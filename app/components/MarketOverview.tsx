"use client";

// 全球指数总览：实时行情卡片 + 自动刷新 + 点击查看指数K线
import { useEffect, useState, useCallback } from "react";
import { IndexQuote, getMarketIndices, getChartData, ChartData } from "@/app/lib/realStockApi";
import { changeColorClass, formatPercent } from "@/app/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import { toast } from "sonner";

// 迷你走势线
function Sparkline({ values, up }: { values: number[]; up: boolean }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 120;
  const H = 32;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(" ");
  return (
    <svg width={W} height={H} className="opacity-80">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "#dc2626" : "#16a34a"}
        strokeWidth={1.5}
      />
    </svg>
  );
}

export default function MarketOverview() {
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [chartTicker, setChartTicker] = useState<IndexQuote | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  const load = useCallback(async (showToast = false) => {
    try {
      const data = await getMarketIndices();
      setIndices(data);
      setLastUpdated(new Date());
      if (showToast) toast.success("行情已刷新");
    } catch (e) {
      console.error("Failed to load market indices:", e);
      if (showToast) toast.error("行情加载失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(), 60 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  const openChart = async (idx: IndexQuote) => {
    setChartTicker(idx);
    setChartData(null);
    setChartLoading(true);
    try {
      const range = idx.market === "US" ? "1y" : "6mo";
      const data = await getChartData(idx.ticker, range, "1d");
      setChartData(data);
    } catch {
      toast.error("K线数据加载失败");
    } finally {
      setChartLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">全球市场动态</h2>
          <p className="text-xs text-muted-foreground">
            {lastUpdated
              ? `更新于 ${lastUpdated.toLocaleTimeString("zh-CN")} · 每60秒自动刷新`
              : "正在获取实时行情..."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); load(true); }} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {loading && indices.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : indices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂时无法获取行情数据，请点击刷新重试
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {indices.map((idx) => {
            const up = idx.changePercent >= 0;
            return (
              <Card
                key={idx.ticker}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => openChart(idx)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium">{idx.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {idx.ticker} · {idx.exchange}
                      </div>
                    </div>
                    {up ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className={`text-xl font-bold mt-2 ${changeColorClass(idx.changePercent)}`}>
                    {idx.price.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-sm ${changeColorClass(idx.changePercent)}`}>
                    {up ? "+" : ""}{idx.change.toFixed(2)} ({formatPercent(idx.changePercent)})
                  </div>
                  <div className="mt-1 flex justify-end">
                    {idx.spark && <Sparkline values={idx.spark} up={up} />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 指数 K 线弹窗 */}
      <Dialog open={!!chartTicker} onOpenChange={(open) => !open && setChartTicker(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {chartTicker?.label}（{chartTicker?.ticker}）日K线
            </DialogTitle>
          </DialogHeader>
          {chartLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : chartData ? (
            <CandlestickChart
              candles={chartData.candles}
              currency={chartData.currency}
              height={380}
            />
          ) : (
            <div className="py-12 text-center text-muted-foreground">暂无数据</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
