import { Portfolio, PortfolioHolding, HealthCheckResult, HealthCheckAlert, AlertLevel, StressTestResult, StockData } from '@/app/types/stock';
import { stressTestScenarios } from './mockData';

// 计算投资组合当前价值
export function calculatePortfolioValue(portfolio: Portfolio, stockPrices: Record<string, number>): number {
  return portfolio.holdings.reduce((total, holding) => {
    const currentPrice = stockPrices[holding.ticker] || holding.averageCost;
    return total + holding.shares * currentPrice;
  }, 0);
}

// 计算持仓权重
export function calculateWeights(portfolio: Portfolio, stockPrices: Record<string, number>): Record<string, number> {
  const totalValue = calculatePortfolioValue(portfolio, stockPrices);
  const weights: Record<string, number> = {};
  
  portfolio.holdings.forEach(holding => {
    const currentPrice = stockPrices[holding.ticker] || holding.averageCost;
    const value = holding.shares * currentPrice;
    weights[holding.ticker] = totalValue > 0 ? value / totalValue : 0;
  });
  
  return weights;
}

// 计算赫芬达尔指数 (HHI) - 集中度指标
export function calculateHHI(weights: Record<string, number>): number {
  const weightValues = Object.values(weights);
  return weightValues.reduce((sum, weight) => sum + weight * weight, 0);
}

// 健康检查
export function performHealthCheck(
  portfolio: Portfolio,
  stockData: Record<string, StockData>
): HealthCheckResult {
  const alerts: HealthCheckAlert[] = [];
  
  portfolio.holdings.forEach(holding => {
    const stock = stockData[holding.ticker];
    if (!stock) return;
    
    // 技术分析警报
    if (stock.technical.rsi14 !== null) {
      if (stock.technical.rsi14 > 70) {
        alerts.push({
          ticker: holding.ticker,
          level: 'warning',
          category: 'technical',
          message: `RSI overbought (${stock.technical.rsi14.toFixed(1)})`,
          recommendation: 'Consider taking partial profits',
        });
      } else if (stock.technical.rsi14 < 30) {
        alerts.push({
          ticker: holding.ticker,
          level: 'warning',
          category: 'technical',
          message: `RSI oversold (${stock.technical.rsi14.toFixed(1)})`,
          recommendation: 'Potential buying opportunity or trend reversal',
        });
      }
    }
    
    // 移动平均线警报
    if (stock.technical.sma50 !== null && stock.technical.sma200 !== null) {
      const deathCross = stock.technical.sma50 < stock.technical.sma200;
      const approaching = Math.abs(stock.technical.sma50 - stock.technical.sma200) / stock.technical.sma200 < 0.05;
      
      if (deathCross) {
        alerts.push({
          ticker: holding.ticker,
          level: 'danger',
          category: 'technical',
          message: 'Death cross detected (SMA50 < SMA200)',
          recommendation: 'Consider reducing position',
        });
      } else if (approaching) {
        alerts.push({
          ticker: holding.ticker,
          level: 'warning',
          category: 'technical',
          message: 'SMA50 approaching SMA200',
          recommendation: 'Monitor for potential trend change',
        });
      }
    }
    
    // 基本面警报
    if (stock.financial.roe !== null && stock.financial.roe < 5) {
      alerts.push({
        ticker: holding.ticker,
        level: 'warning',
        category: 'fundamental',
        message: `Low ROE (${stock.financial.roe.toFixed(1)}%)`,
        recommendation: 'Review company profitability',
      });
    }
    
    if (stock.financial.revenueGrowth !== null && stock.financial.revenueGrowth < -10) {
      alerts.push({
        ticker: holding.ticker,
        level: 'danger',
        category: 'fundamental',
        message: `Significant revenue decline (${stock.financial.revenueGrowth.toFixed(1)}%)`,
        recommendation: 'Investigate business challenges',
      });
    }
    
    // 估值警报
    if (stock.valuation.per !== null && stock.valuation.per > 50) {
      alerts.push({
        ticker: holding.ticker,
        level: 'warning',
        category: 'fundamental',
        message: `High valuation (PER ${stock.valuation.per.toFixed(1)})`,
        recommendation: 'Assess if growth justifies valuation',
      });
    }
  });
  
  // 集中度检查
  const weights = calculateWeights(portfolio, 
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.valuation.price]))
  );
  const hhi = calculateHHI(weights);
  const sortedWeights = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  const top5Weight = sortedWeights.slice(0, 5).reduce((sum, [, w]) => sum + w, 0);
  
  if (hhi > 0.25) {
    alerts.push({
      ticker: 'PORTFOLIO',
      level: 'warning',
      category: 'concentration',
      message: `High concentration risk (HHI: ${(hhi * 10000).toFixed(0)})`,
      recommendation: 'Consider diversifying holdings',
    });
  }
  
  if (top5Weight > 0.7) {
    alerts.push({
      ticker: 'PORTFOLIO',
      level: hhi > 0.3 ? 'danger' : 'warning',
      category: 'concentration',
      message: `Top 5 holdings represent ${(top5Weight * 100).toFixed(1)}% of portfolio`,
      recommendation: 'Reduce concentration in top holdings',
    });
  }
  
  // 确定整体健康状态
  const dangerCount = alerts.filter(a => a.level === 'danger').length;
  const warningCount = alerts.filter(a => a.level === 'warning').length;
  
  let overallHealth: AlertLevel = 'normal';
  if (dangerCount > 0) overallHealth = 'danger';
  else if (warningCount > 2) overallHealth = 'warning';
  
  return {
    portfolioId: portfolio.id,
    alerts,
    overallHealth,
    concentration: {
      hhi,
      top5Weight,
    },
    checkedAt: new Date(),
  };
}

// 压力测试
export function runStressTest(
  portfolio: Portfolio,
  stockData: Record<string, StockData>,
  scenarioId: string
): StressTestResult {
  const scenario = stressTestScenarios.find(s => s.id === scenarioId);
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} not found`);
  }
  
  const currentValue = calculatePortfolioValue(portfolio, 
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.valuation.price]))
  );
  
  let stressedValue = 0;
  
  portfolio.holdings.forEach(holding => {
    const stock = stockData[holding.ticker];
    if (!stock) return;
    
    const currentPrice = stock.valuation.price;
    const sector = stock.sector || 'Industrial';
    const impact = scenario.impactFactors[sector] || -0.15;
    
    const stressedPrice = currentPrice * (1 + impact);
    stressedValue += holding.shares * stressedPrice;
  });
  
  const lossAmount = currentValue - stressedValue;
  const lossPercent = currentValue > 0 ? (lossAmount / currentValue) * 100 : 0;
  
  // 计算 VaR (简化版)
  const returns = portfolio.holdings.map(holding => {
    const stock = stockData[holding.ticker];
    if (!stock) return 0;
    const weight = (holding.shares * stock.valuation.price) / currentValue;
    const volatility = 0.2; // 假设20%年化波动率
    return weight * volatility;
  });
  
  const portfolioVolatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0));
  const var95 = 1.645 * portfolioVolatility * currentValue;
  const var99 = 2.326 * portfolioVolatility * currentValue;
  
  // 相关性风险评估
  const sectors = new Set(portfolio.holdings.map(h => stockData[h.ticker]?.sector).filter(Boolean));
  const correlationRisk = sectors.size <= 2 ? 'High' : sectors.size <= 4 ? 'Medium' : 'Low';
  
  return {
    scenario,
    portfolioValue: currentValue,
    stressedValue,
    lossAmount,
    lossPercent,
    var95,
    var99,
    correlationRisk,
  };
}

// 生成再平衡建议
export function generateRebalanceSuggestions(
  portfolio: Portfolio,
  stockData: Record<string, StockData>,
  targetWeights?: Record<string, number>
): { ticker: string; action: 'buy' | 'sell' | 'hold'; shares: number; reason: string }[] {
  const suggestions: { ticker: string; action: 'buy' | 'sell' | 'hold'; shares: number; reason: string }[] = [];
  
  const currentValue = calculatePortfolioValue(portfolio, 
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.valuation.price]))
  );
  const currentWeights = calculateWeights(portfolio, 
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.valuation.price]))
  );
  
  // 默认等权重
  const defaultTarget = 1 / portfolio.holdings.length;
  
  portfolio.holdings.forEach(holding => {
    const stock = stockData[holding.ticker];
    if (!stock) return;
    
    const currentWeight = currentWeights[holding.ticker] || 0;
    const targetWeight = targetWeights?.[holding.ticker] || defaultTarget;
    const currentPrice = stock.valuation.price;
    
    const weightDiff = currentWeight - targetWeight;
    const targetValue = currentValue * targetWeight;
    const currentHoldingValue = holding.shares * currentPrice;
    const valueDiff = targetValue - currentHoldingValue;
    const sharesDiff = Math.round(valueDiff / currentPrice);
    
    if (Math.abs(weightDiff) > 0.05) {
      if (weightDiff > 0.05) {
        suggestions.push({
          ticker: holding.ticker,
          action: 'sell',
          shares: Math.abs(sharesDiff),
          reason: `Overweight (${(currentWeight * 100).toFixed(1)}% vs target ${(targetWeight * 100).toFixed(1)}%)`,
        });
      } else if (weightDiff < -0.05) {
        suggestions.push({
          ticker: holding.ticker,
          action: 'buy',
          shares: Math.abs(sharesDiff),
          reason: `Underweight (${(currentWeight * 100).toFixed(1)}% vs target ${(targetWeight * 100).toFixed(1)}%)`,
        });
      }
    } else {
      suggestions.push({
        ticker: holding.ticker,
        action: 'hold',
        shares: 0,
        reason: 'Weight within target range',
      });
    }
  });
  
  return suggestions.sort((a, b) => {
    if (a.action === 'sell' && b.action !== 'sell') return -1;
    if (a.action !== 'sell' && b.action === 'sell') return 1;
    return b.shares - a.shares;
  });
}

// 计算预期收益 (3种情景)
export function calculateExpectedReturns(
  portfolio: Portfolio,
  stockData: Record<string, StockData>
): { optimistic: number; base: number; pessimistic: number } {
  let optimisticReturn = 0;
  let baseReturn = 0;
  let pessimisticReturn = 0;
  
  const totalValue = calculatePortfolioValue(portfolio, 
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.valuation.price]))
  );
  
  portfolio.holdings.forEach(holding => {
    const stock = stockData[holding.ticker];
    if (!stock) return;
    
    const weight = (holding.shares * stock.valuation.price) / totalValue;
    
    if (stock.analyst.targetHigh && stock.analyst.targetMean && stock.analyst.targetLow) {
      const currentPrice = stock.valuation.price;
      const optimistic = (stock.analyst.targetHigh - currentPrice) / currentPrice;
      const base = (stock.analyst.targetMean - currentPrice) / currentPrice;
      const pessimistic = (stock.analyst.targetLow - currentPrice) / currentPrice;
      
      optimisticReturn += weight * optimistic * 100;
      baseReturn += weight * base * 100;
      pessimisticReturn += weight * pessimistic * 100;
    }
  });
  
  return {
    optimistic: optimisticReturn,
    base: baseReturn,
    pessimistic: pessimisticReturn,
  };
}
