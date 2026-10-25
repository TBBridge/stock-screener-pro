import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistItem {
  ticker: string;
  name: string;
  exchange: string;
  addedAt: number;
}

interface WatchlistState {
  items: WatchlistItem[];
  add: (item: Omit<WatchlistItem, 'addedAt'>) => void;
  remove: (ticker: string) => void;
  has: (ticker: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item) => {
        if (get().has(item.ticker)) return;
        set((state) => ({
          items: [...state.items, { ...item, addedAt: Date.now() }],
        }));
      },

      remove: (ticker) => {
        set((state) => ({ items: state.items.filter((i) => i.ticker !== ticker) }));
      },

      has: (ticker) => get().items.some((i) => i.ticker === ticker),
    }),
    { name: 'watchlist-storage' }
  )
);
