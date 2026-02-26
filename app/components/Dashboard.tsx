"use client";

import { useEffect, useState } from "react";
import { useStockStore } from "@/app/store/stockStore";
import { useLanguageStore } from "@/app/store/languageStore";
import ScreenerPanel from "./ScreenerPanel";
import StockTable from "./StockTable";
import PortfolioPanel from "./PortfolioPanel";
import LanguageSwitcher from "./LanguageSwitcher";
import DocumentationPanel, { HelpButton } from "./DocumentationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Search, PieChart, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { initializeData, screenerResult, isLoading } = useStockStore();
  const { t } = useLanguageStore();
  const [isDocOpen, setIsDocOpen] = useState(false);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{t('appName')}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">{t('appSubtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <HelpButton onClick={() => setIsDocOpen(true)} />
              <LanguageSwitcher />
              <Badge variant="outline" className="hidden sm:inline-flex">
                Claude Code Skills
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
        <Tabs defaultValue="screener" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="screener" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t('stockScreener')}
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              {t('portfolio')}
            </TabsTrigger>
          </TabsList>

          {/* Screener Tab */}
          <TabsContent value="screener" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Screener Panel */}
              <div className="lg:col-span-1">
                <ScreenerPanel />
              </div>

              {/* Results */}
              <div className="lg:col-span-3 space-y-6">
                {/* Stats Cards */}
                {screenerResult && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">{t('results')}</div>
                        <div className="text-2xl font-bold">{screenerResult.totalCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">{t('score')}</div>
                        <div className="text-2xl font-bold">
                          {screenerResult.stocks.length > 0
                            ? Math.round(
                                screenerResult.stocks.reduce((sum, s) => sum + s.score.total, 0) /
                                  screenerResult.stocks.length
                              )
                            : 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">{t('sector')}</div>
                        <div className="text-lg font-bold truncate">
                          {screenerResult.stocks.length > 0
                            ? (() => {
                                const sectors = screenerResult.stocks.reduce((acc, s) => {
                                  if (s.sector) {
                                    acc[s.sector] = (acc[s.sector] || 0) + 1;
                                  }
                                  return acc;
                                }, {} as Record<string, number>);
                                return Object.entries(sectors).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
                              })()
                            : "N/A"}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground">{t('screeningEngine')}</div>
                        <div className="text-lg font-bold capitalize">
                          {t(screenerResult.engine)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Stock Table */}
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

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <PortfolioPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Documentation Panel */}
      <DocumentationPanel isOpen={isDocOpen} onClose={() => setIsDocOpen(false)} />
    </div>
  );
}
