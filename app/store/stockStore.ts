import { create } from 'zustand';
import { StockData, ScreenerCriteria, ScreenerResult, ScreenerEngine, Portfolio } from '@/app/types/stock';
import { generateMockStocks, generateAShareStocks, generateJapaneseStocks, generateMockPortfolio } from '@/app/lib/mockData';
import { updateStockScores, runScreener } from '@/app/lib/screener';

interface StockState {
  // 数据
  stocks: StockData[];
  portfolio: Portfolio;
  
  // 筛选状态
  selectedEngine: ScreenerEngine;
  customCriteria: ScreenerCriteria;
  screenerResult: ScreenerResult | null;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // 动作
  initializeData: () => void;
  setSelectedEngine: (engine: ScreenerEngine) => void;
  setCustomCriteria: (criteria: ScreenerCriteria) => void;
  runScreener: () => void;
  updatePortfolio: (portfolio: Portfolio) => void;
  refreshData: () => void;
}

export const useStockStore = create<StockState>((set, get) => ({
  // 初始状态
  stocks: [],
  portfolio: generateMockPortfolio(),
  selectedEngine: 'value',
  customCriteria: {},
  screenerResult: null,
  isLoading: false,
  error: null,
  
  // 初始化数据
  initializeData: () => {
    // 生成美股/港股/欧股数据
    const mockStocks = generateMockStocks(70);
    // 生成A股数据
    const aShareStocks = generateAShareStocks(25);
    // 生成日股数据
    const japaneseStocks = generateJapaneseStocks(25);
    // 合并数据
    const allStocks = [...mockStocks, ...aShareStocks, ...japaneseStocks];
    const scoredStocks = updateStockScores(allStocks);
    
    // 默认使用 value 引擎运行筛选
    const result = runScreener('value', scoredStocks);
    
    set({ 
      stocks: scoredStocks,
      portfolio: generateMockPortfolio(),
      screenerResult: result,
    });
  },
  
  // 设置筛选引擎
  setSelectedEngine: (engine) => {
    set({ selectedEngine: engine });
    get().runScreener();
  },
  
  // 设置自定义筛选条件
  setCustomCriteria: (criteria) => {
    set({ customCriteria: criteria });
    if (get().selectedEngine === 'custom') {
      get().runScreener();
    }
  },
  
  // 运行筛选
  runScreener: () => {
    const { stocks, selectedEngine, customCriteria } = get();
    
    set({ isLoading: true, error: null });
    
    try {
      const result = runScreener(
        selectedEngine,
        stocks,
        selectedEngine === 'custom' ? customCriteria : undefined
      );
      
      set({ 
        screenerResult: result,
        isLoading: false,
      });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
  
  // 更新投资组合
  updatePortfolio: (portfolio) => {
    set({ portfolio });
  },
  
  // 刷新数据
  refreshData: () => {
    set({ isLoading: true });
    
    // 模拟API调用延迟
    setTimeout(() => {
      const mockStocks = generateMockStocks(70);
      const aShareStocks = generateAShareStocks(25);
      const japaneseStocks = generateJapaneseStocks(25);
      const allStocks = [...mockStocks, ...aShareStocks, ...japaneseStocks];
      const scoredStocks = updateStockScores(allStocks);
      
      set({ 
        stocks: scoredStocks,
        isLoading: false,
      });
      
      get().runScreener();
    }, 1000);
  },
}));
