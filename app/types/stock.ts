// 股票基础数据类型
export interface Stock {
  ticker: string;
  name: string;
  exchange: string;
  currency: string;
  sector?: string;
  industry?: string;
}

// 股票估值数据
export interface StockValuation {
  ticker: string;
  per: number | null;           // 市盈率
  pbr: number | null;           // 市净率
  dividendYield: number | null; // 股息率 (%)
  marketCap: number | null;     // 市值
  price: number;                // 当前价格
  week52High: number | null;    // 52周最高价
  week52Low: number | null;     // 52周最低价
}

// 财务数据
export interface FinancialData {
  ticker: string;
  revenue: number | null;           // 营收
  netIncome: number | null;         // 净利润
  totalAssets: number | null;       // 总资产
  totalEquity: number | null;       // 股东权益
  freeCashFlow: number | null;      // 自由现金流
  roe: number | null;               // 净资产收益率 (%)
  revenueGrowth: number | null;     // 营收增长率 (%)
}

// 技术指标
export interface TechnicalIndicators {
  ticker: string;
  rsi14: number | null;             // RSI(14)
  sma50: number | null;             // 50日移动平均线
  sma200: number | null;            // 200日移动平均线
  bollingerUpper: number | null;    // 布林带上轨
  bollingerLower: number | null;    // 布林带下轨
}

// 分析师预测
export interface AnalystForecast {
  ticker: string;
  targetHigh: number | null;        // 最高目标价
  targetMean: number | null;        // 平均目标价
  targetLow: number | null;         // 最低目标价
  rating: string | null;            // 评级
  analystCount: number;             // 分析师数量
}

// 综合股票数据
export interface StockData extends Stock {
  valuation: StockValuation;
  financial: FinancialData;
  technical: TechnicalIndicators;
  analyst: AnalystForecast;
  score: StockScore;
  lastUpdated: Date;
}

// 评分系统
export interface StockScore {
  total: number;                    // 总分 (0-100)
  value: number;                    // 价值评分 (PER/PBR/股息)
  growth: number;                   // 成长评分
  quality: number;                  // 质量评分 (ROE/FCF)
  technical: number;                // 技术评分
  alpha: number;                    // 阿尔法评分 (变化趋势)
}

// 筛选条件
export interface ScreenerCriteria {
  // 市场
  exchange?: string[];              // 交易所 (TSE, NYSE, NASDAQ等)
  sector?: string[];                // 行业
  
  // 估值
  perMin?: number;
  perMax?: number;
  pbrMin?: number;
  pbrMax?: number;
  dividendYieldMin?: number;
  marketCapMin?: number;
  marketCapMax?: number;
  
  // 财务
  roeMin?: number;
  revenueGrowthMin?: number;
  
  // 技术
  rsiMin?: number;
  rsiMax?: number;
  aboveSMA50?: boolean;
  aboveSMA200?: boolean;
  
  // 分析师
  analystCountMin?: number;
  rating?: string[];
}

// 筛选引擎类型
export type ScreenerEngine = 'value' | 'pullback' | 'alpha' | 'custom';

// 筛选结果
export interface ScreenerResult {
  engine: ScreenerEngine;
  criteria: ScreenerCriteria;
  stocks: StockData[];
  totalCount: number;
  executedAt: Date;
}

// 投资组合持仓
export interface PortfolioHolding {
  ticker: string;
  shares: number;
  averageCost: number;
  purchaseDate: Date;
}

// 投资组合
export interface Portfolio {
  id: string;
  name: string;
  holdings: PortfolioHolding[];
  createdAt: Date;
  updatedAt: Date;
}

// 健康检查警报
export type AlertLevel = 'normal' | 'warning' | 'danger';

export interface HealthCheckAlert {
  ticker: string;
  level: AlertLevel;
  category: 'technical' | 'fundamental' | 'concentration';
  message: string;
  recommendation: string;
}

// 健康检查结果
export interface HealthCheckResult {
  portfolioId: string;
  alerts: HealthCheckAlert[];
  overallHealth: AlertLevel;
  concentration: {
    hhi: number;                    // 赫芬达尔指数
    top5Weight: number;             // 前5大持仓占比
  };
  checkedAt: Date;
}

// 压力测试场景
export interface StressTestScenario {
  id: string;
  name: string;
  description: string;
  impactFactors: Record<string, number>; // 各资产类别的冲击系数
}

// 压力测试结果
export interface StressTestResult {
  scenario: StressTestScenario;
  portfolioValue: number;
  stressedValue: number;
  lossAmount: number;
  lossPercent: number;
  var95: number;
  var99: number;
  correlationRisk: string;
}

// 价格历史
export interface PriceHistory {
  ticker: string;
  dates: Date[];
  prices: number[];
  volumes: number[];
}
