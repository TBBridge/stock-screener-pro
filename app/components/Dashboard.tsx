"use client";

import { useEffect, useState } from "react";
import { useStockStore } from "@/app/store/stockStore";
import { useLanguageStore } from "@/app/store/languageStore";
import ScreenerPanel from "./ScreenerPanel";
import StockTable from "./StockTable";
import RealPortfolioPanel from "./RealPortfolioPanel";
import MarketOverview from "./MarketOverview";
import WatchlistPanel from "./WatchlistPanel";
import NewsPanel from "./NewsPanel";
import LanguageSwitcher from "./LanguageSwitcher";
import DocumentationPanel, { HelpButton } from "./DocumentationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Search, PieChart, TrendingUp, Star, Globe2, Newspaper } from "lucide-react";

export default function Dashboard() {
  const { loadScreener, screenerResult, isLoading } = useStockStore();
  const { t } = useLanguageStore();
  const [isDocOpen, setIsDocOpen] = useState(false);

  useEffect(() => {
    loadScreener();
  }, [loadScreener]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">多市场股票分析仪表盘</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  A股 · 港股 · 日股 · 美股 | K线 · 买卖判断 · 新闻影响 · 实时行情
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <HelpButton onClick={() => setIsDocOpen(true)} />
              <LanguageSwitcher />
              <Badge variant="outline" className="hidden sm:inline-flex">
                Real-time
              </Badge>
              <div className="text-sm text-muted-foreground hidden md:block">
                {screenerResult ? `${screenerResult.totalCount} ${t('results')}` : t('loading')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="market" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="market" className="flex items-center gap-1.5">
              <Globe2 className="h-4 w-4" />
              <span className="hidden sm:inline">市场行情</span>
            </TabsTrigger>
            <TabsTrigger value="screener" className="flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">智能筛选</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-1.5">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">我的持仓</span>
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex items-center gap-1.5">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">关注股票</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-1.5">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">市场新闻</span>
            </TabsTrigger>
          </TabsList>

          {/* 市场行情 */}
          <TabsContent value="market" className="space-y-6">
            <MarketOverview />
            <NewsPanel />
          </TabsContent>

          {/* 智能筛选 */}
          <TabsContent value="screener" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <ScreenerPanel />
              </div>
              <div className="lg:col-span-3 space-y-6">
                {screenerResult && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="筛选结果" value={String(screenerResult.totalCount)} />
                    <StatCard
                      label="平均评分"
                      value={
                        screenerResult.stocks.length > 0
                          ? String(
                              Math.round(
                                screenerResult.stocks.reduce((sum, s) => sum + s.score.total, 0) /
                                  screenerResult.stocks.length
                              )
                            )
                          : "0"
                      }
                    />
                    <StatCard
                      label="主要市场"
                      value={
                        screenerResult.stocks.length > 0
                          ? Object.entries(
                              screenerResult.stocks.reduce((acc, s) => {
                                const mk = (s.sector && ({ CN: "A股", HK: "港股", JP: "日股", US: "美股" } as Record<string, string>)[s.sector]) || s.sector;
                                if (mk) acc[mk] = (acc[mk] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
                          : "N/A"
                      }
                    />
                    <StatCard label="筛选引擎" value={t(screenerResult.engine)} />
                  </div>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {t('results')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StockTable />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* 我的持仓 */}
          <TabsContent value="portfolio">
            <RealPortfolioPanel />
          </TabsContent>

          {/* 关注股票 */}
          <TabsContent value="watchlist">
            <WatchlistPanel />
          </TabsContent>

          {/* 市场新闻 */}
          <TabsContent value="news">
            <NewsPanel />
          </TabsContent>
        </Tabs>
      </main>

      <DocumentationPanel isOpen={isDocOpen} onClose={() => setIsDocOpen(false)} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold truncate">{value}</div>
      </CardContent>
    </Card>
  );
}
