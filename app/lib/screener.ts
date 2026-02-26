import { StockData, ScreenerCriteria, ScreenerResult, ScreenerEngine, StockScore } from '@/app/types/stock';

// 价值评分计算 (PER + PBR + 股息)
function calculateValueScore(stock: StockData): number {
  let score = 0;
  
  // PER 评分 (越低越好) - 25分
  if (stock.valuation.per !== null) {
    if (stock.valuation.per < 10) score += 25;
    else if (stock.valuation.per < 15) score += 20;
    else if (stock.valuation.per < 20) score += 15;
    else if (stock.valuation.per < 30) score += 10;
    else score += 5;
  }
  
  // PBR 评分 (越低越好) - 25分
  if (stock.valuation.pbr !== null) {
    if (stock.valuation.pbr < 1) score += 25;
    else if (stock.valuation.pbr < 1.5) score += 20;
    else if (stock.valuation.pbr < 2) score += 15;
    else if (stock.valuation.pbr < 3) score += 10;
    else score += 5;
  }
  
  // 股息率评分 (越高越好) - 20分
  if (stock.valuation.dividendYield !== null) {
    if (stock.valuation.dividendYield > 5) score += 20;
    else if (stock.valuation.dividendYield > 3) score += 15;
    else if (stock.valuation.dividendYield > 2) score += 10;
    else if (stock.valuation.dividendYield > 1) score += 5;
  }
  
  // ROE 评分 (越高越好) - 15分
  if (stock.financial.roe !== null) {
    if (stock.financial.roe > 20) score += 15;
    else if (stock.financial.roe > 15) score += 12;
    else if (stock.financial.roe > 10) score += 9;
    else if (stock.financial.roe > 5) score += 6;
    else score += 3;
  }
  
  // 营收增长评分 - 15分
  if (stock.financial.revenueGrowth !== null) {
    if (stock.financial.revenueGrowth > 30) score += 15;
    else if (stock.financial.revenueGrowth > 20) score += 12;
    else if (stock.financial.revenueGrowth > 10) score += 9;
    else if (stock.financial.revenueGrowth > 0) score += 6;
    else score += 3;
  }
  
  return score;
}

// 阿尔法评分 (变化趋势)
function calculateAlphaScore(stock: StockData): number {
  let score = 0;
  
  // 营收增长趋势 - 30分
  if (stock.financial.revenueGrowth !== null) {
    score += Math.min(30, Math.max(0, stock.financial.revenueGrowth));
  }
  
  // ROE 质量 - 25分
  if (stock.financial.roe !== null) {
    score += Math.min(25, stock.financial.roe * 1.25);
  }
  
  // 自由现金流 - 25分
  if (stock.financial.freeCashFlow !== null && stock.financial.revenue !== null) {
    const fcfMargin = (stock.financial.freeCashFlow / stock.financial.revenue) * 100;
    score += Math.min(25, fcfMargin * 2);
  }
  
  // 价格动量 - 20分
  if (stock.technical.rsi14 !== null) {
    // RSI 在 40-60 之间视为健康
    const rsiScore = 20 - Math.abs(stock.technical.rsi14 - 50) / 2.5;
    score += Math.max(0, rsiScore);
  }
  
  return Math.min(100, score);
}

// 技术评分
function calculateTechnicalScore(stock: StockData): number {
  let score = 50; // 基础分
  
  // RSI 评分
  if (stock.technical.rsi14 !== null) {
    if (stock.technical.rsi14 > 70) score -= 15; // 超买
    else if (stock.technical.rsi14 > 60) score -= 5;
    else if (stock.technical.rsi14 > 40) score += 10; // 健康区间
    else if (stock.technical.rsi14 > 30) score += 5;
    else score += 15; // 超卖，可能反弹
  }
  
  // 移动平均线
  if (stock.technical.sma50 !== null && stock.technical.sma200 !== null) {
    if (stock.technical.sma50 > stock.technical.sma200) {
      score += 15; // 黄金交叉
    } else {
      score -= 10; // 死亡交叉
    }
  }
  
  // 52周位置
  if (stock.valuation.week52High !== null && stock.valuation.week52Low !== null) {
    const range = stock.valuation.week52High - stock.valuation.week52Low;
    const position = (stock.valuation.price - stock.valuation.week52Low) / range;
    if (position > 0.8) score -= 10; // 接近高点
    else if (position < 0.2) score += 10; // 接近低点
  }
  
  return Math.max(0, Math.min(100, score));
}

// 更新股票评分
export function updateStockScores(stocks: StockData[]): StockData[] {
  return stocks.map(stock => {
    const valueScore = calculateValueScore(stock);
    const alphaScore = calculateAlphaScore(stock);
    const technicalScore = calculateTechnicalScore(stock);
    
    const score: StockScore = {
      value: Math.floor(valueScore * 0.4),
      growth: Math.floor(alphaScore * 0.3),
      quality: Math.floor(valueScore * 0.2),
      technical: Math.floor(technicalScore * 0.1),
      alpha: Math.floor(alphaScore),
      total: 0,
    };
    
    score.total = score.value + score.growth + score.quality + score.technical;
    
    return {
      ...stock,
      score,
    };
  });
}

// 筛选股票
export function filterStocks(stocks: StockData[], criteria: ScreenerCriteria): StockData[] {
  return stocks.filter(stock => {
    // 交易所筛选
    if (criteria.exchange?.length && !criteria.exchange.includes(stock.exchange)) {
      return false;
    }
    
    // 行业筛选
    if (criteria.sector?.length && stock.sector && !criteria.sector.includes(stock.sector)) {
      return false;
    }
    
    // PER 筛选
    if (criteria.perMin !== undefined && (stock.valuation.per === null || stock.valuation.per < criteria.perMin)) {
      return false;
    }
    if (criteria.perMax !== undefined && (stock.valuation.per === null || stock.valuation.per > criteria.perMax)) {
      return false;
    }
    
    // PBR 筛选
    if (criteria.pbrMin !== undefined && (stock.valuation.pbr === null || stock.valuation.pbr < criteria.pbrMin)) {
      return false;
    }
    if (criteria.pbrMax !== undefined && (stock.valuation.pbr === null || stock.valuation.pbr > criteria.pbrMax)) {
      return false;
    }
    
    // 股息率筛选
    if (criteria.dividendYieldMin !== undefined && 
        (stock.valuation.dividendYield === null || stock.valuation.dividendYield < criteria.dividendYieldMin)) {
      return false;
    }
    
    // 市值筛选
    if (criteria.marketCapMin !== undefined && 
        (stock.valuation.marketCap === null || stock.valuation.marketCap < criteria.marketCapMin)) {
      return false;
    }
    if (criteria.marketCapMax !== undefined && 
        (stock.valuation.marketCap === null || stock.valuation.marketCap > criteria.marketCapMax)) {
      return false;
    }
    
    // ROE 筛选
    if (criteria.roeMin !== undefined && 
        (stock.financial.roe === null || stock.financial.roe < criteria.roeMin)) {
      return false;
    }
    
    // 营收增长筛选
    if (criteria.revenueGrowthMin !== undefined && 
        (stock.financial.revenueGrowth === null || stock.financial.revenueGrowth < criteria.revenueGrowthMin)) {
      return false;
    }
    
    // RSI 筛选
    if (criteria.rsiMin !== undefined && 
        (stock.technical.rsi14 === null || stock.technical.rsi14 < criteria.rsiMin)) {
      return false;
    }
    if (criteria.rsiMax !== undefined && 
        (stock.technical.rsi14 === null || stock.technical.rsi14 > criteria.rsiMax)) {
      return false;
    }
    
    // 移动平均线筛选
    if (criteria.aboveSMA50 && stock.technical.sma50 !== null && stock.valuation.price < stock.technical.sma50) {
      return false;
    }
    if (criteria.aboveSMA200 && stock.technical.sma200 !== null && stock.valuation.price < stock.technical.sma200) {
      return false;
    }
    
    // 分析师数量筛选
    if (criteria.analystCountMin !== undefined && stock.analyst.analystCount < criteria.analystCountMin) {
      return false;
    }
    
    // 评级筛选
    if (criteria.rating?.length && !criteria.rating.includes(stock.analyst.rating || '')) {
      return false;
    }
    
    return true;
  });
}

// 价值筛选引擎
export function valueScreener(stocks: StockData[]): StockData[] {
  const criteria: ScreenerCriteria = {
    perMax: 15,
    pbrMax: 1.5,
    roeMin: 10,
    marketCapMin: 1000000000,
  };
  
  const filtered = filterStocks(stocks, criteria);
  return filtered.sort((a, b) => b.score.total - a.score.total);
}

// 回调筛选引擎 (Pullback)
export function pullbackScreener(stocks: StockData[]): StockData[] {
  const criteria: ScreenerCriteria = {
    rsiMin: 30,
    rsiMax: 50,
    aboveSMA200: true,
    perMax: 25,
  };
  
  const filtered = filterStocks(stocks, criteria);
  return filtered.sort((a, b) => {
    // 优先 RSI 较低但高于30的
    const rsiA = a.technical.rsi14 || 50;
    const rsiB = b.technical.rsi14 || 50;
    return rsiB - rsiA;
  });
}

// 阿尔法筛选引擎
export function alphaScreener(stocks: StockData[]): StockData[] {
  const criteria: ScreenerCriteria = {
    roeMin: 15,
    revenueGrowthMin: 15,
    perMax: 30,
  };
  
  const filtered = filterStocks(stocks, criteria);
  return filtered.sort((a, b) => b.score.alpha - a.score.alpha);
}

// 执行筛选
export function runScreener(
  engine: ScreenerEngine,
  stocks: StockData[],
  customCriteria?: ScreenerCriteria
): ScreenerResult {
  let filtered: StockData[] = [];
  
  switch (engine) {
    case 'value':
      filtered = valueScreener(stocks);
      break;
    case 'pullback':
      filtered = pullbackScreener(stocks);
      break;
    case 'alpha':
      filtered = alphaScreener(stocks);
      break;
    case 'custom':
      if (customCriteria) {
        filtered = filterStocks(stocks, customCriteria);
        filtered.sort((a, b) => b.score.total - a.score.total);
      }
      break;
  }
  
  return {
    engine,
    criteria: customCriteria || {},
    stocks: filtered,
    totalCount: filtered.length,
    executedAt: new Date(),
  };
}
