"use client";

// 手写 SVG 蜡烛图 —— 中国习惯红涨绿跌，含 MA5/MA20、成交量、hover 十字线
import { useMemo, useState } from "react";
import { Candle } from "@/app/types/market";

interface CandlestickChartProps {
  candles: Candle[];
  height?: number;
  currency?: string;
  showVolume?: boolean;
  title?: string;
}

function smaSeries(candles: Candle[], period: number): (number | null)[] {
  return candles.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].c;
    return sum / period;
  });
}

export default function CandlestickChart({
  candles,
  height = 360,
  currency = "",
  showVolume = true,
  title,
}: CandlestickChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const layout = useMemo(() => {
    if (candles.length === 0) return null;
    const W = 1000;
    const padL = 8;
    const padR = 64;
    const priceTop = 28;
    const priceH = showVolume ? Math.round(height * 0.68) : height - 46;
    const volTop = priceTop + priceH + 18;
    const volH = showVolume ? Math.round(height * 0.16) : 0;
    const dateY = showVolume ? volTop + volH + 16 : priceTop + priceH + 16;

    const plotW = W - padL - padR;
    const lows = candles.map((c) => c.l);
    const highs = candles.map((c) => c.h);
    let min = Math.min(...lows);
    let max = Math.max(...highs);
    const pad = (max - min) * 0.06 || max * 0.02 || 1;
    min -= pad;
    max += pad;

    const x = (i: number) => padL + ((i + 0.5) / candles.length) * plotW;
    const cw = Math.max(1.5, (plotW / candles.length) * 0.62);
    const y = (p: number) => priceTop + (1 - (p - min) / (max - min)) * priceH;

    const maxVol = Math.max(...candles.map((c) => c.v), 1);
    const vy = (v: number) => volTop + (1 - v / maxVol) * volH;

    const ma5 = smaSeries(candles, 5);
    const ma20 = smaSeries(candles, 20);

    const linePath = (series: (number | null)[]) => {
      let d = "";
      let started = false;
      series.forEach((v, i) => {
        if (v == null) return;
        d += started ? ` L ${x(i)} ${y(v)}` : ` M ${x(i)} ${y(v)}`;
        started = true;
      });
      return d;
    };

    // y 轴刻度 5 档
    const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);

    // 日期刻度 6 档
    const dateTicks = Array.from({ length: 6 }, (_, i) =>
      Math.round((i * (candles.length - 1)) / 5)
    );

    return {
      W, padL, padR, priceTop, priceH, volTop, volH, dateY,
      min, max, x, cw, y, vy, ma5, ma20, linePath, ticks, dateTicks, plotW,
    };
  }, [candles, height, showVolume]);

  if (!layout) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        暂无K线数据
      </div>
    );
  }

  const fmtPrice = (p: number) =>
    currency === "JPY" ? p.toLocaleString("ja-JP", { maximumFractionDigits: 1 }) : p.toFixed(2);
  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });

  const hover = hoverIdx != null ? candles[hoverIdx] : null;
  const prev = hoverIdx != null && hoverIdx > 0 ? candles[hoverIdx - 1] : null;
  const hoverUp = hover && prev ? hover.c >= prev.c : true;

  return (
    <div className="relative select-none" onMouseLeave={() => setHoverIdx(null)}>
      {title && <div className="text-sm font-medium mb-1">{title}</div>}
      <svg
        viewBox={`0 0 ${layout.W} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const relX = ((e.clientX - rect.left) / rect.width) * layout.W;
          const idx = Math.floor(((relX - layout.padL) / layout.plotW) * candles.length);
          setHoverIdx(idx >= 0 && idx < candles.length ? idx : null);
        }}
      >
        {/* 价格网格 */}
        {layout.ticks.map((p, i) => (
          <g key={i}>
            <line
              x1={layout.padL}
              x2={layout.W - layout.padR}
              y1={layout.y(p)}
              y2={layout.y(p)}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
            <text
              x={layout.W - layout.padR + 6}
              y={layout.y(p) + 4}
              fontSize={11}
              fill="currentColor"
              fillOpacity={0.55}
            >
              {fmtPrice(p)}
            </text>
          </g>
        ))}

        {/* 蜡烛 */}
        {candles.map((c, i) => {
          const prevClose = i > 0 ? candles[i - 1].c : c.o;
          const up = c.c >= prevClose;
          const color = up ? "#dc2626" : "#16a34a"; // 红涨绿跌
          const bodyTop = layout.y(Math.max(c.o, c.c));
          const bodyBottom = layout.y(Math.min(c.o, c.c));
          return (
            <g key={i} opacity={hoverIdx == null || hoverIdx === i ? 1 : 0.85}>
              <line x1={layout.x(i)} x2={layout.x(i)} y1={layout.y(c.h)} y2={layout.y(c.l)} stroke={color} strokeWidth={1} />
              <rect
                x={layout.x(i) - layout.cw / 2}
                y={bodyTop}
                width={layout.cw}
                height={Math.max(1, bodyBottom - bodyTop)}
                fill={up ? color : color}
                opacity={up ? 0.95 : 0.95}
                stroke={color}
                strokeWidth={0.5}
              />
            </g>
          );
        })}

        {/* MA 线 */}
        <path d={layout.linePath(layout.ma5)} fill="none" stroke="#f59e0b" strokeWidth={1.4} />
        <path d={layout.linePath(layout.ma20)} fill="none" stroke="#3b82f6" strokeWidth={1.4} />

        {/* 成交量 */}
        {showVolume &&
          candles.map((c, i) => {
            const prevClose = i > 0 ? candles[i - 1].c : c.o;
            const up = c.c >= prevClose;
            return (
              <rect
                key={`v${i}`}
                x={layout.x(i) - layout.cw / 2}
                y={layout.vy(c.v)}
                width={layout.cw}
                height={Math.max(0.5, layout.volTop + layout.volH - layout.vy(c.v))}
                fill={up ? "#dc2626" : "#16a34a"}
                opacity={0.55}
              />
            );
          })}

        {/* 日期轴 */}
        {layout.dateTicks.map((idx, i) => (
          <text
            key={`d${i}`}
            x={layout.x(idx)}
            y={layout.dateY}
            fontSize={11}
            fill="currentColor"
            fillOpacity={0.55}
            textAnchor={i === 0 ? "start" : i === 5 ? "end" : "middle"}
          >
            {fmtDate(candles[idx].t)}
          </text>
        ))}

        {/* 十字线 */}
        {hoverIdx != null && (
          <g pointerEvents="none">
            <line
              x1={layout.x(hoverIdx)}
              x2={layout.x(hoverIdx)}
              y1={layout.priceTop}
              y2={showVolume ? layout.volTop + layout.volH : layout.priceTop + layout.priceH}
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeDasharray="3 3"
            />
          </g>
        )}
      </svg>

      {/* 图例 + tooltip */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber-500" />MA5</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-blue-500" />MA20</span>
        {hover && (
          <span className="flex flex-wrap gap-x-3 font-medium text-foreground">
            <span>{fmtDate(hover.t)}</span>
            <span>开 {fmtPrice(hover.o)}</span>
            <span>高 {fmtPrice(hover.h)}</span>
            <span>低 {fmtPrice(hover.l)}</span>
            <span className={hoverUp ? "text-red-600" : "text-green-600"}>
              收 {fmtPrice(hover.c)} ({prev ? ((hover.c - prev.c) / prev.c * 100).toFixed(2) : "0.00"}%)
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
