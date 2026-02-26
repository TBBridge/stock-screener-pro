// 多语言支持
export type Language = 'zh' | 'en' | 'ja';

export const translations = {
  zh: {
    // 通用
    appName: '股票筛选器专业版',
    appSubtitle: 'AI驱动的投资分析工具',
    loading: '加载中...',
    search: '搜索',
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    close: '关闭',
    refresh: '刷新',
    
    // 导航
    stockScreener: '股票筛选',
    portfolio: '投资组合',
    
    // 筛选器
    screeningEngine: '筛选引擎',
    value: '价值投资',
    pullback: '回调买入',
    alpha: '阿尔法策略',
    custom: '自定义',
    presets: '预设方案',
    customCriteria: '自定义条件',
    runScreener: '运行筛选',
    results: '结果',
    
    // 筛选条件
    exchanges: '交易所',
    sectors: '行业',
    valuation: '估值指标',
    financialMetrics: '财务指标',
    technicalIndicators: '技术指标',
    perMax: '市盈率上限',
    pbrMax: '市净率上限',
    dividendYieldMin: '最低股息率',
    roeMin: '最低ROE',
    revenueGrowthMin: '最低营收增长',
    rsiRange: 'RSI范围',
    aboveSMA50: '高于50日均线',
    aboveSMA200: '高于200日均线',
    
    // 股票表格
    ticker: '代码',
    name: '名称',
    sector: '行业',
    price: '价格',
    per: '市盈率',
    pbr: '市净率',
    roe: '净资产收益率',
    dividendYield: '股息率',
    marketCap: '市值',
    score: '评分',
    noResults: '没有找到符合条件的股票',
    
    // 投资组合
    totalValue: '总市值',
    totalReturn: '总收益',
    holdings: '持仓数量',
    healthScore: '健康评分',
    sectorAllocation: '行业配置',
    expectedReturns: '预期收益 (12个月)',
    optimistic: '乐观',
    baseCase: '基准',
    pessimistic: '悲观',
    
    // 健康检查
    healthCheck: '健康检查',
    alerts: '警报',
    normal: '正常',
    warning: '警告',
    danger: '危险',
    concentration: '集中度',
    concentrationRisk: '集中度风险',
    diversified: '分散良好',
    
    // 压力测试
    stressTest: '压力测试',
    potentialLoss: '潜在损失',
    correlationRisk: '相关性风险',
    
    // 再平衡
    rebalance: '再平衡',
    rebalanceSuggestions: '再平衡建议',
    action: '操作',
    buy: '买入',
    sell: '卖出',
    hold: '持有',
    shares: '股数',
    reason: '原因',
    recommendation: '建议',
    
    // 股票详情
    overview: '概览',
    financial: '财务',
    technical: '技术',
    valuationMetrics: '估值指标',
    financialStatements: '财务报表',
    analystForecast: '分析师预测',
    targetHigh: '最高目标价',
    targetMean: '平均目标价',
    targetLow: '最低目标价',
    analystCount: '分析师数量',
    rating: '评级',
    revenue: '营收',
    netIncome: '净利润',
    totalAssets: '总资产',
    totalEquity: '股东权益',
    week52Range: '52周区间',
    week52High: '52周最高',
    week52Low: '52周最低',
    trend: '趋势',
    bollingerBands: '布林带',
    
    // 引擎描述
    valueDesc: '低市盈率/市净率，高ROE的价值股',
    pullbackDesc: '上升趋势中的回调买入机会',
    alphaDesc: '成长性与基本面改善的股票',
    customDesc: '定义您自己的筛选条件',
  },
  
  en: {
    // General
    appName: 'Stock Screener Pro',
    appSubtitle: 'AI-Powered Investment Analysis',
    loading: 'Loading...',
    search: 'Search',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    refresh: 'Refresh',
    
    // Navigation
    stockScreener: 'Stock Screener',
    portfolio: 'Portfolio',
    
    // Screener
    screeningEngine: 'Screening Engine',
    value: 'Value',
    pullback: 'Pullback',
    alpha: 'Alpha',
    custom: 'Custom',
    presets: 'Presets',
    customCriteria: 'Custom Criteria',
    runScreener: 'Run Screener',
    results: 'Results',
    
    // Criteria
    exchanges: 'Exchanges',
    sectors: 'Sectors',
    valuation: 'Valuation',
    financialMetrics: 'Financial Metrics',
    technicalIndicators: 'Technical Indicators',
    perMax: 'PER Max',
    pbrMax: 'PBR Max',
    dividendYieldMin: 'Min Dividend Yield',
    roeMin: 'Min ROE',
    revenueGrowthMin: 'Min Revenue Growth',
    rsiRange: 'RSI Range',
    aboveSMA50: 'Above SMA50',
    aboveSMA200: 'Above SMA200',
    
    // Stock Table
    ticker: 'Ticker',
    name: 'Name',
    sector: 'Sector',
    price: 'Price',
    per: 'PER',
    pbr: 'PBR',
    roe: 'ROE',
    dividendYield: 'Div Yield',
    marketCap: 'Market Cap',
    score: 'Score',
    noResults: 'No stocks found matching your criteria',
    
    // Portfolio
    totalValue: 'Total Value',
    totalReturn: 'Total Return',
    holdings: 'Holdings',
    healthScore: 'Health Score',
    sectorAllocation: 'Sector Allocation',
    expectedReturns: 'Expected Returns (12M)',
    optimistic: 'Optimistic',
    baseCase: 'Base Case',
    pessimistic: 'Pessimistic',
    
    // Health Check
    healthCheck: 'Health Check',
    alerts: 'Alerts',
    normal: 'Normal',
    warning: 'Warning',
    danger: 'Danger',
    concentration: 'Concentration',
    concentrationRisk: 'Concentration Risk',
    diversified: 'Diversified',
    
    // Stress Test
    stressTest: 'Stress Test',
    potentialLoss: 'Potential Loss',
    correlationRisk: 'Correlation Risk',
    
    // Rebalance
    rebalance: 'Rebalance',
    rebalanceSuggestions: 'Rebalance Suggestions',
    action: 'Action',
    buy: 'Buy',
    sell: 'Sell',
    hold: 'Hold',
    shares: 'Shares',
    reason: 'Reason',
    recommendation: 'Recommendation',
    
    // Stock Details
    overview: 'Overview',
    financial: 'Financial',
    technical: 'Technical',
    valuationMetrics: 'Valuation Metrics',
    financialStatements: 'Financial Statements',
    analystForecast: 'Analyst Forecast',
    targetHigh: 'High Target',
    targetMean: 'Mean Target',
    targetLow: 'Low Target',
    analystCount: 'Analysts',
    rating: 'Rating',
    revenue: 'Revenue',
    netIncome: 'Net Income',
    totalAssets: 'Total Assets',
    totalEquity: 'Total Equity',
    week52Range: '52W Range',
    week52High: '52W High',
    week52Low: '52W Low',
    trend: 'Trend',
    bollingerBands: 'Bollinger Bands',
    
    // Engine descriptions
    valueDesc: 'Low PER/PBR, high ROE value stocks',
    pullbackDesc: 'Pullback opportunities in uptrend',
    alphaDesc: 'Growth with improving fundamentals',
    customDesc: 'Define your own criteria',
  },
  
  ja: {
    // 一般
    appName: 'ストックスクリーナーPro',
    appSubtitle: 'AI駆動の投資分析ツール',
    loading: '読み込み中...',
    search: '検索',
    save: '保存',
    cancel: 'キャンセル',
    confirm: '確認',
    close: '閉じる',
    refresh: '更新',
    
    // ナビゲーション
    stockScreener: '銘柄スクリーニング',
    portfolio: 'ポートフォリオ',
    
    // スクリーナー
    screeningEngine: 'スクリーニングエンジン',
    value: 'バリュー投資',
    pullback: '押し目買い',
    alpha: 'アルファ戦略',
    custom: 'カスタム',
    presets: 'プリセット',
    customCriteria: 'カスタム条件',
    runScreener: 'スクリーニング実行',
    results: '結果',
    
    // 条件
    exchanges: '取引所',
    sectors: '業種',
    valuation: 'バリュエーション',
    financialMetrics: '財務指標',
    technicalIndicators: 'テクニカル指標',
    perMax: 'PER上限',
    pbrMax: 'PBR上限',
    dividendYieldMin: '最低配当利回り',
    roeMin: '最低ROE',
    revenueGrowthMin: '最低売上成長率',
    rsiRange: 'RSI範囲',
    aboveSMA50: '50日移動平均線上',
    aboveSMA200: '200日移動平均線上',
    
    // 銘柄テーブル
    ticker: 'ティッカー',
    name: '銘柄名',
    sector: '業種',
    price: '株価',
    per: 'PER',
    pbr: 'PBR',
    roe: 'ROE',
    dividendYield: '配当利回り',
    marketCap: '時価総額',
    score: 'スコア',
    noResults: '条件に一致する銘柄が見つかりません',
    
    // ポートフォリオ
    totalValue: '総資産額',
    totalReturn: '総リターン',
    holdings: '保有銘柄数',
    healthScore: '健全性スコア',
    sectorAllocation: '業種別配分',
    expectedReturns: '期待リターン（12ヶ月）',
    optimistic: '楽観的',
    baseCase: 'ベースケース',
    pessimistic: '悲観的',
    
    // ヘルスチェック
    healthCheck: 'ヘルスチェック',
    alerts: 'アラート',
    normal: '正常',
    warning: '警告',
    danger: '危険',
    concentration: '集中度',
    concentrationRisk: '集中リスク',
    diversified: '分散済み',
    
    // ストレステスト
    stressTest: 'ストレステスト',
    potentialLoss: '潜在損失',
    correlationRisk: '相関リスク',
    
    // リバランス
    rebalance: 'リバランス',
    rebalanceSuggestions: 'リバランス提案',
    action: 'アクション',
    buy: '買い',
    sell: '売り',
    hold: '保有',
    shares: '株数',
    reason: '理由',
    recommendation: '推奨',
    
    // 銘柄詳細
    overview: '概要',
    financial: '財務',
    technical: 'テクニカル',
    valuationMetrics: 'バリュエーション指標',
    financialStatements: '財務諸表',
    analystForecast: 'アナリスト予測',
    targetHigh: '目標高値',
    targetMean: '目標平均',
    targetLow: '目標安値',
    analystCount: 'アナリスト数',
    rating: 'レーティング',
    revenue: '売上高',
    netIncome: '純利益',
    totalAssets: '総資産',
    totalEquity: '純資産',
    week52Range: '52週範囲',
    week52High: '52週高値',
    week52Low: '52週安値',
    trend: 'トレンド',
    bollingerBands: 'ボリンジャーバンド',
    
    // エンジン説明
    valueDesc: '低PER/PBR、高ROEのバリュー株',
    pullbackDesc: '上昇トレンド中の押し目買い機会',
    alphaDesc: '成長性と基本面改善の銘柄',
    customDesc: '独自の条件を定義',
  },
};

export type Translations = typeof translations.en;

export function getTranslations(lang: Language): Translations {
  return translations[lang];
}

export const languageNames: Record<Language, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
};

export const languageFlags: Record<Language, string> = {
  zh: '🇨🇳',
  en: '🇺🇸',
  ja: '🇯🇵',
};
