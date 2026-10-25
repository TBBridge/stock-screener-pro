# 多市场股票分析仪表盘

AI驱动的多市场股票分析与投资组合管理工具，覆盖 **A股、港股、日股、美股**。

## 核心功能

- **市场动态实时跟踪**：全球 8 大指数（上证/深成/创业板/恒生/日经225/标普/纳指/道指）实时行情，60 秒自动刷新，点击查看指数 K 线
- **K 线图**：手写 SVG 蜡烛图（红涨绿跌），MA5/MA20、成交量、十字光标，支持 1月~2年 切换
- **智能筛选**：价值投资/回调买入/阿尔法/自定义 4 种引擎，基于评分系统推荐股票
- **买卖判断**：综合均线趋势、RSI 超买超卖、分析师目标价空间、基本面、52 周位置生成 强烈买入~卖出 五级信号
- **我的持仓**：真实行情驱动的持仓管理、盈亏分析、健康检查、压力测试、再平衡建议
- **关注股票（Watchlist）**：搜索添加、实时行情、一键查看详情
- **市场新闻 + 股价影响判断**：利好/利空/中性三级判断并给出理由（中英文关键词规则）

## 数据源与降级链

服务端统一代理（解决浏览器 CORS），按顺序降级：

1. **Yahoo Finance**（chart/quoteSummary/search，带 429 重试与 crumb 认证）
2. **腾讯行情**（qt.gtimg.cn：A股/港股/美股报价与日K，全球部分指数）
3. **新浪财经**（hq.sinajs.cn：全球指数；feed.mix.sina.com.cn：新闻兜底）
4. **东方财富**（push2his：日股等品种兜底，多 CDN 轮询）

所有行情/详情/K线接口带服务端 TTL 缓存与客户端内存缓存。技术指标（RSI14/SMA20/50/200/布林带）由服务端基于日K计算。

> 注：日股（.T）依赖 Yahoo/东财，若上游限流可能暂时无数据；A股/港股/美股在腾讯源下稳定可用。

## API 路由

| 路由 | 说明 |
|------|------|
| `GET /api/market` | 全球指数实时行情 |
| `GET /api/quote?tickers=` | 批量实时报价 |
| `GET /api/chart?ticker=&range=&interval=` | 日K + 技术指标 |
| `GET /api/details?ticker=` | 详情（估值/财务/分析师/技术/K线） |
| `GET /api/news?ticker=&count=` | 新闻 + 影响判断 |
| `GET /api/search?q=` | 股票搜索 |

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
