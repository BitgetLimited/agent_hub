// Bitget REST API V2 endpoint paths for the margin module.
// Margin paths are scoped by margin type (crossed/isolated), so they are
// built from a shared base plus a per-operation suffix.
export const MARGIN_ENDPOINTS = {
  assets: 'account/assets',
  borrow: 'account/borrow',
  repay: 'account/repay',
  flashRepay: 'account/flash-repay',
  placeOrder: 'place-order',
  cancelOrder: 'cancel-order',
  batchCancelOrder: 'batch-cancel-order',
  historyOrders: 'history-orders',
  openOrders: 'open-orders',
  borrowHistory: 'borrow-history',
  repayHistory: 'repay-history',
  interestHistory: 'interest-history',
  liquidationHistory: 'liquidation-history'
} as const;

export function marginEndpoint(marginType: string, suffix: string): string {
  const scope = marginType === 'crossed' ? 'crossed' : 'isolated';
  return `/api/v2/margin/${scope}/${suffix}`;
}
