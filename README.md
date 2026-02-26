# Stock Screener Pro

AI驱动的股票筛选和投资组合管理工具，支持多语言（中文、英文、日文）。

## 功能特性

### 📊 股票筛选器
- **4种筛选引擎**：价值投资、回调买入、阿尔法策略、自定义筛选
- **7种预设方案**：价值投资、高股息、成长股、优质股、小盘价值、技术回调、分析师推荐
- **多维度筛选条件**：交易所、行业、估值指标、财务指标、技术指标
- **智能评分系统**：综合评分0-100分，基于价值、成长、质量、技术四个维度

### 💼 投资组合管理
- **持仓概览**：总市值、总收益、持仓数量、健康评分
- **行业配置**：饼图展示各行业投资占比
- **预期收益**：基于分析师目标价的三情景分析（乐观/基准/悲观）

### 🔍 健康检查
- **技术警报**：RSI超买超卖、死亡交叉、均线趋近
- **基本面警报**：ROE过低、营收下滑、估值过高
- **集中度风险**：HHI指数、Top5权重分析

### 🧪 压力测试
- **8种测试情景**：Triple Weakness、Tech Crash、Rate Hikes、Recession、High Inflation、Trade War、Pandemic、Cyber Attack
- **风险指标**：VaR (95%/99%)、相关性风险评估

### 🔄 再平衡建议
- **智能建议**：买入/卖出/持有建议
- **等权重策略**：自动计算目标权重和调仓股数

### 🌐 多语言支持
- 中文 (zh)
- 英文 (en)
- 日文 (ja)

## 技术栈

- **框架**：Next.js 16 + React 19
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **UI组件**：shadcn/ui
- **状态管理**：Zustand
- **图表**：Recharts
- **构建输出**：静态导出

## 市场覆盖

| 交易所 | 市场 | 货币 |
|--------|------|------|
| NYSE | 美股 | USD |
| NASDAQ | 美股 | USD |
| HKEX | 港股 | HKD |
| LSE | 英股 | GBP |
| TSE | 日股 | JPY |
| SSE | 上证A股 | CNY |
| SZSE | 深证A股 | CNY |

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/stock-screener-pro.git
cd stock-screener-pro

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 部署到Vercel

### 方式一：通过Vercel CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署
vercel --prod
```

### 方式二：通过GitHub集成

1. 将代码推送到GitHub仓库
2. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
3. 点击 "Add New Project"
4. 导入GitHub仓库
5. 配置构建设置：
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. 点击 "Deploy"

## 项目结构

```
app/
├── components/          # React组件
│   ├── Dashboard.tsx
│   ├── ScreenerPanel.tsx
│   ├── StockTable.tsx
│   ├── PortfolioPanel.tsx
│   ├── DocumentationPanel.tsx
│   └── LanguageSwitcher.tsx
├── lib/                 # 工具函数和数据
│   ├── mockData.ts     # 股票数据生成
│   ├── screener.ts     # 筛选引擎
│   ├── portfolio.ts    # 投资组合计算
│   ├── i18n.ts         # 多语言配置
│   └── documentation.ts # 使用文档
├── store/              # 状态管理
│   ├── stockStore.ts
│   └── languageStore.ts
├── types/              # TypeScript类型
│   └── stock.ts
└── page.tsx           # 主页面
components/ui/         # shadcn/ui组件
public/               # 静态资源
```

## 免责声明

本应用提供的数据和分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。请在做出投资决策前进行充分的研究和咨询专业顾问。

## License

MIT License
