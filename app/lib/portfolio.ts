// 投资组合分析引擎 —— 基于真实行情数据（QuoteSummary）
import { Portfolio, HealthCheckResult, HealthCheckAlert, AlertLevel, StressTestResult } from '@/app/types/stock';
import { QuoteSummary } from '@/app/types/market';
import { stressTestScenarios } from './mockData';

export type StockDataMap = Record<string, QuoteSummary>;

function priceOf(stockData: StockDataMap, ticker: string, fallback: number): number {
  return stockData[ticker]?.price || fallback;
}

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
  return Object.values(weights).reduce((sum, weight) => sum + weight * weight, 0);
}

// 健康检查
export function performHealthCheck(portfolio: Portfolio, stockData: StockDataMap): HealthCheckResult {
  const alerts: HealthCheckAlert[] = [];

  portfolio.holdings.forEach(holding => {
    const stock = stockData[holding.ticker];
    if (!stock) return;

    // 技术分析警报
    if (stock.technical.rsi14 != null) {
      if (stock.technical.rsi14 > 70) {
        alerts.push({
          ticker: holding.ticker,
          level: 'warning',
          category: 'technical',
          message: `RSI 超买 (${stock.technical.rsi14.toFixed(1)})`,
          recommendation: '可考虑部分止盈',
        });
      } else if (stock.technical.rsi14 < 30) {
        alerts.push({
          ticker: holding.ticker,
          level: 'warning',
          category: 'technical',
          message: `RSI 超卖 (${stock.technical.rsi14.toFixed(1)})`,
          recommendation: '可能出现买入机会或趋势反转，关注企稳信号',
        });
      }
    }

    // 移动平均线警报
    if (stock.technical.sma50 != null && stock.technical.sma200 != null) {
      const deathCross = stock.technical.sma50 < stock.technical.sma200;
      const approaching = Math.abs(stock.technical.sma50 - stock.technical.sma200) / stock.technical.sma200 < 0.05;
      if (deathCross) {
        alerts.push({
          ticker: holding.ticker,
          level: 'danger',
          category: 'technical',
          message: '出现死亡交叉 (SMA50 < SMA200)',
          recommendation: '考虑降低仓位',
        });
      } else if (approaching) {
        alerts.push({
          ticker: holding.ticker,
          level: 'warning',
          category: 'technical',
          message: 'SMA50 接近 SMA200，注意趋势变化',
          recommendation: '密切观察后续走势',
        });
      }
    }

    // 基本面警报
    if (stock.financial.roe != null && stock.financial.roe < 5) {
      alerts.push({
        ticker: holding.ticker,
        level: 'warning',
        category: 'fundamental',
        message: `ROE 偏低 (${stock.financial.roe.toFixed(1)}%)`,
        recommendation: '审视公司盈利能力',
      });
    }

    if (stock.financial.revenueGrowth != null && stock.financial.revenueGrowth < -10) {
      alerts.push({
        ticker: holding.ticker,
        level: 'danger',
        category: 'fundamental',
        message: `营收大幅下滑 (${stock.financial.revenueGrowth.toFixed(1)}%)`,
        recommendation: '调查业务是否存在结构性问题',
      });
    }

    // 估值警报
    if (stock.valuation.per != null && stock.valuation.per > 50) {
      alerts.push({
        ticker: holding.ticker,
        level: 'warning',
        category: 'fundamental',
        message: `估值偏高 (PER ${stock.valuation.per.toFixed(1)})`,
        recommendation: '评估高增长能否支撑估值',
      });
    }
  });

  // 集中度检查
  const weights = calculateWeights(portfolio,
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.price]))
  );
  const hhi = calculateHHI(weights);
  const sortedWeights = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  const top5Weight = sortedWeights.slice(0, 5).reduce((sum, [, w]) => sum + w, 0);

  if (hhi > 0.25) {
    alerts.push({
      ticker: 'PORTFOLIO',
      level: 'warning',
      category: 'concentration',
      message: `集中度风险偏高 (HHI: ${(hhi * 10000).toFixed(0)})`,
      recommendation: '考虑分散持仓',
    });
  }

  if (top5Weight > 0.7) {
    alerts.push({
      ticker: 'PORTFOLIO',
      level: hhi > 0.3 ? 'danger' : 'warning',
      category: 'concentration',
      message: `前5大持仓占比 ${(top5Weight * 100).toFixed(1)}%`,
      recommendation: '降低头部持仓集中度',
    });
  }

  const dangerCount = alerts.filter(a => a.level === 'danger').length;
  const warningCount = alerts.filter(a => a.level === 'warning').length;

  let overallHealth: AlertLevel = 'normal';
  if (dangerCount > 0) overallHealth = 'danger';
  else if (warningCount > 2) overallHealth = 'warning';

  return {
    portfolioId: portfolio.id,
    alerts,
    overallHealth,
    concentration: { hhi, top5Weight },
    checkedAt: new Date(),
  };
}

// 压力测试
export function runStressTest(
  portfolio: Portfolio,
  stockData: StockDataMap,
  scenarioId: string
): StressTestResult {
  const scenario = stressTestScenarios.find(s => s.id === scenarioId);
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} not found`);
  }

  const currentValue = calculatePortfolioValue(portfolio,
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.price]))
  );

  let stressedValue = 0;

  portfolio.holdings.forEach(holding => {
    const stock = stockData[holding.ticker];
    if (!stock) return;

    const currentPrice = stock.price;
    const sector = stock.sector || 'Industrial';
    const impact = scenario.impactFactors[sector] ?? -0.15;

    const stressedPrice = currentPrice * (1 + impact);
    stressedValue += holding.shares * stressedPrice;
  });

  const lossAmount = currentValue - stressedValue;
  const lossPercent = currentValue > 0 ? (lossAmount / currentValue) * 100 : 0;

  // 简化 VaR
  const returns = portfolio.holdings.map(holding => {
    const stock = stockData[holding.ticker];
    if (!stock || currentValue <= 0) return 0;
    const weight = (holding.shares * stock.price) / currentValue;
    const volatility = 0.2;
    return weight * volatility;
  });

  const portfolioVolatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0));
  const var95 = 1.645 * portfolioVolatility * currentValue;
  const var99 = 2.326 * portfolioVolatility * currentValue;

  const sectors = new Set(portfolio.holdings.map(h => stockData[h.ticker]?.sector).filter(Boolean));
  const correlationRisk = sectors.size <= 2 ? '高' : sectors.size <= 4 ? '中' : '低';

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
  stockData: StockDataMap,
  targetWeights?: Record<string, number>
): { ticker: string; action: 'buy' | 'sell' | 'hold'; shares: number; reason: string }[] {
  const suggestions: { ticker: string; action: 'buy' | 'sell' | 'hold'; shares: number; reason: string }[] = [];

  const currentValue = calculatePortfolioValue(portfolio,
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.price]))
  );
  const currentWeights = calculateWeights(portfolio,
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.price]))
  );

  const defaultTarget = 1 / portfolio.holdings.length;

  portfolio.holdings.forEach(holding => {
    const currentPrice = priceOf(stockData, holding.ticker, holding.averageCost);
    if (currentPrice <= 0) return;

    const currentWeight = currentWeights[holding.ticker] || 0;
    const targetWeight = targetWeights?.[holding.ticker] || defaultTarget;

    const weightDiff = currentWeight - targetWeight;
    const targetValue = currentValue * targetWeight;
    const currentHoldingValue = holding.shares * currentPrice;
    const valueDiff = targetValue - currentHoldingValue;
    const sharesDiff = Math.round(Math.abs(valueDiff) / currentPrice) * (valueDiff >= 0 ? 1 : -1);

    if (weightDiff > 0.05) {
      suggestions.push({
        ticker: holding.ticker,
        action: 'sell',
        shares: Math.abs(sharesDiff),
        reason: `超配 (${(currentWeight * 100).toFixed(1)}%，目标 ${(targetWeight * 100).toFixed(1)}%)`,
      });
    } else if (weightDiff < -0.05) {
      suggestions.push({
        ticker: holding.ticker,
        action: 'buy',
        shares: Math.abs(sharesDiff),
        reason: `低配 (${(currentWeight * 100).toFixed(1)}%，目标 ${(targetWeight * 100).toFixed(1)}%)`,
      });
    } else {
      suggestions.push({
        ticker: holding.ticker,
        action: 'hold',
        shares: 0,
        reason: '权重在目标范围内',
      });
    }
  });

  return suggestions.sort((a, b) => {
    if (a.action === 'sell' && b.action !== 'sell') return -1;
    if (a.action !== 'sell' && b.action === 'sell') return 1;
    return b.shares - a.shares;
  });
}

// 计算预期收益 (3种情景，基于分析师目标价)
export function calculateExpectedReturns(
  portfolio: Portfolio,
  stockData: StockDataMap
): { optimistic: number; base: number; pessimistic: number } {
  let optimisticReturn = 0;
  let baseReturn = 0;
  let pessimisticReturn = 0;

  const totalValue = calculatePortfolioValue(portfolio,
    Object.fromEntries(Object.entries(stockData).map(([k, v]) => [k, v.price]))
  );

  portfolio.holdings.forEach(holding => {
    const stock = stockData[holding.ticker];
    if (!stock || totalValue <= 0) return;

    const weight = (holding.shares * stock.price) / totalValue;
    const { targetHigh, targetMean, targetLow } = stock.analyst;
    if (targetHigh && targetMean && targetLow && stock.price > 0) {
      optimisticReturn += weight * ((targetHigh - stock.price) / stock.price) * 100;
      baseReturn += weight * ((targetMean - stock.price) / stock.price) * 100;
      pessimisticReturn += weight * ((targetLow - stock.price) / stock.price) * 100;
    }
  });

  return { optimistic: optimisticReturn, base: baseReturn, pessimistic: pessimisticReturn };
}
