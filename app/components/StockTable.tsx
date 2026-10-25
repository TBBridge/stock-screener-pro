"use client";

import { useState } from "react";
import { useStockStore } from "@/app/store/stockStore";
import { useLanguageStore } from "@/app/store/languageStore";
import { useWatchlistStore } from "@/app/store/watchlistStore";
import { StockData } from "@/app/types/stock";
import RealStockDetailModal from "./RealStockDetailModal";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  MoreHorizontal,
  Eye,
  Plus,
} from "lucide-react";

// 货币符号映射
const currencySymbols: Record<string, string> = {
  USD: "$",
  CNY: "¥",
  JPY: "¥",
  HKD: "HK$",
  GBP: "£",
  EUR: "€",
};

// 真实筛选结果里 sector 存的是市场代码
const marketLabels: Record<string, string> = {
  CN: "A股", HK: "港股", JP: "日股", US: "美股",
};
const marketLabel = (s: string | undefined) => (s && marketLabels[s]) || s || "-";

type SortField = keyof StockData | "score.total" | "valuation.per" | "valuation.pbr" | "valuation.price" | "financial.roe";
type SortDirection = "asc" | "desc";

interface StockTableProps {
  stocks?: StockData[];
  showActions?: boolean;
}

export default function StockTable({ stocks: propStocks, showActions = true }: StockTableProps) {
  const { screenerResult, isLoading } = useStockStore();
  const { t } = useLanguageStore();
  const watchlistAdd = useWatchlistStore((s) => s.add);
  const watchlistHas = useWatchlistStore((s) => s.has);
  const [sortField, setSortField] = useState<SortField>("score.total");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const stocks = propStocks || screenerResult?.stocks || [];

  // 排序逻辑
  const getSortValue = (stock: StockData, field: SortField): number | string => {
    switch (field) {
      case "score.total":
        return stock.score.total;
      case "valuation.per":
        return stock.valuation.per ?? Infinity;
      case "valuation.pbr":
        return stock.valuation.pbr ?? Infinity;
      case "financial.roe":
        return stock.financial.roe ?? -Infinity;
      case "valuation.price":
        return stock.valuation.price;
      case "ticker":
        return stock.ticker;
      case "name":
        return stock.name;
      default:
        return stock.ticker;
    }
  };

  const sortedStocks = [...stocks]
    .filter(
      (stock) =>
        stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = getSortValue(a, sortField);
      const bVal = getSortValue(b, sortField);
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      const aNum = typeof aVal === "number" ? aVal : 0;
      const bNum = typeof bVal === "number" ? bVal : 0;
      
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const formatNumber = (value: number | null, decimals: number = 2): string => {
    if (value === null || value === undefined) return "-";
    return value.toFixed(decimals);
  };

  const formatPercent = (value: number | null): string => {
    if (value === null || value === undefined) return "-";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number | null, currency: string = "USD"): string => {
    if (value === null || value === undefined) return "-";
    const symbol = currencySymbols[currency] || "$";
    if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
    return `${symbol}${value.toFixed(2)}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleStockClick = (stock: StockData) => {
    setSelectedTicker(stock.ticker);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedStocks.length} {t('results')}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("score.total")}
                  className="h-8"
                >
                  {t('score')}
                  {getSortIcon("score.total")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("ticker")}
                  className="h-8"
                >
                  {t('ticker')}
                  {getSortIcon("ticker")}
                </Button>
              </TableHead>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('sector')}</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("valuation.price")}
                  className="h-8"
                >
                  {t('price')}
                  {getSortIcon("valuation.price")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("valuation.per")}
                  className="h-8"
                >
                  {t('per')}
                  {getSortIcon("valuation.per")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("valuation.pbr")}
                  className="h-8"
                >
                  {t('pbr')}
                  {getSortIcon("valuation.pbr")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("financial.roe")}
                  className="h-8"
                >
                  {t('roe')}
                  {getSortIcon("financial.roe")}
                </Button>
              </TableHead>
              <TableHead className="text-right">{t('dividendYield')}</TableHead>
              <TableHead className="text-right">{t('marketCap')}</TableHead>
              {showActions && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStocks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 11 : 10}
                  className="text-center h-32 text-muted-foreground"
                >
                  {t('noResults')}
                </TableCell>
              </TableRow>
            ) : (
              sortedStocks.map((stock) => (
                <TableRow 
                  key={stock.ticker} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleStockClick(stock)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getScoreColor(
                          stock.score.total
                        )}`}
                      >
                        {stock.score.total}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {stock.ticker}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {stock.exchange}
                    </Badge>
                  </TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {marketLabel(stock.sector)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(stock.valuation.price, stock.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(stock.valuation.per)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(stock.valuation.pbr)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(stock.financial.roe)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(stock.valuation.dividendYield)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(stock.valuation.marketCap, stock.currency)}
                  </TableCell>
                  {showActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStockClick(stock)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (watchlistHas(stock.ticker)) {
                                toast.info(`${stock.ticker} 已在关注列表中`);
                                return;
                              }
                              watchlistAdd({ ticker: stock.ticker, name: stock.name, exchange: stock.exchange });
                              toast.success(`已添加关注：${stock.ticker}（在"关注股票"页查看实时行情）`);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            加入关注
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info(`请在"我的持仓"页通过"添加持仓"录入 ${stock.ticker} 的成本与股数`)}>
                            <Plus className="h-4 w-4 mr-2" />
                            加入持仓
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stock Detail Modal（真实行情：K线 + 买卖建议 + 新闻） */}
      <RealStockDetailModal
        ticker={selectedTicker}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
