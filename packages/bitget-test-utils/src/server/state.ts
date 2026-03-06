export interface SpotOrder {
  orderId: string;
  clientOid?: string;
  symbol: string;
  side: string;
  orderType: string;
  price?: string;
  size: string;
  status: "live" | "filled" | "cancelled" | "partially_filled";
  fillSize: string;
  fillPrice?: string;
  cTime: string;
  uTime: string;
}

export interface SpotPlanOrder {
  orderId: string;
  symbol: string;
  side: string;
  orderType: string;
  triggerPrice: string;
  triggerType: string;
  size: string;
  status: "live" | "filled" | "cancelled";
  cTime: string;
}

export interface FuturesOrder {
  orderId: string;
  clientOid?: string;
  symbol: string;
  productType: string;
  side: string;
  tradeSide: string;
  orderType: string;
  price?: string;
  size: string;
  status: "live" | "filled" | "cancelled";
  cTime: string;
  uTime: string;
}

export interface Position {
  symbol: string;
  productType: string;
  holdSide: "long" | "short";
  total: string;
  available: string;
  averageOpenPrice: string;
  unrealizedPL: string;
  leverage: string;
}

export interface Balance {
  coin: string;
  available: string;
  frozen: string;
}

export interface Transfer {
  transferId: string;
  coin: string;
  size: string;
  fromType: string;
  toType: string;
  cTime: string;
}

export interface Withdrawal {
  withdrawalId: string;
  coin: string;
  size: string;
  address: string;
  status: "pending" | "processing" | "success" | "cancelled";
  cTime: string;
}

export interface Deposit {
  depositId: string;
  coin: string;
  size: string;
  address: string;
  status: "pending" | "success";
  cTime: string;
}

export interface Subaccount {
  subUid: string;
  subName: string;
  status: "normal" | "freeze";
}

export interface MarginOrder {
  orderId: string;
  symbol: string;
  side: string;
  orderType: string;
  price?: string;
  size: string;
  status: "live" | "filled" | "cancelled";
  cTime: string;
}

export interface MarginPosition {
  symbol: string;
  side: "long" | "short";
  size: string;
  leverage: string;
}

export interface ConvertQuote {
  quoteId: string;
  fromCoin: string;
  toCoin: string;
  fromSize: string;
  toSize: string;
  price: string;
  expireTime: string;
}

export interface ConvertRecord {
  tradeId: string;
  fromCoin: string;
  toCoin: string;
  fromSize: string;
  toSize: string;
  status: "success";
  cTime: string;
}

export interface EarnProduct {
  productId: string;
  coin: string;
  productType: "flexible" | "fixed";
  apy: string;
  minAmount: string;
  term?: number;
}

export interface EarnHolding {
  holdingId: string;
  productId: string;
  coin: string;
  size: string;
  status: "holding" | "redeemed";
}

export interface P2pOrder {
  orderId: string;
  type: "buy" | "sell";
  coin: string;
  fiatCoin: string;
  fiatAmount: string;
  status: "pending" | "completed" | "cancelled";
  cTime: string;
}

export type BrokerSubaccount = Subaccount;

export interface CopySettings {
  traderId: string;
  mode: "spot" | "mix";
  copyAmount?: string;
  stopLoss?: string;
}

export interface MockState {
  spotOrders: Map<string, SpotOrder>;
  spotPlanOrders: Map<string, SpotPlanOrder>;
  futuresOrders: Map<string, FuturesOrder>;
  positions: Map<string, Position>;
  leverage: Map<string, number>;
  balances: Map<string, Balance>;
  transfers: Transfer[];
  withdrawals: Map<string, Withdrawal>;
  deposits: Deposit[];
  subaccounts: Map<string, Subaccount>;
  marginOrders: Map<string, MarginOrder>;
  marginPositions: Map<string, MarginPosition>;
  convertQuotes: Map<string, ConvertQuote>;
  convertHistory: ConvertRecord[];
  earnProducts: EarnProduct[];
  earnHoldings: Map<string, EarnHolding>;
  p2pOrders: Map<string, P2pOrder>;
  brokerSubaccounts: Map<string, BrokerSubaccount>;
  copyTradingSettings: Map<string, CopySettings>;
  errorOverrides: Map<string, { code: string; msg: string }>;
  _idCounter: number;
}

export function nextId(state: MockState, prefix: string): string {
  return `${prefix}${String(state._idCounter++).padStart(10, "0")}`;
}

export function createEmptyState(): MockState {
  return {
    spotOrders: new Map(),
    spotPlanOrders: new Map(),
    futuresOrders: new Map(),
    positions: new Map(),
    leverage: new Map(),
    balances: new Map(),
    transfers: [],
    withdrawals: new Map(),
    deposits: [],
    subaccounts: new Map(),
    marginOrders: new Map(),
    marginPositions: new Map(),
    convertQuotes: new Map(),
    convertHistory: [],
    earnProducts: [],
    earnHoldings: new Map(),
    p2pOrders: new Map(),
    brokerSubaccounts: new Map(),
    copyTradingSettings: new Map(),
    errorOverrides: new Map(),
    _idCounter: 1,
  };
}
