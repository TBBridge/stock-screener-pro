"use client";

import { useLanguageStore } from "@/app/store/languageStore";
import { StockData } from "@/app/types/stock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Users,
  Calendar,
} from "lucide-react";

interface StockDetailModalProps {
  stock: StockData | null;
  isOpen: boolean;
  onClose: () => void;
}

// 货币符号映射
const currencySymbols: Record<string, string> = {
  USD: "$",
  CNY: "¥",
  JPY: "¥",
  HKD: "HK$",
  GBP: "£",
  EUR: "€",
};

// 货币格式化
const formatCurrency = (value: number | null, currency: string): string => {
  if (value === null || value === undefined) return "-";
  const symbol = currencySymbols[currency] || "$";
  
  if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${symbol}${(value / 1e3).toFixed(2)}K`;
  return `${symbol}${value.toFixed(2)}`;
};

const formatNumber = (value: number | null, decimals: number = 2): string => {
  if (value === null || value === undefined) return "-";
  return value.toFixed(decimals);
};

const formatPercent = (value: number | null): string => {
  if (value === null || value === undefined) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

export default function StockDetailModal({ stock, isOpen, onClose }: StockDetailModalProps) {
  const { t, currentLanguage } = useLanguageStore();

  if (!stock) return null;

  const currency = stock.currency || "USD";
  const symbol = currencySymbols[currency] || "$";

  // 计算52周位置
  const week52Range = stock.valuation.week52High && stock.valuation.week52Low
    ? stock.valuation.week52High - stock.valuation.week52Low
    : 0;
  const week52Position = week52Range > 0 && stock.valuation.week52Low
    ? ((stock.valuation.price - stock.valuation.week52Low) / week52Range) * 100
    : 50;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-3">
                {stock.name}
                <Badge variant="outline">{stock.ticker}</Badge>
                <Badge variant="secondary">{stock.exchange}</Badge>
              </DialogTitle>
              <p className="text-muted-foreground mt-1">
                {stock.sector} {stock.industry && `· ${stock.industry}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {symbol}{formatNumber(stock.valuation.price)}
              </div>
              <div className={`text-sm ${stock.score.total >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                {t('score')}: <span className="font-bold text-lg">{stock.score.total}</span>/100
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('overview') || 'Overview'}</TabsTrigger>
            <TabsTrigger value="valuation">{t('valuation') || 'Valuation'}</TabsTrigger>
            <TabsTrigger value="financial">{t('financial') || 'Financial'}</TabsTrigger>
            <TabsTrigger value="technical">{t('technical') || 'Technical'}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Score Cards */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: t('value') || 'Value', score: stock.score.value },
                { label: t('growth') || 'Growth', score: stock.score.growth },
                { label: t('quality') || 'Quality', score: stock.score.quality },
                { label: t('technical') || 'Technical', score: stock.score.technical },
                { label: 'Alpha', score: stock.score.alpha },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                      {item.score}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                    <Progress 
                      value={item.score} 
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <BarChart3 className="h-4 w-4" />
                    {t('marketCap') || 'Market Cap'}
                  </div>
                  <div className="text-xl font-bold mt-1">
                    {formatCurrency(stock.valuation.marketCap, currency)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Activity className="h-4 w-4" />
                    {t('per') || 'PER'}
                  </div>
                  <div className="text-xl font-bold mt-1">
                    {formatNumber(stock.valuation.per)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <PieChart className="h-4 w-4" />
                    {t('pbr') || 'PBR'}
                  </div>
                  <div className="text-xl font-bold mt-1">
                    {formatNumber(stock.valuation.pbr)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <TrendingUp className="h-4 w-4" />
                    {t('dividendYield') || 'Div Yield'}
                  </div>
                  <div className="text-xl font-bold mt-1">
                    {formatPercent(stock.valuation.dividendYield)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analyst Forecast */}
            {stock.analyst.analystCount > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {t('analystForecast') || 'Analyst Forecast'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">{t('targetHigh') || 'High'}</div>
                      <div className="text-lg font-semibold text-green-600">
                        {symbol}{formatNumber(stock.analyst.targetHigh)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">{t('targetMean') || 'Mean'}</div>
                      <div className="text-lg font-semibold">
                        {symbol}{formatNumber(stock.analyst.targetMean)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">{t('targetLow') || 'Low'}</div>
                      <div className="text-lg font-semibold text-red-600">
                        {symbol}{formatNumber(stock.analyst.targetLow)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">{t('analystCount') || 'Analysts'}</div>
                      <div className="text-lg font-semibold flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" />
                        {stock.analyst.analystCount}
                      </div>
                    </div>
                  </div>
                  {stock.analyst.rating && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t('rating') || 'Rating'}</span>
                        <Badge 
                          variant={stock.analyst.rating === 'Buy' ? 'default' : stock.analyst.rating === 'Sell' ? 'destructive' : 'secondary'}
                        >
                          {stock.analyst.rating}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Valuation Tab */}
          <TabsContent value="valuation" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('valuationMetrics') || 'Valuation Metrics'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">{t('price') || 'Current Price'}</span>
                    <span className="font-bold text-lg">{symbol}{formatNumber(stock.valuation.price)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">{t('marketCap') || 'Market Cap'}</span>
                    <span className="font-bold">{formatCurrency(stock.valuation.marketCap, currency)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">PER</div>
                    <div className="text-2xl font-bold">{formatNumber(stock.valuation.per)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stock.valuation.per && stock.valuation.per < 15 ? 'Undervalued' : stock.valuation.per && stock.valuation.per > 30 ? 'Overvalued' : 'Fair'}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">PBR</div>
                    <div className="text-2xl font-bold">{formatNumber(stock.valuation.pbr)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stock.valuation.pbr && stock.valuation.pbr < 1 ? 'Undervalued' : stock.valuation.pbr && stock.valuation.pbr > 3 ? 'Overvalued' : 'Fair'}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{t('dividendYield') || 'Div Yield'}</div>
                    <div className="text-2xl font-bold">{formatPercent(stock.valuation.dividendYield)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Annual
                    </div>
                  </div>
                </div>

                {/* 52 Week Range */}
                <div className="pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{t('week52Low') || '52W Low'}</span>
                    <span className="font-medium">{t('week52Range') || '52 Week Range'}</span>
                    <span className="text-muted-foreground">{t('week52High') || '52W High'}</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, week52Position))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>{symbol}{formatNumber(stock.valuation.week52Low)}</span>
                    <span className="font-medium">{symbol}{formatNumber(stock.valuation.price)}</span>
                    <span>{symbol}{formatNumber(stock.valuation.week52High)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('financialStatements') || 'Financial Statements'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{t('revenue') || 'Revenue'}</div>
                    <div className="text-xl font-bold">{formatCurrency(stock.financial.revenue, currency)}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{t('netIncome') || 'Net Income'}</div>
                    <div className="text-xl font-bold">{formatCurrency(stock.financial.netIncome, currency)}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{t('totalAssets') || 'Total Assets'}</div>
                    <div className="text-xl font-bold">{formatCurrency(stock.financial.totalAssets, currency)}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{t('totalEquity') || 'Total Equity'}</div>
                    <div className="text-xl font-bold">{formatCurrency(stock.financial.totalEquity, currency)}</div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">ROE</div>
                    <div className="text-2xl font-bold">{formatPercent(stock.financial.roe)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stock.financial.roe && stock.financial.roe > 15 ? 'Strong' : stock.financial.roe && stock.financial.roe > 10 ? 'Good' : 'Weak'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{t('revenueGrowth') || 'Revenue Growth'}</div>
                    <div className={`text-2xl font-bold ${stock.financial.revenueGrowth && stock.financial.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(stock.financial.revenueGrowth)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">YoY</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{t('freeCashFlow') || 'Free Cash Flow'}</div>
                    <div className="text-2xl font-bold">{formatCurrency(stock.financial.freeCashFlow, currency)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Annual</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('technicalIndicators') || 'Technical Indicators'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">RSI (14)</div>
                    <div className={`text-2xl font-bold ${
                      stock.technical.rsi14 && stock.technical.rsi14 > 70 ? 'text-red-600' : 
                      stock.technical.rsi14 && stock.technical.rsi14 < 30 ? 'text-green-600' : ''
                    }`}>
                      {formatNumber(stock.technical.rsi14)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stock.technical.rsi14 && stock.technical.rsi14 > 70 ? 'Overbought' : 
                       stock.technical.rsi14 && stock.technical.rsi14 < 30 ? 'Oversold' : 'Neutral'}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">SMA 50</div>
                    <div className="text-2xl font-bold">{symbol}{formatNumber(stock.technical.sma50)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stock.technical.sma50 && stock.valuation.price > stock.technical.sma50 ? 'Above' : 'Below'}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">SMA 200</div>
                    <div className="text-2xl font-bold">{symbol}{formatNumber(stock.technical.sma200)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stock.technical.sma200 && stock.valuation.price > stock.technical.sma200 ? 'Above' : 'Below'}
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{t('trend') || 'Trend'}</div>
                    <div className="text-2xl font-bold">
                      {stock.technical.sma50 && stock.technical.sma200 && stock.technical.sma50 > stock.technical.sma200 ? 
                        <span className="text-green-600 flex items-center justify-center gap-1">
                          <TrendingUp className="h-5 w-5" /> Bull
                        </span> : 
                        <span className="text-red-600 flex items-center justify-center gap-1">
                          <TrendingDown className="h-5 w-5" /> Bear
                        </span>
                      }
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">SMA50 vs SMA200</div>
                  </div>
                </div>

                {/* Bollinger Bands */}
                <div className="pt-4">
                  <div className="text-sm font-medium mb-3">{t('bollingerBands') || 'Bollinger Bands'}</div>
                  <div className="relative h-16 bg-muted rounded-lg p-4">
                    <div className="flex justify-between items-center h-full">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Lower</div>
                        <div className="font-semibold">{symbol}{formatNumber(stock.technical.bollingerLower)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Price</div>
                        <div className="font-bold text-lg text-primary">{symbol}{formatNumber(stock.valuation.price)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Upper</div>
                        <div className="font-semibold">{symbol}{formatNumber(stock.technical.bollingerUpper)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
