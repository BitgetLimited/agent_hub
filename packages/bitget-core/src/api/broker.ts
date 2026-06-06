// Bitget REST API V2 endpoint paths for the broker module.
export const BROKER_ENDPOINTS = {
  accountInfo: '/api/v2/broker/account/info',
  subaccountList: '/api/v2/broker/account/subaccount-list',
  createSubaccount: '/api/v2/broker/account/create-subaccount',
  modifySubaccount: '/api/v2/broker/account/modify-subaccount',
  apikeyList: '/api/v2/broker/manage/subaccount-apikey-list',
  deleteApikey: '/api/v2/broker/manage/delete-subaccount-apikey',
  createApikey: '/api/v2/broker/manage/create-subaccount-apikey',
  modifyApikey: '/api/v2/broker/manage/modify-subaccount-apikey'
} as const;
