import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Portfolio, PortfolioHolding } from '@/app/types/stock';

interface PortfolioState {
  portfolios: Portfolio[];
  activePortfolioId: string | null;
  
  // 操作
  addPortfolio: (name: string) => void;
  deletePortfolio: (id: string) => void;
  setActivePortfolio: (id: string) => void;
  addHolding: (portfolioId: string, holding: Omit<PortfolioHolding, 'purchaseDate'>) => void;
  updateHolding: (portfolioId: string, ticker: string, updates: Partial<PortfolioHolding>) => void;
  removeHolding: (portfolioId: string, ticker: string) => void;
  getActivePortfolio: () => Portfolio | null;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      portfolios: [
        {
          id: 'default',
          name: 'My Portfolio',
          holdings: [
            { ticker: 'AAPL', shares: 100, averageCost: 150, purchaseDate: new Date('2024-01-15') },
            { ticker: 'MSFT', shares: 50, averageCost: 380, purchaseDate: new Date('2024-02-01') },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      activePortfolioId: 'default',

      addPortfolio: (name: string) => {
        const newPortfolio: Portfolio = {
          id: `portfolio-${Date.now()}`,
          name,
          holdings: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          portfolios: [...state.portfolios, newPortfolio],
          activePortfolioId: newPortfolio.id,
        }));
      },

      deletePortfolio: (id: string) => {
        set((state) => {
          const newPortfolios = state.portfolios.filter((p) => p.id !== id);
          return {
            portfolios: newPortfolios,
            activePortfolioId: 
              state.activePortfolioId === id 
                ? (newPortfolios[0]?.id || null)
                : state.activePortfolioId,
          };
        });
      },

      setActivePortfolio: (id: string) => {
        set({ activePortfolioId: id });
      },

      addHolding: (portfolioId: string, holding: Omit<PortfolioHolding, 'purchaseDate'>) => {
        set((state) => ({
          portfolios: state.portfolios.map((portfolio) => {
            if (portfolio.id !== portfolioId) return portfolio;
            
            const existingIndex = portfolio.holdings.findIndex(
              (h) => h.ticker === holding.ticker
            );
            
            if (existingIndex >= 0) {
              // 更新现有持仓
              const existing = portfolio.holdings[existingIndex];
              const totalShares = existing.shares + holding.shares;
              const totalCost = existing.shares * existing.averageCost + holding.shares * holding.averageCost;
              const newAverageCost = totalCost / totalShares;
              
              const newHoldings = [...portfolio.holdings];
              newHoldings[existingIndex] = {
                ...existing,
                shares: totalShares,
                averageCost: newAverageCost,
              };
              
              return {
                ...portfolio,
                holdings: newHoldings,
                updatedAt: new Date(),
              };
            }
            
            // 添加新持仓
            return {
              ...portfolio,
              holdings: [
                ...portfolio.holdings,
                { ...holding, purchaseDate: new Date() },
              ],
              updatedAt: new Date(),
            };
          }),
        }));
      },

      updateHolding: (portfolioId: string, ticker: string, updates: Partial<PortfolioHolding>) => {
        set((state) => ({
          portfolios: state.portfolios.map((portfolio) => {
            if (portfolio.id !== portfolioId) return portfolio;
            
            return {
              ...portfolio,
              holdings: portfolio.holdings.map((holding) =>
                holding.ticker === ticker ? { ...holding, ...updates } : holding
              ),
              updatedAt: new Date(),
            };
          }),
        }));
      },

      removeHolding: (portfolioId: string, ticker: string) => {
        set((state) => ({
          portfolios: state.portfolios.map((portfolio) => {
            if (portfolio.id !== portfolioId) return portfolio;
            
            return {
              ...portfolio,
              holdings: portfolio.holdings.filter((h) => h.ticker !== ticker),
              updatedAt: new Date(),
            };
          }),
        }));
      },

      getActivePortfolio: () => {
        const { portfolios, activePortfolioId } = get();
        return portfolios.find((p) => p.id === activePortfolioId) || portfolios[0] || null;
      },
    }),
    {
      name: 'portfolio-storage',
    }
  )
);
