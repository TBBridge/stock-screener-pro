"use client";

import { useState } from "react";
import { usePortfolioStore } from "@/app/store/portfolioStore";
import { useLanguageStore } from "@/app/store/languageStore";
import { searchStocks } from "@/app/lib/realStockApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface AddHoldingDialogProps {
  portfolioId: string;
}

export default function AddHoldingDialog({ portfolioId }: AddHoldingDialogProps) {
  const { t } = useLanguageStore();
  const { addHolding } = usePortfolioStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ ticker: string; name: string; exchange: string }>>([]);
  const [selectedStock, setSelectedStock] = useState<{ ticker: string; name: string } | null>(null);
  const [shares, setShares] = useState("");
  const [averageCost, setAverageCost] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchStocks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStock = (stock: { ticker: string; name: string }) => {
    setSelectedStock(stock);
    setSearchQuery(stock.name);
    setSearchResults([]);
  };

  const handleAdd = () => {
    if (!selectedStock || !shares || !averageCost) {
      toast.error(t('pleaseFillAllFields') || 'Please fill all fields');
      return;
    }

    addHolding(portfolioId, {
      ticker: selectedStock.ticker,
      shares: parseInt(shares),
      averageCost: parseFloat(averageCost),
    });

    toast.success(t('holdingAdded') || 'Holding added successfully');
    setIsOpen(false);
    setSelectedStock(null);
    setSearchQuery("");
    setShares("");
    setAverageCost("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('addHolding') || 'Add Holding'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addHolding') || 'Add Holding'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>{t('searchStock') || 'Search Stock'}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('searchByNameOrTicker') || 'Search by name or ticker'}
                className="pl-9"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => handleSelectStock(stock)}
                    className="w-full text-left px-4 py-2 hover:bg-muted border-b last:border-b-0"
                  >
                    <div className="font-medium">{stock.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {stock.ticker} · {stock.exchange}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {isSearching && (
              <div className="text-sm text-muted-foreground">
                {t('searching') || 'Searching...'}
              </div>
            )}
          </div>

          {selectedStock && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">{selectedStock.name}</div>
              <div className="text-sm text-muted-foreground">{selectedStock.ticker}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('shares') || 'Shares'}</Label>
              <Input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="100"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('averageCost') || 'Average Cost'}</Label>
              <Input
                type="number"
                value={averageCost}
                onChange={(e) => setAverageCost(e.target.value)}
                placeholder="150.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <Button onClick={handleAdd} className="w-full" disabled={!selectedStock || !shares || !averageCost}>
            {t('add') || 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
