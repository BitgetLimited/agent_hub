// Bitget REST API V2 endpoint paths for the copy-trading module.
export const COPY_ENDPOINTS = {
  spot: {
    queryTraders: '/api/v2/copy/spot-follower/query-traders',
    settings: '/api/v2/copy/spot-follower/settings',
    queryHistoryOrders: '/api/v2/copy/spot-follower/query-history-orders',
    queryCurrentOrders: '/api/v2/copy/spot-follower/query-current-orders'
  },
  mix: {
    queryTraders: '/api/v2/copy/mix-follower/query-traders',
    settings: '/api/v2/copy/mix-follower/settings',
    closePositions: '/api/v2/copy/mix-follower/close-positions',
    queryHistoryOrders: '/api/v2/copy/mix-follower/query-history-orders',
    queryCurrentOrders: '/api/v2/copy/mix-follower/query-current-orders'
  }
} as const;
