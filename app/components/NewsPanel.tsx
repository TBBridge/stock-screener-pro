"use client";

// 市场新闻面板：支持市场要闻与个股新闻，含利好/利空影响判断
import { useEffect, useState, useCallback } from "react";
import { getStockNews } from "@/app/lib/realStockApi";
import { NewsItem } from "@/app/types/market";
import { formatDateTime } from "@/app/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Newspaper, ThumbsUp, ThumbsDown, MinusCircle, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const IMPACT_META = {
  positive: { label: "利好", className: "bg-red-50 text-red-700 border-red-200", icon: ThumbsUp },
  negative: { label: "利空", className: "bg-green-50 text-green-700 border-green-200", icon: ThumbsDown },
  neutral: { label: "中性", className: "bg-muted text-muted-foreground border-border", icon: MinusCircle },
} as const;

export default function NewsPanel({ ticker }: { ticker?: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeTicker, setActiveTicker] = useState<string | undefined>(ticker);

  useEffect(() => setActiveTicker(ticker), [ticker]);

  const load = useCallback(async (t?: string, showToast = false) => {
    setLoading(true);
    try {
      const data = await getStockNews(t, 20);
      setNews(data);
      if (showToast && data.length === 0) toast("暂无新闻数据");
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTicker);
  }, [activeTicker, load]);

  const handleQuerySearch = () => {
    const q = query.trim();
    if (!q) return;
    setActiveTicker(q);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            {activeTicker ? `${activeTicker} 相关新闻` : "市场要闻"}
            <span className="text-xs font-normal text-muted-foreground">（含股价影响判断）</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 w-44 pl-8 text-sm"
                placeholder="输入代码查个股新闻"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuerySearch()}
              />
            </div>
            <Button size="sm" variant="outline" onClick={handleQuerySearch}>查询</Button>
            {activeTicker && (
              <Button size="sm" variant="ghost" onClick={() => { setQuery(""); setActiveTicker(undefined); }}>
                市场要闻
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => load(activeTicker, true)} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : news.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">暂无新闻数据</div>
        ) : (
          <div className="space-y-2">
            {news.map((item) => {
              const meta = IMPACT_META[item.impact];
              const Icon = meta.icon;
              return (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm leading-snug flex items-start gap-2">
                        <span className="truncate-none">{item.title}</span>
                        <ExternalLink className="h-3 w-3 mt-1 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
                        <span>{item.publisher}</span>
                        <span>·</span>
                        <span>{formatDateTime(item.publishedAt)}</span>
                        {item.relatedTickers.slice(0, 3).map((tk) => (
                          <Badge key={tk} variant="outline" className="text-[10px] px-1 py-0">
                            {tk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 gap-1 ${meta.className}`}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    影响判断：{item.reason}
                  </div>
                </a>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-3">
          免责声明：新闻影响判断基于关键词规则，仅供参考，不构成投资建议。
        </p>
      </CardContent>
    </Card>
  );
}
