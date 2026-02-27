"use client";

import { useState, useEffect } from "react";
import { usePortfolioStore } from "@/app/store/portfolioStore";
import { useLanguageStore } from "@/app/store/languageStore";
import { getStockDetails, getMultipleStocks } from "@/app/lib/realStockApi";
import { performHealthCheck, runStressTest, generateRebalanceSuggestions, calculateExpectedReturns } from "@/app/lib/portfolio";
import { StockData } from "@/app/types/stock";
import PortfolioManager from "./PortfolioManager";
import AddHoldingDialog from "./AddHoldingDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

// 货币符号映射
const currencySymbols: Record<string, string> = {
  USD: "$",
  CNY: "¥",
  JPY: "¥",
  HKD: "HK$",
  GBP: "£",
  EUR: "€",
};

export default function RealPortfolioPanel() {
  const { t } = useLanguageStore();
  const { portfolios, activePortfolioId, getActivePortfolio, removeHolding, updateHolding } = usePortfolioStore();
  const [stockDataMap, setStockDataMap] = useState<Record<string, StockData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedScenario, setSelectedScenario] = useState("triple-weak");

  const portfolio = getActivePortfolio();

  // 加载持仓股票数据
  useEffect(() => {
    if (!portfolio) return;
    
    const loadStockData = async () => {
      setIsLoading(true);
      try {
        const tickers = portfolio.holdings.map((h) => h.ticker);
        if (tickers.length === 0) {
          setStockDataMap({});
          return;
        }
        
        const stocks = await getMultipleStocks(tickers);
        const newDataMap: Record<string, StockData> = {};
        stocks.forEach((stock) => {
          newDataMap[stock.ticker] = stock;
        });
        setStockDataMap(newDataMap);
      } catch (error) {
        console.error('Failed to load stock data:', error);
        toast.error(t('failedToLoadData') || 'Failed to load stock data');
      } finally {
        setIsLoading(false);
      }
    };

    loadStockData();
    // 每60秒刷新一次数据
    const interval = setInterval(loadStockData, 60000);
    return () => clearInterval(interval);
  }, [portfolio, t]);

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('noPortfolio') || 'No portfolio selected'}</p>
      </div>
    );
  }

  // 计算持仓数据
  const holdingsData = portfolio.holdings.map((holding) => {
    const stock = stockDataMap[holding.ticker];
    const currentPrice = stock?.valuation.price || holding.averageCost;
    const marketValue = holding.shares * currentPrice;
    const costBasis = holding.shares * holding.averageCost;
    const gainLoss = marketValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    
    return {
      ...holding,
      stock,
      currentPrice,
      marketValue,
      costBasis,
      gainLoss,
      gainLossPercent,
      currency: stock?.currency || 'USD',
    };
  });

  const totalValue = holdingsData.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdingsData.reduce((sum, h) => sum + h.costBasis, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // 计算行业配置
  const sectorData = holdingsData.reduce((acc, holding) => {
    const sector = holding.stock?.sector || 'Unknown';
    if (!acc[sector]) acc[sector] = 0;
    acc[sector] += holding.marketValue;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(sectorData).map(([name, value]) => ({
    name,
    value,
    percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }));

  // 健康检查
  const healthCheck = performHealthCheck(portfolio, stockDataMap);

  // 压力测试
  const stressResult = runStressTest(portfolio, stockDataMap, selectedScenario);

  // 再平衡建议
  const rebalanceSuggestions = generateRebalanceSuggestions(portfolio, stockDataMap);

  // 预期收益
  const expectedReturns = calculateExpectedReturns(portfolio, stockDataMap);

  const formatCurrency = (value: number, currency: string = 'USD') => {
    const symbol = currencySymbols[currency] || '$';
    if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${symbol}${(value / 1e3).toFixed(2)}K`;
    return `${symbol}${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Manager */}
      <PortfolioManager />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">{t('totalValue') || 'Total Value'}</div>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">{t('totalReturn') || 'Total Return'}</div>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
            </div>
            <div className={`text-sm ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">{t('holdings') || 'Holdings'}</div>
            <div className="text-2xl font-bold">{portfolio.holdings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">{t('healthScore') || 'Health Score'}</div>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${
                healthCheck.overallHealth === 'normal' ? 'text-green-600' :
                healthCheck.overallHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {healthCheck.overallHealth === 'normal' ? 'Good' :
                 healthCheck.overallHealth === 'warning' ? 'Fair' : 'Poor'}
              </div>
              {healthCheck.overallHealth === 'normal' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
               healthCheck.overallHealth === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-600" /> :
               <AlertTriangle className="h-5 w-5 text-red-600" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Holding Button */}
      <div className="flex justify-end">
        <AddHoldingDialog portfolioId={portfolio.id} />
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('holdings') || 'Holdings'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : holdingsData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noHoldings') || 'No holdings yet. Add your first stock!'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ticker') || 'Ticker'}</TableHead>
                  <TableHead>{t('name') || 'Name'}</TableHead>
                  <TableHead className="text-right">{t('shares') || 'Shares'}</TableHead>
                  <TableHead className="text-right">{t('avgCost') || 'Avg Cost'}</TableHead>
                  <TableHead className="text-right">{t('currentPrice') || 'Price'}</TableHead>
                  <TableHead className="text-right">{t('marketValue') || 'Value'}</TableHead>
                  <TableHead className="text-right">{t('gainLoss') || 'Gain/Loss'}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdingsData.map((holding) => (
                  <TableRow key={holding.ticker}>
                    <TableCell className="font-medium">{holding.ticker}</TableCell>
                    <TableCell>{holding.stock?.name || holding.ticker}</TableCell>
                    <TableCell className="text-right">{holding.shares}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(holding.averageCost, holding.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(holding.currentPrice, holding.currency)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(holding.marketValue, holding.currency)}
                    </TableCell>
                    <TableCell className={`text-right ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <div>{holding.gainLoss >= 0 ? '+' : ''}{formatCurrency(holding.gainLoss, holding.currency)}</div>
                      <div className="text-xs">({holding.gainLossPercent >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%)</div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHolding(portfolio.id, holding.ticker)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('overview') || 'Overview'}</TabsTrigger>
          <TabsTrigger value="allocation">{t('allocation') || 'Allocation'}</TabsTrigger>
          <TabsTrigger value="health">{t('health') || 'Health'}</TabsTrigger>
          <TabsTrigger value="stress">{t('stressTest') || 'Stress Test'}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {expectedReturns.base !== 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('expectedReturns') || 'Expected Returns (12M)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">{t('optimistic') || 'Optimistic'}</div>
                    <div className="text-2xl font-bold text-green-600">
                      +{expectedReturns.optimistic.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">{t('baseCase') || 'Base Case'}</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {expectedReturns.base >= 0 ? '+' : ''}{expectedReturns.base.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">{t('pessimistic') || 'Pessimistic'}</div>
                    <div className="text-2xl font-bold text-red-600">
                      {expectedReturns.pessimistic.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {rebalanceSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t('rebalanceSuggestions') || 'Rebalance Suggestions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rebalanceSuggestions.slice(0, 5).map((suggestion) => (
                    <div key={suggestion.ticker} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <span className="font-medium">{suggestion.ticker}</span>
                        <span className="text-sm text-muted-foreground ml-2">{suggestion.reason}</span>
                      </div>
                      <Badge variant={suggestion.action === 'buy' ? 'default' : suggestion.action === 'sell' ? 'destructive' : 'secondary'}>
                        {suggestion.action === 'buy' ? t('buy') : suggestion.action === 'sell' ? t('sell') : t('hold')}
                        {suggestion.shares > 0 && ` ${suggestion.shares} ${t('shares')}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation">
          <Card>
            <CardHeader>
              <CardTitle>{t('sectorAllocation') || 'Sector Allocation'}</CardTitle>
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
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('noData') || 'No allocation data available'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('healthCheck') || 'Health Check'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthCheck.alerts.length === 0 ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">{t('portfolioHealthy') || 'Portfolio is healthy'}</div>
                    <div className="text-sm text-green-600">{t('noIssues') || 'No issues detected'}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {healthCheck.alerts.map((alert, index) => (
                    <div key={index} className={`p-4 rounded-lg ${
                      alert.level === 'danger' ? 'bg-red-50 border border-red-200' :
                      alert.level === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        {alert.level === 'danger' ? <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" /> :
                         alert.level === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" /> :
                         <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                        <div>
                          <div className="font-medium">{alert.ticker}</div>
                          <div className="text-sm">{alert.message}</div>
                          <div className="text-sm text-muted-foreground mt-1">{t('recommendation') || 'Recommendation'}: {alert.recommendation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stress Test Tab */}
        <TabsContent value="stress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t('stressTest') || 'Stress Test'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">{t('currentValue') || 'Current Value'}</div>
                  <div className="text-xl font-bold">{formatCurrency(stressResult.portfolioValue)}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">{t('stressedValue') || 'Stressed Value'}</div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(stressResult.stressedValue)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-muted-foreground">{t('potentialLoss') || 'Potential Loss'}</div>
                  <div className="text-xl font-bold text-red-600">
                    -{formatCurrency(stressResult.lossAmount)} ({stressResult.lossPercent.toFixed(2)}%)
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">{t('correlationRisk') || 'Correlation Risk'}</div>
                  <div className="text-xl font-bold">{stressResult.correlationRisk}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
