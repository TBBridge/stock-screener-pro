// 真实数据筛选引擎（服务端专用）
// 数据源策略：腾讯优先（批量报价 + 逐票日K，A股/港股/美股稳定）→ Yahoo（日股）→ 东财兜底

import { StockData, ScreenerEngine } from '@/app/types/stock';
import { UNIVERSE, marketOf, exchangeLabel, UniverseEntry } from '@/app/lib/universe';
import { RealCriteria } from '@/app/lib/realScreenerTypes';
import { rsi as calcRsi, sma as calcSma } from '@/app/lib/yahooServer';

export type { RealCriteria };

// ---------- 数据抓取 ----------

interface RawStock {
  entry: UniverseEntry;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number | null; // 本币
  per: number | null;
  pbr: number | null;
  rsi14: number | null;
  sma50: number | null;
  sma200: number | null;
  momentum20: number | null; // 20日涨幅 %
  week52High: number | null;
  week52Low: number | null;
}

// 腾讯批量报价（一次请求），返回 ticker -> {price, changePercent, pe, pb, marketCap(本币), name}
async function tencentBatchQuotes(tickers: string[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const symMap = new Map<string, string>(); // tencentSym -> ticker
  const syms: string[] = [];
  for (const t of tickers) {
    const m = marketOf(t);
    let sym: string | null = null;
    if (m === 'CN') sym = `${t.endsWith('.SS') ? 'sh' : 'sz'}${t.slice(0, 6)}`;
    else if (m === 'HK') sym = `hk${t.split('.')[0].padStart(5, '0')}`;
    else if (m === 'US') sym = `us${t}`;
    if (sym) {
      syms.push(sym);
      symMap.set(sym, t);
    }
  }
  if (syms.length === 0) return map;
  try {
    // 分批，每批 60 个
    for (let i = 0; i < syms.length; i += 60) {
      const batch = syms.slice(i, i + 60);
      const res = await fetch(`https://qt.gtimg.cn/q=${batch.join(',')}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const text = new TextDecoder('gbk').decode(await res.arrayBuffer());
      for (const m of text.matchAll(/v_(\w+)="([^"]*)"/g)) {
        const sym = m[1];
        const f = m[2].split('~');
        const ticker = symMap.get(sym);
        if (!ticker || f.length < 46 || !f[3]) continue;
        const price = parseFloat(f[3]);
        if (Number.isNaN(price) || price <= 0) continue;
        const prev = parseFloat(f[4]) || price;
        const pe = parseFloat(f[39]);
        const pb = parseFloat(f[46]);
        const w52h = parseFloat(f[47]);
        const w52l = parseFloat(f[48]);
        const w52Valid = !Number.isNaN(w52h) && !Number.isNaN(w52l) && w52h > w52l && w52l < price * 1.6 && w52h > price * 0.5;
        const mcapYi = parseFloat(f[45]);
        map.set(ticker, {
          name: f[1] || '',
          price,
          changePercent: prev ? ((price - prev) / prev) * 100 : 0,
          per: !Number.isNaN(pe) && pe > 0 ? pe : null,
          pbr: !Number.isNaN(pb) && pb > 0 ? pb : null,
          marketCap: !Number.isNaN(mcapYi) && mcapYi > 0 ? mcapYi * 1e8 : null,
          week52High: w52Valid ? w52h : null,
          week52Low: w52Valid ? w52l : null,
        });
      }
    }
  } catch {
    // 整体失败则返回空 map，逐票走 chart
  }
  return map;
}

// 腾讯日K（A股/港股/美股），返回收盘价序列（升序）
// 注意：web.ifzq.gtimg.cn 对高频请求会触发 WAF，使用 ifzq.gtimg.cn / proxy.finance.qq.com 多 host 轮询
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

// Yahoo 日K收盘价（美股/日股），带熔断器：连续失败 5 次则跳过 60 秒，避免 429 期间反复重试拖慢筛选
let yahooFails = 0;
let yahooSkipUntil = 0;
async function yahooCloses(ticker: string, count = 260): Promise<number[] | null> {
  if (Date.now() < yahooSkipUntil) return null;
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y&includePrePost=false`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36' } }
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

// 东财日K收盘价（日股兜底）
const EM_HOSTS = ['https://23.push2his.eastmoney.com', 'https://push2delay.eastmoney.com', 'https://push2his.eastmoney.com'];
async function eastmoneyClosesAndMeta(ticker: string): Promise<{ closes: number[]; name: string } | null> {
  let secid: string | null = null;
  if (/^\d{6}\.SS$/i.test(ticker)) secid = `1.${ticker.slice(0, 6)}`;
  else if (/^\d{6}\.SZ$/i.test(ticker)) secid = `0.${ticker.slice(0, 6)}`;
  else if (/^\d{1,5}\.HK$/i.test(ticker)) secid = `116.${ticker.split('.')[0].padStart(5, '0')}`;
  else if (/^\d{4}\.T$/i.test(ticker)) secid = `176.${ticker.split('.')[0]}`;
  else if (/^[A-Z]{1,5}$/i.test(ticker)) secid = `105.${ticker.toUpperCase()}`; // 美股（NASDAQ 优先，NYCE 由下面轮询 106 补试）
  if (!secid) return null;
  const secids = /^[A-Z]{1,5}$/i.test(ticker) ? [`105.${ticker.toUpperCase()}`, `106.${ticker.toUpperCase()}`] : [secid];
  for (const sid of secids) {
    for (const host of EM_HOSTS) {
      try {
        const res = await fetch(
          `${host}/api/qt/stock/kline/get?secid=${sid}&klt=101&fqt=1&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58&end=20500101&lmt=260`,
          { cache: 'no-store', signal: AbortSignal.timeout(6000), headers: { Referer: 'https://quote.eastmoney.com/' } }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const klines: string[] = data?.data?.klines || [];
        if (!Array.isArray(klines) || klines.length === 0) continue;
        const closes = klines.map((l) => parseFloat(l.split(',')[2])).filter((v) => !Number.isNaN(v));
        if (closes.length === 0) continue;
        return { closes, name: data.data?.name || '' };
      } catch {
        continue;
      }
    }
  }
  return null;
}

// 日K收盘价内存缓存（10分钟，降低上游压力、加速重复筛选）
const closesCache = new Map<string, { closes: number[]; source: string; name?: string; at: number }>();
const CLOSES_TTL = 10 * 60 * 1000;

async function fetchCloses(ticker: string): Promise<{ closes: number[]; source: string; name?: string } | null> {
  const hit = closesCache.get(ticker);
  if (hit && Date.now() - hit.at < CLOSES_TTL) {
    return { closes: hit.closes, source: hit.source, name: hit.name };
  }
  const m = marketOf(ticker);
  let result: { closes: number[]; source: string; name?: string } | null = null;
  if (m === 'US') {
    // 腾讯不支持美股日K，直接走 Yahoo → 东财
    const yahoo = await yahooCloses(ticker);
    if (yahoo && yahoo.length >= 30) result = { closes: yahoo, source: 'yahoo' };
    else {
      const em = await eastmoneyClosesAndMeta(ticker);
      if (em) result = { closes: em.closes, source: 'eastmoney', name: em.name };
    }
  } else {
    // A股/港股/日股：腾讯优先
    const tencent = await tencentCloses(ticker);
    if (tencent && tencent.length >= 30) result = { closes: tencent, source: 'tencent' };
    else {
      const yahoo = await yahooCloses(ticker);
      if (yahoo && yahoo.length >= 30) result = { closes: yahoo, source: 'yahoo' };
      else {
        const em = await eastmoneyClosesAndMeta(ticker);
        if (em) result = { closes: em.closes, source: 'eastmoney', name: em.name };
      }
    }
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
  };
}

// ---------- 过滤 + 评分 ----------

function passes(stock: RawStock, c: RealCriteria): { pass: boolean; failedOn?: string } {
  if (c.markets?.length && !c.markets.includes(stock.entry.market)) return { pass: false, failedOn: 'market' };

  if (c.perMin !== undefined && (stock.per === null || stock.per < c.perMin)) return { pass: false, failedOn: 'per' };
  if (c.perMax !== undefined && (stock.per === null || stock.per > c.perMax)) return { pass: false, failedOn: 'per' };
  if (c.pbrMax !== undefined && (stock.pbr === null || stock.pbr > c.pbrMax)) return { pass: false, failedOn: 'pbr' };
  if (c.marketCapMinYi !== undefined && (stock.marketCap === null || stock.marketCap < c.marketCapMinYi * 1e8))
    return { pass: false, failedOn: 'marketCap' };

  if (c.rsiMin !== undefined && (stock.rsi14 === null || stock.rsi14 < c.rsiMin)) return { pass: false, failedOn: 'rsi' };
  if (c.rsiMax !== undefined && (stock.rsi14 === null || stock.rsi14 > c.rsiMax)) return { pass: false, failedOn: 'rsi' };

  if (c.aboveSMA50 && stock.sma50 !== null && stock.price < stock.sma50) return { pass: false, failedOn: 'sma50' };
  if (c.aboveSMA200 && stock.sma200 !== null && stock.price < stock.sma200) return { pass: false, failedOn: 'sma200' };

  if (c.momentumMin !== undefined && (stock.momentum20 === null || stock.momentum20 < c.momentumMin))
    return { pass: false, failedOn: 'momentum' };

  if (c.week52PosMax !== undefined) {
    if (stock.week52High === null || stock.week52Low === null) return { pass: false, failedOn: 'week52' };
    const range = stock.week52High - stock.week52Low;
    if (range <= 0) return { pass: false, failedOn: 'week52' };
    const pos = (stock.price - stock.week52Low) / range;
    if (pos > c.week52PosMax) return { pass: false, failedOn: 'week52' };
  }

  return { pass: true };
}

// 评分（0-100）
function scoreStock(s: RawStock) {
  // 价值分：PER/PBR 越低越好
  let value = 40;
  if (s.per !== null) value += s.per < 10 ? 30 : s.per < 15 ? 22 : s.per < 20 ? 14 : s.per < 30 ? 6 : 0;
  if (s.pbr !== null) value += s.pbr < 1 ? 30 : s.pbr < 1.5 ? 22 : s.pbr < 3 ? 12 : 0;

  // 技术分：RSI 健康度 + 均线趋势
  let technical = 30;
  if (s.rsi14 !== null) {
    if (s.rsi14 > 75) technical -= 15;
    else if (s.rsi14 > 65) technical -= 5;
    else if (s.rsi14 >= 40) technical += 15;
    else technical += 5; // 超卖反弹潜力
  }
  if (s.sma50 !== null && s.sma200 !== null) technical += s.sma50 > s.sma200 ? 15 : -10;
  else if (s.sma50 !== null) technical += s.price > s.sma50 ? 8 : -5;

  // 动量分：20日涨幅
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
    case 'value': return { perMax: 20, pbrMax: 3, marketCapMinYi: 500 };
    case 'pullback': return { rsiMin: 25, rsiMax: 50, aboveSMA200: true };
    case 'alpha': return { momentumMin: 0, aboveSMA50: true, rsiMax: 75 };
    default: return {};
  }
}

// ---------- 主入口 ----------

export async function runRealScreener(
  engine: ScreenerEngine,
  customCriteria?: RealCriteria,
  universeLimit?: number
): Promise<{ stocks: StockData[]; universeSize: number; fetched: number; sources: Record<string, number> }> {
  const pool = (universeLimit ? UNIVERSE.slice(0, universeLimit) : UNIVERSE);
  const criteria = engine === 'custom' ? (customCriteria || {}) : engineDefaultCriteria(engine);

  // 1) 批量报价（一次请求）
  const quoteMap = await tencentBatchQuotes(pool.map((e) => e.ticker));

  // 2) 逐票日K（腾讯优先，并发 4 + 错峰，避免触发上游限流）
  const sources: Record<string, number> = {};
  const raw: RawStock[] = [];
  let next = 0;
  const workers = Array.from({ length: 4 }, async () => {
    while (true) {
      const i = next++;
      if (i >= pool.length) break;
      const entry = pool[i];
      const q = quoteMap.get(entry.ticker) || {};
      const fetched = await fetchCloses(entry.ticker);
      if (!fetched) continue; // 数据源全失败则跳过（日股网络受限时会这样）
      sources[fetched.source] = (sources[fetched.source] || 0) + 1;
      const price = q.price ?? fetched.closes[fetched.closes.length - 1];
      const ind = indicatorsFromCloses(fetched.closes);
      raw.push({
        entry,
        name: q.name || fetched.name || entry.fallbackName || entry.ticker,
        price,
        changePercent: q.changePercent ?? 0,
        marketCap: q.marketCap ?? null,
        per: q.per ?? null,
        pbr: q.pbr ?? null,
        week52High: q.week52High ?? Math.max(...fetched.closes.slice(-250)),
        week52Low: q.week52Low ?? Math.min(...fetched.closes.slice(-250)),
        ...ind,
      });
    }
  });
  await Promise.all(workers);

  // 3) 过滤
  const passed = raw.filter((s) => passes(s, criteria).pass);

  // 4) 评分 + 排序（映射为 StockData 供现有表格复用）
  const stocks: StockData[] = passed
    .map((s) => {
      const sc = scoreStock(s);
      sc.total = Math.round(sc.value * 0.4 + sc.technical * 0.25 + sc.momentum * 0.35);
      if (sc.total > 100) sc.total = 100;
      return {
        ticker: s.entry.ticker,
        name: s.name,
        exchange: exchangeLabel(s.entry.ticker),
        currency:
          s.entry.market === 'CN' ? 'CNY' : s.entry.market === 'HK' ? 'HKD' : s.entry.market === 'JP' ? 'JPY' : 'USD',
        sector: s.entry.market,
        valuation: {
          ticker: s.entry.ticker,
          per: s.per,
          pbr: s.pbr,
          dividendYield: null,
          marketCap: s.marketCap,
          price: s.price,
          week52High: s.week52High,
          week52Low: s.week52Low,
        },
        financial: {
          ticker: s.entry.ticker,
          revenue: null, netIncome: null, totalAssets: null, totalEquity: null,
          freeCashFlow: null, roe: null, revenueGrowth: null,
        },
        technical: {
          ticker: s.entry.ticker,
          rsi14: s.rsi14, sma50: s.sma50, sma200: s.sma200,
          bollingerUpper: null, bollingerLower: null,
        },
        analyst: {
          ticker: s.entry.ticker,
          targetHigh: null, targetMean: null, targetLow: null, rating: null, analystCount: 0,
        },
        score: { total: sc.total, value: sc.value, growth: 0, quality: 0, technical: sc.technical, alpha: sc.momentum },
        lastUpdated: new Date(),
      } satisfies StockData;
    })
    .sort((a, b) => b.score.total - a.score.total);

  return { stocks, universeSize: pool.length, fetched: raw.length, sources };
}
