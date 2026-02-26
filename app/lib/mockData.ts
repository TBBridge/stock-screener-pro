// 生成模拟股票数据
import { StockData, StockScore, Portfolio, StressTestScenario, ScreenerCriteria } from '@/app/types/stock';

// 真实美股公司名称
const usStockNames = [
  // 科技巨头
  { name: 'Apple Inc.', ticker: 'AAPL', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'Microsoft Corporation', ticker: 'MSFT', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'Alphabet Inc.', ticker: 'GOOGL', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'Amazon.com Inc.', ticker: 'AMZN', exchange: 'NASDAQ', sector: 'Consumer' },
  { name: 'NVIDIA Corporation', ticker: 'NVDA', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'Meta Platforms', ticker: 'META', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'Tesla Inc.', ticker: 'TSLA', exchange: 'NASDAQ', sector: 'Consumer' },
  { name: 'Broadcom Inc.', ticker: 'AVGO', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'Adobe Inc.', ticker: 'ADBE', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'Netflix Inc.', ticker: 'NFLX', exchange: 'NASDAQ', sector: 'Communication' },
  { name: 'Intel Corporation', ticker: 'INTC', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'AMD', ticker: 'AMD', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'Qualcomm Inc.', ticker: 'QCOM', exchange: 'NASDAQ', sector: 'Technology' },
  { name: 'Salesforce Inc.', ticker: 'CRM', exchange: 'NYSE', sector: 'Technology' },
  { name: 'Oracle Corporation', ticker: 'ORCL', exchange: 'NYSE', sector: 'Technology' },
  
  // 金融
  { name: 'JPMorgan Chase', ticker: 'JPM', exchange: 'NYSE', sector: 'Finance' },
  { name: 'Bank of America', ticker: 'BAC', exchange: 'NYSE', sector: 'Finance' },
  { name: 'Wells Fargo', ticker: 'WFC', exchange: 'NYSE', sector: 'Finance' },
  { name: 'Goldman Sachs', ticker: 'GS', exchange: 'NYSE', sector: 'Finance' },
  { name: 'Morgan Stanley', ticker: 'MS', exchange: 'NYSE', sector: 'Finance' },
  { name: 'Visa Inc.', ticker: 'V', exchange: 'NYSE', sector: 'Finance' },
  { name: 'Mastercard Inc.', ticker: 'MA', exchange: 'NYSE', sector: 'Finance' },
  { name: 'Berkshire Hathaway', ticker: 'BRK.B', exchange: 'NYSE', sector: 'Finance' },
  
  // 医疗
  { name: 'Johnson & Johnson', ticker: 'JNJ', exchange: 'NYSE', sector: 'Healthcare' },
  { name: 'UnitedHealth Group', ticker: 'UNH', exchange: 'NYSE', sector: 'Healthcare' },
  { name: 'Pfizer Inc.', ticker: 'PFE', exchange: 'NYSE', sector: 'Healthcare' },
  { name: 'Eli Lilly', ticker: 'LLY', exchange: 'NYSE', sector: 'Healthcare' },
  { name: 'Merck & Co.', ticker: 'MRK', exchange: 'NYSE', sector: 'Healthcare' },
  { name: 'Abbott Laboratories', ticker: 'ABT', exchange: 'NYSE', sector: 'Healthcare' },
  { name: 'Thermo Fisher', ticker: 'TMO', exchange: 'NYSE', sector: 'Healthcare' },
  { name: 'AbbVie Inc.', ticker: 'ABBV', exchange: 'NYSE', sector: 'Healthcare' },
  
  // 消费
  { name: 'Walmart Inc.', ticker: 'WMT', exchange: 'NYSE', sector: 'Consumer' },
  { name: 'Procter & Gamble', ticker: 'PG', exchange: 'NYSE', sector: 'Consumer' },
  { name: 'Coca-Cola Company', ticker: 'KO', exchange: 'NYSE', sector: 'Consumer' },
  { name: 'PepsiCo Inc.', ticker: 'PEP', exchange: 'NASDAQ', sector: 'Consumer' },
  { name: 'McDonald\'s Corp', ticker: 'MCD', exchange: 'NYSE', sector: 'Consumer' },
  { name: 'Home Depot', ticker: 'HD', exchange: 'NYSE', sector: 'Consumer' },
  { name: 'Costco Wholesale', ticker: 'COST', exchange: 'NASDAQ', sector: 'Consumer' },
  { name: 'Nike Inc.', ticker: 'NKE', exchange: 'NYSE', sector: 'Consumer' },
  { name: 'Starbucks Corp', ticker: 'SBUX', exchange: 'NASDAQ', sector: 'Consumer' },
  
  // 能源
  { name: 'Exxon Mobil', ticker: 'XOM', exchange: 'NYSE', sector: 'Energy' },
  { name: 'Chevron Corporation', ticker: 'CVX', exchange: 'NYSE', sector: 'Energy' },
  { name: 'ConocoPhillips', ticker: 'COP', exchange: 'NYSE', sector: 'Energy' },
  { name: 'EOG Resources', ticker: 'EOG', exchange: 'NYSE', sector: 'Energy' },
  
  // 工业
  { name: 'Boeing Company', ticker: 'BA', exchange: 'NYSE', sector: 'Industrial' },
  { name: 'Caterpillar Inc.', ticker: 'CAT', exchange: 'NYSE', sector: 'Industrial' },
  { name: 'General Electric', ticker: 'GE', exchange: 'NYSE', sector: 'Industrial' },
  { name: '3M Company', ticker: 'MMM', exchange: 'NYSE', sector: 'Industrial' },
  { name: 'Union Pacific', ticker: 'UNP', exchange: 'NYSE', sector: 'Industrial' },
  { name: 'Honeywell', ticker: 'HON', exchange: 'NASDAQ', sector: 'Industrial' },
  { name: 'Lockheed Martin', ticker: 'LMT', exchange: 'NYSE', sector: 'Industrial' },
  { name: 'RTX Corporation', ticker: 'RTX', exchange: 'NYSE', sector: 'Industrial' },
  
  // 通信
  { name: 'AT&T Inc.', ticker: 'T', exchange: 'NYSE', sector: 'Communication' },
  { name: 'Verizon', ticker: 'VZ', exchange: 'NYSE', sector: 'Communication' },
  { name: 'Comcast Corporation', ticker: 'CMCSA', exchange: 'NASDAQ', sector: 'Communication' },
  { name: 'T-Mobile US', ticker: 'TMUS', exchange: 'NASDAQ', sector: 'Communication' },
  { name: 'Disney', ticker: 'DIS', exchange: 'NYSE', sector: 'Communication' },
];

// 港股公司名称
const hkStockNames = [
  { name: '騰訊控股', ticker: '0700.HK', exchange: 'HKEX', sector: 'Technology' },
  { name: '阿里巴巴-SW', ticker: '9988.HK', exchange: 'HKEX', sector: 'Technology' },
  { name: '美團-W', ticker: '3690.HK', exchange: 'HKEX', sector: 'Technology' },
  { name: '小米集團-W', ticker: '1810.HK', exchange: 'HKEX', sector: 'Technology' },
  { name: '京東集團-SW', ticker: '9618.HK', exchange: 'HKEX', sector: 'Consumer' },
  { name: '網易-S', ticker: '9999.HK', exchange: 'HKEX', sector: 'Technology' },
  { name: '百度集團-SW', ticker: '9888.HK', exchange: 'HKEX', sector: 'Technology' },
  { name: '比亞迪股份', ticker: '1211.HK', exchange: 'HKEX', sector: 'Consumer' },
  { name: '建設銀行', ticker: '0939.HK', exchange: 'HKEX', sector: 'Finance' },
  { name: '工商銀行', ticker: '1398.HK', exchange: 'HKEX', sector: 'Finance' },
  { name: '中國平安', ticker: '2318.HK', exchange: 'HKEX', sector: 'Finance' },
  { name: '友邦保險', ticker: '1299.HK', exchange: 'HKEX', sector: 'Finance' },
  { name: '香港交易所', ticker: '0388.HK', exchange: 'HKEX', sector: 'Finance' },
  { name: '滙豐控股', ticker: '0005.HK', exchange: 'HKEX', sector: 'Finance' },
  { name: '中國海洋石油', ticker: '0883.HK', exchange: 'HKEX', sector: 'Energy' },
  { name: '中國移動', ticker: '0941.HK', exchange: 'HKEX', sector: 'Communication' },
  { name: '藥明生物', ticker: '2269.HK', exchange: 'HKEX', sector: 'Healthcare' },
  { name: '領展房產基金', ticker: '0823.HK', exchange: 'HKEX', sector: 'Real Estate' },
  { name: '銀河娛樂', ticker: '0027.HK', exchange: 'HKEX', sector: 'Consumer' },
  { name: '新基地產', ticker: '0016.HK', exchange: 'HKEX', sector: 'Real Estate' },
];

// 英股公司名称
const ukStockNames = [
  { name: 'Shell plc', ticker: 'SHEL.L', exchange: 'LSE', sector: 'Energy' },
  { name: 'AstraZeneca', ticker: 'AZN.L', exchange: 'LSE', sector: 'Healthcare' },
  { name: 'HSBC Holdings', ticker: 'HSBA.L', exchange: 'LSE', sector: 'Finance' },
  { name: 'Unilever', ticker: 'ULVR.L', exchange: 'LSE', sector: 'Consumer' },
  { name: 'BP plc', ticker: 'BP.L', exchange: 'LSE', sector: 'Energy' },
  { name: 'Diageo', ticker: 'DGE.L', exchange: 'LSE', sector: 'Consumer' },
  { name: 'Rio Tinto', ticker: 'RIO.L', exchange: 'LSE', sector: 'Materials' },
  { name: 'Glencore', ticker: 'GLEN.L', exchange: 'LSE', sector: 'Materials' },
  { name: 'British American Tobacco', ticker: 'BATS.L', exchange: 'LSE', sector: 'Consumer' },
  { name: 'GlaxoSmithKline', ticker: 'GSK.L', exchange: 'LSE', sector: 'Healthcare' },
  { name: 'Relx plc', ticker: 'REL.L', exchange: 'LSE', sector: 'Industrial' },
  { name: 'Vodafone Group', ticker: 'VOD.L', exchange: 'LSE', sector: 'Communication' },
  { name: 'Lloyds Banking', ticker: 'LLOY.L', exchange: 'LSE', sector: 'Finance' },
  { name: 'Barclays', ticker: 'BARC.L', exchange: 'LSE', sector: 'Finance' },
  { name: 'NatWest Group', ticker: 'NWG.L', exchange: 'LSE', sector: 'Finance' },
];

export function generateMockStocks(count: number = 50): StockData[] {
  // 合并所有非A股/日股的股票
  const allRealStocks = [...usStockNames, ...hkStockNames, ...ukStockNames];
  
  const stocks: StockData[] = [];
  
  for (let i = 0; i < count && i < allRealStocks.length; i++) {
    const stockInfo = allRealStocks[i];
    const basePrice = 20 + Math.random() * 480;
    const per = 8 + Math.random() * 32;
    const pbr = 0.8 + Math.random() * 3.5;
    
    const score: StockScore = {
      total: Math.floor(Math.random() * 40) + 60,
      value: Math.floor(Math.random() * 30) + 50,
      growth: Math.floor(Math.random() * 40) + 40,
      quality: Math.floor(Math.random() * 35) + 45,
      technical: Math.floor(Math.random() * 40) + 40,
      alpha: Math.floor(Math.random() * 50) + 30,
    };
    
    stocks.push({
      ticker: stockInfo.ticker,
      name: stockInfo.name,
      exchange: stockInfo.exchange,
      currency: stockInfo.exchange === 'LSE' ? 'GBP' : stockInfo.exchange === 'HKEX' ? 'HKD' : 'USD',
      sector: stockInfo.sector,
      industry: 'Various',
      
      valuation: {
        ticker: stockInfo.ticker,
        per: per,
        pbr: pbr,
        dividendYield: Math.random() * 8,
        marketCap: Math.random() * 1000000000000,
        price: basePrice,
        week52High: basePrice * (1.1 + Math.random() * 0.5),
        week52Low: basePrice * (0.5 + Math.random() * 0.4),
      },
      
      financial: {
        ticker: stockInfo.ticker,
        revenue: Math.random() * 100000000000,
        netIncome: Math.random() * 20000000000,
        totalAssets: Math.random() * 500000000000,
        totalEquity: Math.random() * 200000000000,
        freeCashFlow: Math.random() * 15000000000,
        roe: Math.random() * 30,
        revenueGrowth: (Math.random() - 0.3) * 50,
      },
      
      technical: {
        ticker: stockInfo.ticker,
        rsi14: 20 + Math.random() * 60,
        sma50: basePrice * (0.9 + Math.random() * 0.2),
        sma200: basePrice * (0.85 + Math.random() * 0.3),
        bollingerUpper: basePrice * 1.1,
        bollingerLower: basePrice * 0.9,
      },
      
      analyst: {
        ticker: stockInfo.ticker,
        targetHigh: basePrice * (1.2 + Math.random() * 0.5),
        targetMean: basePrice * (1 + Math.random() * 0.3),
        targetLow: basePrice * (0.8 + Math.random() * 0.2),
        rating: ['Buy', 'Hold', 'Sell'][Math.floor(Math.random() * 3)],
        analystCount: Math.floor(Math.random() * 25) + 1,
      },
      
      score,
      lastUpdated: new Date(),
    });
  }
  
  return stocks;
}

// 模拟投资组合
export function generateMockPortfolio(): Portfolio {
  const holdings = [
    { ticker: 'AAPL', shares: 100, averageCost: 150, purchaseDate: new Date('2024-01-15') },
    { ticker: 'MSFT', shares: 50, averageCost: 380, purchaseDate: new Date('2024-02-01') },
    { ticker: 'GOOGL', shares: 75, averageCost: 140, purchaseDate: new Date('2024-01-20') },
    { ticker: 'NVDA', shares: 40, averageCost: 450, purchaseDate: new Date('2024-03-01') },
    { ticker: 'TSLA', shares: 60, averageCost: 200, purchaseDate: new Date('2024-02-15') },
    { ticker: 'JPM', shares: 80, averageCost: 170, purchaseDate: new Date('2024-01-10') },
    { ticker: 'JNJ', shares: 90, averageCost: 155, purchaseDate: new Date('2024-02-20') },
    { ticker: 'V', shares: 45, averageCost: 280, purchaseDate: new Date('2024-03-10') },
  ];
  
  return {
    id: 'portfolio-1',
    name: 'My Investment Portfolio',
    holdings: holdings.map(h => ({
      ...h,
      purchaseDate: new Date(h.purchaseDate),
    })),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  };
}

// 压力测试场景
export const stressTestScenarios: StressTestScenario[] = [
  {
    id: 'triple-weak',
    name: 'Triple Weakness',
    description: 'Dollar weakness, commodity crash, and tech selloff',
    impactFactors: {
      'Technology': -0.25,
      'Finance': -0.15,
      'Healthcare': -0.10,
      'Consumer': -0.20,
      'Energy': -0.30,
      'Industrial': -0.18,
    },
  },
  {
    id: 'tech-crash',
    name: 'Tech Crash',
    description: 'Technology sector major correction',
    impactFactors: {
      'Technology': -0.40,
      'Finance': -0.10,
      'Healthcare': -0.05,
      'Consumer': -0.15,
      'Energy': 0.05,
      'Industrial': -0.10,
    },
  },
  {
    id: 'rate-hike',
    name: 'Aggressive Rate Hikes',
    description: 'Central bank aggressive tightening',
    impactFactors: {
      'Technology': -0.30,
      'Finance': 0.10,
      'Healthcare': -0.15,
      'Consumer': -0.20,
      'Energy': 0.05,
      'Industrial': -0.15,
    },
  },
  {
    id: 'recession',
    name: 'Economic Recession',
    description: 'Global economic downturn',
    impactFactors: {
      'Technology': -0.35,
      'Finance': -0.25,
      'Healthcare': -0.10,
      'Consumer': -0.30,
      'Energy': -0.35,
      'Industrial': -0.30,
    },
  },
  {
    id: 'inflation',
    name: 'High Inflation',
    description: 'Persistent high inflation environment',
    impactFactors: {
      'Technology': -0.20,
      'Finance': -0.05,
      'Healthcare': 0.05,
      'Consumer': -0.25,
      'Energy': 0.15,
      'Industrial': -0.10,
    },
  },
  {
    id: 'trade-war',
    name: 'Trade War',
    description: 'Global trade tensions escalation',
    impactFactors: {
      'Technology': -0.20,
      'Finance': -0.10,
      'Healthcare': -0.05,
      'Consumer': -0.15,
      'Energy': -0.10,
      'Industrial': -0.25,
    },
  },
  {
    id: 'pandemic',
    name: 'Pandemic',
    description: 'Global health crisis',
    impactFactors: {
      'Technology': 0.05,
      'Finance': -0.20,
      'Healthcare': 0.20,
      'Consumer': -0.30,
      'Energy': -0.25,
      'Industrial': -0.20,
    },
  },
  {
    id: 'cyber-attack',
    name: 'Major Cyber Attack',
    description: 'Critical infrastructure cyber attack',
    impactFactors: {
      'Technology': -0.15,
      'Finance': -0.30,
      'Healthcare': -0.10,
      'Consumer': -0.10,
      'Energy': -0.25,
      'Industrial': -0.20,
    },
  },
];

// 预设筛选条件
export const presetScreeners: Record<string, ScreenerCriteria> = {
  value: {
    perMax: 15,
    pbrMax: 1.5,
    roeMin: 10,
    marketCapMin: 1000000000,
  },
  'high-dividend': {
    dividendYieldMin: 3,
    perMax: 20,
    marketCapMin: 500000000,
  },
  growth: {
    revenueGrowthMin: 20,
    roeMin: 15,
    perMax: 40,
  },
  quality: {
    roeMin: 20,
    perMax: 25,
    marketCapMin: 10000000000,
  },
  'small-cap-value': {
    perMax: 12,
    pbrMax: 1.2,
    marketCapMax: 10000000000,
    marketCapMin: 300000000,
  },
  'technical-pullback': {
    rsiMin: 30,
    rsiMax: 50,
    aboveSMA200: true,
  },
  'analyst-favorite': {
    analystCountMin: 10,
    rating: ['Buy'],
  },
};

// 交易所列表
export const exchanges = [
  { code: 'TSE', name: 'Tokyo Stock Exchange', country: 'Japan' },
  { code: 'NYSE', name: 'New York Stock Exchange', country: 'USA' },
  { code: 'NASDAQ', name: 'NASDAQ', country: 'USA' },
  { code: 'LSE', name: 'London Stock Exchange', country: 'UK' },
  { code: 'HKEX', name: 'Hong Kong Exchange', country: 'Hong Kong' },
  { code: 'SSE', name: 'Shanghai Stock Exchange', country: 'China' },
  { code: 'SZSE', name: 'Shenzhen Stock Exchange', country: 'China' },
];

// A股股票代码前缀
const aSharePrefixes = {
  '600': 'SSE', // 上海主板
  '601': 'SSE', // 上海主板
  '603': 'SSE', // 上海主板
  '605': 'SSE', // 上海主板
  '688': 'SSE', // 科创板
  '000': 'SZSE', // 深圳主板
  '001': 'SZSE', // 深圳主板
  '002': 'SZSE', // 中小板
  '003': 'SZSE', // 深圳主板
  '300': 'SZSE', // 创业板
  '301': 'SZSE', // 创业板
};

// A股行业映射
const aShareSectors = [
  'Technology', 'Finance', 'Healthcare', 'Consumer', 
  'Energy', 'Industrial', 'Materials', 'Real Estate'
];

// A股公司名称（模拟）
const aShareNames = [
  '贵州茅台', '中国平安', '招商银行', '五粮液', '比亚迪', '宁德时代',
  '美的集团', '格力电器', '海康威视', '迈瑞医疗', '恒瑞医药', '药明康德',
  '中信证券', '东方财富', '隆基绿能', '立讯精密', '顺丰控股', '伊利股份',
  '中国中免', '紫金矿业', '万华化学', '长江电力', '爱尔眼科', '京东方A',
  '三一重工', '牧原股份', '东方雨虹', '科大讯飞', '韦尔股份', '中芯国际',
  '工业富联', '顺丰控股', '金龙鱼', '智飞生物', '阳光电源', '汇川技术',
  '恩捷股份', '亿纬锂能', '赣锋锂业', '北方华创', '兆易创新', '三安光电',
  '用友网络', '宝信软件', '恒生电子', '广联达', '金山办公', '深信服',
  '石头科技', '传音控股', '中微公司', '澜起科技', '寒武纪', '华润微',
];

// 生成A股模拟数据
export function generateAShareStocks(count: number = 30): StockData[] {
  const stocks: StockData[] = [];
  
  for (let i = 0; i < count && i < aShareNames.length; i++) {
    const name = aShareNames[i];
    const prefixKeys = Object.keys(aSharePrefixes);
    const prefix = prefixKeys[Math.floor(Math.random() * prefixKeys.length)];
    const code = prefix + String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
    const exchange = aSharePrefixes[prefix as keyof typeof aSharePrefixes];
    const ticker = exchange === 'SSE' ? `${code}.SS` : `${code}.SZ`;
    
    const basePrice = 10 + Math.random() * 190;
    const per = 8 + Math.random() * 40;
    const pbr = 0.8 + Math.random() * 5;
    
    const score: StockScore = {
      total: Math.floor(Math.random() * 40) + 60,
      value: Math.floor(Math.random() * 30) + 50,
      growth: Math.floor(Math.random() * 40) + 40,
      quality: Math.floor(Math.random() * 35) + 45,
      technical: Math.floor(Math.random() * 40) + 40,
      alpha: Math.floor(Math.random() * 50) + 30,
    };
    
    stocks.push({
      ticker,
      name,
      exchange,
      currency: 'CNY',
      sector: aShareSectors[Math.floor(Math.random() * aShareSectors.length)],
      industry: 'Various',
      
      valuation: {
        ticker,
        per: per,
        pbr: pbr,
        dividendYield: Math.random() * 5,
        marketCap: Math.random() * 500000000000 + 10000000000,
        price: basePrice,
        week52High: basePrice * (1.1 + Math.random() * 0.5),
        week52Low: basePrice * (0.5 + Math.random() * 0.4),
      },
      
      financial: {
        ticker,
        revenue: Math.random() * 100000000000 + 1000000000,
        netIncome: Math.random() * 20000000000 + 100000000,
        totalAssets: Math.random() * 500000000000 + 10000000000,
        totalEquity: Math.random() * 200000000000 + 5000000000,
        freeCashFlow: Math.random() * 15000000000 + 100000000,
        roe: Math.random() * 25 + 5,
        revenueGrowth: (Math.random() - 0.3) * 60,
      },
      
      technical: {
        ticker,
        rsi14: 20 + Math.random() * 60,
        sma50: basePrice * (0.9 + Math.random() * 0.2),
        sma200: basePrice * (0.85 + Math.random() * 0.3),
        bollingerUpper: basePrice * 1.1,
        bollingerLower: basePrice * 0.9,
      },
      
      analyst: {
        ticker,
        targetHigh: basePrice * (1.2 + Math.random() * 0.5),
        targetMean: basePrice * (1 + Math.random() * 0.3),
        targetLow: basePrice * (0.8 + Math.random() * 0.2),
        rating: ['Buy', 'Hold', 'Sell'][Math.floor(Math.random() * 3)],
        analystCount: Math.floor(Math.random() * 25) + 1,
      },
      
      score,
      lastUpdated: new Date(),
    });
  }
  
  return stocks;
}

// 行业列表
export const sectors = [
  'Technology',
  'Finance',
  'Healthcare',
  'Consumer',
  'Energy',
  'Industrial',
  'Materials',
  'Utilities',
  'Real Estate',
  'Communication',
];

// 日股行业映射
const japaneseSectors = [
  'Technology', 'Finance', 'Healthcare', 'Consumer', 
  'Energy', 'Industrial', 'Materials', 'Communication'
];

// 日股公司名称（模拟）
const japaneseStockNames = [
  'トヨタ自動車', 'ソフトバンクグループ', 'ソニーグループ', 'キーエンス', '任天堂',
  '東京エレクトロン', '信越化学工業', 'ファストリテイリング', '三菱UFJフィナンシャル', '日本電信電話',
  'KDDI', 'ホンダ', '日産自動車', 'キャノン', 'パナソニックホールディングス',
  'アステラス製薬', '武田薬品工業', '第一三共', '中外製薬', 'エーザイ',
  '三菱商事', '三井物産', '伊藤忠商事', '住友商事', '双日',
  '日本製鉄', 'JFEホールディングス', '新日鐵住金', '神戸製鋼所', '大同特殊鋼',
  'オリンパス', 'テルモ', 'シスメックス', 'ニプロ', 'ファナック',
  'アマダ', 'オークマ', 'マザック', 'DMG森精機', 'オムロン',
  '横河電機', 'キーサイト・テクノロジー', 'アドバンテスト', '愛徳万テスト', 'スクリーン・ホールディングス',
  '村田製作所', 'TDK', 'アルプスアルパイン', '日本電産', 'キヤノン電子',
];

// 生成日股模拟数据
export function generateJapaneseStocks(count: number = 30): StockData[] {
  const stocks: StockData[] = [];
  
  for (let i = 0; i < count && i < japaneseStockNames.length; i++) {
    const name = japaneseStockNames[i];
    // 日股代码格式：4位数字
    const code = String(Math.floor(Math.random() * 9000) + 1000);
    const ticker = `${code}.T`;
    
    const basePrice = 1000 + Math.random() * 9000;
    const per = 8 + Math.random() * 35;
    const pbr = 0.8 + Math.random() * 4;
    
    const score: StockScore = {
      total: Math.floor(Math.random() * 40) + 60,
      value: Math.floor(Math.random() * 30) + 50,
      growth: Math.floor(Math.random() * 40) + 40,
      quality: Math.floor(Math.random() * 35) + 45,
      technical: Math.floor(Math.random() * 40) + 40,
      alpha: Math.floor(Math.random() * 50) + 30,
    };
    
    stocks.push({
      ticker,
      name,
      exchange: 'TSE',
      currency: 'JPY',
      sector: japaneseSectors[Math.floor(Math.random() * japaneseSectors.length)],
      industry: 'Various',
      
      valuation: {
        ticker,
        per: per,
        pbr: pbr,
        dividendYield: Math.random() * 4,
        marketCap: Math.random() * 2000000000000 + 5000000000,
        price: basePrice,
        week52High: basePrice * (1.1 + Math.random() * 0.5),
        week52Low: basePrice * (0.5 + Math.random() * 0.4),
      },
      
      financial: {
        ticker,
        revenue: Math.random() * 500000000000 + 1000000000,
        netIncome: Math.random() * 50000000000 + 100000000,
        totalAssets: Math.random() * 1000000000000 + 10000000000,
        totalEquity: Math.random() * 400000000000 + 5000000000,
        freeCashFlow: Math.random() * 30000000000 + 100000000,
        roe: Math.random() * 20 + 3,
        revenueGrowth: (Math.random() - 0.4) * 40,
      },
      
      technical: {
        ticker,
        rsi14: 20 + Math.random() * 60,
        sma50: basePrice * (0.9 + Math.random() * 0.2),
        sma200: basePrice * (0.85 + Math.random() * 0.3),
        bollingerUpper: basePrice * 1.1,
        bollingerLower: basePrice * 0.9,
      },
      
      analyst: {
        ticker,
        targetHigh: basePrice * (1.2 + Math.random() * 0.5),
        targetMean: basePrice * (1 + Math.random() * 0.3),
        targetLow: basePrice * (0.8 + Math.random() * 0.2),
        rating: ['Buy', 'Hold', 'Sell'][Math.floor(Math.random() * 3)],
        analystCount: Math.floor(Math.random() * 20) + 1,
      },
      
      score,
      lastUpdated: new Date(),
    });
  }
  
  return stocks;
}
