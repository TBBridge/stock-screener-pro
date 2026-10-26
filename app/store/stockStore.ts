import { create } from 'zustand';
import { ScreenerCriteria, ScreenerResult, ScreenerEngine } from '@/app/types/stock';

interface StockState {
  screenerResult: ScreenerResult | null;
  screenerMeta: {
    snapshotSize: number;
    prefiltered: number;
    klineFetched: number;
    klineBudget: number;
    fallbackUniverse: boolean;
    sources: Record<string, number>;
  } | null;
  selectedEngine: ScreenerEngine;
  customCriteria: ScreenerCriteria;
  isLoading: boolean;
  error: string | null;
  loadScreener: () => Promise<void>;
  setSelectedEngine: (engine: ScreenerEngine) => void;
  setCustomCriteria: (criteria: ScreenerCriteria) => void;
  runScreener: () => Promise<void>;
}

function buildQuery(engine: ScreenerEngine, criteria: ScreenerCriteria): string {
  const params = new URLSearchParams({ engine });
  if (engine === 'custom' && Object.keys(criteria).length > 0) {
    params.set('criteria', JSON.stringify(criteria));
  }
  return params.toString();
}

export const useStockStore = create<StockState>((set, get) => ({
  screenerResult: null,
  screenerMeta: null,
  selectedEngine: 'value',
  customCriteria: {},
  isLoading: false,
  error: null,

  loadScreener: async () => {
    const { selectedEngine, customCriteria } = get();
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/screener?${buildQuery(selectedEngine, customCriteria)}`);
      if (!res.ok) throw new Error(`筛选服务返回 ${res.status}`);
      const data = await res.json();
      set({
        screenerResult: {
          engine: data.engine,
          criteria: data.criteria || {},
          stocks: data.stocks || [],
          totalCount: data.totalCount || 0,
          executedAt: new Date(data.executedAt || Date.now()),
        },
        screenerMeta: {
          snapshotSize: data.stats?.snapshotSize ?? 0,
          prefiltered: data.stats?.prefiltered ?? 0,
          klineFetched: data.stats?.klineFetched ?? 0,
          klineBudget: data.stats?.klineBudget ?? 0,
          fallbackUniverse: data.stats?.fallbackUniverse ?? false,
          sources: data.stats?.sources ?? {},
        },
        isLoading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : '筛选失败',
        isLoading: false,
      });
    }
  },

  setSelectedEngine: (engine) => {
    set({ selectedEngine: engine });
    get().loadScreener();
  },

  setCustomCriteria: (criteria) => {
    set({ customCriteria: criteria });
    if (get().selectedEngine === 'custom') {
      get().loadScreener();
    }
  },

  runScreener: async () => {
    await get().loadScreener();
  },
}));
