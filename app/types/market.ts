// K线蜡烛
export interface Candle {
  t: number;   // 时间戳 (ms)
  o: number;   // 开盘价
  h: number;   // 最高价
  l: number;   // 最低价
  c: number;   // 收盘价
  v: number;   // 成交量
}

// 技术指标
export interface TechnicalSnapshot {
  rsi14: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  bollingerUpper: number | null;
  bollingerLower: number | null;
}

// 实时报价
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
  spark?: number[];
}

// 股票详情（服务端汇总）
export interface QuoteSummary {
  ticker: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  previousClose: number;
  changePercent: number;
  sector: string | null;
  industry: string | null;
  valuation: {
    marketCap: number | null;
    per: number | null;
    pbr: number | null;
    dividendYield: number | null;
    week52High: number | null;
    week52Low: number | null;
  };
  financial: {
    revenue: number | null;
    netIncome: number | null;
    freeCashFlow: number | null;
    roe: number | null;
    revenueGrowth: number | null;
    totalCash: number | null;
    totalDebt: number | null;
    grossMargins: number | null;
    profitMargins: number | null;
  };
  analyst: {
    targetHigh: number | null;
    targetMean: number | null;
    targetLow: number | null;
    rating: string | null;
    analystCount: number;
  };
  technical: TechnicalSnapshot;
  candles: Candle[];
  hasSummary: boolean;
}

// 新闻条目（含影响判断）
export interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: number;
  relatedTickers: string[];
  impact: 'positive' | 'negative' | 'neutral';
  reason: string;
}

// 搜索结果
export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

// 买卖信号
export type TradeSignalLevel = 'strong_buy' | 'buy' | 'hold' | 'reduce' | 'sell';

export interface TradeAdvice {
  signal: TradeSignalLevel;
  score: number; // -100 ~ +100
  reasons: string[];
  risks: string[];
}
