// Bitget REST API V2 endpoint paths used by the account module.
// Spans spot/account, spot/wallet, mix/account, account/*, and user/* prefixes.
export const ACCOUNT_ENDPOINTS = {
  assets: {
    spot: '/api/v2/spot/account/assets',
    futures: '/api/v2/mix/account/accounts',
    funding: '/api/v2/account/funding-assets',
    all: '/api/v2/account/all-account-balance'
  },
  bills: {
    spot: '/api/v2/spot/account/bills',
    futures: '/api/v2/mix/account/bill'
  },
  wallet: {
    transfer: '/api/v2/spot/wallet/transfer',
    subaccountTransfer: '/api/v2/spot/wallet/subaccount-transfer',
    withdrawal: '/api/v2/spot/wallet/withdrawal',
    cancelWithdrawal: '/api/v2/spot/wallet/cancel-withdrawal',
    depositAddress: '/api/v2/spot/wallet/deposit-address',
    depositRecords: '/api/v2/spot/wallet/deposit-records',
    withdrawalRecords: '/api/v2/spot/wallet/withdrawal-records'
  },
  records: {
    subMainTransRecord: '/api/v2/spot/account/sub-main-trans-record'
  },
  subaccount: {
    list: '/api/v2/user/virtual-subaccount-list',
    apikeyList: '/api/v2/user/virtual-subaccount-apikey-list',
    create: '/api/v2/user/create-virtual-subaccount',
    modify: '/api/v2/user/modify-virtual-subaccount',
    createApikey: '/api/v2/user/create-virtual-subaccount-apikey',
    modifyApikey: '/api/v2/user/modify-virtual-subaccount-apikey'
  }
} as const;
