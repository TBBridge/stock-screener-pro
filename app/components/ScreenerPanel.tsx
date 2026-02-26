"use client";

import { useState } from "react";
import { useStockStore } from "@/app/store/stockStore";
import { useLanguageStore } from "@/app/store/languageStore";
import { ScreenerEngine, ScreenerCriteria } from "@/app/types/stock";
import { presetScreeners, exchanges, sectors } from "@/app/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RotateCcw, Settings2 } from "lucide-react";

export default function ScreenerPanel() {
  const { selectedEngine, setSelectedEngine, customCriteria, setCustomCriteria, runScreener, isLoading } = useStockStore();
  const { t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<string>("preset");

  const engines: { id: ScreenerEngine; nameKey: string; descriptionKey: string }[] = [
    { id: "value", nameKey: "value", descriptionKey: "valueDesc" },
    { id: "pullback", nameKey: "pullback", descriptionKey: "pullbackDesc" },
    { id: "alpha", nameKey: "alpha", descriptionKey: "alphaDesc" },
    { id: "custom", nameKey: "custom", descriptionKey: "customDesc" },
  ];

  const handleEngineChange = (engineId: ScreenerEngine) => {
    setSelectedEngine(engineId);
    if (engineId !== "custom") {
      setActiveTab("preset");
    }
  };

  const handlePresetSelect = (presetName: string) => {
    const criteria = presetScreeners[presetName];
    if (criteria) {
      setCustomCriteria(criteria);
      setSelectedEngine("custom");
    }
  };

  const updateCriteria = (key: keyof ScreenerCriteria, value: any) => {
    setCustomCriteria({
      ...customCriteria,
      [key]: value,
    });
  };

  const toggleExchange = (exchange: string) => {
    const current = customCriteria.exchange || [];
    const updated = current.includes(exchange)
      ? current.filter((e) => e !== exchange)
      : [...current, exchange];
    updateCriteria("exchange", updated.length > 0 ? updated : undefined);
  };

  const toggleSector = (sector: string) => {
    const current = customCriteria.sector || [];
    const updated = current.includes(sector)
      ? current.filter((s) => s !== sector)
      : [...current, sector];
    updateCriteria("sector", updated.length > 0 ? updated : undefined);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          {t('stockScreener')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Engine Selection */}
        <div className="space-y-3">
          <Label>{t('screeningEngine')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {engines.map((engine) => (
              <Button
                key={engine.id}
                variant={selectedEngine === engine.id ? "default" : "outline"}
                className="justify-start h-auto min-h-[80px] py-3 px-4 whitespace-normal"
                onClick={() => handleEngineChange(engine.id)}
              >
                <div className="text-left">
                  <div className="font-medium">{t(engine.nameKey)}</div>
                  <div className="text-xs text-muted-foreground leading-tight mt-1">
                    {t(engine.descriptionKey)}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Criteria Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">{t('presets')}</TabsTrigger>
            <TabsTrigger value="custom">{t('customCriteria')}</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(presetScreeners).map(([name, criteria]) => (
                <Button
                  key={name}
                  variant="outline"
                  className="justify-between"
                  onClick={() => handlePresetSelect(name)}
                >
                  <span className="capitalize">{name.replace(/-/g, " ")}</span>
                  <Badge variant="secondary">
                    {Object.keys(criteria).length} filters
                  </Badge>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            {/* Exchange Filter */}
            <div className="space-y-2">
              <Label>{t('exchanges')}</Label>
              <div className="flex flex-wrap gap-2">
                {exchanges.map((exchange) => (
                  <Badge
                    key={exchange.code}
                    variant={
                      customCriteria.exchange?.includes(exchange.code)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleExchange(exchange.code)}
                  >
                    {exchange.code}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sector Filter */}
            <div className="space-y-2">
              <Label>{t('sectors')}</Label>
              <div className="flex flex-wrap gap-2">
                {sectors.map((sector) => (
                  <Badge
                    key={sector}
                    variant={
                      customCriteria.sector?.includes(sector)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleSector(sector)}
                  >
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Valuation Filters */}
            <div className="space-y-4">
              <Label>{t('valuation')}</Label>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('perMax')}</span>
                  <span>{customCriteria.perMax || "Any"}</span>
                </div>
                <Slider
                  value={[customCriteria.perMax || 50]}
                  min={5}
                  max={50}
                  step={1}
                  onValueChange={([v]) => updateCriteria("perMax", v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('pbrMax')}</span>
                  <span>{customCriteria.pbrMax || "Any"}</span>
                </div>
                <Slider
                  value={[customCriteria.pbrMax || 5]}
                  min={0.5}
                  max={5}
                  step={0.1}
                  onValueChange={([v]) => updateCriteria("pbrMax", v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('dividendYieldMin')} (%)</span>
                  <span>{customCriteria.dividendYieldMin || 0}%</span>
                </div>
                <Slider
                  value={[customCriteria.dividendYieldMin || 0]}
                  min={0}
                  max={10}
                  step={0.5}
                  onValueChange={([v]) => updateCriteria("dividendYieldMin", v)}
                />
              </div>
            </div>

            {/* Financial Filters */}
            <div className="space-y-4">
              <Label>{t('financialMetrics')}</Label>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('roeMin')} (%)</span>
                  <span>{customCriteria.roeMin || 0}%</span>
                </div>
                <Slider
                  value={[customCriteria.roeMin || 0]}
                  min={0}
                  max={30}
                  step={1}
                  onValueChange={([v]) => updateCriteria("roeMin", v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('revenueGrowthMin')} (%)</span>
                  <span>{customCriteria.revenueGrowthMin || 0}%</span>
                </div>
                <Slider
                  value={[customCriteria.revenueGrowthMin || 0]}
                  min={-20}
                  max={50}
                  step={5}
                  onValueChange={([v]) => updateCriteria("revenueGrowthMin", v)}
                />
              </div>
            </div>

            {/* Technical Filters */}
            <div className="space-y-4">
              <Label>{t('technicalIndicators')}</Label>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('rsiRange')}</span>
                  <span>
                    {customCriteria.rsiMin || 0} - {customCriteria.rsiMax || 100}
                  </span>
                </div>
                <Slider
                  value={[
                    customCriteria.rsiMin || 0,
                    customCriteria.rsiMax || 100,
                  ]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([min, max]) => {
                    updateCriteria("rsiMin", min > 0 ? min : undefined);
                    updateCriteria("rsiMax", max < 100 ? max : undefined);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="above-sma50">{t('aboveSMA50')}</Label>
                <Switch
                  id="above-sma50"
                  checked={customCriteria.aboveSMA50 || false}
                  onCheckedChange={(v) => updateCriteria("aboveSMA50", v || undefined)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="above-sma200">{t('aboveSMA200')}</Label>
                <Switch
                  id="above-sma200"
                  checked={customCriteria.aboveSMA200 || false}
                  onCheckedChange={(v) => updateCriteria("aboveSMA200", v || undefined)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            className="flex-1"
            onClick={runScreener}
            disabled={isLoading}
          >
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? t('loading') : t('runScreener')}
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
      </CardContent>
    </Card>
  );
}
