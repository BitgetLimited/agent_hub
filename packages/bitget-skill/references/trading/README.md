# Trading Reference Index

Detailed documentation for each trading interface — parameters, use cases, and examples.

## Spot Trading

| File | Commands Covered |
|------|-----------------|
| [spot-place-order.md](spot-place-order.md) | `spot_place_order` — limit, market, batch, TP/SL presets |
| [spot-cancel-orders.md](spot-cancel-orders.md) | `spot_cancel_orders` — single, batch, cancel-all |
| [spot-modify-order.md](spot-modify-order.md) | `spot_modify_order` — cancel-and-replace |
| [spot-get-orders.md](spot-get-orders.md) | `spot_get_orders` — open, history, single lookup, pagination |
| [spot-plan-orders.md](spot-plan-orders.md) | `spot_place_plan_order`, `spot_get_plan_orders`, `spot_cancel_plan_orders` — trigger orders |

## Futures Trading

| File | Commands Covered |
|------|-----------------|
| [futures-place-order.md](futures-place-order.md) | `futures_place_order` — one-way/hedge mode, TP/SL, COIN-FUTURES |
| [futures-cancel-orders.md](futures-cancel-orders.md) | `futures_cancel_orders` — single, batch, cancel-all |
| [futures-get-orders.md](futures-get-orders.md) | `futures_get_orders`, `futures_get_fills` — open, history, detail |
| [futures-positions.md](futures-positions.md) | `futures_get_positions` — current, history, PnL, liquidation |
| [futures-leverage-config.md](futures-leverage-config.md) | `futures_set_leverage`, `futures_update_config` — leverage, margin mode, position mode |

## Quick Scenario Guide

| Scenario | Files to Read |
|----------|--------------|
| Place my first spot order | spot-place-order.md |
| Set up a stop-loss for spot | spot-plan-orders.md |
| Open a leveraged long | futures-leverage-config.md → futures-place-order.md |
| Close a futures position | futures-place-order.md (Case 4/6) |
| Check my unrealized PnL | futures-positions.md |
| Cancel all orders (emergency) | spot-cancel-orders.md (Case 3) or futures-cancel-orders.md (Case 3) |
| Set up TP/SL on a futures trade | futures-place-order.md (Case 3, Case 8) |
| DCA ladder of buy orders | spot-place-order.md (Case 6) |
