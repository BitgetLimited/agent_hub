// Bitget REST API V2 endpoint paths for the futures (mix) module.
export const FUTURES_ENDPOINTS = {
  market: {
    ticker: '/api/v2/mix/market/ticker',
    tickers: '/api/v2/mix/market/tickers',
    mergeDepth: '/api/v2/mix/market/merge-depth',
    candles: '/api/v2/mix/market/candles',
    historyCandles: '/api/v2/mix/market/history-candles',
    historyIndexCandles: '/api/v2/mix/market/history-index-candles',
    historyMarkCandles: '/api/v2/mix/market/history-mark-candles',
    fills: '/api/v2/mix/market/fills',
    fillsHistory: '/api/v2/mix/market/fills-history',
    contracts: '/api/v2/mix/market/contracts',
    historyFundRate: '/api/v2/mix/market/history-fund-rate',
    currentFundRate: '/api/v2/mix/market/current-fund-rate',
    fundingTime: '/api/v2/mix/market/funding-time',
    openInterest: '/api/v2/mix/market/open-interest'
  },
  order: {
    placeOrder: '/api/v2/mix/order/place-order',
    batchPlaceOrder: '/api/v2/mix/order/batch-place-order',
    modifyOrder: '/api/v2/mix/order/modify-order',
    cancelOrder: '/api/v2/mix/order/cancel-order',
    batchCancelOrders: '/api/v2/mix/order/batch-cancel-orders',
    cancelAllOrders: '/api/v2/mix/order/cancel-all-orders',
    detail: '/api/v2/mix/order/detail',
    ordersHistory: '/api/v2/mix/order/orders-history',
    ordersPending: '/api/v2/mix/order/orders-pending',
    fills: '/api/v2/mix/order/fills',
    fillHistory: '/api/v2/mix/order/fill-history'
  },
  position: {
    historyPosition: '/api/v2/mix/position/history-position',
    singlePosition: '/api/v2/mix/position/single-position',
    allPosition: '/api/v2/mix/position/all-position'
  },
  account: {
    setLeverage: '/api/v2/mix/account/set-leverage',
    setMarginMode: '/api/v2/mix/account/set-margin-mode',
    setPositionMode: '/api/v2/mix/account/set-position-mode',
    setAutoMargin: '/api/v2/mix/account/set-auto-margin'
  }
} as const;
