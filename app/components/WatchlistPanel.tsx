"use client";

// 关注股面板：搜索添加 / 实时行情 / 删除 / 查看详情
import { useEffect, useState, useCallback } from "react";
import { useWatchlistStore } from "@/app/store/watchlistStore";
import { getQuotes, searchStocks } from "@/app/lib/realStockApi";
import { Quote } from "@/app/types/market";
import { changeColorClass, formatPercent, formatPrice } from "@/app/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Search, Eye, Star, RefreshCw } from "lucide-react";
import RealStockDetailModal from "./RealStockDetailModal";
import { toast } from "sonner";

export default function WatchlistPanel() {
  const { items, add, remove, has } = useWatchlistStore();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ ticker: string; name: string; exchange: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [detailTicker, setDetailTicker] = useState<string | null>(null);

  const loadQuotes = useCallback(async (showToast = false) => {
    const tickers = items.map((i) => i.ticker);
    if (tickers.length === 0) {
      setQuotes({});
      return;
    }
    setLoading(true);
    try {
      const qs = await getQuotes(tickers);
      setQuotes(Object.fromEntries(qs.map((q) => [q.ticker, q])));
      if (showToast) toast.success("关注股行情已刷新");
    } catch {
      if (showToast) toast.error("行情刷新失败");
    } finally {
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    loadQuotes();
    const timer = setInterval(() => loadQuotes(), 60 * 1000);
    return () => clearInterval(timer);
  }, [loadQuotes]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const r = await searchStocks(q);
      setResults(r.slice(0, 8));
      if (r.length === 0) toast.info("未找到匹配的股票");
    } catch {
      toast.error("搜索失败");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = (item: { ticker: string; name: string; exchange: string }) => {
    if (has(item.ticker)) {
      toast.info(`${item.ticker} 已在关注列表中`);
      return;
    }
    add(item);
    toast.success(`已添加关注：${item.ticker}`);
    setResults([]);
    setQuery("");
  };

  return (
    <div className="space-y-4">
      {/* 添加关注 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            关注股票
            <Badge variant="secondary">{items.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="输入代码或名称，如：600519 / 茅台 / AAPL / 丰田"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              {searching ? "搜索中..." : "搜索添加"}
            </Button>
          </div>
          {results.length > 0 && (
            <div className="mt-3 border rounded-md divide-y max-h-56 overflow-auto">
              {results.map((r) => (
                <button
                  key={r.ticker}
                  onClick={() => handleAdd(r)}
                  className="w-full text-left px-4 py-2 hover:bg-muted flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-sm">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.ticker} · {r.exchange}</div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 关注列表行情 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">实时行情（60秒自动刷新）</CardTitle>
            <Button size="sm" variant="outline" onClick={() => loadQuotes(true)} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              还没有关注任何股票，搜索并添加你的第一只关注股吧
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>代码</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead className="text-right">现价</TableHead>
                    <TableHead className="text-right">涨跌</TableHead>
                    <TableHead className="text-right">52周区间</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const q = quotes[item.ticker];
                    return (
                      <TableRow
                        key={item.ticker}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setDetailTicker(item.ticker)}
                      >
                        <TableCell className="font-medium">
                          {item.ticker}
                          <Badge variant="outline" className="ml-2 text-[10px]">{item.exchange || q?.exchange}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">{q?.name || item.name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {q ? formatPrice(q.price, q.currency) : "加载中..."}
                        </TableCell>
                        <TableCell className={`text-right ${changeColorClass(q?.changePercent)}`}>
                          {q ? formatPercent(q.changePercent) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {q?.week52Low != null && q?.week52High != null
                            ? `${formatPrice(q.week52Low, q.currency).replace(/^(\D+)/, "$1")} ~ ${formatPrice(q.week52High, q.currency)}`
                            : "-"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDetailTicker(item.ticker)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => { remove(item.ticker); toast.success(`已取消关注 ${item.ticker}`); }}
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

      <RealStockDetailModal
        ticker={detailTicker}
        isOpen={!!detailTicker}
        onClose={() => setDetailTicker(null)}
      />
    </div>
  );
}
