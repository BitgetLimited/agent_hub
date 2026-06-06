import type { ToolSpec } from './types.js';
import { asRecord, assertEnum, compactObject, ensureOneOf, readBoolean, readNumber, readObjectArray, readString, readStringArray, requireObjectArray, requireString } from './helpers.js';
import { privateRateLimit, PRODUCT_TYPES } from './common.js';
import { FUTURES_ENDPOINTS } from '../api/index.js';
import { ValidationError } from '../utils/errors.js';

function normalize(response: {
  endpoint: string;
  requestTime: string;
  data: unknown;
}): Record<string, unknown> {
  return {
    endpoint: response.endpoint,
    requestTime: response.requestTime,
    data: response.data
  };
}

export function registerFuturesTradeTools(): ToolSpec[] {
  return [{
    name: 'futures_place_order',
    module: 'futures',
    description:
      "Place one or more futures orders. Attach TP/SL on open by adding presetStopSurplusPrice (take-profit trigger) and presetStopLossPrice (stop-loss trigger) to an order object; optionally presetStopSurplusExecutePrice / presetStopLossExecutePrice for the execution price. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.",
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        orders: {
          type: 'array',
          description: 'Array of futures order objects.',
          items: { type: 'object' }
        }
      },
      required: ['orders']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const orders = requireObjectArray(args, 'orders');
      if (orders.length > 50) {
        throw new ValidationError('orders supports at most 50 items.');
      }
      const normalizedOrders = orders.map((order) => {
        const orderType = readString(order, 'orderType');
        return compactObject({
          ...order,
          marginMode: readString(order, 'marginMode') ?? 'crossed',
          force:
            readString(order, 'force') ??
            (orderType === 'limit' ? 'gtc' : undefined)
        });
      });
      const isSingle = orders.length === 1;
      const path = isSingle
        ? FUTURES_ENDPOINTS.order.placeOrder
        : FUTURES_ENDPOINTS.order.batchPlaceOrder;
      const first = normalizedOrders.at(0);
      if (!first) {
        throw new ValidationError('orders cannot be empty.');
      }
      let body: Record<string, unknown>;
      if (isSingle) {
        body = first;
      } else {
        const shared = {
          symbol: readString(first, 'symbol'),
          productType: readString(first, 'productType'),
          marginCoin: readString(first, 'marginCoin'),
          marginMode: readString(first, 'marginMode') ?? 'crossed'
        };
        const isSameKey = normalizedOrders.every((order) =>
            readString(order, 'symbol') === shared.symbol &&
            readString(order, 'productType') === shared.productType &&
            readString(order, 'marginCoin') === shared.marginCoin &&
            (readString(order, 'marginMode') ?? 'crossed') ===
              shared.marginMode);
        if (!isSameKey) {
          throw new ValidationError('Batch futures orders must share symbol, productType, marginCoin, and marginMode.');
        }
        body = {
          symbol: shared.symbol,
          productType: shared.productType,
          marginCoin: shared.marginCoin,
          marginMode: shared.marginMode,
          orderList: normalizedOrders.map((order) => {
            const rest = { ...order };
            delete rest.symbol;
            delete rest.productType;
            delete rest.marginCoin;
            delete rest.marginMode;
            return rest;
          })
        };
      }
      const response = await context.client.privatePost(path, body, privateRateLimit('futures_place_order', 10));
      return normalize(response);
    }
  }, {
    name: 'futures_modify_order',
    module: 'futures',
    description:
      "Modify a pending futures order: adjust TP/SL prices, size, or limit price. Modifying TP/SL only does NOT cancel the order. Modifying size/price cancels and recreates it. Pass '0' for newPresetStopSurplusPrice or newPresetStopLossPrice to delete that preset. [CAUTION] Affects live orders. Private endpoint. Rate limit: 10 req/s per UID.",
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Trading pair, e.g. BTCUSDT.' },
        productType: { type: 'string', enum: [...PRODUCT_TYPES], description: 'Futures product type.' },
        marginCoin: { type: 'string', description: 'Margin asset, e.g. USDT.' },
        orderId: { type: 'string', description: 'Order ID. One of orderId or clientOid required.' },
        clientOid: { type: 'string', description: 'Custom order ID. orderId takes priority if both provided.' },
        newClientOid: { type: 'string', description: 'New custom order ID for the modified order.' },
        newSize: { type: 'string', description: 'New order quantity. Must be provided together with newPrice.' },
        newPrice: { type: 'string', description: 'New limit price. Must be provided together with newSize.' },
        newPresetStopSurplusPrice: { type: 'string', description: "New take-profit trigger price. Pass '0' to delete." },
        newPresetStopLossPrice: { type: 'string', description: "New stop-loss trigger price. Pass '0' to delete." }
      },
      required: ['symbol', 'productType', 'marginCoin', 'newClientOid']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const orderId = readString(args, 'orderId');
      const clientOid = readString(args, 'clientOid');
      if (!orderId && !clientOid) {
        throw new ValidationError('Provide at least one of "orderId" or "clientOid".');
      }
      const newSize = readString(args, 'newSize');
      const newPrice = readString(args, 'newPrice');
      if ((newSize && !newPrice) || (!newSize && newPrice)) {
        throw new ValidationError('"newSize" and "newPrice" must be provided together.');
      }
      const newPresetStopSurplusPrice = readString(args, 'newPresetStopSurplusPrice');
      const newPresetStopLossPrice = readString(args, 'newPresetStopLossPrice');
      if (!newSize && !newPresetStopSurplusPrice && !newPresetStopLossPrice) {
        throw new ValidationError('Provide at least one of: "newSize"+"newPrice", "newPresetStopSurplusPrice", or "newPresetStopLossPrice".');
      }
      const productType = requireString(args, 'productType');
      assertEnum(productType, 'productType', PRODUCT_TYPES);
      const response = await context.client.privatePost(FUTURES_ENDPOINTS.order.modifyOrder, compactObject({
          symbol: requireString(args, 'symbol'),
          productType,
          marginCoin: requireString(args, 'marginCoin'),
          orderId,
          clientOid,
          newClientOid: requireString(args, 'newClientOid'),
          newSize,
          newPrice,
          newPresetStopSurplusPrice,
          newPresetStopLossPrice
        }), privateRateLimit('futures_modify_order', 10));
      return normalize(response);
    }
  }, {
    name: 'futures_cancel_orders',
    module: 'futures',
    description:
      'Cancel futures orders by order id, batch ids, or cancel-all mode. Pass planType (normal_plan, track_plan, or profit_loss) to cancel TP/SL or trigger (plan) orders instead of regular orders. Private endpoint. Rate limit: 10 req/s per UID.',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        productType: { type: 'string', enum: [...PRODUCT_TYPES] },
        symbol: { type: 'string' },
        orderId: { type: 'string' },
        orderIds: { type: 'array', items: { type: 'string' } },
        cancelAll: { type: 'boolean' },
        marginCoin: { type: 'string' },
        planType: { type: 'string', enum: ['normal_plan', 'track_plan', 'profit_loss'], description: 'Set to cancel TP/SL or trigger orders via the plan-order endpoint.' }
      },
      required: ['productType', 'symbol']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const productType = requireString(args, 'productType');
      const symbol = requireString(args, 'symbol');
      const orderId = readString(args, 'orderId');
      const orderIds = readStringArray(args, 'orderIds');
      const marginCoin = readString(args, 'marginCoin');
      const planType = readString(args, 'planType');
      assertEnum(productType, 'productType', PRODUCT_TYPES);
      assertEnum(planType, 'planType', ['normal_plan', 'track_plan', 'profit_loss']);
      ensureOneOf(args, ['orderId', 'orderIds', 'cancelAll'], 'Provide one of "orderId", "orderIds", or "cancelAll=true".');
      if (orderIds && orderIds.length > 50) {
        throw new ValidationError('orderIds supports at most 50 items.');
      }
      const orderIdList = orderId
        ? [{ orderId }]
        : orderIds
          ? orderIds.map((id) => ({ orderId: id }))
          : undefined;
      if (planType) {
        const response = await context.client.privatePost(FUTURES_ENDPOINTS.order.cancelPlanOrder, compactObject({
            productType,
            symbol,
            marginCoin,
            planType,
            orderIdList
          }), privateRateLimit('futures_cancel_orders', 10));
        return normalize(response);
      }
      const cancelTarget = orderId
        ? {
            path: FUTURES_ENDPOINTS.order.cancelOrder,
            body: { productType, symbol, orderId }
          }
        : orderIds
          ? {
              path: FUTURES_ENDPOINTS.order.batchCancelOrders,
              body: { productType, symbol, orderIdList }
            }
          : {
              path: FUTURES_ENDPOINTS.order.cancelAllOrders,
              body: compactObject({ productType, marginCoin })
            };
      const response = await context.client.privatePost(cancelTarget.path, cancelTarget.body, privateRateLimit('futures_cancel_orders', 10));
      return normalize(response);
    }
  }, {
    name: 'futures_get_orders',
    module: 'futures',
    description:
      'Query futures orders by id, open status, or history. Pass planType (normal_plan, track_plan, or profit_loss) to list TP/SL or trigger (plan) orders instead of regular orders. Private endpoint. Rate limit: 10 req/s per UID.',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        productType: { type: 'string', enum: [...PRODUCT_TYPES] },
        orderId: { type: 'string' },
        symbol: { type: 'string' },
        status: { type: 'string', enum: ['open', 'history'] },
        planType: { type: 'string', enum: ['normal_plan', 'track_plan', 'profit_loss'], description: 'Set to list TP/SL or trigger orders via the plan-order endpoint.' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['productType']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const productType = requireString(args, 'productType');
      const orderId = readString(args, 'orderId');
      const symbol = readString(args, 'symbol');
      const status = readString(args, 'status') ?? 'open';
      const planType = readString(args, 'planType');
      assertEnum(productType, 'productType', PRODUCT_TYPES);
      assertEnum(planType, 'planType', ['normal_plan', 'track_plan', 'profit_loss']);
      const path = planType
        ? status === 'history'
          ? FUTURES_ENDPOINTS.order.ordersPlanHistory
          : FUTURES_ENDPOINTS.order.ordersPlanPending
        : orderId
          ? FUTURES_ENDPOINTS.order.detail
          : status === 'history'
            ? FUTURES_ENDPOINTS.order.ordersHistory
            : FUTURES_ENDPOINTS.order.ordersPending;
      const query = compactObject({
        productType,
        orderId,
        symbol,
        planType,
        startTime: readString(args, 'startTime'),
        endTime: readString(args, 'endTime'),
        limit: readNumber(args, 'limit')
      });
      const response = await context.client.privateGet(path, query, privateRateLimit('futures_get_orders', 10));
      return normalize(response);
    }
  }, {
    name: 'futures_get_fills',
    module: 'futures',
    description:
      'Get futures fills and fill history records. Private endpoint. Rate limit: 10 req/s per UID.',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        productType: { type: 'string', enum: [...PRODUCT_TYPES] },
        symbol: { type: 'string' },
        orderId: { type: 'string' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['productType']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const productType = requireString(args, 'productType');
      const startTime = readString(args, 'startTime');
      assertEnum(productType, 'productType', PRODUCT_TYPES);
      const path = startTime
        ? FUTURES_ENDPOINTS.order.fillHistory
        : FUTURES_ENDPOINTS.order.fills;
      const response = await context.client.privateGet(path, compactObject({
          productType,
          symbol: readString(args, 'symbol'),
          orderId: readString(args, 'orderId'),
          startTime,
          endTime: readString(args, 'endTime'),
          limit: readNumber(args, 'limit')
        }), privateRateLimit('futures_get_fills', 10));
      return normalize(response);
    }
  }, {
    name: 'futures_get_positions',
    module: 'futures',
    description:
      'Get current or historical futures positions. Private endpoint. Rate limit: 10 req/s per UID.',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        productType: { type: 'string', enum: [...PRODUCT_TYPES] },
        symbol: { type: 'string' },
        marginCoin: { type: 'string' },
        history: { type: 'boolean' }
      },
      required: ['productType']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const productType = requireString(args, 'productType');
      const symbol = readString(args, 'symbol');
      const history = readBoolean(args, 'history') ?? false;
      assertEnum(productType, 'productType', PRODUCT_TYPES);
      const path = history
        ? FUTURES_ENDPOINTS.position.historyPosition
        : symbol
          ? FUTURES_ENDPOINTS.position.singlePosition
          : FUTURES_ENDPOINTS.position.allPosition;
      const response = await context.client.privateGet(path, compactObject({
          productType,
          symbol,
          marginCoin:
            readString(args, 'marginCoin') ?? (symbol ? 'USDT' : undefined)
        }), privateRateLimit('futures_get_positions', 10));
      return normalize(response);
    }
  }, {
    name: 'futures_place_tpsl',
    module: 'futures',
    description:
      "Place a TP/SL or trigger order. mode='position' sets TP/SL on an existing position (planType: profit_plan, loss_plan, moving_plan, pos_profit, pos_loss; use size for partial profit_plan/loss_plan, omit for whole-position pos_profit/pos_loss; rangeRate is the moving_plan callback rate). mode='plan' places a trigger/stop-market order (planType: normal_plan, track_plan; needs side, tradeSide, orderType, size, triggerPrice). executePrice '0' or omitted = market. [CAUTION] Executes real trades. Private endpoint. Rate limit: 10 req/s per UID.",
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['position', 'plan'], description: "'position' = TP/SL on a position; 'plan' = trigger order." },
        symbol: { type: 'string', description: 'Trading pair, e.g. BTCUSDT.' },
        productType: { type: 'string', enum: [...PRODUCT_TYPES] },
        marginCoin: { type: 'string', description: 'Margin asset, e.g. USDT.' },
        planType: { type: 'string', description: 'position: profit_plan|loss_plan|moving_plan|pos_profit|pos_loss. plan: normal_plan|track_plan.' },
        triggerPrice: { type: 'string', description: 'Trigger price.' },
        triggerType: { type: 'string', enum: ['fill_price', 'mark_price'] },
        executePrice: { type: 'string', description: "Execution price; '0' or omitted = market." },
        holdSide: { type: 'string', enum: ['long', 'short'], description: 'position mode: side of the position.' },
        size: { type: 'string', description: 'Order or close size.' },
        rangeRate: { type: 'string', description: 'position moving_plan callback rate.' },
        marginMode: { type: 'string', enum: ['isolated', 'crossed'], description: 'plan mode; default crossed.' },
        side: { type: 'string', enum: ['buy', 'sell'], description: 'plan mode.' },
        tradeSide: { type: 'string', enum: ['open', 'close'], description: 'plan mode (hedge).' },
        orderType: { type: 'string', enum: ['limit', 'market'], description: 'plan mode.' },
        price: { type: 'string', description: 'plan mode limit price.' },
        callbackRatio: { type: 'string', description: 'plan mode track_plan callback ratio.' },
        reduceOnly: { type: 'string', enum: ['YES', 'NO'], description: 'plan mode.' },
        presetStopSurplusPrice: { type: 'string', description: 'plan mode nested take-profit trigger price.' },
        presetStopLossPrice: { type: 'string', description: 'plan mode nested stop-loss trigger price.' },
        clientOid: { type: 'string' }
      },
      required: ['mode', 'symbol', 'productType', 'marginCoin', 'planType', 'triggerPrice']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const mode = requireString(args, 'mode');
      assertEnum(mode, 'mode', ['position', 'plan']);
      const productType = requireString(args, 'productType');
      assertEnum(productType, 'productType', PRODUCT_TYPES);
      requireString(args, 'symbol');
      requireString(args, 'marginCoin');
      requireString(args, 'triggerPrice');
      const planType = requireString(args, 'planType');
      const positionPlanTypes = ['profit_plan', 'loss_plan', 'moving_plan', 'pos_profit', 'pos_loss'];
      const planPlanTypes = ['normal_plan', 'track_plan'];
      assertEnum(planType, 'planType', mode === 'position' ? positionPlanTypes : planPlanTypes);
      const body = { ...args };
      delete body.mode;
      if (mode === 'plan' && readString(args, 'marginMode') === undefined) {
        body.marginMode = 'crossed';
      }
      const path = mode === 'position'
        ? FUTURES_ENDPOINTS.order.placeTpslOrder
        : FUTURES_ENDPOINTS.order.placePlanOrder;
      const response = await context.client.privatePost(path, compactObject(body), privateRateLimit('futures_place_tpsl', 10));
      return normalize(response);
    }
  }, {
    name: 'futures_set_leverage',
    module: 'futures',
    description:
      'Set futures leverage for symbol and margin coin. [CAUTION] Affects risk exposure. Private endpoint. Rate limit: 5 req/s per UID.',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        productType: { type: 'string', enum: [...PRODUCT_TYPES] },
        symbol: { type: 'string' },
        marginCoin: { type: 'string' },
        leverage: { type: 'string' },
        holdSide: { type: 'string', enum: ['long', 'short'] }
      },
      required: ['productType', 'symbol', 'marginCoin', 'leverage']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const productType = requireString(args, 'productType');
      assertEnum(productType, 'productType', PRODUCT_TYPES);
      const response = await context.client.privatePost(FUTURES_ENDPOINTS.account.setLeverage, compactObject({
          productType,
          symbol: requireString(args, 'symbol'),
          marginCoin: requireString(args, 'marginCoin'),
          leverage: requireString(args, 'leverage'),
          holdSide: readString(args, 'holdSide')
        }), privateRateLimit('futures_set_leverage', 5));
      return normalize(response);
    }
  }, {
    name: 'futures_update_config',
    module: 'futures',
    description:
      'Update futures margin mode, position mode, or auto-margin setting. [CAUTION] Affects trading behavior. Private endpoint. Rate limit: 5 req/s per UID.',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        productType: { type: 'string', enum: [...PRODUCT_TYPES] },
        symbol: { type: 'string' },
        marginCoin: { type: 'string' },
        setting: {
          type: 'string',
          enum: ['marginMode', 'positionMode', 'autoMargin']
        },
        value: { type: 'string' },
        holdSide: { type: 'string', enum: ['long', 'short'] }
      },
      required: ['productType', 'symbol', 'marginCoin', 'setting', 'value']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const productType = requireString(args, 'productType');
      const setting = requireString(args, 'setting');
      assertEnum(productType, 'productType', PRODUCT_TYPES);
      assertEnum(setting, 'setting', ['marginMode', 'positionMode', 'autoMargin']);
      const endpoint =
        setting === 'marginMode'
          ? FUTURES_ENDPOINTS.account.setMarginMode
          : setting === 'positionMode'
            ? FUTURES_ENDPOINTS.account.setPositionMode
            : FUTURES_ENDPOINTS.account.setAutoMargin;
      const response = await context.client.privatePost(endpoint, setting === 'marginMode'
          ? compactObject({
              productType,
              symbol: requireString(args, 'symbol'),
              marginCoin: requireString(args, 'marginCoin'),
              marginMode: requireString(args, 'value')
            })
          : setting === 'positionMode'
            ? compactObject({
                productType,
                posMode: requireString(args, 'value')
              })
            : compactObject({
                symbol: requireString(args, 'symbol'),
                marginCoin: requireString(args, 'marginCoin'),
                autoMargin: requireString(args, 'value'),
                holdSide: readString(args, 'holdSide')
              }), privateRateLimit('futures_update_config', 5));
      return normalize(response);
    }
  }, {
    name: 'futures_modify_plan',
    module: 'futures',
    description:
      "Modify an existing TP/SL or trigger order. mode='tpsl' modifies a position TP/SL (triggerPrice, triggerType, executePrice, size, rangeRate). mode='plan' modifies a trigger order (newSize, newPrice, newCallbackRatio, triggerPrice). Provide orderId or clientOid. [CAUTION] Affects live orders. Private endpoint. Rate limit: 10 req/s per UID.",
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['tpsl', 'plan'] },
        productType: { type: 'string', enum: [...PRODUCT_TYPES] },
        symbol: { type: 'string' },
        marginCoin: { type: 'string' },
        orderId: { type: 'string', description: 'One of orderId or clientOid required.' },
        clientOid: { type: 'string' },
        triggerPrice: { type: 'string' },
        triggerType: { type: 'string', enum: ['fill_price', 'mark_price'] },
        executePrice: { type: 'string' },
        size: { type: 'string', description: 'tpsl mode size.' },
        rangeRate: { type: 'string', description: 'tpsl moving_plan callback rate.' },
        newSize: { type: 'string', description: 'plan mode new size.' },
        newPrice: { type: 'string', description: 'plan mode new limit price.' },
        newCallbackRatio: { type: 'string', description: 'plan mode track_plan callback.' }
      },
      required: ['mode', 'productType']
    },
    handler: async (rawArgs, context) => {
      const args = asRecord(rawArgs);
      const mode = requireString(args, 'mode');
      assertEnum(mode, 'mode', ['tpsl', 'plan']);
      const productType = requireString(args, 'productType');
      assertEnum(productType, 'productType', PRODUCT_TYPES);
      const orderId = readString(args, 'orderId');
      const clientOid = readString(args, 'clientOid');
      if (!orderId && !clientOid) {
        throw new ValidationError('Provide at least one of "orderId" or "clientOid".');
      }
      const body = { ...args };
      delete body.mode;
      const path = mode === 'tpsl'
        ? FUTURES_ENDPOINTS.order.modifyTpslOrder
        : FUTURES_ENDPOINTS.order.modifyPlanOrder;
      const response = await context.client.privatePost(path, compactObject(body), privateRateLimit('futures_modify_plan', 10));
      return normalize(response);
    }
  }];
}
