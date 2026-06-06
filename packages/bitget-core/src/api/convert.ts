// Bitget REST API V2 endpoint paths for the convert module.
export const CONVERT_ENDPOINTS = {
  currencies: '/api/v2/convert/currencies',
  quotedPrice: '/api/v2/convert/quoted-price',
  trade: '/api/v2/convert/trade',
  bgbConvert: '/api/v2/convert/bgb-convert',
  convertRecord: '/api/v2/convert/convert-record',
  bgbConvertRecords: '/api/v2/convert/bgb-convert-records'
} as const;
