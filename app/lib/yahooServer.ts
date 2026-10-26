// 服务端 Yahoo Finance 数据层
// 只能在 Route Handlers（服务端）中使用，浏览器端请走 /api/* 代理

import { Candle, QuoteSummary, NewsItem, SearchResult } from '@/app/types/market';

const CHART_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const QUOTE_BASE = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary';
const SEARCH_BASE = 'https://query2.finance.yahoo.com/v1/finance/search';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// 带超时的 fetch
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        Accept: 'application/json',
        ...(init.headers || {}),
      },
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
}

// 带重试的 fetch（应对 Yahoo 偶发 429 限流）
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000,
  retries = 3
): Promise<Response> {
  let lastRes: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, init, timeoutMs);
      if (res.status !== 429 || attempt === retries) return res;
      lastRes = res;
      await sleep(1000 * (attempt + 1) * (attempt + 1)); // 1s, 4s, 9s
    } catch (e) {
      if (attempt === retries) throw e;
      await sleep(500 * (attempt + 1));
    }
  }
  return lastRes!;
}

// 并发限制执行（避免瞬时并发触发上游限流）
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ---------------- Crumb（quoteSummary 需要 cookie+crumb，失败则降级） ----------------
let crumbCache: { crumb: string; cookie: string; at: number } | null = null;
const CRUMB_TTL = 30 * 60 * 1000; // 30 分钟

async function getCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  if (crumbCache && Date.now() - crumbCache.at < CRUMB_TTL) {
    return { crumb: crumbCache.crumb, cookie: crumbCache.cookie };
  }
  try {
    const first = await fetchWithTimeout('https://fc.yahoo.com', { redirect: 'follow' }, 6000);
    const cookie = first.headers.getSetCookie?.().map((c) => c.split(';')[0]).join('; ') || '';
    const res = await fetchWithTimeout(
      'https://query2.finance.yahoo.com/v1/test/getcrumb',
      { headers: cookie ? { Cookie: cookie } : {} },
      6000
    );
    const crumb = (await res.text()).trim();
    if (crumb && crumb.length < 64 && !crumb.startsWith('{')) {
      crumbCache = { crumb, cookie, at: Date.now() };
      return { crumb, cookie };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------- Chart API（公开，无需鉴权） ----------------
export interface ChartEntry {
  meta: Record<string, unknown>;
  timestamp?: number[];
  indicators: {
    quote?: Array<{
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }>;
  };
}

export interface ChartResponse {
  chart: {
    result?: ChartEntry[];
    error?: unknown;
  };
}

// 腾讯日K兜底：[date, open, close, high, low, volume]
// 注意：web.ifzq.gtimg.cn 高频会触发 WAF，使用 ifzq.gtimg.cn / proxy.finance.qq.com 轮询
const TENCENT_KLINE_HOSTS = ['https://ifzq.gtimg.cn', 'https://proxy.finance.qq.com/ifzqgtimg'];

async function getTencentChartEntry(ticker: string, count = 260): Promise<ChartEntry | null> {
  const sym = toTencentSymbol(ticker);
  if (!sym) return null;
  for (const klineHost of TENCENT_KLINE_HOSTS) {
    try {
      const url = `${klineHost}/appstock/app/fqkline/get?param=${sym},day,,,${count},qfq`;
      const res = await fetchWithTimeout(url, {}, 8000);
      if (!res.ok) continue;
      const data = await res.json();
      const node = data?.data?.[sym];
      const rows: string[][] = node?.qfqday || node?.day || [];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const candles: Candle[] = rows
        .filter((r) => r.length >= 6)
        .map((r) => ({
          t: new Date(r[0] + 'T00:00:00+08:00').getTime(),
          o: parseFloat(r[1]),
          c: parseFloat(r[2]),
          h: parseFloat(r[3]),
          l: parseFloat(r[4]),
          v: parseFloat(r[5]),
        }))
        .filter((c) => !Number.isNaN(c.o) && !Number.isNaN(c.c));

      if (candles.length === 0) continue;

      const last = candles[candles.length - 1];
      const prev = candles.length > 1 ? candles[candles.length - 2] : last;
      const currency = sym.startsWith('hk') ? 'HKD' : sym.startsWith('us') ? 'USD' : 'CNY';

      // 顺带拿实时报价填充 meta（尽力而为）
      const quote = await getTencentQuote(ticker);

      return {
        meta: {
          regularMarketPrice: quote?.price ?? last.c,
          chartPreviousClose: prev.c,
          longName: quote?.name ?? ticker,
          shortName: quote?.name ?? ticker,
          fullExchangeName: quote?.exchange ?? '',
          exchangeName: quote?.exchange ?? '',
          currency,
          regularMarketDayHigh: quote?.dayHigh ?? last.h,
          regularMarketDayLow: quote?.dayLow ?? last.l,
          regularMarketVolume: quote?.volume ?? last.v,
          fiftyTwoWeekHigh: quote?.week52High,
          fiftyTwoWeekLow: quote?.week52Low,
          pe: (quote as any)?.pe ?? null,
          pb: (quote as any)?.pb ?? null,
          marketCap: (quote as any)?.marketCap ?? null,
        },
        timestamp: candles.map((c) => c.t / 1000),
        indicators: {
          quote: [
            {
              open: candles.map((c) => c.o),
              high: candles.map((c) => c.h),
              low: candles.map((c) => c.l),
              close: candles.map((c) => c.c),
              volume: candles.map((c) => c.v),
            },
          ],
        },
      };
    } catch {
      continue; // 换下一个 host
    }
  }
  return null;
}

// ---------------- 东方财富兜底（覆盖日股等腾讯不支持的品种） ----------------
// secid 映射：沪 1. / 深 0. / 港 116. / 美股 105(NASDAQ)或106(NYSE) / 日股 176. / 全球指数 100.
function toEastmoneySecids(ticker: string): string[] {
  if (/^\d{6}\.SS$/i.test(ticker)) return [`1.${ticker.slice(0, 6)}`];
  if (/^\d{6}\.SZ$/i.test(ticker)) return [`0.${ticker.slice(0, 6)}`];
  if (/^\d{1,5}\.HK$/i.test(ticker)) return [`116.${ticker.split('.')[0].padStart(5, '0')}`];
  if (/^\d{4}\.T$/i.test(ticker)) return [`176.${ticker.split('.')[0]}`];
  if (ticker.startsWith('^')) {
    const map: Record<string, string> = {
      '^GSPC': '100.GSPC', '^IXIC': '100.IXIC', '^DJI': '100.DJI',
      '^HSI': '100.HSI', '^N225': '100.N225', '^DAX': '100.DAX', '^FTSE': '100.FTSE',
    };
    return map[ticker] ? [map[ticker]] : [];
  }
  if (/^[A-Z]{1,5}$/i.test(ticker)) return [`105.${ticker.toUpperCase()}`, `106.${ticker.toUpperCase()}`];
  return [];
}

const EM_HOSTS = [
  'https://23.push2his.eastmoney.com',
  'https://push2delay.eastmoney.com',
  'https://92.push2his.eastmoney.com',
  'https://push2his.eastmoney.com',
];

async function getEastmoneyChartEntry(ticker: string, count: number): Promise<ChartEntry | null> {
  const secids = toEastmoneySecids(ticker);
  if (secids.length === 0) return null;

  for (const secid of secids) {
    for (const host of EM_HOSTS) {
      try {
        const url = `${host}/api/qt/stock/kline/get?secid=${secid}&klt=101&fqt=1&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56&end=20500101&lmt=${count}`;
        const res = await fetchWithTimeout(url, {
          headers: { Referer: 'https://quote.eastmoney.com/' },
        }, 6000);
        if (!res.ok) continue;
        const data = await res.json();
        const klines: string[] = data?.data?.klines || [];
        if (!Array.isArray(klines) || klines.length === 0) continue;

        const candles: Candle[] = klines
          .map((line) => {
            const p = line.split(',');
            return {
              t: new Date(p[0] + 'T00:00:00+08:00').getTime(),
              o: parseFloat(p[1]),
              c: parseFloat(p[2]),
              h: parseFloat(p[3]),
              l: parseFloat(p[4]),
              v: parseFloat(p[5]),
            };
          })
          .filter((c) => !Number.isNaN(c.o) && !Number.isNaN(c.c) && !Number.isNaN(c.h) && !Number.isNaN(c.l));
        if (candles.length === 0) continue;

        const last = candles[candles.length - 1];
        const prev = candles.length > 1 ? candles[candles.length - 2] : last;
        const currency =
          ticker.endsWith('.T') ? 'JPY' :
          ticker.endsWith('.HK') ? 'HKD' :
          ticker.startsWith('^') ? '' :
          /^\d{6}/.test(ticker) ? 'CNY' : 'USD';

        return {
          meta: {
            regularMarketPrice: last.c,
            chartPreviousClose: prev.c,
            longName: data.data.name || ticker,
            shortName: data.data.name || ticker,
            fullExchangeName: ticker.endsWith('.T') ? 'TSE' : '',
            exchangeName: ticker.endsWith('.T') ? 'TSE' : '',
            currency,
            regularMarketDayHigh: last.h,
            regularMarketDayLow: last.l,
            regularMarketVolume: last.v,
          },
          timestamp: candles.map((c) => c.t / 1000),
          indicators: {
            quote: [
              {
                open: candles.map((c) => c.o),
                high: candles.map((c) => c.h),
                low: candles.map((c) => c.l),
                close: candles.map((c) => c.c),
                volume: candles.map((c) => c.v),
              },
            ],
          },
        };
      } catch {
        continue; // 换下一个 host
      }
    }
  }
  return null;
}

export async function getChart(
  ticker: string,
  range = '6mo',
  interval = '1d'
): Promise<ChartEntry | null> {
  if (interval !== '1d') return null; // 腾讯兜底只支持日线
  const rangeToCount: Record<string, number> = {
    '1mo': 25, '3mo': 70, '6mo': 135, '1y': 260, '2y': 510, '5y': 1250,
  };
  const count = rangeToCount[range] || 260;
  try {
    const url = `${CHART_BASE}/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}&includePrePost=false`;
    const res = await fetchWithRetry(url);
    if (res.ok) {
      const data = (await res.json()) as ChartResponse;
      const entry = data.chart?.result?.[0];
      if (entry && entry.indicators?.quote?.[0]?.close?.some((v) => v != null)) {
        return entry;
      }
    }
  } catch {
    // fallthrough to fallbacks
  }
  const tencent = await getTencentChartEntry(ticker, count);
  if (tencent) return tencent;
  return getEastmoneyChartEntry(ticker, count);
}

// 把 chart 结果整理为蜡烛序列
export function chartToCandles(
  result: NonNullable<Awaited<ReturnType<typeof getChart>>>
): Candle[] {
  const ts = result.timestamp || [];
  const q = result.indicators?.quote?.[0];
  if (!q) return [];
  const candles: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    candles.push({
      t: ts[i] * 1000,
      o,
      h,
      l,
      c,
      v: q.volume?.[i] ?? 0,
    });
  }
  return candles;
}

// ---------------- 技术指标计算 ----------------
export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function bollinger(values: number[], period = 20, mult = 2) {
  if (values.length < period) return { upper: null, lower: null };
  const slice = values.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  const sd = Math.sqrt(variance);
  return { upper: mean + mult * sd, lower: mean - mult * sd };
}

export function computeIndicators(candles: Candle[]) {
  const closes = candles.map((c) => c.c);
  const { upper, lower } = bollinger(closes);
  return {
    rsi14: rsi(closes, 14),
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    bollingerUpper: upper,
    bollingerLower: lower,
  };
}

// ---------------- 逐 ticker 的 quote（基于 chart meta，公开稳定） ----------------
export interface Quote {
  ticker: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number | null;
  dayLow: number | null;
  week52High: number | null;
  week52Low: number | null;
  volume: number | null;
  marketState: string;
  spark?: number[]; // 近期收盘价（用于迷你走势）
}

export async function getQuote(ticker: string): Promise<Quote | null> {
  const result = await getChart(ticker, '1mo', '1d');
  if (!result) return null;
  const meta = result.meta as Record<string, any>;
  const price = meta.regularMarketPrice;
  if (typeof price !== 'number') return null;
  const prev =
    typeof meta.chartPreviousClose === 'number'
      ? meta.chartPreviousClose
      : typeof meta.previousClose === 'number'
        ? meta.previousClose
        : price;
  const closes = (result.timestamp || [])
    .map((_, i) => result.indicators?.quote?.[0]?.close?.[i])
    .filter((v): v is number => typeof v === 'number');

  return {
    ticker,
    name: meta.longName || meta.shortName || ticker,
    exchange: meta.fullExchangeName || meta.exchangeName || '',
    currency: meta.currency || 'USD',
    price,
    previousClose: prev,
    change: price - prev,
    changePercent: prev !== 0 ? ((price - prev) / prev) * 100 : 0,
    dayHigh: meta.regularMarketDayHigh ?? null,
    dayLow: meta.regularMarketDayLow ?? null,
    week52High: meta.fiftyTwoWeekHigh ?? null,
    week52Low: meta.fiftyTwoWeekLow ?? null,
    volume: meta.regularMarketVolume ?? null,
    marketState: meta.marketState || '',
    spark: closes.slice(-20),
  };
}

// ---------------- 腾讯行情兜底（A股/港股/美股，Yahoo 失败时使用） ----------------
function toTencentSymbol(ticker: string): string | null {
  if (/^\d{6}\.SS$/i.test(ticker)) return `sh${ticker.slice(0, 6)}`;
  if (/^\d{6}\.SZ$/i.test(ticker)) return `sz${ticker.slice(0, 6)}`;
  if (/^\d{1,5}\.HK$/i.test(ticker)) return `hk${ticker.split('.')[0].padStart(5, '0')}`;
  if (/^[A-Z.]{1,6}$/i.test(ticker) && !ticker.startsWith('^')) return `us${ticker.toUpperCase()}`;
  return null; // 日股等腾讯不支持
}

// ---------------- 指数兜底：腾讯(us/hk) + 新浪(全球) ----------------
function toTencentIndexSymbol(ticker: string): string | null {
  const map: Record<string, string> = {
    '^DJI': 'usDJI', '^IXIC': 'usIXIC', '^HSI': 'hkHSI',
  };
  return map[ticker] || null;
}

function toSinaIndexSymbol(ticker: string): string | null {
  const map: Record<string, string> = {
    '^DJI': 'int_dji', '^IXIC': 'int_nasdaq', '^GSPC': 'int_sp500',
    '^N225': 'int_nikkei', '^HSI': 'int_hangseng',
  };
  return map[ticker] || null;
}

async function getSinaIndexQuote(ticker: string): Promise<Quote | null> {
  const sym = toSinaIndexSymbol(ticker);
  if (!sym) return null;
  try {
    const res = await fetchWithTimeout(`https://hq.sinajs.cn/list=${sym}`, {
      headers: { Referer: 'https://finance.sina.com.cn' },
    }, 6000);
    if (!res.ok) return null;
    const text = new TextDecoder('gbk').decode(await res.arrayBuffer());
    const m = text.match(/="([^"]*)"/);
    if (!m || !m[1]) return null;
    const f = m[1].split(',');
    if (f.length < 4) return null;
    const price = parseFloat(f[1]);
    const change = parseFloat(f[2]);
    const changePercent = parseFloat(f[3]);
    if (Number.isNaN(price)) return null;
    return {
      ticker,
      name: f[0] || ticker,
      exchange: 'INDEX',
      currency: '',
      price,
      previousClose: price - (Number.isNaN(change) ? 0 : change),
      change: Number.isNaN(change) ? 0 : change,
      changePercent: Number.isNaN(changePercent) ? 0 : changePercent,
      dayHigh: null,
      dayLow: null,
      week52High: null,
      week52Low: null,
      volume: null,
      marketState: '',
    };
  } catch {
    return null;
  }
}

async function getTencentQuote(ticker: string): Promise<Quote | null> {
  const sym = toTencentSymbol(ticker) || toTencentIndexSymbol(ticker);
  if (!sym) return null;
  try {
    const res = await fetchWithTimeout(`https://qt.gtimg.cn/q=${sym}`, {}, 6000);
    if (!res.ok) return null;
    const text = new TextDecoder('gbk').decode(await res.arrayBuffer());
    const m = text.match(/="([^"]+)"/);
    if (!m) return null;
    const f = m[1].split('~');
    if (f.length < 35 || !f[3]) return null;
    const price = parseFloat(f[3]);
    const prev = parseFloat(f[4]) || price;
    const currency = sym.startsWith('hk') ? 'HKD' : sym.startsWith('us') ? 'USD' : 'CNY';
    const name = f[1] || ticker;
    const pe = parseFloat(f[39]);
    const pb = parseFloat(f[46]);
    const w52h = parseFloat(f[47]);
    const w52l = parseFloat(f[48]);
    // 字段映射在不同市场有差异，做合理性校验
    const w52Valid = !Number.isNaN(w52h) && !Number.isNaN(w52l) && w52h > w52l && w52l < price * 1.6 && w52h > price * 0.5;
    const mcapYi = parseFloat(f[45]); // 总市值（亿）
    return {
      ticker,
      name,
      exchange: sym.startsWith('hk') ? 'HKEX' : sym.startsWith('us') ? 'US' : sym.startsWith('sh') ? 'SSE' : 'SZSE',
      currency,
      price,
      previousClose: prev,
      change: price - prev,
      changePercent: prev !== 0 ? ((price - prev) / prev) * 100 : 0,
      dayHigh: parseFloat(f[33]) || null,
      dayLow: parseFloat(f[34]) || null,
      week52High: w52Valid ? w52h : null,
      week52Low: w52Valid ? w52l : null,
      volume: parseFloat(f[36]) || null,
      marketState: '',
      // 附加字段供 meta/detail 使用
      pe: Number.isNaN(pe) || pe <= 0 ? null : pe,
      pb: Number.isNaN(pb) || pb <= 0 ? null : pb,
      marketCap: !Number.isNaN(mcapYi) && mcapYi > 0 ? mcapYi * 1e8 : null,
    } as Quote & { pe: number | null; pb: number | null; marketCap: number | null };
  } catch {
    return null;
  }
}

// 东财实时报价兜底（f43 现价/f60 昨收/f58 名称，价格可能带精度，取 kline 校准）
async function getEastmoneyQuote(ticker: string): Promise<Quote | null> {
  const secids = toEastmoneySecids(ticker);
  if (secids.length === 0) return null;
  for (const secid of secids) {
    try {
      const url = `https://push2delay.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f44,f45,f46,f57,f58,f60,f116,f162,f167,f169,f170,f171`;
      const res = await fetchWithTimeout(url, {
        headers: { Referer: 'https://quote.eastmoney.com/' },
      }, 6000);
      if (!res.ok) continue;
      const data = await res.json();
      const d = data?.data;
      if (!d || d.f43 == null || d.f43 === '-') continue;

      // 东财价格字段带精度（f59 未取时通常 ×100 或 ×1000），用日K收盘价校准
      const chart = await getEastmoneyChartEntry(ticker, 5);
      const lastClose = chart ? (chart.indicators.quote?.[0]?.close?.slice(-1)[0] as number) : null;
      let price = Number(d.f43);
      if (lastClose && lastClose > 0) {
        // 选择最接近K线收盘价的精度
        for (const div of [1, 10, 100, 1000]) {
          if (Math.abs(price / div - lastClose) / lastClose < 0.03) {
            price = price / div;
            break;
          }
        }
      }
      const prev = Number(d.f60);
      const scale = price > 0 && Number.isFinite(prev) ? 1 : 1;
      const prevScaled = lastClose && prev > price * 2 ? prev / 100 : prev; // 精度校准
      const currency = ticker.endsWith('.T') ? 'JPY' : ticker.endsWith('.HK') ? 'HKD' : /^\d{6}/.test(ticker) ? 'CNY' : 'USD';
      const changePercent = d.f170 != null && typeof d.f170 === 'number' ? d.f170 / 100 : prevScaled ? ((price - prevScaled) / prevScaled) * 100 : 0;

      return {
        ticker,
        name: d.f58 || ticker,
        exchange: ticker.endsWith('.T') ? 'TSE' : '',
        currency,
        price,
        previousClose: prevScaled || price,
        change: prevScaled ? price - prevScaled : 0,
        changePercent,
        dayHigh: typeof d.f45 === 'number' ? d.f45 / 100 : null,
        dayLow: typeof d.f46 === 'number' ? d.f46 / 100 : null,
        week52High: null,
        week52Low: null,
        volume: null,
        marketState: '',
        pe: typeof d.f162 === 'number' && d.f162 > 0 ? d.f162 / 100 : null,
        pb: typeof d.f167 === 'number' && d.f167 > 0 ? d.f167 / 100 : null,
        marketCap: typeof d.f116 === 'number' ? d.f116 : null,
      } as Quote & { pe: number | null; pb: number | null; marketCap: number | null };
    } catch {
      continue;
    }
  }
  return null;
}

export async function getQuotes(tickers: string[]): Promise<Quote[]> {
  // 限流并发（每批3个），失败的 ticker 依次走腾讯/新浪/东财兜底
  const results = await mapWithConcurrency(tickers, 3, async (t) => {
    const q = await getQuote(t);
    if (q) return q;
    return (
      (await getTencentQuote(t)) ||
      (await getSinaIndexQuote(t)) ||
      (await getEastmoneyQuote(t))
    );
  });
  return results.filter((q): q is Quote => q !== null);
}

// ---------------- 详情（chart + quoteSummary，quoteSummary 失败时优雅降级） ----------------
export async function getDetail(ticker: string): Promise<QuoteSummary | null> {
  const chart = await getChart(ticker, '1y', '1d');
  if (!chart) return null;
  const candles = chartToCandles(chart);
  const meta = chart.meta as Record<string, any>;
  const indicators = computeIndicators(candles);
  const price = meta.regularMarketPrice ?? candles[candles.length - 1]?.c ?? 0;

  // quoteSummary 需要鉴权，失败不影响基础功能
  const { crumb, cookie } = (await getCrumb()) || { crumb: '', cookie: '' };
  let summary: any = null;
  if (crumb) {
    try {
      const modules = 'summaryDetail,defaultKeyStatistics,financialData,price,recommendationTrend';
      const res = await fetchWithTimeout(
        `${QUOTE_BASE}/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`,
        { headers: cookie ? { Cookie: cookie } : {} },
        8000
      );
      if (res.ok) {
        const data = await res.json();
        summary = data?.quoteSummary?.result?.[0] || null;
      }
    } catch {
      summary = null;
    }
  }

  const pick = (v: any): number | null =>
    v && typeof v === 'object' && 'raw' in v ? (v.raw as number) : typeof v === 'number' ? v : null;

  const summaryDetail = summary?.summaryDetail || {};
  const financial = summary?.financialData || {};
  const stats = summary?.defaultKeyStatistics || {};
  const rec = summary?.recommendationTrend?.trend?.[0] || {};

  return {
    ticker,
    name: meta.longName || meta.shortName || summary?.price?.longName || ticker,
    exchange: meta.fullExchangeName || meta.exchangeName || '',
    currency: meta.currency || 'USD',
    price,
    previousClose:
      typeof meta.chartPreviousClose === 'number' ? meta.chartPreviousClose : price,
    changePercent:
      meta.chartPreviousClose ? ((price - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : 0,
    sector: summary?.price?.sector || null,
    industry: summary?.price?.industry || null,
    valuation: {
      marketCap: pick(summaryDetail.marketCap) ?? (meta.marketCap as number | null) ?? pick(stats.enterpriseValue),
      per: pick(summaryDetail.trailingPE) ?? pick(stats.forwardPE) ?? (meta.pe as number | null),
      pbr: pick(summaryDetail.priceToBook) ?? (meta.pb as number | null),
      dividendYield: pick(summaryDetail.dividendYield),
      week52High: pick(summaryDetail.fiftyTwoWeekHigh) ?? meta.fiftyTwoWeekHigh ?? null,
      week52Low: pick(summaryDetail.fiftyTwoWeekLow) ?? meta.fiftyTwoWeekLow ?? null,
    },
    financial: {
      revenue: pick(financial.totalRevenue),
      netIncome: pick(financial.netIncomeToCommon),
      freeCashFlow: pick(financial.freeCashflow),
      roe: pick(financial.returnOnEquity),
      revenueGrowth: pick(financial.revenueGrowth),
      totalCash: pick(financial.totalCash),
      totalDebt: pick(financial.totalDebt),
      grossMargins: pick(financial.grossMargins),
      profitMargins: pick(financial.profitMargins),
    },
    analyst: {
      // 修正：目标价在 financialData，评级在 recommendationTrend
      targetHigh: pick(financial.targetHighPrice),
      targetMean: pick(financial.targetMeanPrice),
      targetLow: pick(financial.targetLowPrice),
      rating: typeof rec.recommendation === 'string' ? rec.recommendation : null,
      analystCount: pick(rec.numberOfAnalystOpinions) ?? 0,
    },
    technical: {
      rsi14: indicators.rsi14,
      sma20: indicators.sma20,
      sma50: indicators.sma50,
      sma200: indicators.sma200,
      bollingerUpper: indicators.bollingerUpper,
      bollingerLower: indicators.bollingerLower,
    },
    candles,
    hasSummary: summary !== null,
  };
}

// ---------------- 搜索 + 新闻 ----------------
export async function searchSymbol(query: string): Promise<SearchResult[]> {
  try {
    const url = `${SEARCH_BASE}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&lang=zh-CN&region=CN`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.quotes || [])
      .filter((q: any) => q.symbol)
      .map((q: any) => ({
        ticker: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchDisp || q.exchange || '',
        type: q.quoteType || '',
      }));
  } catch {
    return [];
  }
}

// 东方财富模糊搜索（覆盖 A股/港股/美股/日股，支持中文/代码/拼音，Yahoo 不可用时是主力搜索源）
// QuoteID 映射：1.XX→沪 0.XX→深 116.X→港 105/106.X→美 176.X→日 100.X→全球指数
function quoteIdToTicker(quoteId: string): string | null {
  const m = quoteId.match(/^(\d+)\.(.+)$/);
  if (!m) return null;
  const [, mkt, code] = m;
  if (mkt === '1') return `${code}.SS`;
  if (mkt === '0') return `${code}.SZ`;
  if (mkt === '116') return `${code}.HK`;
  if (mkt === '105' || mkt === '106') return code;
  if (mkt === '176') return `${code}.T`;
  if (mkt === '100') return `^${code}`;
  return null;
}

export async function searchEastmoney(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(query)}&type=14&count=10`;
    const res = await fetchWithTimeout(url, {
      headers: { Referer: 'https://www.eastmoney.com/' },
    }, 6000);
    if (!res.ok) return [];
    const data = await res.json();
    const rows = data?.QuotationCodeTable?.Data || [];
    const out: SearchResult[] = [];
    for (const r of rows) {
      const ticker = quoteIdToTicker(r.QuoteID || '');
      if (!ticker) continue;
      out.push({
        ticker,
        name: r.Name || ticker,
        exchange: r.SecurityTypeName || '',
        type: r.Classify || '',
      });
    }
    return out;
  } catch {
    return [];
  }
}

// 组合搜索：东财（主力）+ Yahoo（补充美股/ETF），去重
export async function searchSymbolMulti(query: string): Promise<SearchResult[]> {
  const [em, yahoo] = await Promise.all([searchEastmoney(query), searchSymbol(query)]);
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const r of [...em, ...yahoo]) {
    const key = r.ticker.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(r);
  }
  return merged;
}

// ---------------- 新闻 + 影响判断 ----------------
// 关键词情感规则（中英文）
const POSITIVE_KEYWORDS: Array<[RegExp, string]> = [
  [/upgrade|raised.*(rating|target|outlook)|buy rating/i, '评级上调'],
  [/beat|exceed|surpass|record (high|revenue|profit)|stronger-than-expected/i, '业绩超预期'],
  [/surge|soar|rally|jump|climb/i, '股价上涨动能'],
  [/dividend increase|special dividend|buyback|share repurchase/i, '回购/增派股息'],
  [/partnership|contract win|awarded|approval|breakthrough/i, '业务利好'],
  [/profit (growth|up)|revenue (growth|up|beat)/i, '盈利增长'],
  [/降息|宽松|刺激政策|利好政策/i, '政策利好'],
  [/增持|上调|超预期|创新高|中标|获批|业绩预增|扭亏为盈/i, '利好消息'],
  [/重大资产重组|并购重组|成功收购|拟收购|签署.*(协议|合同)|战略合作/i, '资本运作/业务扩张利好'],
  [/回购|分红|派息|特别分红/i, '回报股东'],
  [/净利(润)?增(长|好)|营收增(长|好)|预盈|盈利能力提升/i, '盈利向好'],
  [/调入|纳入(指数|港股通|标普)|获得订单|签订|中标/i, '纳入/订单利好'],
  [/涨停|大涨|拉升|走高|反弹/i, '股价强势'],
  [/突破|新高|放量上涨/i, '技术面走强'],
];

const NEGATIVE_KEYWORDS: Array<[RegExp, string]> = [
  [/downgrade|cut.*(rating|target|outlook)|sell rating/i, '评级下调'],
  [/miss|disappoint|weaker-than-expected|loss|plunge|sink|tumble|slump|fall/i, '业绩不及预期/股价下跌'],
  [/lawsuit|probe|investigation|sec charges|fine|penalt/i, '监管/诉讼风险'],
  [/recall|bankrupt|default|delisting|resign|layoff|restructure/i, '经营风险'],
  [/bearish|short seller|warn/i, '市场看空'],
  [/加息|收紧|tariff|trade war|sanction/i, '宏观利空'],
  [/下调|立案|处罚|减持|预亏|跌停|诉讼|违规|退市/i, '利空消息'],
  [/首亏|亏损|净利(润)?下(滑|降)|营收下(滑|降)|业绩变脸/i, '业绩恶化'],
  [/缩水|承压|走低|下挫|大跌|重挫|暴跌|创.*新低/i, '股价走弱'],
  [/解禁|质押|平仓|爆雷|被查|警示|问询函/i, '风险警示'],
  [/裁员|停产|停工|推迟|终止(?!上市)/i, '经营不确定'],
];

export function analyzeNewsSentiment(title: string, summary?: string): {
  impact: 'positive' | 'negative' | 'neutral';
  reason: string;
} {
  const text = `${title} ${summary || ''}`;
  let posScore = 0;
  let negScore = 0;
  const posHits: string[] = [];
  const negHits: string[] = [];
  for (const [re, label] of POSITIVE_KEYWORDS) {
    if (re.test(text)) {
      posScore++;
      posHits.push(label);
    }
  }
  for (const [re, label] of NEGATIVE_KEYWORDS) {
    if (re.test(text)) {
      negScore++;
      negHits.push(label);
    }
  }
  if (posScore > negScore) {
    return { impact: 'positive', reason: posHits.join('、') };
  }
  if (negScore > posScore) {
    return { impact: 'negative', reason: negHits.join('、') };
  }
  return { impact: 'neutral', reason: '未检测到明显利好或利空信号，建议结合基本面判断' };
}

export async function getNews(ticker?: string, count = 15): Promise<NewsItem[]> {
  // 主源：Yahoo（支持个股新闻）；兜底：新浪财经滚动（市场要闻）
  const yahoo = await getYahooNews(ticker, count);
  if (yahoo.length > 0) return yahoo;
  return getSinaNews(count);
}

async function getYahooNews(ticker?: string, count = 15): Promise<NewsItem[]> {
  try {
    const q = ticker || 'stock market';
    const url = `${SEARCH_BASE}?q=${encodeURIComponent(q)}&quotesCount=0&newsCount=${count}&lang=zh-CN&region=CN`;
    const res = await fetchWithRetry(url, {}, 8000, 1);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.news || []).map((n: any) => {
      const { impact, reason } = analyzeNewsSentiment(n.title || '', '');
      return {
        id: n.uuid || `${n.title}`,
        title: n.title || '',
        publisher: n.publisher || '',
        link: n.link || '',
        publishedAt: (n.providerPublishTime || 0) * 1000,
        relatedTickers: n.relatedTickers || [],
        impact,
        reason,
      };
    });
  } catch {
    return [];
  }
}

// 新浪财经滚动新闻兜底
async function getSinaNews(count = 15): Promise<NewsItem[]> {
  try {
    const url = `https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&num=${count}`;
    const res = await fetchWithTimeout(url, {
      headers: { Referer: 'https://finance.sina.com.cn' },
    }, 8000);
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.result?.data || [];
    return items.map((item: any) => {
      const title = (item.title || '').replace(/<[^>]+>/g, '');
      const { impact, reason } = analyzeNewsSentiment(title, item.intro || '');
      return {
        id: item.oid ? String(item.oid) : `${title}`,
        title,
        publisher: item.media_name || '新浪财经',
        link: item.url || '',
        publishedAt: item.int_time ? parseInt(item.int_time) * 1000 : Date.now(),
        relatedTickers: [],
        impact,
        reason,
      };
    });
  } catch {
    return [];
  }
}
