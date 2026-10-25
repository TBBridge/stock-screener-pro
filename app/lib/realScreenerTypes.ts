// 真实筛选条件类型（客户端/服务端共用）
export interface RealCriteria {
  markets?: string[];        // ['CN','HK','JP','US']
  perMax?: number;
  perMin?: number;
  pbrMax?: number;
  marketCapMinYi?: number;   // 市值下限（亿，本币）
  rsiMin?: number;
  rsiMax?: number;
  aboveSMA50?: boolean;
  aboveSMA200?: boolean;
  momentumMin?: number;      // 20日涨幅下限 (%)
  week52PosMax?: number;     // 现价在52周区间的位置上限 (0-1，低吸用)
}
