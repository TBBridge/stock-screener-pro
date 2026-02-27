"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/app/store/portfolioStore";
import { useLanguageStore } from "@/app/store/languageStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

export default function PortfolioManager() {
  const { portfolios, activePortfolioId, addPortfolio, deletePortfolio, setActivePortfolio } = usePortfolioStore();
  const { t } = useLanguageStore();
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddPortfolio = () => {
    if (newPortfolioName.trim()) {
      addPortfolio(newPortfolioName.trim());
      setNewPortfolioName("");
      setIsDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {t('portfolioManagement') || 'Portfolio Management'}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                {t('newPortfolio') || 'New'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createPortfolio') || 'Create New Portfolio'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t('portfolioName') || 'Portfolio Name'}</Label>
                  <Input
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    placeholder={t('enterPortfolioName') || 'Enter portfolio name'}
                  />
                </div>
                <Button onClick={handleAddPortfolio} className="w-full">
                  {t('create') || 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('selectPortfolio') || 'Select Portfolio'}</Label>
            <Select value={activePortfolioId || ''} onValueChange={setActivePortfolio}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectPortfolio') || 'Select a portfolio'} />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name} ({portfolio.holdings.length} {t('holdings') || 'holdings'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {portfolios.length > 1 && (
            <div className="pt-2">
              <Label className="text-sm text-muted-foreground">
                {t('allPortfolios') || 'All Portfolios'}
              </Label>
              <div className="mt-2 space-y-2">
                {portfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      portfolio.id === activePortfolioId ? 'bg-muted border-primary' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium">{portfolio.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {portfolio.holdings.length} {t('holdings') || 'holdings'}
                      </div>
                    </div>
                    {portfolio.id !== 'default' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePortfolio(portfolio.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
