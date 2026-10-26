// 全市场真实筛选引擎（服务端专用）
// 两段式：
//   1) 东财全市场快照（价格/PE/PB/市值/涨跌幅）→ 按估值条件预过滤
//   2) 对候选股（按市值排序取前 N）拉日K（腾讯/东财/Yahoo）算 RSI/SMA/动量 → 技术过滤 + 评分
// 数据源分级：A股/港股=腾讯日K；美股/日股=东财日K→Yahoo；快照=东财 clist（失败时回退精选池）

import { StockData, ScreenerEngine } from '@/app/types/stock';
import { UNIVERSE, marketOf, exchangeLabel } from '@/app/lib/universe';
import { RealCriteria } from '@/app/lib/realScreenerTypes';
import { rsi as calcRsi, sma as calcSma } from '@/app/lib/yahooServer';

export type { RealCriteria };

// ---------- 全市场快照（东财 clist） ----------

const MARKET_FS: Record<string, string> = {
  CN: 'm:0+t:6,m:0+t:80,m:0+t:81+s:2048,m:1+t:2,m:1+t:23',
  HK: 'm:116',
  US: 'm:105,m:106,m:107',
  JP: 'm:176',
};

// 每个市场最多扫描的行数（控制扫描时间；列表已按市值降序，即覆盖头部股票）
const MAX_ROWS: Record<string, number> = { CN: 6000, HK: 3000, US: 4000, JP: 2000 };
const PAGE_SIZE = 100; // 东财 clist 单页实际上限约 100-130 行，明确用 100

const EM_LIST_HOSTS = [
  'https://push2delay.eastmoney.com',
  'https://23.push2.eastmoney.com',
  'https://48.push2.eastmoney.com',
  'https://92.push2.eastmoney.com',
  'https://push2.eastmoney.com',
];

export interface SnapshotRow {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  per: number | null;
  pbr: number | null;
  marketCap: number | null;
  volume: number | null;
}

function mapCodeToTicker(market: string, code: string): string | null {
  if (market === 'CN') {
    if (/^6/.test(code)) return `${code}.SS`;
    if (/^[03]/.test(code)) return `${code}.SZ`;
    return null; // 北交所等 K 线源暂不支持的排除
  }
  if (market === 'HK') {
    return /^\d{1,5}$/.test(code) ? `${code}.HK` : null;
  }
  if (market === 'JP') {
    return /^\d{4}$/.test(code) ? `${code}.T` : null;
  }
  return /^[A-Z]{1,5}$/.test(code) ? code : null; // US
}

async function fetchListPage(market: string, page: number): Promise<{ total: number; rows: SnapshotRow[] } | null> {
  const fs = MARKET_FS[market];
  for (const host of EM_LIST_HOSTS) {
    try {
      const url = `${host}/api/qt/clist/get?pn=${page}&pz=${PAGE_SIZE}&po=1&np=1&fltt=2&invt=2&fid=f20&fs=${fs}&fields=f2,f3,f5,f9,f12,f14,f20,f23`;
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
        headers: { Referer: 'https://quote.eastmoney.com/', 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const dt = data?.data;
      if (!dt?.diff) continue;
      const rows: SnapshotRow[] = [];
      for (const r of dt.diff) {
        const ticker = mapCodeToTicker(market, String(r.f12 || ''));
        const price = typeof r.f2 === 'number' ? r.f2 : parseFloat(r.f2);
        if (!ticker || !Number.isFinite(price) || price <= 0) continue; // 停牌/无效
        const num = (v: any) => {
          const n = typeof v === 'number' ? v : parseFloat(v);
          return Number.isFinite(n) ? n : null;
        };
        rows.push({
          ticker,
          name: String(r.f14 || ticker),
          price,
          changePercent: num(r.f3) ?? 0,
          per: num(r.f9),
          pbr: num(r.f23),
          marketCap: num(r.f20),
          volume: num(r.f5),
        });
      }
      return { total: typeof dt.total === 'number' ? dt.total : rows.length, rows };
    } catch {
      continue;
    }
  }
  return null;
}

// 快照缓存（30 分钟）：全市场列表变化慢，缓存后重复筛选秒级返回
const snapshotCache = new Map<string, { rows: SnapshotRow[]; at: number }>();
const SNAPSHOT_TTL = 30 * 60 * 1000;

async function fetchMarketSnapshot(market: string): Promise<SnapshotRow[]> {
  const hit = snapshotCache.get(market);
  if (hit && Date.now() - hit.at < SNAPSHOT_TTL) return hit.rows;

  const all: SnapshotRow[] = [];
  const first = await fetchListPage(market, 1);
  if (!first) return []; // 东财不可用 → 空数组，由上层回退精选池
  all.push(...first.rows);
  // 用实际返回的每页行数计算页数（服务端会限制单页大小）
  const rowsPerPage = Math.max(1, first.rows.length);
  const maxPages = Math.min(Math.ceil((first.total || 0) / rowsPerPage), Math.ceil((MAX_ROWS[market] || 3000) / PAGE_SIZE));
  // 并发拉剩余页（限 6）
  let next = 2;
  const workers = Array.from({ length: Math.max(0, Math.min(6, maxPages - 1)) }, async () => {
    while (true) {
      const p = next++;
      if (p > maxPages) break;
      const r = await fetchListPage(market, p);
      if (r) all.push(...r.rows);
    }
  });
  await Promise.all(workers);

  // 去重；只有覆盖足够完整时才缓存（避免东财半故障时把残缺列表缓存 30 分钟）
  const seen = new Set<string>();
  const dedup = all.filter((r) => (seen.has(r.ticker) ? false : (seen.add(r.ticker), true)));
  const expected = first.total || 0;
  if (dedup.length > 0 && (dedup.length >= expected * 0.8 || dedup.length > 800)) {
    snapshotCache.set(market, { rows: dedup, at: Date.now() });
  }
  return dedup;
}

// ---------- 腾讯批量报价（回退精选池时富化 价格/PE/PB/市值） ----------

function toTencentSym(ticker: string): string | null {
  const m = marketOf(ticker);
  if (m === 'CN') return `${ticker.endsWith('.SS') ? 'sh' : 'sz'}${ticker.slice(0, 6)}`;
  if (m === 'HK') return `hk${ticker.split('.')[0].padStart(5, '0')}`;
  if (m === 'US') return `us${ticker}`;
  return null;
}

async function tencentBatchQuotes(tickers: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const syms: string[] = [];
  const symMap = new Map<string, string>();
  for (const t of tickers) {
    const sym = toTencentSym(t);
    if (sym) {
      syms.push(sym);
      symMap.set(sym, t);
    }
  }
  for (let i = 0; i < syms.length; i += 60) {
    const batch = syms.slice(i, i + 60);
    try {
      const res = await fetch(`https://qt.gtimg.cn/q=${batch.join(',')}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const text = new TextDecoder('gbk').decode(await res.arrayBuffer());
      for (const m of text.matchAll(/v_(\w+)="([^"]*)"/g)) {
        const ticker = symMap.get(m[1]);
        const f = m[2].split('~');
        if (!ticker || f.length < 46 || !f[3]) continue;
        const price = parseFloat(f[3]);
        if (Number.isNaN(price) || price <= 0) continue;
        const pe = parseFloat(f[39]);
        const pb = parseFloat(f[46]);
        const mcapYi = parseFloat(f[45]);
        map.set(ticker, {
          price,
          changePercent: parseFloat(f[4]) ? ((price - parseFloat(f[4])) / parseFloat(f[4])) * 100 : 0,
          per: !Number.isNaN(pe) && pe > 0 ? pe : null,
          pbr: !Number.isNaN(pb) && pb > 0 ? pb : null,
          marketCap: !Number.isNaN(mcapYi) && mcapYi > 0 ? mcapYi * 1e8 : null,
        });
      }
    } catch {
      continue;
    }
  }
  return map;
}

// ---------- 日K收盘价（腾讯 → 东财 → Yahoo） ----------

const TENCENT_KLINE_HOSTS = ['https://ifzq.gtimg.cn', 'https://proxy.finance.qq.com/ifzqgtimg'];

async function tencentCloses(ticker: string, count = 260): Promise<number[] | null> {
  const m = marketOf(ticker);
  let sym: string | null = null;
  if (m === 'CN') sym = `${ticker.endsWith('.SS') ? 'sh' : 'sz'}${ticker.slice(0, 6)}`;
  else if (m === 'HK') sym = `hk${ticker.split('.')[0].padStart(5, '0')}`;
  else if (m === 'US') sym = `us${ticker}`;
  if (!sym) return null;
  for (const host of TENCENT_KLINE_HOSTS) {
    try {
      const res = await fetch(
        `${host}/appstock/app/fqkline/get?param=${sym},day,,,${count},qfq`,
        { cache: 'no-store', signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const node = data?.data?.[sym];
      const rows: string[][] = node?.qfqday || node?.day || [];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const closes = rows
        .filter((r) => r.length >= 5)
        .map((r) => parseFloat(r[2]))
        .filter((v) => !Number.isNaN(v));
      if (closes.length > 0) return closes;
    } catch {
      continue;
    }
  }
  return null;
}

const EM_KLINE_HOSTS = [
  'https://23.push2his.eastmoney.com',
  'https://push2delay.eastmoney.com',
  'https://48.push2his.eastmoney.com',
  'https://92.push2his.eastmoney.com',
  'https://push2his.eastmoney.com',
];

function toEastmoneySecid(ticker: string): string | null {
  if (/^\d{6}\.SS$/i.test(ticker)) return `1.${ticker.slice(0, 6)}`;
  if (/^\d{6}\.SZ$/i.test(ticker)) return `0.${ticker.slice(0, 6)}`;
  if (/^\d{1,5}\.HK$/i.test(ticker)) return `116.${ticker.split('.')[0].padStart(5, '0')}`;
  if (/^\d{4}\.T$/i.test(ticker)) return `176.${ticker.split('.')[0]}`;
  return null;
}

async function eastmoneyCloses(ticker: string, count = 260): Promise<{ closes: number[]; name: string } | null> {
  const secid = toEastmoneySecid(ticker);
  const secids = secid ? [secid] : /^[A-Z]{1,5}$/i.test(ticker) ? [`105.${ticker}`, `106.${ticker}`] : [];
  for (const sid of secids) {
    for (const host of EM_KLINE_HOSTS) {
      try {
        const res = await fetch(
          `${host}/api/qt/stock/kline/get?secid=${sid}&klt=101&fqt=1&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56&end=20500101&lmt=${count}`,
          { cache: 'no-store', signal: AbortSignal.timeout(7000), headers: { Referer: 'https://quote.eastmoney.com/' } }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const klines: string[] = data?.data?.klines || [];
        if (!Array.isArray(klines) || klines.length === 0) continue;
        const closes = klines.map((l) => parseFloat(l.split(',')[2])).filter((v) => !Number.isNaN(v));
        if (closes.length > 0) return { closes, name: data.data?.name || '' };
      } catch {
        continue;
      }
    }
  }
  return null;
}

// Yahoo 日K（最后兜底），带熔断器：连败 5 次暂停 60 秒
let yahooFails = 0;
let yahooSkipUntil = 0;
async function yahooCloses(ticker: string, count = 260): Promise<number[] | null> {
  if (Date.now() < yahooSkipUntil) return null;
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&includePrePost=false`,
      {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36' },
      }
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const closes = (result?.indicators?.quote?.[0]?.close || []).filter((v: any) => typeof v === 'number');
    if (closes.length === 0) throw new Error('empty');
    yahooFails = 0;
    return closes.slice(-count);
  } catch {
    yahooFails++;
    if (yahooFails >= 5) {
      yahooSkipUntil = Date.now() + 60 * 1000;
      yahooFails = 0;
    }
    return null;
  }
}

const closesCache = new Map<string, { closes: number[]; source: string; name?: string; at: number }>();
const CLOSES_TTL = 30 * 60 * 1000;

async function fetchCloses(ticker: string): Promise<{ closes: number[]; source: string; name?: string } | null> {
  const hit = closesCache.get(ticker);
  if (hit && Date.now() - hit.at < CLOSES_TTL) {
    return { closes: hit.closes, source: hit.source, name: hit.name };
  }
  const m = marketOf(ticker);
  let result: { closes: number[]; source: string; name?: string } | null = null;
  if (m === 'CN' || m === 'HK') {
    const t = await tencentCloses(ticker);
    if (t && t.length >= 30) result = { closes: t, source: 'tencent' };
  }
  if (!result) {
    const em = await eastmoneyCloses(ticker);
    if (em) result = { closes: em.closes, source: 'eastmoney', name: em.name };
  }
  if (!result) {
    const y = await yahooCloses(ticker);
    if (y && y.length >= 30) result = { closes: y, source: 'yahoo' };
  }
  if (result) closesCache.set(ticker, { ...result, at: Date.now() });
  return result;
}

function indicatorsFromCloses(closes: number[]) {
  const last = closes[closes.length - 1];
  const momentum20 =
    closes.length > 20 ? ((last - closes[closes.length - 21]) / closes[closes.length - 21]) * 100 : null;
  return {
    rsi14: calcRsi(closes, 14),
    sma50: calcSma(closes, 50),
    sma200: calcSma(closes, 200),
    momentum20,
    week52High: Math.max(...closes.slice(-250)),
    week52Low: Math.min(...closes.slice(-250)),
  };
}

// ---------- 过滤 + 评分 ----------

interface RawStock {
  ticker: string;
  name: string;
  market: string;
  price: number;
  changePercent: number;
  marketCap: number | null;
  per: number | null;
  pbr: number | null;
  rsi14: number | null;
  sma50: number | null;
  sma200: number | null;
  momentum20: number | null;
  week52High: number | null;
  week52Low: number | null;
}

function passes(stock: RawStock, c: RealCriteria): boolean {
  if (c.markets?.length && !c.markets.includes(stock.market)) return false;
  if (c.perMin !== undefined && (stock.per === null || stock.per < c.perMin)) return false;
  if (c.perMax !== undefined && (stock.per === null || stock.per > c.perMax)) return false;
  if (c.pbrMax !== undefined && (stock.pbr === null || stock.pbr > c.pbrMax)) return false;
  if (c.marketCapMinYi !== undefined && (stock.marketCap === null || stock.marketCap < c.marketCapMinYi * 1e8)) return false;
  if (c.rsiMin !== undefined && (stock.rsi14 === null || stock.rsi14 < c.rsiMin)) return false;
  if (c.rsiMax !== undefined && (stock.rsi14 === null || stock.rsi14 > c.rsiMax)) return false;
  if (c.aboveSMA50 && stock.sma50 !== null && stock.price < stock.sma50) return false;
  if (c.aboveSMA200 && stock.sma200 !== null && stock.price < stock.sma200) return false;
  if (c.momentumMin !== undefined && (stock.momentum20 === null || stock.momentum20 < c.momentumMin)) return false;
  if (c.week52PosMax !== undefined) {
    if (stock.week52High === null || stock.week52Low === null) return false;
    const range = stock.week52High - stock.week52Low;
    if (range <= 0) return false;
    if ((stock.price - stock.week52Low) / range > c.week52PosMax) return false;
  }
  return true;
}

function scoreStock(s: RawStock) {
  let value = 40;
  if (s.per !== null) value += s.per < 10 ? 30 : s.per < 15 ? 22 : s.per < 20 ? 14 : s.per < 30 ? 6 : 0;
  if (s.pbr !== null) value += s.pbr < 1 ? 30 : s.pbr < 1.5 ? 22 : s.pbr < 3 ? 12 : 0;

  let technical = 30;
  if (s.rsi14 !== null) {
    if (s.rsi14 > 75) technical -= 15;
    else if (s.rsi14 > 65) technical -= 5;
    else if (s.rsi14 >= 40) technical += 15;
    else technical += 5;
  }
  if (s.sma50 !== null && s.sma200 !== null) technical += s.sma50 > s.sma200 ? 15 : -10;
  else if (s.sma50 !== null) technical += s.price > s.sma50 ? 8 : -5;

  let momentum = 35;
  if (s.momentum20 !== null) momentum = Math.max(0, Math.min(70, 35 + s.momentum20 * 2));

  return {
    value: Math.round(value),
    technical: Math.max(0, Math.min(70, Math.round(technical))),
    momentum: Math.round(momentum),
    total: 0 as number,
  };
}

function engineDefaultCriteria(engine: ScreenerEngine): RealCriteria {
  switch (engine) {
    case 'value': return { perMax: 20, pbrMax: 3, marketCapMinYi: 100 };
    case 'pullback': return { rsiMin: 25, rsiMax: 50, aboveSMA200: true };
    case 'alpha': return { momentumMin: 0, aboveSMA50: true, rsiMax: 75 };
    default: return {};
  }
}

// ---------- 主入口 ----------

export interface ScreenerRunStats {
  snapshotSize: number;
  prefiltered: number;
  klineFetched: number;
  klineBudget: number;
  fallbackUniverse: boolean;
  sources: Record<string, number>;
}

export async function runRealScreener(
  engine: ScreenerEngine,
  customCriteria?: RealCriteria,
  klineBudget = 150
): Promise<{ stocks: StockData[]; stats: ScreenerRunStats }> {
  const criteria = engine === 'custom' ? (customCriteria || {}) : engineDefaultCriteria(engine);
  const markets = criteria.markets?.length ? criteria.markets : ['CN', 'HK', 'US', 'JP'];

  // 1) 全市场快照（东财），失败的市场回退精选池
  let snapshot: SnapshotRow[] = [];
  let fallbackUniverse = false;
  const marketResults = await Promise.all(
    markets.map(async (m) => ({ m, rows: await fetchMarketSnapshot(m) }))
  );
  for (const { m, rows } of marketResults) {
    if (rows.length > 0) {
      snapshot.push(...rows);
      // 快照覆盖不足（如日股东财仅少量条目）时补充精选池
      if (rows.length < 50) {
        snapshot.push(
          ...UNIVERSE.filter((e) => e.market === m).map((e) => ({
            ticker: e.ticker,
            name: e.fallbackName || e.ticker,
            price: 0,
            changePercent: 0,
            per: null as number | null,
            pbr: null as number | null,
            marketCap: null as number | null,
            volume: null as number | null,
          }))
        );
      }
    } else {
      fallbackUniverse = true;
      snapshot.push(
        ...UNIVERSE.filter((e) => e.market === m).map((e) => ({
          ticker: e.ticker,
          name: e.fallbackName || e.ticker,
          price: 0,
          changePercent: 0,
          per: null as number | null,
          pbr: null as number | null,
          marketCap: null as number | null,
          volume: null as number | null,
        }))
      );
    }
  }

  const snapshotSize = snapshot.length;

  // 2) 估值/市场预过滤（快照数据即可完成）
  const prefiltered = snapshot.filter((r) => {
    if (r.price <= 0) return true; // 回退池价格未知，进入候选拉K线时校验
    if (criteria.perMin !== undefined && (r.per === null || r.per < criteria.perMin)) return false;
    if (criteria.perMax !== undefined && (r.per === null || r.per > criteria.perMax)) return false;
    if (criteria.pbrMax !== undefined && (r.pbr === null || r.pbr > criteria.pbrMax)) return false;
    if (criteria.marketCapMinYi !== undefined && (r.marketCap === null || r.marketCap < criteria.marketCapMinYi * 1e8)) return false;
    return true;
  });

  // 3) 候选排序（市值优先）+ 截断到 K 线预算
  prefiltered.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  const candidates = prefiltered.slice(0, klineBudget);

  // 回退池/缺估值的候选，用腾讯批量报价富化（一次请求）
  const needEnrich = candidates.filter((c) => c.price <= 0 || c.per === null || c.pbr === null);
  const quoteMap = needEnrich.length > 0 ? await tencentBatchQuotes(needEnrich.map((c) => c.ticker)) : new Map();
  for (const c of candidates) {
    const q = quoteMap.get(c.ticker);
    if (q) {
      if (c.price <= 0) c.price = q.price;
      if (c.per === null) c.per = q.per;
      if (c.pbr === null) c.pbr = q.pbr;
      if (c.marketCap === null) c.marketCap = q.marketCap;
    }
  }

  // 4) 拉日K计算技术指标（并发 5）
  const sources: Record<string, number> = {};
  const raw: RawStock[] = [];
  let next = 0;
  const workers = Array.from({ length: 5 }, async () => {
    while (true) {
      const i = next++;
      if (i >= candidates.length) break;
      const c = candidates[i];
      const fetched = await fetchCloses(c.ticker);
      if (!fetched) continue;
      sources[fetched.source] = (sources[fetched.source] || 0) + 1;
      const closes = fetched.closes;
      const price = c.price > 0 ? c.price : closes[closes.length - 1];
      const ind = indicatorsFromCloses(closes);
      raw.push({
        ticker: c.ticker,
        name: c.name || fetched.name || c.ticker,
        market: marketOf(c.ticker),
        price,
        changePercent: c.changePercent,
        marketCap: c.marketCap,
        per: c.per,
        pbr: c.pbr,
        week52High: ind.week52High,
        week52Low: ind.week52Low,
        rsi14: ind.rsi14,
        sma50: ind.sma50,
        sma200: ind.sma200,
        momentum20: ind.momentum20,
      });
    }
  });
  await Promise.all(workers);

  // 5) 技术条件过滤 + 评分
  const passed = raw.filter((s) => passes(s, criteria));
  const stocks: StockData[] = passed
    .map((s) => {
      const sc = scoreStock(s);
      sc.total = Math.min(100, Math.round(sc.value * 0.4 + sc.technical * 0.25 + sc.momentum * 0.35));
      return {
        ticker: s.ticker,
        name: s.name,
        exchange: exchangeLabel(s.ticker),
        currency:
          s.market === 'CN' ? 'CNY' : s.market === 'HK' ? 'HKD' : s.market === 'JP' ? 'JPY' : 'USD',
        sector: s.market,
        valuation: {
          ticker: s.ticker,
          per: s.per,
          pbr: s.pbr,
          dividendYield: null,
          marketCap: s.marketCap,
          price: s.price,
          week52High: s.week52High,
          week52Low: s.week52Low,
        },
        financial: {
          ticker: s.ticker,
          revenue: null, netIncome: null, totalAssets: null, totalEquity: null,
          freeCashFlow: null, roe: null, revenueGrowth: null,
        },
        technical: {
          ticker: s.ticker,
          rsi14: s.rsi14, sma50: s.sma50, sma200: s.sma200,
          bollingerUpper: null, bollingerLower: null,
        },
        analyst: {
          ticker: s.ticker,
          targetHigh: null, targetMean: null, targetLow: null, rating: null, analystCount: 0,
        },
        score: { total: sc.total, value: sc.value, growth: 0, quality: 0, technical: sc.technical, alpha: sc.momentum },
        lastUpdated: new Date(),
      } satisfies StockData;
    })
    .sort((a, b) => b.score.total - a.score.total);

  return {
    stocks,
    stats: {
      snapshotSize,
      prefiltered: prefiltered.length,
      klineFetched: raw.length,
      klineBudget,
      fallbackUniverse,
      sources,
    },
  };
}
