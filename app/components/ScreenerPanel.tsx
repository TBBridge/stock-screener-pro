"use client";

import { useState } from "react";
import { useStockStore } from "@/app/store/stockStore";
import { ScreenerEngine } from "@/app/types/stock";
import { RealCriteria } from "@/app/lib/realScreenerTypes";
import { SCREENER_PRESETS } from "@/app/lib/screenerPresets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RotateCcw, Settings2 } from "lucide-react";

const MARKET_OPTIONS = [
  { code: "CN", label: "A股" },
  { code: "HK", label: "港股" },
  { code: "JP", label: "日股" },
  { code: "US", label: "美股" },
];

const ENGINES: { id: ScreenerEngine; name: string; desc: string }[] = [
  { id: "value", name: "价值投资", desc: "低市盈率/市净率的大市值股票" },
  { id: "pullback", name: "回调买入", desc: "上升趋势中RSI回落的买点" },
  { id: "alpha", name: "阿尔法策略", desc: "动量强势且趋势健康" },
  { id: "custom", name: "自定义", desc: "定义您自己的筛选条件" },
];

export default function ScreenerPanel() {
  const { selectedEngine, setSelectedEngine, customCriteria, setCustomCriteria, runScreener, isLoading, error, screenerMeta } = useStockStore();
  const [activeTab, setActiveTab] = useState<string>("preset");

  const crit = (customCriteria || {}) as RealCriteria;

  const handleEngineChange = (engineId: ScreenerEngine) => {
    setSelectedEngine(engineId);
    if (engineId !== "custom") setActiveTab("preset");
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = SCREENER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCustomCriteria(preset.criteria);
      setSelectedEngine("custom");
    }
  };

  const update = (patch: Partial<RealCriteria>) => {
    setCustomCriteria({ ...crit, ...patch });
  };

  const toggleMarket = (code: string) => {
    const current = crit.markets || [];
    const updated = current.includes(code) ? current.filter((m) => m !== code) : [...current, code];
    update({ markets: updated.length > 0 ? updated : undefined });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          股票筛选
          <Badge variant="secondary" className="ml-auto font-normal text-xs">
            真实行情
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 引擎选择 */}
        <div className="space-y-3">
          <Label>筛选引擎</Label>
          <div className="grid grid-cols-2 gap-2">
            {ENGINES.map((engine) => (
              <Button
                key={engine.id}
                variant={selectedEngine === engine.id ? "default" : "outline"}
                className="justify-start h-auto min-h-[64px] py-3 px-4 whitespace-normal"
                onClick={() => handleEngineChange(engine.id)}
              >
                <div className="text-left">
                  <div className="font-medium">{engine.name}</div>
                  <div className="text-xs text-muted-foreground leading-tight mt-1">{engine.desc}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">预设方案</TabsTrigger>
            <TabsTrigger value="custom">自定义条件</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-2 pt-2">
            {SCREENER_PRESETS.map((p) => (
              <Button key={p.id} variant="outline" className="w-full justify-between" onClick={() => handlePresetSelect(p.id)}>
                <span>{p.label}</span>
                <Badge variant="secondary">{Object.keys(p.criteria).length} 条件</Badge>
              </Button>
            ))}
          </TabsContent>

          <TabsContent value="custom" className="space-y-5 pt-2">
            {/* 市场 */}
            <div className="space-y-2">
              <Label>市场</Label>
              <div className="flex flex-wrap gap-2">
                {MARKET_OPTIONS.map((m) => (
                  <Badge
                    key={m.code}
                    variant={crit.markets?.includes(m.code) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMarket(m.code)}
                  >
                    {m.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 估值 */}
            <div className="space-y-4">
              <Label>估值</Label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>市盈率上限</span>
                  <span>{crit.perMax ?? "不限"}</span>
                </div>
                <Slider
                  value={[crit.perMax ?? 60]}
                  min={5}
                  max={60}
                  step={1}
                  onValueChange={([v]) => update({ perMax: v >= 60 ? undefined : v })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>市净率上限</span>
                  <span>{crit.pbrMax ?? "不限"}</span>
                </div>
                <Slider
                  value={[crit.pbrMax ?? 10]}
                  min={0.5}
                  max={10}
                  step={0.5}
                  onValueChange={([v]) => update({ pbrMax: v >= 10 ? undefined : v })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>市值下限（亿）</span>
                  <span>{crit.marketCapMinYi ?? "不限"}</span>
                </div>
                <Slider
                  value={[crit.marketCapMinYi ?? 0]}
                  min={0}
                  max={20000}
                  step={100}
                  onValueChange={([v]) => update({ marketCapMinYi: v > 0 ? v : undefined })}
                />
              </div>
            </div>

            {/* 技术 */}
            <div className="space-y-4">
              <Label>技术指标</Label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>RSI(14) 区间</span>
                  <span>
                    {crit.rsiMin ?? 0} - {crit.rsiMax ?? 100}
                  </span>
                </div>
                <Slider
                  value={[crit.rsiMin ?? 0, crit.rsiMax ?? 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([min, max]) =>
                    update({ rsiMin: min > 0 ? min : undefined, rsiMax: max < 100 ? max : undefined })
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>20日涨幅下限 (%)</span>
                  <span>{crit.momentumMin ?? "不限"}</span>
                </div>
                <Slider
                  value={[crit.momentumMin ?? -30]}
                  min={-30}
                  max={30}
                  step={1}
                  onValueChange={([v]) => update({ momentumMin: v > -30 ? v : undefined })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="above-sma50">站上50日均线</Label>
                <Switch
                  id="above-sma50"
                  checked={crit.aboveSMA50 || false}
                  onCheckedChange={(v) => update({ aboveSMA50: v || undefined })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="above-sma200">站上200日均线</Label>
                <Switch
                  id="above-sma200"
                  checked={crit.aboveSMA200 || false}
                  onCheckedChange={(v) => update({ aboveSMA200: v || undefined })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>距52周低点位置 ≤</span>
                  <span>{crit.week52PosMax !== undefined ? `${Math.round(crit.week52PosMax * 100)}%` : "不限"}</span>
                </div>
                <Slider
                  value={[crit.week52PosMax !== undefined ? Math.round(crit.week52PosMax * 100) : 100]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={([v]) => update({ week52PosMax: v < 100 ? v / 100 : undefined })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 操作 */}
        <div className="flex gap-2 pt-4 border-t">
          <Button className="flex-1" onClick={() => runScreener()} disabled={isLoading}>
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? "筛选中…" : "运行筛选"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCustomCriteria({});
              setSelectedEngine("value");
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">筛选出错：{error}</p>}
        {screenerMeta && !isLoading && (
          <p className="text-xs text-muted-foreground">
            扫描 {screenerMeta.universeSize} 只标的，成功获取 {screenerMeta.fetched} 只
            {Object.keys(screenerMeta.sources).length > 0 &&
              `（${Object.entries(screenerMeta.sources).map(([k, v]) => `${k} ${v}`).join(" / ")}）`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
