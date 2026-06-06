// Bitget REST API V2 endpoint paths for the spot module.
// Single source of truth — tool handlers reference these instead of inline strings.
export const SPOT_ENDPOINTS = {
  market: {
    tickers: '/api/v2/spot/market/tickers',
    orderbook: '/api/v2/spot/market/orderbook',
    mergeDepth: '/api/v2/spot/market/merge-depth',
    candles: '/api/v2/spot/market/candles',
    historyCandles: '/api/v2/spot/market/history-candles',
    fills: '/api/v2/spot/market/fills',
    fillsHistory: '/api/v2/spot/market/fills-history',
    coins: '/api/v2/spot/public/coins',
    symbols: '/api/v2/spot/public/symbols'
  },
  trade: {
    placeOrder: '/api/v2/spot/trade/place-order',
    batchOrders: '/api/v2/spot/trade/batch-orders',
    cancelOrder: '/api/v2/spot/trade/cancel-order',
    batchCancelOrder: '/api/v2/spot/trade/batch-cancel-order',
    cancelSymbolOrder: '/api/v2/spot/trade/cancel-symbol-order',
    cancelReplaceOrder: '/api/v2/spot/trade/cancel-replace-order',
    orderInfo: '/api/v2/spot/trade/orderInfo',
    historyOrders: '/api/v2/spot/trade/history-orders',
    unfilledOrders: '/api/v2/spot/trade/unfilled-orders',
    fills: '/api/v2/spot/trade/fills',
    placePlanOrder: '/api/v2/spot/trade/place-plan-order',
    modifyPlanOrder: '/api/v2/spot/trade/modify-plan-order',
    currentPlanOrder: '/api/v2/spot/trade/current-plan-order',
    historyPlanOrder: '/api/v2/spot/trade/history-plan-order',
    cancelPlanOrder: '/api/v2/spot/trade/cancel-plan-order',
    batchCancelPlanOrder: '/api/v2/spot/trade/batch-cancel-plan-order'
  }
} as const;
