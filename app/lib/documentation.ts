// 使用文档内容
export type DocSection = {
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
};

export type Documentation = {
  zh: DocSection[];
  en: DocSection[];
  ja: DocSection[];
};

export const documentation: Documentation = {
  zh: [
    {
      title: "快速开始",
      content: "股票筛选器专业版是一个AI驱动的投资分析工具，帮助您发现投资机会、管理投资组合并评估风险。",
      subsections: [
        {
          title: "界面概览",
          content: "应用包含两个主要模块：股票筛选器和投资组合。使用顶部标签切换不同功能。",
        },
        {
          title: "语言切换",
          content: "点击右上角的语言切换按钮，可在中文、英文和日文之间切换。",
        },
      ],
    },
    {
      title: "股票筛选器",
      content: "使用多种筛选策略发现符合您投资标准的股票。",
      subsections: [
        {
          title: "筛选引擎",
          content: `提供4种预设筛选引擎：
• 价值投资 - 筛选低市盈率、低市净率、高ROE的价值股
• 回调买入 - 发现上升趋势中出现技术性回调的买入机会
• 阿尔法策略 - 寻找成长性好、基本面持续改善的股票
• 自定义 - 根据您的特定条件灵活筛选`,
        },
        {
          title: "预设方案",
          content: `系统提供7种常用筛选方案：
• 价值投资 - PER<15, PBR<1.5, ROE>10%
• 高股息 - 股息率>3%, PER<20
• 成长股 - 营收增长>20%, ROE>15%
• 优质股 - ROE>20%, PER<25
• 小盘价值 - 小市值低估值股票
• 技术回调 - RSI 30-50, 价格高于200日均线
• 分析师推荐 - 分析师数量>10, 评级为买入`,
        },
        {
          title: "自定义筛选条件",
          content: `可设置多维度筛选条件：
• 交易所 - 支持TSE、NYSE、NASDAQ、LSE、HKEX、SSE(上交所)、SZSE(深交所)
• 行业 - 科技、金融、医疗、消费、能源、工业等
• 估值指标 - PER、PBR、股息率、市值范围
• 财务指标 - ROE、营收增长率
• 技术指标 - RSI范围、移动平均线位置`,
        },
        {
          title: "评分系统",
          content: `每只股票获得0-100分的综合评分，基于：
• 价值评分(40%) - PER、PBR、股息率、ROE、营收增长
• 成长评分(30%) - 营收增长趋势、ROE质量、自由现金流
• 质量评分(20%) - 财务健康度
• 技术评分(10%) - RSI、均线位置、52周高低点`,
        },
        {
          title: "结果解读",
          content: `筛选结果表格显示：
• 评分圆环 - 绿色(80+)、黄色(60-79)、红色(<60)
• 基础信息 - 代码、名称、交易所、行业
• 估值数据 - 价格、PER、PBR、股息率、市值
• 财务数据 - ROE
• 可点击表头进行排序`,
        },
      ],
    },
    {
      title: "投资组合",
      content: "管理您的投资组合，监控持仓表现并进行风险评估。",
      subsections: [
        {
          title: "持仓概览",
          content: `顶部卡片显示关键指标：
• 总市值 - 当前投资组合总价值
• 总收益 - 相对于成本基础的盈亏金额和百分比
• 持仓数量 - 持有的股票数量
• 健康评分 - 整体健康状态(正常/警告/危险)`,
        },
        {
          title: "行业配置",
          content: `饼图展示各行业投资占比，帮助您了解：
• 行业分散程度
• 是否存在行业集中风险
• 是否需要调整行业配置`,
        },
        {
          title: "预期收益",
          content: `基于分析师目标价的三情景分析：
• 乐观情景 - 使用最高目标价计算
• 基准情景 - 使用平均目标价计算
• 悲观情景 - 使用最低目标价计算`,
        },
      ],
    },
    {
      title: "健康检查",
      content: "自动监控您的投资组合，识别潜在风险。",
      subsections: [
        {
          title: "技术警报",
          content: `监控技术指标异常：
• RSI超买(>70) - 建议考虑获利了结
• RSI超卖(<30) - 可能是买入机会或趋势反转
• 死亡交叉 - SMA50跌破SMA200，建议减仓
• 均线趋近 - 需关注潜在趋势变化`,
        },
        {
          title: "基本面警报",
          content: `监控财务指标恶化：
• ROE过低(<5%) - 公司盈利能力下降
• 营收大幅下滑(<-10%) - 业务面临挑战
• 估值过高(PER>50) - 评估增长是否支撑估值`,
        },
        {
          title: "集中度风险",
          content: `评估持仓集中程度：
• HHI指数(赫芬达尔指数) - >2500表示高度集中
• Top5权重 - >70%表示集中度过高
• 建议分散投资以降低风险`,
        },
      ],
    },
    {
      title: "压力测试",
      content: "模拟极端市场情景，评估投资组合的抗风险能力。",
      subsections: [
        {
          title: "测试情景",
          content: `提供8种压力测试情景：
• Triple Weakness - 美元走弱、商品崩盘、科技股抛售
• Tech Crash - 科技板块大幅回调
• Rate Hikes - 央行激进加息
• Recession - 全球经济衰退
• High Inflation - 持续高通胀环境
• Trade War - 全球贸易摩擦升级
• Pandemic - 全球健康危机
• Cyber Attack - 关键基础设施遭受网络攻击`,
        },
        {
          title: "风险指标",
          content: `压力测试结果包含：
• 潜在损失金额和百分比
• VaR(风险价值) - 95%和99%置信水平
• 相关性风险评估 - 高/中/低
• 压力前后组合价值对比图表`,
        },
      ],
    },
    {
      title: "再平衡建议",
      content: "根据目标权重自动生成调仓建议。",
      subsections: [
        {
          title: "建议类型",
          content: `系统会针对每只持仓给出建议：
• 买入 - 权重低于目标，建议增持
• 卖出 - 权重高于目标，建议减持
• 持有 - 权重在目标范围内，无需调整`,
        },
        {
          title: "计算方法",
          content: `默认使用等权重策略，计算每只股票的：
• 当前权重 - 当前市值占总市值比例
• 目标权重 - 1/持仓数量
• 建议股数 - 需要买入或卖出的股票数量`,
        },
      ],
    },
    {
      title: "数据说明",
      content: "了解应用中使用的数据来源和限制。",
      subsections: [
        {
          title: "市场覆盖",
          content: `支持以下交易所：
• 美股 - NYSE、NASDAQ
• 港股 - HKEX
• 日股 - TSE
• 欧股 - LSE
• A股 - SSE(上交所)、SZSE(深交所)`,
        },
        {
          title: "数据类型",
          content: `包含以下数据维度：
• 估值数据 - PER、PBR、股息率、市值、52周高低点
• 财务数据 - 营收、净利润、总资产、ROE、营收增长、自由现金流
• 技术指标 - RSI(14)、SMA(50/200)、布林带
• 分析师数据 - 目标价(高/中/低)、评级、分析师数量`,
        },
        {
          title: "免责声明",
          content: `本应用提供的数据和分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。请在做出投资决策前进行充分的研究和咨询专业顾问。`,
        },
      ],
    },
  ],
  
  en: [
    {
      title: "Getting Started",
      content: "Stock Screener Pro is an AI-powered investment analysis tool that helps you discover investment opportunities, manage your portfolio, and assess risks.",
      subsections: [
        {
          title: "Interface Overview",
          content: "The app includes two main modules: Stock Screener and Portfolio. Use the top tabs to switch between different features.",
        },
        {
          title: "Language Switching",
          content: "Click the language switcher button in the top right corner to switch between Chinese, English, and Japanese.",
        },
      ],
    },
    {
      title: "Stock Screener",
      content: "Use multiple screening strategies to discover stocks that meet your investment criteria.",
      subsections: [
        {
          title: "Screening Engines",
          content: `Four preset screening engines available:
• Value - Screens for low PER, low PBR, high ROE value stocks
• Pullback - Finds buying opportunities during technical pullbacks in uptrends
• Alpha - Seeks growth stocks with improving fundamentals
• Custom - Flexible screening based on your specific criteria`,
        },
        {
          title: "Preset Screeners",
          content: `Seven commonly used screening presets:
• Value - PER<15, PBR<1.5, ROE>10%
• High Dividend - Dividend yield>3%, PER<20
• Growth - Revenue growth>20%, ROE>15%
• Quality - ROE>20%, PER<25
• Small Cap Value - Small market cap with low valuation
• Technical Pullback - RSI 30-50, price above 200-day MA
• Analyst Favorite - Analyst count>10, Buy rating`,
        },
        {
          title: "Custom Criteria",
          content: `Set multi-dimensional screening criteria:
• Exchanges - TSE, NYSE, NASDAQ, LSE, HKEX, SSE, SZSE
• Sectors - Technology, Finance, Healthcare, Consumer, Energy, Industrial
• Valuation - PER, PBR, Dividend yield, Market cap range
• Financial - ROE, Revenue growth rate
• Technical - RSI range, Moving average position`,
        },
        {
          title: "Scoring System",
          content: `Each stock receives a comprehensive score (0-100) based on:
• Value Score (40%) - PER, PBR, Dividend yield, ROE, Revenue growth
• Growth Score (30%) - Revenue growth trend, ROE quality, Free cash flow
• Quality Score (20%) - Financial health
• Technical Score (10%) - RSI, Moving averages, 52-week high/low`,
        },
        {
          title: "Interpreting Results",
          content: `The results table shows:
• Score badge - Green (80+), Yellow (60-79), Red (<60)
• Basic info - Ticker, Name, Exchange, Sector
• Valuation - Price, PER, PBR, Dividend yield, Market cap
• Financial - ROE
• Click headers to sort`,
        },
      ],
    },
    {
      title: "Portfolio",
      content: "Manage your investment portfolio, monitor holdings performance, and assess risks.",
      subsections: [
        {
          title: "Portfolio Overview",
          content: `Top cards display key metrics:
• Total Value - Current portfolio total value
• Total Return - Gain/loss amount and percentage vs cost basis
• Holdings - Number of stocks held
• Health Score - Overall health status (Normal/Warning/Danger)`,
        },
        {
          title: "Sector Allocation",
          content: `Pie chart shows investment by sector, helping you understand:
• Sector diversification
• Sector concentration risk
• Need for sector rebalancing`,
        },
        {
          title: "Expected Returns",
          content: `Three-scenario analysis based on analyst price targets:
• Optimistic - Calculated using highest target price
• Base Case - Calculated using average target price
• Pessimistic - Calculated using lowest target price`,
        },
      ],
    },
    {
      title: "Health Check",
      content: "Automatically monitor your portfolio and identify potential risks.",
      subsections: [
        {
          title: "Technical Alerts",
          content: `Monitor technical indicator anomalies:
• RSI Overbought (>70) - Consider taking profits
• RSI Oversold (<30) - Potential buying opportunity or trend reversal
• Death Cross - SMA50 below SMA200, consider reducing position
• MA Convergence - Watch for potential trend changes`,
        },
        {
          title: "Fundamental Alerts",
          content: `Monitor deteriorating financial metrics:
• Low ROE (<5%) - Declining company profitability
• Significant Revenue Decline (<-10%) - Business challenges
• High Valuation (PER>50) - Assess if growth justifies valuation`,
        },
        {
          title: "Concentration Risk",
          content: `Assess holding concentration:
• HHI Index - >2500 indicates high concentration
• Top5 Weight - >70% indicates excessive concentration
• Recommend diversification to reduce risk`,
        },
      ],
    },
    {
      title: "Stress Test",
      content: "Simulate extreme market scenarios to evaluate portfolio resilience.",
      subsections: [
        {
          title: "Test Scenarios",
          content: `Eight stress test scenarios available:
• Triple Weakness - Dollar weakness, commodity crash, tech selloff
• Tech Crash - Major tech sector correction
• Rate Hikes - Central bank aggressive tightening
• Recession - Global economic downturn
• High Inflation - Persistent high inflation
• Trade War - Escalating global trade tensions
• Pandemic - Global health crisis
• Cyber Attack - Critical infrastructure cyber attack`,
        },
        {
          title: "Risk Metrics",
          content: `Stress test results include:
• Potential loss amount and percentage
• VaR (Value at Risk) - 95% and 99% confidence levels
• Correlation risk assessment - High/Medium/Low
• Before/after portfolio value comparison chart`,
        },
      ],
    },
    {
      title: "Rebalance Suggestions",
      content: "Automatically generate rebalancing recommendations based on target weights.",
      subsections: [
        {
          title: "Suggestion Types",
          content: `System provides recommendations for each holding:
• Buy - Weight below target, recommend increasing
• Sell - Weight above target, recommend decreasing
• Hold - Weight within target range, no action needed`,
        },
        {
          title: "Calculation Method",
          content: `Default equal-weight strategy calculates for each stock:
• Current Weight - Current market value / Total value
• Target Weight - 1 / Number of holdings
• Suggested Shares - Number of shares to buy or sell`,
        },
      ],
    },
    {
      title: "Data Information",
      content: "Understand data sources and limitations used in the application.",
      subsections: [
        {
          title: "Market Coverage",
          content: `Supported exchanges:
• US Stocks - NYSE, NASDAQ
• HK Stocks - HKEX
• Japan Stocks - TSE
• Europe Stocks - LSE
• China A-Shares - SSE, SZSE`,
        },
        {
          title: "Data Types",
          content: `Includes the following data dimensions:
• Valuation - PER, PBR, Dividend yield, Market cap, 52-week high/low
• Financial - Revenue, Net income, Total assets, ROE, Revenue growth, Free cash flow
• Technical - RSI(14), SMA(50/200), Bollinger Bands
• Analyst - Price targets (High/Mid/Low), Rating, Analyst count`,
        },
        {
          title: "Disclaimer",
          content: `The data and analysis provided by this application are for reference only and do not constitute investment advice. Investing involves risks. Please conduct thorough research and consult professional advisors before making investment decisions.`,
        },
      ],
    },
  ],
  
  ja: [
    {
      title: "はじめに",
      content: "ストックスクリーナーProは、投資機会の発見、ポートフォリオ管理、リスク評価を支援するAI駆動の投資分析ツールです。",
      subsections: [
        {
          title: "インターフェース概要",
          content: "アプリには2つの主要モジュールがあります：銘柄スクリーニングとポートフォリオ。上部のタブを使用して機能を切り替えます。",
        },
        {
          title: "言語切り替え",
          content: "右上の言語切り替えボタンをクリックして、中国語、英語、日本語を切り替えます。",
        },
      ],
    },
    {
      title: "銘柄スクリーニング",
      content: "複数のスクリーニング戦略を使用して、投資基準に合致する銘柄を発見します。",
      subsections: [
        {
          title: "スクリーニングエンジン",
          content: `4つのプリセットスクリーニングエンジンを提供：
• バリュー投資 - 低PER、低PBR、高ROEのバリュー株をスクリーニング
• 押し目買い - 上昇トレンド中のテクニカル押し目の買い機会を発見
• アルファ戦略 - 成長性と基本面改善の銘柄を探索
• カスタム - 特定の条件に基づく柔軟なスクリーニング`,
        },
        {
          title: "プリセットスクリーナー",
          content: `7つの一般的に使用されるスクリーニングプリセット：
• バリュー - PER<15, PBR<1.5, ROE>10%
• 高配当 - 配当利回り>3%, PER<20
• 成長株 - 売上成長率>20%, ROE>15%
• 優良株 - ROE>20%, PER<25
• 小型バリュー - 低時価総額の割安株
• テクニカル押し目 - RSI 30-50, 200日移動平均線上
• アナリスト推奨 - アナリスト数>10, 買い評価`,
        },
        {
          title: "カスタム条件",
          content: `多次元スクリーニング条件を設定：
• 取引所 - TSE, NYSE, NASDAQ, LSE, HKEX, SSE, SZSE
• 業種 - テクノロジー、金融、ヘルスケア、消費財、エネルギー、工業
• バリュエーション - PER, PBR, 配当利回り, 時価総額範囲
• 財務指標 - ROE, 売上成長率
• テクニカル指標 - RSI範囲, 移動平均線位置`,
        },
        {
          title: "スコアリングシステム",
          content: `各銘柄は以下に基づいて包括的スコア(0-100)を取得：
• バリュースコア(40%) - PER, PBR, 配当利回り, ROE, 売上成長
• 成長スコア(30%) - 売上成長トレンド, ROE品質, フリーキャッシュフロー
• 品質スコア(20%) - 財務健全性
• テクニカルスコア(10%) - RSI, 移動平均線, 52週高値/安値`,
        },
        {
          title: "結果の解釈",
          content: `結果テーブルには以下が表示されます：
• スコアバッジ - 緑(80+)、黄(60-79)、赤(<60)
• 基本情報 - ティッカー、銘柄名、取引所、業種
• バリュエーション - 株価、PER、PBR、配当利回り、時価総額
• 財務データ - ROE
• ヘッダーをクリックしてソート`,
        },
      ],
    },
    {
      title: "ポートフォリオ",
      content: "投資ポートフォリオを管理し、保有銘柄のパフォーマンスを監視し、リスクを評価します。",
      subsections: [
        {
          title: "ポートフォリオ概要",
          content: `上部カードに主要指標を表示：
• 総資産額 - 現在のポートフォリオ総額
• 総リターン - 原価基準に対する損益額とパーセンテージ
• 保有銘柄数 - 保有する銘柄の数
• 健全性スコア - 全体的な健全性状態(正常/警告/危険)`,
        },
        {
          title: "業種別配分",
          content: `円グラフで業種別投資を表示し、以下を理解するのに役立ちます：
• 業種分散度
• 業種集中リスク
• 業種リバランスの必要性`,
        },
        {
          title: "期待リターン",
          content: `アナリスト目標株価に基づく3シナリオ分析：
• 楽観的 - 最高目標株価を使用して計算
• ベースケース - 平均目標株価を使用して計算
• 悲観的 - 最低目標株価を使用して計算`,
        },
      ],
    },
    {
      title: "ヘルスチェック",
      content: "ポートフォリオを自動監視し、潜在的なリスクを特定します。",
      subsections: [
        {
          title: "テクニカルアラート",
          content: `テクニカル指標の異常を監視：
• RSI買われすぎ(>70) - 利益確定を検討
• RSI売られすぎ(<30) - 買い機会またはトレンド反転の可能性
• デッドクロス - SMA50がSMA200を下回る、減量を検討
• MA収束 - 潜在的なトレンド変化に注意`,
        },
        {
          title: "ファンダメンタルアラート",
          content: `悪化する財務指標を監視：
• 低ROE(<5%) - 企業の収益性低下
• 大幅な売上減少(<-10%) - ビジネス上の課題
• 高バリュエーション(PER>50) - 成長性がバリュエーションを正当化するか評価`,
        },
        {
          title: "集中リスク",
          content: `保有集中度を評価：
• HHI指数 - >2500は高集中度を示す
• Top5比率 - >70%は過度の集中度を示す
• リスク軽減のため分散投資を推奨`,
        },
      ],
    },
    {
      title: "ストレステスト",
      content: "極端な市場シナリオをシミュレートし、ポートフォリオの回復力を評価します。",
      subsections: [
        {
          title: "テストシナリオ",
          content: `8つのストレステストシナリオを提供：
• Triple Weakness - ドル安、商品暴落、テック株売り
• Tech Crash - テクノロジー部門の大幅修正
• Rate Hikes - 中央銀行の積極的な引き締め
• Recession - 世界経済の後退
• High Inflation - 持続的な高インフレ
• Trade War - エスカレートする世界貿易摩擦
• Pandemic - 世界的健康危機
• Cyber Attack - 重要インフラへのサイバー攻撃`,
        },
        {
          title: "リスク指標",
          content: `ストレステスト結果には以下が含まれます：
• 潜在的損失額とパーセンテージ
• VaR(リスク価値) - 95%および99%信頼水準
• 相関リスク評価 - 高/中/低
• ストレス前後のポートフォリオ価値比較チャート`,
        },
      ],
    },
    {
      title: "リバランス提案",
      content: "目標ウェイトに基づいてリバランス推奨事項を自動生成します。",
      subsections: [
        {
          title: "提案タイプ",
          content: `システムは各保有銘柄に対して推奨を提供：
• 買い - 目標より低いウェイト、増量を推奨
• 売り - 目標より高いウェイト、減量を推奨
• 保有 - 目標範囲内のウェイト、対応不要`,
        },
        {
          title: "計算方法",
          content: `デフォルトの等ウェイト戦略で各銘柄を計算：
• 現在のウェイト - 現在の時価総額/総額
• 目標ウェイト - 1/保有銘柄数
• 推奨株数 - 買いまたは売りの株数`,
        },
      ],
    },
    {
      title: "データ情報",
      content: "アプリケーションで使用されるデータソースと制限を理解します。",
      subsections: [
        {
          title: "市場カバレッジ",
          content: `サポートされる取引所：
• 米国株 - NYSE, NASDAQ
• 香港株 - HKEX
• 日本株 - TSE
• 欧州株 - LSE
• 中国A株 - SSE, SZSE`,
        },
        {
          title: "データタイプ",
          content: `以下のデータ次元を含む：
• バリュエーション - PER, PBR, 配当利回り, 時価総額, 52週高値/安値
• 財務 - 売上高、純利益、総資産、ROE、売上成長率、フリーキャッシュフロー
• テクニカル - RSI(14), SMA(50/200), ボリンジャーバンド
• アナリスト - 目標株価(高/中/低), 評価, アナリスト数`,
        },
        {
          title: "免責事項",
          content: `本アプリケーションが提供するデータと分析は参考のみであり、投資助言を構成するものではありません。投資にはリスクが伴います。投資判断を行う前に、十分な調査を行い、専門家に相談してください。`,
        },
      ],
    },
  ],
};

export function getDocumentation(lang: 'zh' | 'en' | 'ja'): DocSection[] {
  return documentation[lang];
}
