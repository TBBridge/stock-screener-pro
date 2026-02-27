// 真实股票数据API接口
// 使用 Yahoo Finance API (通过 yfinance 或类似服务)

import { StockData, StockValuation, FinancialData, TechnicalIndicators, AnalystForecast, StockScore } from '@/app/types/stock';

// Yahoo Finance API 基础URL
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_QUOTE_BASE = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary';

// 股票代码映射 (将内部代码转换为Yahoo格式)
const tickerMapping: Record<string, string> = {
  // A股
  '600519.SS': '600519.SS', // 茅台
  '000858.SZ': '000858.SZ', // 五粮液
  // 美股
  'AAPL': 'AAPL',
  'MSFT': 'MSFT',
  'GOOGL': 'GOOGL',
  'AMZN': 'AMZN',
  'NVDA': 'NVDA',
  'TSLA': 'TSLA',
  'META': 'META',
  'NFLX': 'NFLX',
  // 港股
  '0700.HK': '0700.HK',
  '9988.HK': '9988.HK',
  '3690.HK': '3690.HK',
  // 日股
  '7203.T': '7203.T', // 丰田
  '6758.T': '6758.T', // 索尼
};

// 获取股票实时价格
export async function getStockPrice(ticker: string): Promise<number | null> {
  try {
    const yahooTicker = tickerMapping[ticker] || ticker;
    const response = await fetch(`${YAHOO_FINANCE_BASE}/${yahooTicker}?interval=1d&range=1d`);
    const data = await response.json();
    
    if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
      return data.chart.result[0].meta.regularMarketPrice;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch price for ${ticker}:`, error);
    return null;
  }
}

// 获取股票详细信息
export async function getStockDetails(ticker: string): Promise<Partial<StockData> | null> {
  try {
    const yahooTicker = tickerMapping[ticker] || ticker;
    const modules = 'summaryDetail,defaultKeyStatistics,financialData,price,recommendationTrend';
    const response = await fetch(`${YAHOO_QUOTE_BASE}/${yahooTicker}?modules=${modules}`);
    const data = await response.json();
    
    if (!data.quoteSummary?.result?.[0]) {
      return null;
    }

    const result = data.quoteSummary.result[0];
    const price = result.price;
    const summary = result.summaryDetail;
    const stats = result.defaultKeyStatistics;
    const financial = result.financialData;
    const recommendation = result.recommendationTrend;

    return {
      ticker,
      name: price?.longName || price?.shortName || ticker,
      exchange: price?.exchangeName || '',
      currency: price?.currency || 'USD',
      sector: price?.sector || '',
      industry: price?.industry || '',
      valuation: {
        ticker,
        price: price?.regularMarketPrice || 0,
        per: summary?.trailingPE || null,
        pbr: summary?.priceToBook || null,
        dividendYield: summary?.dividendYield ? summary.dividendYield * 100 : null,
        marketCap: summary?.marketCap || null,
        week52High: summary?.fiftyTwoWeekHigh || null,
        week52Low: summary?.fiftyTwoWeekLow || null,
      },
      financial: {
        ticker,
        revenue: financial?.totalRevenue || null,
        netIncome: financial?.netIncomeToCommon || null,
        totalAssets: null, // 需要额外模块
        totalEquity: null,
        freeCashFlow: financial?.freeCashflow || null,
        roe: financial?.returnOnEquity ? financial.returnOnEquity * 100 : null,
        revenueGrowth: financial?.revenueGrowth ? financial.revenueGrowth * 100 : null,
      },
      analyst: {
        ticker,
        targetHigh: recommendation?.trend?.[0]?.high || null,
        targetMean: recommendation?.trend?.[0]?.consensus || null,
        targetLow: recommendation?.trend?.[0]?.low || null,
        rating: null,
        analystCount: recommendation?.trend?.[0]?.numberOfAnalysts || 0,
      },
    };
  } catch (error) {
    console.error(`Failed to fetch details for ${ticker}:`, error);
    return null;
  }
}

// 获取多只股票数据
export async function getMultipleStocks(tickers: string[]): Promise<StockData[]> {
  const stocks: StockData[] = [];
  
  for (const ticker of tickers) {
    const details = await getStockDetails(ticker);
    if (details) {
      stocks.push({
        ...details,
        technical: {
          ticker,
          rsi14: null,
          sma50: null,
          sma200: null,
          bollingerUpper: null,
          bollingerLower: null,
        },
        score: calculateScore(details),
        lastUpdated: new Date(),
      } as StockData);
    }
  }
  
  return stocks;
}

// 计算股票评分
function calculateScore(stock: Partial<StockData>): StockScore {
  const valuation = stock.valuation;
  const financial = stock.financial;
  
  let valueScore = 50;
  let growthScore = 50;
  let qualityScore = 50;
  let technicalScore = 50;
  
  // 价值评分
  if (valuation && valuation.per !== null && valuation.per !== undefined) {
    if (valuation.per < 10) valueScore += 25;
    else if (valuation.per < 15) valueScore += 15;
    else if (valuation.per < 25) valueScore += 5;
    else valueScore -= 10;
  }
  
  if (valuation && valuation.pbr !== null && valuation.pbr !== undefined) {
    if (valuation.pbr < 1) valueScore += 15;
    else if (valuation.pbr < 2) valueScore += 5;
    else valueScore -= 5;
  }
  
  // 成长评分
  if (financial && financial.revenueGrowth !== null && financial.revenueGrowth !== undefined) {
    if (financial.revenueGrowth > 20) growthScore += 25;
    else if (financial.revenueGrowth > 10) growthScore += 15;
    else if (financial.revenueGrowth > 0) growthScore += 5;
    else growthScore -= 10;
  }
  
  // 质量评分
  if (financial && financial.roe !== null && financial.roe !== undefined) {
    if (financial.roe > 20) qualityScore += 25;
    else if (financial.roe > 15) qualityScore += 15;
    else if (financial.roe > 10) qualityScore += 5;
    else qualityScore -= 5;
  }
  
  valueScore = Math.max(0, Math.min(100, valueScore));
  growthScore = Math.max(0, Math.min(100, growthScore));
  qualityScore = Math.max(0, Math.min(100, qualityScore));
  technicalScore = Math.max(0, Math.min(100, technicalScore));
  
  const alphaScore = Math.round((valueScore + growthScore + qualityScore) / 3);
  const total = Math.round(valueScore * 0.4 + growthScore * 0.3 + qualityScore * 0.2 + technicalScore * 0.1);
  
  return {
    total,
    value: valueScore,
    growth: growthScore,
    quality: qualityScore,
    technical: technicalScore,
    alpha: alphaScore,
  };
}

// 搜索股票
export async function searchStocks(query: string): Promise<Array<{ ticker: string; name: string; exchange: string }>> {
  try {
    const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`);
    const data = await response.json();
    
    return (data.quotes || []).map((quote: any) => ({
      ticker: quote.symbol,
      name: quote.longname || quote.shortname || quote.symbol,
      exchange: quote.exchange || '',
    }));
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}
