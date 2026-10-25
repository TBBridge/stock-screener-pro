"use client";

// 我的持仓：真实行情驱动，含总览/买卖信号/健康检查/压力测试/再平衡
import { useState, useEffect, useCallback } from "react";
import { usePortfolioStore } from "@/app/store/portfolioStore";
import { getQuotes, getStockDetails } from "@/app/lib/realStockApi";
import { QuoteSummary } from "@/app/types/market";
import { performHealthCheck, runStressTest, generateRebalanceSuggestions, calculateExpectedReturns, StockDataMap } from "@/app/lib/portfolio";
import { generateTradeAdvice, SIGNAL_META } from "@/app/lib/tradeAdvice";
import { changeColorClass, formatPercent, formatPrice, formatMarketCap } from "@/app/lib/format";
import PortfolioManager from "./PortfolioManager";
import AddHoldingDialog from "./AddHoldingDialog";
import RealStockDetailModal from "./RealStockDetailModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import {
  AlertTriangle, CheckCircle, TrendingUp, Activity, Shield, RefreshCw, Trash2, Eye,
} from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function RealPortfolioPanel() {
  const { getActivePortfolio, removeHolding } = usePortfolioStore();
  const [stockDataMap, setStockDataMap] = useState<StockDataMap>({});
  const [quotes, setQuotes] = useState<Record<string, { price: number; currency: string; changePercent: number; name: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedScenario] = useState("triple-weak");
  const [detailTicker, setDetailTicker] = useState<string | null>(null);

  const portfolio = getActivePortfolio();
  const holdings = portfolio?.holdings || [];

  const loadStockData = useCallback(async (showToast = false) => {
    if (holdings.length === 0) {
      setStockDataMap({});
      setQuotes({});
      return;
    }
    setIsLoading(true);
    try {
      const tickers = holdings.map((h) => h.ticker);
      // 并行拉取报价 + 详情（详情有 60s 缓存）
      const [qs, details] = await Promise.all([
        getQuotes(tickers).catch(() => []),
        Promise.all(tickers.map((t) => getStockDetails(t).catch(() => null))),
      ]);

      const qMap: Record<string, { price: number; currency: string; changePercent: number; name: string }> = {};
      qs.forEach((q) => {
        qMap[q.ticker] = { price: q.price, currency: q.currency, changePercent: q.changePercent, name: q.name };
      });
      setQuotes(qMap);

      const dMap: StockDataMap = {};
      details.forEach((d) => {
        if (d) dMap[d.ticker] = d;
      });
      setStockDataMap(dMap);
      if (showToast) toast.success("持仓行情已刷新");
    } catch (error) {
      console.error("Failed to load stock data:", error);
      if (showToast) toast.error("行情加载失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings.map((h) => h.ticker).join(",")]);

  useEffect(() => {
    loadStockData();
    const interval = setInterval(() => loadStockData(), 60 * 1000);
    return () => clearInterval(interval);
  }, [loadStockData]);

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">请先选择或创建一个投资组合</p>
      </div>
    );
  }

  // 持仓明细（多币种分别计价，显示原币市值）
  const holdingsData = holdings.map((holding) => {
    const quote = quotes[holding.ticker];
    const stock = stockDataMap[holding.ticker];
    const currentPrice = quote?.price ?? stock?.price ?? holding.averageCost;
    const currency = quote?.currency ?? stock?.currency ?? "USD";
    const marketValue = holding.shares * currentPrice;
    const costBasis = holding.shares * holding.averageCost;
    const gainLoss = marketValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    return {
      ...holding,
      stock,
      currentPrice,
      currency,
      marketValue,
      costBasis,
      gainLoss,
      gainLossPercent,
      dayChangePercent: quote?.changePercent ?? null,
    };
  });

  const totalCost = holdingsData.reduce((sum, h) => sum + h.costBasis, 0);
  const totalGainLoss = holdingsData.reduce((sum, h) => sum + h.gainLoss, 0);
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // 行业配置（按原币市值占比）
  const sectorData = holdingsData.reduce((acc, h) => {
    const sector = h.stock?.sector || "未知行业";
    if (!acc[sector]) acc[sector] = 0;
    acc[sector] += h.marketValue;
    return acc;
  }, {} as Record<string, number>);
  const totalValue = Object.values(sectorData).reduce((a, b) => a + b, 0);
  const pieData = Object.entries(sectorData).map(([name, value]) => ({
    name,
    value,
    percent: totalValue > 0 ? value / totalValue : 0,
  }));

  const healthCheck = holdings.length > 0 ? performHealthCheck(portfolio, stockDataMap) : null;
  const stressResult = holdings.length > 0 ? runStressTest(portfolio, stockDataMap, selectedScenario) : null;
  const rebalanceSuggestions = holdings.length > 0 ? generateRebalanceSuggestions(portfolio, stockDataMap) : [];
  const expectedReturns = holdings.length > 0 ? calculateExpectedReturns(portfolio, stockDataMap) : null;

  return (
    <div className="space-y-6">
      <PortfolioManager />

      {/* 总览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">持仓总市值（原币合计）</div>
            <div className="text-2xl font-bold">
              {totalValue > 0 ? formatMarketCap(totalValue) : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{holdings.length} 只持仓</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">总盈亏</div>
            <div className={`text-2xl font-bold ${changeColorClass(totalGainLoss)}`}>
              {formatMarketCap(totalGainLoss)}
            </div>
            <div className={`text-sm ${changeColorClass(totalGainLossPercent)}`}>
              {formatPercent(totalGainLossPercent)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">健康状态</div>
            {healthCheck ? (
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${
                  healthCheck.overallHealth === "normal" ? "text-red-600" :
                  healthCheck.overallHealth === "warning" ? "text-yellow-600" : "text-green-600"
                }`}>
                  {healthCheck.overallHealth === "normal" ? "健康" :
                   healthCheck.overallHealth === "warning" ? "关注" : "预警"}
                </div>
                {healthCheck.overallHealth === "normal" ? <CheckCircle className="h-5 w-5 text-red-600" /> :
                 <AlertTriangle className={`h-5 w-5 ${healthCheck.overallHealth === "warning" ? "text-yellow-600" : "text-green-600"}`} />}
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">数据刷新</div>
            <Button variant="outline" size="sm" className="mt-1" onClick={() => loadStockData(true)} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "加载中..." : "立即刷新"}
            </Button>
            <div className="text-xs text-muted-foreground mt-1">每60秒自动刷新</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <AddHoldingDialog portfolioId={portfolio.id} />
      </div>

      {/* 持仓表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">持仓明细（点击行查看K线与买卖建议）</CardTitle>
        </CardHeader>
        <CardContent>
          {holdingsData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              还没有持仓，点击右上角"添加持仓"开始记录
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>代码</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead className="text-right">股数</TableHead>
                    <TableHead className="text-right">成本价</TableHead>
                    <TableHead className="text-right">现价</TableHead>
                    <TableHead className="text-right">市值</TableHead>
                    <TableHead className="text-right">盈亏</TableHead>
                    <TableHead className="text-center">操作信号</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdingsData.map((h) => {
                    const advice = h.stock ? generateTradeAdvice(h.stock, h.averageCost) : null;
                    return (
                      <TableRow
                        key={h.ticker}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => setDetailTicker(h.ticker)}
                      >
                        <TableCell className="font-medium">{h.ticker}</TableCell>
                        <TableCell className="max-w-[140px] truncate">{quotes[h.ticker]?.name || h.stock?.name || "-"}</TableCell>
                        <TableCell className="text-right">{h.shares}</TableCell>
                        <TableCell className="text-right">{formatPrice(h.averageCost, h.currency)}</TableCell>
                        <TableCell className={`text-right ${changeColorClass(h.dayChangePercent)}`}>
                          <div>{formatPrice(h.currentPrice, h.currency)}</div>
                          {h.dayChangePercent != null && (
                            <div className="text-xs">{formatPercent(h.dayChangePercent)}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMarketCap(h.marketValue, h.currency)}
                        </TableCell>
                        <TableCell className={`text-right ${changeColorClass(h.gainLoss)}`}>
                          <div>{formatMarketCap(h.gainLoss, h.currency)}</div>
                          <div className="text-xs">{formatPercent(h.gainLossPercent)}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          {advice ? (
                            <Badge variant={SIGNAL_META[advice.signal].badgeVariant} className="text-xs">
                              {SIGNAL_META[advice.signal].label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">加载中</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailTicker(h.ticker)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => { removeHolding(portfolio.id, h.ticker); toast.success(`已移除 ${h.ticker}`); }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分析 Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">预期收益</TabsTrigger>
          <TabsTrigger value="allocation">行业配置</TabsTrigger>
          <TabsTrigger value="health">健康检查</TabsTrigger>
          <TabsTrigger value="stress">压力测试</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {expectedReturns && (expectedReturns.base !== 0 || expectedReturns.optimistic !== 0) ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5" />
                  预期收益（12个月，基于分析师目标价）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg border border-red-200 bg-red-50">
                    <div className="text-sm text-muted-foreground">乐观</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatPercent(expectedReturns.optimistic)}
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="text-sm text-muted-foreground">基准</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPercent(expectedReturns.base)}
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-green-200 bg-green-50">
                    <div className="text-sm text-muted-foreground">悲观</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercent(expectedReturns.pessimistic)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              暂无足够数据计算预期收益（需要行情与分析师目标价）
            </div>
          )}

          {rebalanceSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5" />
                  再平衡建议（等权重目标）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rebalanceSuggestions.slice(0, 6).map((s) => (
                    <div key={s.ticker} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="min-w-0">
                        <span className="font-medium">{s.ticker}</span>
                        <span className="text-sm text-muted-foreground ml-2">{s.reason}</span>
                      </div>
                      <Badge variant={s.action === "buy" ? "default" : s.action === "sell" ? "destructive" : "secondary"}>
                        {s.action === "buy" ? "买入" : s.action === "sell" ? "卖出" : "持有"}
                        {s.shares > 0 && ` ${s.shares} 股`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="allocation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">行业配置</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatMarketCap(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">暂无配置数据</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5" />
                健康检查
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!healthCheck || healthCheck.alerts.length === 0 ? (
                <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
                  <CheckCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <div className="font-medium text-red-800">组合健康，未发现问题</div>
                    <div className="text-sm text-red-600">继续按计划持有</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {healthCheck.alerts.map((alert, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      alert.level === "danger" ? "bg-green-50 border-green-200" :
                      alert.level === "warning" ? "bg-yellow-50 border-yellow-200" :
                      "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-start gap-3">
                        {alert.level === "danger" ? <AlertTriangle className="h-5 w-5 text-green-600 mt-0.5" /> :
                         alert.level === "warning" ? <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" /> :
                         <CheckCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                        <div>
                          <div className="font-medium">{alert.ticker === "PORTFOLIO" ? "组合整体" : alert.ticker}</div>
                          <div className="text-sm">{alert.message}</div>
                          <div className="text-sm text-muted-foreground mt-1">建议：{alert.recommendation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {healthCheck && (
                <div className="mt-4 text-sm text-muted-foreground">
                  集中度 HHI：{(healthCheck.concentration.hhi * 10000).toFixed(0)} ·
                  前5大持仓占比：{(healthCheck.concentration.top5Weight * 100).toFixed(1)}%
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stress" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5" />
                压力测试（三重弱势情景）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stressResult ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">当前市值</div>
                      <div className="text-xl font-bold">{formatMarketCap(stressResult.portfolioValue)}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                      <div className="text-sm text-muted-foreground">压力情景市值</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatMarketCap(stressResult.stressedValue)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                      <div className="text-sm text-muted-foreground">潜在损失</div>
                      <div className="text-xl font-bold text-green-600">
                        -{formatMarketCap(stressResult.lossAmount)} ({stressResult.lossPercent.toFixed(2)}%)
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">相关性风险</div>
                      <div className="text-xl font-bold">{stressResult.correlationRisk}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    VaR(95%)：{formatMarketCap(stressResult.var95)} · VaR(99%)：{formatMarketCap(stressResult.var99)}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">请先添加持仓</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RealStockDetailModal
        ticker={detailTicker}
        isOpen={!!detailTicker}
        onClose={() => setDetailTicker(null)}
        holdingCost={detailTicker ? holdings.find((h) => h.ticker === detailTicker)?.averageCost : undefined}
      />
    </div>
  );
}
