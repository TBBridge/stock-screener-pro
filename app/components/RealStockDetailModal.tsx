"use client";

// 真实行情详情弹窗：K线 + 买卖建议 + 估值/财务/技术 + 个股新闻
import { useEffect, useState } from "react";
import { getStockDetails, getChartData, ChartData } from "@/app/lib/realStockApi";
import { QuoteSummary } from "@/app/types/market";
import { generateTradeAdvice, SIGNAL_META } from "@/app/lib/tradeAdvice";
import { changeColorClass, formatPercent, formatPrice, formatMarketCap, formatVolume } from "@/app/lib/format";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import CandlestickChart from "./CandlestickChart";
import NewsPanel from "./NewsPanel";
import {
  TrendingUp, TrendingDown, Activity, ShieldAlert, Lightbulb, AlertTriangle, CheckCircle2,
} from "lucide-react";

interface RealStockDetailModalProps {
  ticker: string | null;
  isOpen: boolean;
  onClose: () => void;
  holdingCost?: number; // 若为持仓股，传入成本价以辅助买卖判断
}

const RANGES = [
  { label: "1月", value: "1mo" },
  { label: "3月", value: "3mo" },
  { label: "6月", value: "6mo" },
  { label: "1年", value: "1y" },
  { label: "2年", value: "2y" },
];

export default function RealStockDetailModal({ ticker, isOpen, onClose, holdingCost }: RealStockDetailModalProps) {
  const [detail, setDetail] = useState<QuoteSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [range, setRange] = useState("6mo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    setChartData(null);
    setRange("6mo");

    (async () => {
      try {
        const [d, c] = await Promise.all([
          getStockDetails(ticker),
          getChartData(ticker, "6mo", "1d"),
        ]);
        if (cancelled) return;
        setDetail(d);
        setChartData(c);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "数据加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, ticker]);

  const changeRange = async (r: string) => {
    if (!ticker) return;
    setRange(r);
    try {
      setChartData(await getChartData(ticker, r, "1d"));
    } catch {
      /* 保持旧数据 */
    }
  };

  const advice = detail ? generateTradeAdvice(detail, holdingCost) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          {loading ? (
            <DialogTitle>加载中...</DialogTitle>
          ) : detail ? (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                  {detail.name}
                  <Badge variant="outline">{detail.ticker}</Badge>
                  <Badge variant="secondary">{detail.exchange}</Badge>
                  {detail.sector && <Badge variant="outline">{detail.sector}</Badge>}
                </DialogTitle>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-bold">{formatPrice(detail.price, detail.currency)}</span>
                  <span className={`text-base ${changeColorClass(detail.changePercent)}`}>
                    {formatPercent(detail.changePercent)}
                  </span>
                </div>
              </div>
              {advice && (
                <div className="text-right">
                  <Badge variant={SIGNAL_META[advice.signal].badgeVariant} className="text-sm px-3 py-1">
                    {SIGNAL_META[advice.signal].label}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    综合信号分 {advice.score > 0 ? "+" : ""}{advice.score}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <DialogTitle>{error || "无数据"}</DialogTitle>
          )}
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        )}

        {error && !loading && (
          <div className="py-12 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            {error}
          </div>
        )}

        {detail && !loading && (
          <Tabs defaultValue="chart" className="mt-2">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="chart">走势K线</TabsTrigger>
              <TabsTrigger value="advice">买卖建议</TabsTrigger>
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="financial">财务/技术</TabsTrigger>
              <TabsTrigger value="news">新闻</TabsTrigger>
            </TabsList>

            {/* K线 */}
            <TabsContent value="chart" className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                {RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => changeRange(r.value)}
                    className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                      range === r.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
                <span className="text-xs text-muted-foreground ml-2">日K · 红涨绿跌 · MA5/MA20 · 成交量</span>
              </div>
              <CandlestickChart
                candles={chartData?.candles || []}
                currency={detail.currency}
                height={400}
              />
            </TabsContent>

            {/* 买卖建议 */}
            <TabsContent value="advice" className="mt-4 space-y-3">
              {advice && (
                <>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`text-3xl font-bold ${SIGNAL_META[advice.signal].className}`}>
                        {SIGNAL_META[advice.signal].label}
                      </div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-muted overflow-hidden relative">
                          <div
                            className={`absolute top-0 h-full ${advice.score >= 0 ? "bg-red-500" : "bg-green-600"}`}
                            style={{
                              left: advice.score >= 0 ? "50%" : `${50 + advice.score / 2}%`,
                              width: `${Math.abs(advice.score) / 2}%`,
                            }}
                          />
                          <div className="absolute left-1/2 top-0 h-full w-px bg-foreground/30" />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>卖出 -100</span>
                          <span>中性 0</span>
                          <span>买入 +100</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 font-medium text-sm mb-2">
                          <Lightbulb className="h-4 w-4 text-red-600" /> 支持买入/持有的信号
                        </div>
                        <ul className="space-y-1.5">
                          {advice.reasons.map((r, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <CheckCircle2 className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 font-medium text-sm mb-2">
                          <ShieldAlert className="h-4 w-4 text-green-600" /> 风险与卖出提示
                        </div>
                        <ul className="space-y-1.5">
                          {advice.risks.map((r, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <AlertTriangle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    综合信号 = 均线趋势(±30) + RSI超买超卖(±25) + 目标价空间(±25) + 基本面(±20) + 52周位置(±5)。
                    仅供参考，不构成投资建议。
                  </p>
                </>
              )}
            </TabsContent>

            {/* 概览 */}
            <TabsContent value="overview" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "市值", value: formatMarketCap(detail.valuation.marketCap, detail.currency) },
                  { label: "市盈率 PER", value: detail.valuation.per?.toFixed(2) ?? "-" },
                  { label: "市净率 PBR", value: detail.valuation.pbr?.toFixed(2) ?? "-" },
                  { label: "股息率", value: formatPercent(detail.valuation.dividendYield) },
                  { label: "52周最高", value: formatPrice(detail.valuation.week52High, detail.currency) },
                  { label: "52周最低", value: formatPrice(detail.valuation.week52Low, detail.currency) },
                  { label: "今日最高", value: formatPrice(chartData?.candles.slice(-1)[0]?.h ?? null, detail.currency) },
                  { label: "今日最低", value: formatPrice(chartData?.candles.slice(-1)[0]?.l ?? null, detail.currency) },
                ].map((m) => (
                  <Card key={m.label}>
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                      <div className="text-base font-bold mt-0.5">{m.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 分析师预测 */}
              {detail.analyst.targetMean && (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-3">分析师预测（{detail.analyst.analystCount || "-"} 位）</div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-muted-foreground">最高目标价</div>
                        <div className="text-lg font-semibold text-red-600">
                          {formatPrice(detail.analyst.targetHigh, detail.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">平均目标价</div>
                        <div className="text-lg font-semibold">
                          {formatPrice(detail.analyst.targetMean, detail.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">最低目标价</div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatPrice(detail.analyst.targetLow, detail.currency)}
                        </div>
                      </div>
                    </div>
                    {detail.analyst.rating && (
                      <div className="text-center mt-2">
                        <Badge variant="secondary">市场评级：{detail.analyst.rating}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 财务/技术 */}
            <TabsContent value="financial" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "营收", value: formatMarketCap(detail.financial.revenue, detail.currency) },
                  { label: "净利润", value: formatMarketCap(detail.financial.netIncome, detail.currency) },
                  { label: "自由现金流", value: formatMarketCap(detail.financial.freeCashFlow, detail.currency) },
                  { label: "ROE", value: formatPercent(detail.financial.roe) },
                  { label: "营收增长(同比)", value: formatPercent(detail.financial.revenueGrowth) },
                  { label: "毛利率", value: formatPercent(detail.financial.grossMargins) },
                  { label: "净利率", value: formatPercent(detail.financial.profitMargins) },
                  { label: "总现金", value: formatMarketCap(detail.financial.totalCash, detail.currency) },
                  { label: "总负债", value: formatMarketCap(detail.financial.totalDebt, detail.currency) },
                ].map((m) => (
                  <Card key={m.label}>
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                      <div className="text-base font-bold mt-0.5">{m.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" /> 技术指标
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                    {[
                      { label: "RSI(14)", value: detail.technical.rsi14?.toFixed(1) ?? "-",
                        color: detail.technical.rsi14 != null ? (detail.technical.rsi14 > 70 ? "text-green-600" : detail.technical.rsi14 < 30 ? "text-red-600" : "") : "" },
                      { label: "MA20", value: formatPrice(detail.technical.sma20, detail.currency), color: "" },
                      { label: "MA50", value: formatPrice(detail.technical.sma50, detail.currency), color: "" },
                      { label: "MA200", value: formatPrice(detail.technical.sma200, detail.currency), color: "" },
                      { label: "布林上轨", value: formatPrice(detail.technical.bollingerUpper, detail.currency), color: "" },
                      { label: "布林下轨", value: formatPrice(detail.technical.bollingerLower, detail.currency), color: "" },
                    ].map((m) => (
                      <div key={m.label} className="p-2 border rounded-lg">
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                        <div className={`text-sm font-bold mt-0.5 ${m.color}`}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 新闻 */}
            <TabsContent value="news" className="mt-4">
              <NewsPanel ticker={detail.ticker} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
