// 真实筛选股票池：覆盖 A股 / 港股 / 日股 / 美股 的流动性较好的知名标的
// 日股名称预置（腾讯不支持日股，Yahoo/东财失败时兜底显示）

export interface UniverseEntry {
  ticker: string; // 统一格式：600519.SS / 000333.SZ / 00700.HK / 7203.T / AAPL
  market: 'CN' | 'HK' | 'JP' | 'US';
  fallbackName?: string; // 数据源拿不到名称时使用
}

const A_SHARES: Array<[string, string, string]> = [
  // [code, suffix, name]
  ['600519', 'SS', '贵州茅台'], ['000858', 'SZ', '五粮液'], ['601318', 'SS', '中国平安'],
  ['600036', 'SS', '招商银行'], ['000333', 'SZ', '美的集团'], ['600900', 'SS', '长江电力'],
  ['300750', 'SZ', '宁德时代'], ['002594', 'SZ', '比亚迪'], ['600030', 'SS', '中信证券'],
  ['601899', 'SS', '紫金矿业'], ['600276', 'SS', '恒瑞医药'], ['000651', 'SZ', '格力电器'],
  ['601166', 'SS', '兴业银行'], ['600887', 'SS', '伊利股份'], ['002475', 'SZ', '立讯精密'],
  ['603288', 'SS', '海天味业'], ['600309', 'SS', '万华化学'], ['601888', 'SS', '中国中免'],
  ['000001', 'SZ', '平安银行'], ['600028', 'SS', '中国石化'], ['601857', 'SS', '中国石油'],
  ['603259', 'SS', '药明康德'], ['002415', 'SZ', '海康威视'], ['600585', 'SS', '海螺水泥'],
  ['601633', 'SS', '长城汽车'], ['300059', 'SZ', '东方财富'], ['002714', 'SZ', '牧原股份'],
  ['688981', 'SS', '中芯国际'], ['601988', 'SS', '中国银行'], ['600438', 'SS', '通威股份'],
  ['603501', 'SS', '韦尔股份'], ['000568', 'SZ', '泸州老窖'], ['002352', 'SZ', '顺丰控股'],
  ['601668', 'SS', '中国建筑'], ['600809', 'SS', '山西汾酒'],
];

const HK_STOCKS: Array<[string, string]> = [
  ['00700', '腾讯控股'], ['09988', '阿里巴巴-W'], ['03690', '美团-W'], ['09618', '京东集团-SW'],
  ['01211', '比亚迪股份'], ['00941', '中国移动'], ['01299', '友邦保险'], ['01398', '工商银行'],
  ['00388', '香港交易所'], ['01810', '小米集团-W'], ['02318', '中国平安'], ['00939', '建设银行'],
  ['01024', '快手-W'], ['02015', '理想汽车-W'], ['02020', '安踏体育'], ['00322', '康师傅控股'],
  ['00669', '创科实业'], ['02331', '李宁'], ['02382', '舜宇光学科技'], ['01088', '中国神华'],
  ['00883', '中国海洋石油'], ['00386', '中国石油股份'], ['02628', '中国人寿'], ['01298', '中国人保'],
];

const JP_STOCKS: Array<[string, string]> = [
  ['7203', '丰田汽车'], ['6758', '索尼集团'], ['9984', '软银集团'], ['6861', '基恩士'],
  ['8306', '三菱日联金融'], ['9432', '日本电信电话'], ['6501', '日立制作所'],
  ['6954', '发那科'], ['7267', '本田汽车'], ['8316', '三井住友金融'],
  ['9983', '迅销集团'], ['6367', '荏原制作所'], ['6471', '日本精工'], ['4502', '武田药品'],
];

const US_STOCKS: Array<[string, string]> = [
  ['AAPL', '苹果'], ['MSFT', '微软'], ['NVDA', '英伟达'], ['GOOGL', '谷歌A'], ['AMZN', '亚马逊'],
  ['META', 'Meta Platforms'], ['TSLA', '特斯拉'], ['AVGO', '博通'], ['TSM', '台积电'],
  ['JPM', '摩根大通'], ['V', 'Visa'], ['UNH', '联合健康'], ['XOM', '埃克森美孚'], ['MA', '万事达'],
  ['JNJ', '强生'], ['WMT', '沃尔玛'], ['PG', '宝洁'], ['ORCL', '甲骨文'], ['KO', '可口可乐'],
  ['PEP', '百事'], ['ABBV', '艾伯维'], ['CVX', '雪佛龙'], ['BAC', '美国银行'], ['COST', '好市多'],
  ['MCD', '麦当劳'], ['AMD', '超威半导体'], ['NFLX', '奈飞'], ['DIS', '华特迪士尼'],
  ['CRM', '赛富时'], ['QCOM', '高通'], ['BA', '波音'], ['CAT', '卡特彼勒'], ['GS', '高盛'],
  ['IBM', 'IBM'], ['GE', '通用电气'], ['NKE', '耐克'], ['SBUX', '星巴克'], ['INTC', '英特尔'],
];

export const UNIVERSE: UniverseEntry[] = [
  ...A_SHARES.map(([code, suffix, name]) => ({
    ticker: `${code}.${suffix}`,
    market: 'CN' as const,
    fallbackName: name,
  })),
  ...HK_STOCKS.map(([code, name]) => ({
    ticker: `${code}.HK`,
    market: 'HK' as const,
    fallbackName: name,
  })),
  ...JP_STOCKS.map(([code, name]) => ({
    ticker: `${code}.T`,
    market: 'JP' as const,
    fallbackName: name,
  })),
  ...US_STOCKS.map(([code, name]) => ({
    ticker: code,
    market: 'US' as const,
    fallbackName: name,
  })),
];

export const MARKET_LABELS: Record<string, string> = {
  CN: 'A股', HK: '港股', JP: '日股', US: '美股',
};

export function marketOf(ticker: string): 'CN' | 'HK' | 'JP' | 'US' {
  if (/\.SS$|\.SZ$/i.test(ticker)) return 'CN';
  if (/\.HK$/i.test(ticker)) return 'HK';
  if (/\.T$/i.test(ticker)) return 'JP';
  return 'US';
}

export function exchangeLabel(ticker: string): string {
  if (/\.SS$/i.test(ticker)) return /^\d{6}$/.test(ticker.slice(0, 6)) && ticker.startsWith('68') ? 'STAR' : 'SSE';
  if (/\.SZ$/i.test(ticker)) return ticker.startsWith('30') || ticker.startsWith('68') ? 'ChiNext' : 'SZSE';
  if (/\.HK$/i.test(ticker)) return 'HKEX';
  if (/\.T$/i.test(ticker)) return 'TSE';
  return 'US';
}
