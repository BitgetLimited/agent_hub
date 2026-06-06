// Bitget REST API V2 endpoint paths for the earn module.
// Each operation lists candidate paths probed in order (capability detection).
export type EarnOperation = 'products' | 'holdings' | 'subscribe' | 'redeem';

export const EARN_ENDPOINTS: Record<EarnOperation, string[]> = {
  products: ['/api/v2/earn/savings/product'],
  holdings: ['/api/v2/earn/savings/assets'],
  subscribe: ['/api/v2/earn/savings/subscribe'],
  redeem: ['/api/v2/earn/savings/redeem']
};
