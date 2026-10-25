// 客户端数据访问层 —— 统一走本地 /api/* 服务端代理（解决浏览器直连 Yahoo 的 CORS 问题）

import { Quote, QuoteSummary, Candle, NewsItem, SearchResult } from '@/app/types/market';

// 轻量内存缓存（避免同页多次重复请求）
const memCache = new Map<string, { data: unknown; at: number }>();

async function cachedFetch<T>(key: string, url: string, ttlMs: number): Promise<T> {
  const hit = memCache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Request failed: ${res.status}`);
  }
  const data = (await res.json()) as T;
  memCache.set(key, { data, at: Date.now() });
  if (memCache.size > 300) {
    const oldest = [...memCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) memCache.delete(oldest[0]);
  }
  return data;
}

// 实时报价（批量）
export async function getQuotes(tickers: string[]): Promise<Quote[]> {
  if (tickers.length === 0) return [];
  const data = await cachedFetch<{ quotes: Quote[] }>(
    `quotes:${tickers.join(',')}`,
    `/api/quote?tickers=${encodeURIComponent(tickers.join(','))}`,
    30 * 1000
  );
  return data.quotes;
}

// 兼容旧调用名
export async function getStockPrice(ticker: string): Promise<number | null> {
  try {
    const quotes = await getQuotes([ticker]);
    return quotes[0]?.price ?? null;
  } catch {
    return null;
  }
}

// K线数据 + 技术指标
export interface ChartData {
  ticker: string;
  currency: string;
  name: string;
  candles: Candle[];
  indicators: {
    rsi14: number | null;
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    bollingerUpper: number | null;
    bollingerLower: number | null;
  };
}

export async function getChartData(
  ticker: string,
  range = '6mo',
  interval = '1d'
): Promise<ChartData> {
  return cachedFetch<ChartData>(
    `chart:${ticker}:${range}:${interval}`,
    `/api/chart?ticker=${encodeURIComponent(ticker)}&range=${range}&interval=${interval}`,
    60 * 1000
  );
}

// 股票详情（估值/财务/分析师/技术指标/K线）
export async function getStockDetails(ticker: string): Promise<QuoteSummary> {
  return cachedFetch<QuoteSummary>(
    `detail:${ticker}`,
    `/api/details?ticker=${encodeURIComponent(ticker)}`,
    60 * 1000
  );
}

// 新闻（指定股票或市场要闻）
export async function getStockNews(ticker?: string, count = 15): Promise<NewsItem[]> {
  const params = new URLSearchParams({ count: String(count) });
  if (ticker) params.set('ticker', ticker);
  const data = await cachedFetch<{ news: NewsItem[] }>(
    `news:${ticker || 'market'}:${count}`,
    `/api/news?${params.toString()}`,
    5 * 60 * 1000
  );
  return data.news;
}

// 股票搜索
export async function searchStocks(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const data = await cachedFetch<{ results: SearchResult[] }>(
    `search:${query}`,
    `/api/search?q=${encodeURIComponent(query.trim())}`,
    10 * 60 * 1000
  );
  return data.results;
}

// 全球指数行情
export interface IndexQuote extends Quote {
  label: string;
  market: string;
}

export async function getMarketIndices(): Promise<IndexQuote[]> {
  const data = await cachedFetch<{ indices: IndexQuote[] }>(
    'market:default',
    '/api/market',
    30 * 1000
  );
  return data.indices;
}
