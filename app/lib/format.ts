// 共享格式化工具 —— 中国股市习惯：红涨绿跌

export const currencySymbols: Record<string, string> = {
  USD: "$",
  CNY: "¥",
  JPY: "¥",
  HKD: "HK$",
  GBP: "£",
  EUR: "€",
  TWD: "NT$",
  KRW: "₩",
};

export function currencySymbol(currency?: string | null): string {
  return currencySymbols[currency || ""] || "$";
}

export function formatPrice(value: number | null | undefined, currency?: string | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const symbol = currencySymbol(currency);
  const abs = Math.abs(value);
  // 日股价格大，不缩写
  if (currency === "JPY") return `${symbol}${value.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}`;
  return `${symbol}${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMarketCap(value: number | null | undefined, currency?: string | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const symbol = currencySymbol(currency);
  if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}万亿`;
  if (value >= 1e8) return `${symbol}${(value / 1e8).toFixed(1)}亿`;
  if (value >= 1e4) return `${symbol}${(value / 1e4).toFixed(1)}万`;
  return `${symbol}${value.toFixed(0)}`;
}

export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

// 中国习惯：涨=红，跌=绿
export function changeColorClass(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (value > 0) return "text-red-600";
  if (value < 0) return "text-green-600";
  return "text-muted-foreground";
}

export function formatDateTime(ts: number | null | undefined): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
