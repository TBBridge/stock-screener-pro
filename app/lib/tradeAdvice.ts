// 个股买入/卖出分析判断引擎
// 综合技术面（RSI/均线）、估值面（目标价空间）、质量面（ROE/成长）给出操作信号

import { QuoteSummary, TradeAdvice, TradeSignalLevel } from '@/app/types/market';

export function generateTradeAdvice(detail: QuoteSummary, holdingCost?: number): TradeAdvice {
  let score = 0;
  const reasons: string[] = [];
  const risks: string[] = [];

  const price = detail.price;
  const tech = detail.technical;

  // 1. 均线趋势 (±30)
  if (tech.sma50 != null && tech.sma200 != null) {
    if (price > tech.sma50 && tech.sma50 > tech.sma200) {
      score += 30;
      reasons.push('价格站上50日与200日均线，多头排列，趋势向上');
    } else if (price > tech.sma50) {
      score += 15;
      reasons.push('价格高于50日均线，短期趋势偏强');
    } else if (price < tech.sma50 && tech.sma50 < tech.sma200) {
      score -= 30;
      risks.push('价格跌破50日与200日均线，空头排列，趋势向下');
    } else if (price < tech.sma50) {
      score -= 15;
      risks.push('价格跌破50日均线，短期转弱');
    }
  }

  // 2. RSI 超买超卖 (±25)
  if (tech.rsi14 != null) {
    if (tech.rsi14 > 75) {
      score -= 25;
      risks.push(`RSI ${tech.rsi14.toFixed(0)} 严重超买，短期回调风险高`);
    } else if (tech.rsi14 > 65) {
      score -= 10;
      risks.push(`RSI ${tech.rsi14.toFixed(0)} 偏高，追高风险加大`);
    } else if (tech.rsi14 < 25) {
      score += 25;
      reasons.push(`RSI ${tech.rsi14.toFixed(0)} 严重超卖，存在反弹机会`);
    } else if (tech.rsi14 < 35) {
      score += 10;
      reasons.push(`RSI ${tech.rsi14.toFixed(0)} 偏低，抛压减弱`);
    }
  }

  // 3. 分析师目标价空间 (±25)
  if (detail.analyst.targetMean && detail.analyst.targetMean > 0) {
    const upside = (detail.analyst.targetMean - price) / price;
    if (upside > 0.25) {
      score += 25;
      reasons.push(`分析师平均目标价隐含上涨空间 ${formatPct(upside)}`);
    } else if (upside > 0.1) {
      score += 12;
      reasons.push(`分析师平均目标价隐含上涨空间 ${formatPct(upside)}`);
    } else if (upside < -0.15) {
      score -= 25;
      risks.push(`当前价已高于分析师平均目标价 ${formatPct(-upside)}，估值透支`);
    } else if (upside < -0.02) {
      score -= 10;
      risks.push(`价格略高于分析师平均目标价 ${formatPct(-upside)}`);
    }
  }

  // 4. 基本面 (±20)
  if (detail.financial.roe != null) {
    if (detail.financial.roe > 15) {
      score += 10;
      reasons.push(`ROE ${detail.financial.roe.toFixed(1)}%，盈利能力强`);
    } else if (detail.financial.roe < 5) {
      score -= 10;
      risks.push(`ROE 仅 ${detail.financial.roe.toFixed(1)}%，盈利能力偏弱`);
    }
  }
  if (detail.financial.revenueGrowth != null) {
    if (detail.financial.revenueGrowth > 15) {
      score += 10;
      reasons.push(`营收同比增长 ${detail.financial.revenueGrowth.toFixed(1)}%，成长性好`);
    } else if (detail.financial.revenueGrowth < -5) {
      score -= 10;
      risks.push(`营收同比下滑 ${detail.financial.revenueGrowth.toFixed(1)}%，基本面承压`);
    }
  }

  // 5. 持仓盈亏状态（若提供成本）
  if (holdingCost != null && holdingCost > 0) {
    const gain = (price - holdingCost) / holdingCost;
    if (gain > 0.5) {
      score -= 5;
      risks.push(`已盈利 ${formatPct(gain)}，可考虑分批止盈锁定收益`);
    } else if (gain < -0.2) {
      score -= 5;
      risks.push(`已亏损 ${formatPct(gain)}，注意止损纪律`);
    }
  }

  // 52周位置
  if (detail.valuation.week52High != null && detail.valuation.week52Low != null && detail.valuation.week52High > detail.valuation.week52Low) {
    const pos = (price - detail.valuation.week52Low) / (detail.valuation.week52High - detail.valuation.week52Low);
    if (pos > 0.95) {
      score -= 5;
      risks.push('价格处于52周高位附近，注意突破失败风险');
    } else if (pos < 0.1) {
      score += 5;
      reasons.push('价格处于52周低位附近，安全边际相对较高');
    }
  }

  score = Math.max(-100, Math.min(100, score));

  let signal: TradeSignalLevel;
  if (score >= 50) signal = 'strong_buy';
  else if (score >= 20) signal = 'buy';
  else if (score > -20) signal = 'hold';
  else if (score > -50) signal = 'reduce';
  else signal = 'sell';

  if (reasons.length === 0) reasons.push('暂无明显趋势信号');
  if (risks.length === 0) risks.push('暂未发现显著风险信号');

  return { signal, score, reasons, risks };
}

function formatPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
}

export const SIGNAL_META: Record<TradeSignalLevel, { label: string; className: string; badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  strong_buy: { label: '强烈建议买入', className: 'text-red-600', badgeVariant: 'default' },
  buy: { label: '建议买入', className: 'text-red-600', badgeVariant: 'default' },
  hold: { label: '建议持有观望', className: 'text-yellow-600', badgeVariant: 'secondary' },
  reduce: { label: '建议减持', className: 'text-green-600', badgeVariant: 'outline' },
  sell: { label: '建议卖出', className: 'text-green-600', badgeVariant: 'destructive' },
};
