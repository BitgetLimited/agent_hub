# Design: Futures TP/SL & Plan Order Management

**Date:** 2026-06-06
**Issue:** [Bitget-AI/agent_hub#7](https://github.com/Bitget-AI/agent_hub/issues/7) — Add TP/SL order placement and position-level stop management endpoints
**Status:** Approved

## Problem

The MCP server cannot attach Take Profit / Stop Loss to futures positions, nor place
trigger (stop-market) orders. Every MCP-opened trade requires manual risk management in
the Bitget app, defeating AI-driven automation. Issue #7 names four gaps:

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `POST /api/v2/mix/order/place-tpsl-order` | Set TP/SL on existing positions | Critical |
| `presetStopLossPrice` / `presetTakeProfitPrice` on open | Attach TP/SL when opening | Critical |
| `POST /api/v2/mix/order/place-plan-order` | Trigger / plan orders (stop-market) | High |
| `POST /api/v2/mix/order/modify-tpsl-order` | Modify existing TP/SL orders | High |

## Scope

Full suite: place / modify / cancel / query for both position-level TP/SL plans and
trigger (plan) orders, plus documenting the already-working preset-on-open path.

**Out of scope (YAGNI):** WebSocket TP/SL push streams, trailing-stop analytics, any
non-futures (spot) plan orders.

## Approach

Consolidated tools matching existing codebase conventions (`futures_cancel_orders`
multiplexes single/batch/all; `futures_get_orders` multiplexes detail/open/history;
`futures_update_config` multiplexes settings). One tool can wrap two related endpoints
via a `mode` discriminator. This keeps the default futures module under Cursor's 40-tool
cap: futures goes 8 → 12 tools, total default set (spot + futures + account) 36 → 40.

Alternative rejected: one tool per endpoint (6+ tools) — clearer 1:1 with the API but
pushes the default set past 40, where Cursor silently truncates the tool list.

## New tools (`packages/bitget-core/src/tools/futures-trade.ts`)

All belong to `module: 'futures'`. Rate limit 10 req/s per UID (`privateRateLimit`),
matching sibling order tools. Responses wrapped by the existing `normalize()` helper.

### 1. `futures_place_tpsl` (isWrite: true)

Discriminated by `mode`:

- **`mode: 'position'`** → `POST place-tpsl-order`. Sets TP/SL against an open position.
  - `planType` (required): `profit_plan | loss_plan | moving_plan | pos_profit | pos_loss`
  - `symbol`, `productType`, `marginCoin` (required)
  - `triggerPrice` (required)
  - `triggerType` (optional): `fill_price | mark_price`
  - `executePrice` (optional): `'0'` or omitted = market execution
  - `holdSide` (optional): `long | short` (required in hedge mode)
  - `size` (optional): required for partial `profit_plan` / `loss_plan`; omitted for
    whole-position `pos_profit` / `pos_loss`
  - `rangeRate` (optional): callback rate for `moving_plan`
  - `clientOid` (optional)

- **`mode: 'plan'`** → `POST place-plan-order`. Trigger / stop-market entry orders.
  - `planType` (required): `normal_plan | track_plan`
  - `symbol`, `productType`, `marginCoin` (required)
  - `marginMode` (optional, default `crossed`)
  - `side` (`buy | sell`), `tradeSide` (`open | close`), `orderType` (`limit | market`)
  - `size` (required), `price` (limit only), `triggerPrice` (required)
  - `triggerType`, `callbackRatio` (track_plan), `reduceOnly`
  - nested preset TP/SL: `presetStopSurplusPrice`, `presetStopLossPrice` (+ their trigger
    price fields) — pass through verbatim
  - `clientOid` (optional)

Core required fields per mode are validated explicitly; any additional Bitget fields pass
through via `compactObject`, mirroring `futures_place_order`. `marginMode` defaults to
`crossed` (matching `place_order`).

### 2. `futures_modify_plan` (isWrite: true)

Discriminated by `mode`:

- **`mode: 'tpsl'`** → `POST modify-tpsl-order`: `orderId`/`clientOid` (one required),
  `productType`, `symbol`, `marginCoin`, `triggerPrice`, `triggerType`, `executePrice`,
  `size`, `rangeRate`.
- **`mode: 'plan'`** → `POST modify-plan-order`: `orderId`/`clientOid` (one required),
  `productType`, `newSize`, `newPrice`, `newCallbackRatio`, `triggerPrice`, `triggerType`,
  `executePrice`, new preset TP/SL fields.

Extras pass through via `compactObject`.

### 3. `futures_cancel_plan` (isWrite: true)

`POST cancel-plan-order`. Mirrors `futures_cancel_orders` shape:

- `planType` (required): `normal_plan | track_plan | profit_loss`
- `productType`, `symbol` (required)
- `marginCoin` (optional)
- one of: `orderId` | `orderIds[]` (≤ 50, mapped to `orderIdList`) | `cancelAll: true`
  (cancels all of `planType` for the symbol). Enforced with `ensureOneOf`.

### 4. `futures_get_plan_orders` (isWrite: false)

- `planType` (required): `normal_plan | track_plan | profit_loss`
- `status` (optional, default `open`): `open` → `GET orders-plan-pending`;
  `history` → `GET orders-plan-history`
- `productType` (required), `symbol`, `orderId`, `startTime`, `endTime`, `limit` (optional)

## Preset-on-open (Critical gap #2)

No handler change needed — `futures_place_order` already passes each order object through
verbatim, so `presetStopSurplusPrice` / `presetStopLossPrice` (Bitget's field names; the
issue's `presetTakeProfitPrice` / `presetStopLossPrice` are the informal labels) already
reach the API. Fix is:

1. Document the exact field names in the `futures_place_order` description.
2. Add a regression test placing an order with both preset fields and asserting they reach
   the mock.

## Supporting changes

### Endpoints — `packages/bitget-core/src/api/futures.ts`

Add under `order`:

```
placeTpslOrder:    '/api/v2/mix/order/place-tpsl-order'
placePlanOrder:    '/api/v2/mix/order/place-plan-order'
modifyTpslOrder:   '/api/v2/mix/order/modify-tpsl-order'
modifyPlanOrder:   '/api/v2/mix/order/modify-plan-order'
cancelPlanOrder:   '/api/v2/mix/order/cancel-plan-order'
ordersPlanPending: '/api/v2/mix/order/orders-plan-pending'
ordersPlanHistory: '/api/v2/mix/order/orders-plan-history'
```

### Mock — `packages/bitget-test-utils`

- `src/server/state.ts`: add `PlanOrder` type and `planOrders: Map<string, PlanOrder>` to
  state (reset in `reset()`). Fields: `orderId`, `clientOid?`, `symbol`, `productType`,
  `planType`, `triggerPrice`, `size?`, `status` (`live | cancelled | executed`),
  `cTime`, `uTime`.
- `src/server/routes/futures-trade.ts`: register 7 routes:
  - `place-tpsl-order`, `place-plan-order` → mint id (`PLAN…`), store, return `{ orderId, clientOid }`
  - `modify-tpsl-order`, `modify-plan-order` → update stored plan order, return `{ orderId }`
  - `cancel-plan-order` → mark stored order(s) `cancelled`, return success list
  - `orders-plan-pending` → filter `status === 'live'`, optional `symbol`
  - `orders-plan-history` → filter `status !== 'live'`, optional `symbol`

### Tests — `packages/bitget-core/tests/tools/futures.test.ts`

(`config = { modules: 'futures', readOnly: false }` already covers these.)

- `futures_place_tpsl` mode=position → `futures_get_plan_orders` round-trip
- `futures_place_tpsl` mode=plan → `futures_get_plan_orders` round-trip
- `futures_modify_plan` updates a stored plan order
- `futures_cancel_plan` marks a plan order cancelled (by orderId)
- `futures_get_plan_orders` history status hits the history route
- `futures_place_order` with `presetStopSurplusPrice` + `presetStopLossPrice` reaches the mock

### Skill references

`bitget-skill/references/commands.md` is generated from core tool specs. After building
core, run `pnpm gen-references` to pick up the 4 new tools. No hand edits.

## Build / verify order

1. Edit `api/futures.ts`, `tools/futures-trade.ts`.
2. Edit test-utils `state.ts`, `routes/futures-trade.ts`.
3. `pnpm -r build` (core first — consumers import built `dist/`).
4. `pnpm -r typecheck`.
5. `pnpm -r test`.
6. `pnpm gen-references` (commit regenerated reference file).

## Conventions

ESM `.js` import extensions; strict TS with `noUncheckedIndexedAccess`; helpers from
`tools/helpers.ts` (`requireString`, `readString`, `assertEnum`, `ensureOneOf`,
`compactObject`, …); single quotes, semicolons, braces on every `if`, no `any`; one
member per line except tiny inline schema literals. Match the surrounding code in each
file (the existing test file uses double quotes locally — match it there).
