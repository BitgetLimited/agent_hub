# futures_set_leverage / futures_update_config — Futures Leverage & Configuration

## Official Description
Set leverage for a futures contract, or update position mode (one-way/hedge), margin mode (isolated/crossed), or auto-margin settings.

**Endpoints:**
- Set leverage: `POST /api/v2/mix/account/set-leverage`
- Update config: `POST /api/v2/mix/account/set-margin-mode` | `POST /api/v2/mix/account/set-position-mode` | `POST /api/v2/mix/account/set-auto-margin`

**Auth required:** Yes
**Rate limit:** 5 req/s per UID

---

## futures_set_leverage Parameters

| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `COIN-FUTURES`, `USDC-FUTURES` | Contract type |
| `symbol` | string | Yes | e.g. `BTCUSDT` | Contract symbol |
| `marginCoin` | string | Yes | e.g. `USDT` | Margin coin (must match productType) |
| `leverage` | string | Yes | e.g. `"10"`, `"20"`, `"125"` | Target leverage multiplier |
| `holdSide` | string | No | `long`, `short` | Required only in **hedge mode** to set per-side leverage |

---

## futures_update_config Parameters

| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| `productType` | string | Yes | `USDT-FUTURES`, `COIN-FUTURES`, `USDC-FUTURES` | Contract type |
| `symbol` | string | Yes | e.g. `BTCUSDT` | Contract symbol |
| `marginCoin` | string | Yes | e.g. `USDT` | Margin coin |
| `setting` | string | Yes | `marginMode`, `positionMode`, `autoMargin` | Which setting to change |
| `value` | string | Yes | (depends on setting) | New value for the setting |
| `holdSide` | string | No | `long`, `short` | Required for autoMargin setting in hedge mode |

### `setting` + `value` Combinations

| setting | value options | Description |
|---------|--------------|-------------|
| `marginMode` | `isolated`, `crossed` | Isolated = per-position margin; Crossed = shared account margin |
| `positionMode` | `one_way_mode`, `hedge_mode` | One-way = single position per symbol; Hedge = separate long+short |
| `autoMargin` | `on`, `off` | Auto top-up margin when approaching liquidation |

---

## Usage Cases

### Case 1: Set leverage to 10x (one-way mode)
```bash
bgc futures futures_set_leverage \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --marginCoin USDT \
  --leverage 10
```

### Case 2: Set leverage to 20x (isolated margin)
```bash
bgc futures futures_set_leverage \
  --productType USDT-FUTURES \
  --symbol ETHUSDT \
  --marginCoin USDT \
  --leverage 20
```

### Case 3: Set different leverage for long vs short (hedge mode)
```bash
# Set long-side leverage
bgc futures futures_set_leverage \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --marginCoin USDT \
  --leverage 10 \
  --holdSide long

# Set short-side leverage
bgc futures futures_set_leverage \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --marginCoin USDT \
  --leverage 5 \
  --holdSide short
```

### Case 4: Switch to isolated margin mode
```bash
bgc futures futures_update_config \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --marginCoin USDT \
  --setting marginMode \
  --value isolated
```
> Isolated mode limits losses to the margin allocated to this position only.

### Case 5: Switch to crossed margin mode
```bash
bgc futures futures_update_config \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --marginCoin USDT \
  --setting marginMode \
  --value crossed
```
> Crossed mode uses all available USDT as margin — higher liquidation threshold but more capital at risk.

### Case 6: Enable hedge mode (hold long + short simultaneously)
```bash
bgc futures futures_update_config \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --marginCoin USDT \
  --setting positionMode \
  --value hedge_mode
```
> Enables holding both long and short positions on the same symbol at the same time.

### Case 7: Switch back to one-way mode
```bash
bgc futures futures_update_config \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --marginCoin USDT \
  --setting positionMode \
  --value one_way_mode
```
> Note: Cannot switch modes while you have open positions or orders on this symbol.

### Case 8: Enable auto-margin (prevent liquidation by auto top-up)
```bash
bgc futures futures_update_config \
  --productType USDT-FUTURES \
  --symbol BTCUSDT \
  --marginCoin USDT \
  --setting autoMargin \
  --value on
```

### Case 9: COIN-FUTURES leverage setup
```bash
bgc futures futures_set_leverage \
  --productType COIN-FUTURES \
  --symbol BTCUSD \
  --marginCoin BTC \
  --leverage 10
```

---

## Recommended Setup Sequence

Before trading a new contract:
```bash
# 1. Set position mode (do this first, before any positions)
bgc futures futures_update_config --productType USDT-FUTURES --symbol BTCUSDT --marginCoin USDT --setting positionMode --value one_way_mode

# 2. Set margin mode
bgc futures futures_update_config --productType USDT-FUTURES --symbol BTCUSDT --marginCoin USDT --setting marginMode --value crossed

# 3. Set leverage
bgc futures futures_set_leverage --productType USDT-FUTURES --symbol BTCUSDT --marginCoin USDT --leverage 10

# 4. Verify settings
bgc futures futures_get_positions --productType USDT-FUTURES --symbol BTCUSDT
```

---

## Important Notes

- Cannot change `positionMode` while you have open positions or orders on that symbol
- Cannot change `marginMode` while you have an open position on that symbol
- Max leverage varies by contract and notional position size — larger positions have lower max leverage
- `holdSide` for `futures_set_leverage` is only needed in hedge mode; omit in one-way mode
- `autoMargin=on` draws from your available balance — ensure sufficient USDT to avoid unintended draws

---

## Official Docs
- Set Leverage: https://www.bitget.com/api-doc/contract/account/Set-Leverage
- Set Margin Mode: https://www.bitget.com/api-doc/contract/account/Set-Margin-Mode
- Set Position Mode: https://www.bitget.com/api-doc/contract/account/Set-Position-Mode
