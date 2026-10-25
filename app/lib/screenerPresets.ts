// 筛选预设（客户端/服务端共用，避免客户端引入服务端依赖）
import { RealCriteria } from '@/app/lib/realScreenerTypes';

export interface ScreenerPreset {
  id: string;
  label: string;
  criteria: RealCriteria;
}

export const SCREENER_PRESETS: ScreenerPreset[] = [
  { id: 'blue-chip-value', label: '大盘蓝筹·低估值', criteria: { perMax: 20, pbrMax: 3, marketCapMinYi: 2000 } },
  { id: 'deep-value', label: '深度价值', criteria: { perMax: 12, pbrMax: 1.2 } },
  { id: 'growth-momentum', label: '成长动量', criteria: { momentumMin: 3, aboveSMA50: true, rsiMax: 75 } },
  { id: 'pullback-buy', label: '回调买入', criteria: { rsiMin: 25, rsiMax: 50, aboveSMA200: true } },
  { id: 'oversold', label: '超跌低吸', criteria: { week52PosMax: 0.35, rsiMax: 45 } },
  { id: 'mega-cap', label: '巨头权重', criteria: { marketCapMinYi: 10000 } },
];
