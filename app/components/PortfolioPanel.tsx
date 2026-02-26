"use client";

import { useState } from "react";
import { useStockStore } from "@/app/store/stockStore";
import { useLanguageStore } from "@/app/store/languageStore";
import { performHealthCheck, runStressTest, generateRebalanceSuggestions, calculateExpectedReturns } from "@/app/lib/portfolio";
import { generateMockStocks } from "@/app/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  RefreshCw,
} from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function PortfolioPanel() {
  const { portfolio, stocks } = useStockStore();
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedScenario, setSelectedScenario] = useState("triple-weak");

  // 生成股票数据映射
  const stockDataMap = Object.fromEntries(stocks.map((s) => [s.ticker, s]));

  // 如果没有足够数据，生成模拟数据
  const mockStocks = generateMockStocks(20);
  const mockDataMap = Object.fromEntries(mockStocks.map((s) => [s.ticker, s]));

  // 合并数据
  const mergedDataMap = { ...mockDataMap, ...stockDataMap };

  // 健康检查
  const healthCheck = performHealthCheck(portfolio, mergedDataMap);

  // 压力测试
  const stressResult = runStressTest(portfolio, mergedDataMap, selectedScenario);

  // 再平衡建议
  const rebalanceSuggestions = generateRebalanceSuggestions(portfolio, mergedDataMap);

  // 预期收益
  const expectedReturns = calculateExpectedReturns(portfolio, mergedDataMap);

  // 计算持仓数据
  const holdingsData = portfolio.holdings.map((holding) => {
    const stock = mergedDataMap[holding.ticker];
    const currentPrice = stock?.valuation.price || holding.averageCost;
    const currentValue = holding.shares * currentPrice;
    const costBasis = holding.shares * holding.averageCost;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = (gainLoss / costBasis) * 100;

    return {
      ticker: holding.ticker,
      name: stock?.name || holding.ticker,
      sector: stock?.sector || "Unknown",
      shares: holding.shares,
      avgCost: holding.averageCost,
      currentPrice,
      currentValue,
      gainLoss,
      gainLossPercent,
    };
  });

  const totalValue = holdingsData.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = holdingsData.reduce((sum, h) => sum + h.shares * h.avgCost, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = (totalGainLoss / totalCost) * 100;

  // 行业分布数据
  const sectorData = holdingsData.reduce((acc, holding) => {
    const existing = acc.find((item) => item.name === holding.sector);
    if (existing) {
      existing.value += holding.currentValue;
    } else {
      acc.push({ name: holding.sector, value: holding.currentValue });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // 压力测试图表数据
  const stressChartData = [
    { name: t('baseCase'), value: stressResult.portfolioValue },
    { name: t('stressTest'), value: stressResult.stressedValue },
  ];

  const getHealthColor = (level: string) => {
    switch (level) {
      case "normal":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "danger":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">{t('totalValue')}</div>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">{t('totalReturn')}</div>
            <div
              className={`text-2xl font-bold ${
                totalGainLoss >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {totalGainLoss >= 0 ? "+" : ""}${totalGainLoss.toLocaleString()}
            </div>
            <div
              className={`text-sm ${
                totalGainLossPercent >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {totalGainLossPercent >= 0 ? "+" : ""}
              {totalGainLossPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">{t('holdings')}</div>
            <div className="text-2xl font-bold">{portfolio.holdings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">{t('healthScore')}</div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${getHealthColor(healthCheck.overallHealth)}`} />
              <span className="text-2xl font-bold capitalize">{t(healthCheck.overallHealth)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {healthCheck.alerts.length} {t('alerts')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('sectorAllocation')}</TabsTrigger>
          <TabsTrigger value="health">{t('healthCheck')}</TabsTrigger>
          <TabsTrigger value="stress">{t('stressTest')}</TabsTrigger>
          <TabsTrigger value="rebalance">{t('rebalance')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sector Allocation */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sectorAllocation')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expected Returns */}
            <Card>
              <CardHeader>
                <CardTitle>{t('expectedReturns')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">{t('optimistic')}</span>
                    <span className="font-bold">+{expectedReturns.optimistic.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(100, expectedReturns.optimistic)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">{t('baseCase')}</span>
                    <span className="font-bold">{expectedReturns.base >= 0 ? "+" : ""}
                      {expectedReturns.base.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(100, Math.abs(expectedReturns.base))} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">{t('pessimistic')}</span>
                    <span className="font-bold">{expectedReturns.pessimistic.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(100, Math.abs(expectedReturns.pessimistic))} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Holdings Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('holdings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{t('ticker')}</th>
                      <th className="text-left py-2">{t('sector')}</th>
                      <th className="text-right py-2">{t('shares')}</th>
                      <th className="text-right py-2">Avg Cost</th>
                      <th className="text-right py-2">{t('price')}</th>
                      <th className="text-right py-2">Value</th>
                      <th className="text-right py-2">Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdingsData.map((holding) => (
                      <tr key={holding.ticker} className="border-b">
                        <td className="py-2 font-medium">{holding.ticker}</td>
                        <td className="py-2">
                          <Badge variant="outline">{holding.sector}</Badge>
                        </td>
                        <td className="py-2 text-right">{holding.shares}</td>
                        <td className="py-2 text-right">${holding.avgCost.toFixed(2)}</td>
                        <td className="py-2 text-right">${holding.currentPrice.toFixed(2)}</td>
                        <td className="py-2 text-right">${holding.currentValue.toLocaleString()}</td>
                        <td
                          className={`py-2 text-right ${
                            holding.gainLoss >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {holding.gainLoss >= 0 ? "+" : ""}
                          {holding.gainLossPercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Check Tab */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('healthCheck')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthCheck.alerts.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Portfolio is healthy! No alerts detected.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {healthCheck.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        alert.level === "danger"
                          ? "bg-red-50 border-red-200"
                          : alert.level === "warning"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`h-5 w-5 mt-0.5 ${
                            alert.level === "danger"
                              ? "text-red-600"
                              : alert.level === "warning"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                alert.level === "danger"
                                  ? "destructive"
                                  : alert.level === "warning"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {t(alert.level)}
                            </Badge>
                            <span className="font-medium">
                              {alert.ticker === "PORTFOLIO" ? "Portfolio" : alert.ticker}
                            </span>
                            <Badge variant="outline">{alert.category}</Badge>
                          </div>
                          <p className="mt-1 text-sm">{alert.message}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {t('recommendation')}: {alert.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">{t('concentration')} (HHI)</div>
                  <div className="text-xl font-bold">{(healthCheck.concentration.hhi * 10000).toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">
                    {healthCheck.concentration.hhi > 0.25 ? t('concentrationRisk') : t('diversified')}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Top 5 Weight</div>
                  <div className="text-xl font-bold">
                    {(healthCheck.concentration.top5Weight * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {healthCheck.concentration.top5Weight > 0.7 ? t('concentrationRisk') : t('diversified')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stress Test Tab */}
        <TabsContent value="stress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('stressTest')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: "triple-weak", name: "Triple Weakness" },
                  { id: "tech-crash", name: "Tech Crash" },
                  { id: "rate-hike", name: "Rate Hikes" },
                  { id: "recession", name: "Recession" },
                ].map((scenario) => (
                  <Button
                    key={scenario.id}
                    variant={selectedScenario === scenario.id ? "default" : "outline"}
                    onClick={() => setSelectedScenario(scenario.id)}
                    className="h-auto py-3"
                  >
                    {scenario.name}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stressChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm text-red-600">{t('potentialLoss')}</div>
                    <div className="text-2xl font-bold text-red-600">
                      -${stressResult.lossAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600">
                      {stressResult.lossPercent.toFixed(2)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-muted-foreground">VaR (95%)</div>
                      <div className="font-bold">${stressResult.var95.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-muted-foreground">VaR (99%)</div>
                      <div className="font-bold">${stressResult.var99.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-muted-foreground">{t('correlationRisk')}</div>
                    <Badge
                      variant={
                        stressResult.correlationRisk === "High"
                          ? "destructive"
                          : stressResult.correlationRisk === "Medium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {stressResult.correlationRisk}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rebalance Tab */}
        <TabsContent value="rebalance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                {t('rebalanceSuggestions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">{t('ticker')}</th>
                      <th className="text-left py-2">{t('action')}</th>
                      <th className="text-right py-2">{t('shares')}</th>
                      <th className="text-left py-2">{t('reason')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rebalanceSuggestions.map((suggestion, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{suggestion.ticker}</td>
                        <td className="py-2">
                          <Badge
                            variant={
                              suggestion.action === "buy"
                                ? "default"
                                : suggestion.action === "sell"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {suggestion.action === "buy" && (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            )}
                            {suggestion.action === "sell" && (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {t(suggestion.action)}
                          </Badge>
                        </td>
                        <td className="py-2 text-right">
                          {suggestion.shares > 0 ? suggestion.shares : "-"}
                        </td>
                        <td className="py-2 text-sm text-muted-foreground">
                          {suggestion.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
