# Bitget Error Codes

## bgc client errors

| Code | Meaning | Recovery |
|------|---------|----------|
| `AUTH_MISSING` | No API credentials set | Set `BITGET_API_KEY`, `BITGET_SECRET_KEY`, `BITGET_PASSPHRASE` |
| `RATE_LIMITED` | Too many requests | Wait 1 second and retry |
| `INVALID_SYMBOL` | Unknown trading pair | Check format: `BTCUSDT` not `BTC/USDT` |
| `INSUFFICIENT_BALANCE` | Not enough funds | Check balance with `bgc account get_account_assets` |
| `MODULE_FILTERED` | Module not enabled | Add module with `--modules` flag |
| `TOOL_NOT_AVAILABLE` | Tool not in current session | Run `bgc <module> --help` |
| `CONFIG_ERROR` | Invalid configuration | Check env vars and flags |

## Bitget API error codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `00000` | Success | — |
| `40001` | Access denied | Check API key permissions |
| `40003` | Invalid signature | Check `BITGET_SECRET_KEY` is correct |
| `40005` | Invalid timestamp | System clock may be out of sync |
| `40006` | IP not in whitelist | Add your IP to API key whitelist |
| `40007` | Request expired | Retry the request |
| `40009` | Duplicate client order id | Use a unique `clientOid` |
| `40017` | Invalid API key | Re-check `BITGET_API_KEY` |
| `40018` | API key permissions insufficient | Enable Trade permission on API key |
| `40037` | API key does not exist | Verify key is active |
| `40786` | Insufficient balance | Transfer funds to correct account |
| `40788` | Price out of range | Adjust order price |
| `43011` | Invalid parameter | Check required fields in request |
| `43012` | Symbol does not exist | Verify symbol format (e.g. `BTCUSDT`) |
| `43025` | Order does not exist | Order may have already been filled or cancelled |
| `45110` | Minimum order size not met | Increase order size |

## Common recovery patterns

**Missing credentials:**
```bash
export BITGET_API_KEY="your-key"
export BITGET_SECRET_KEY="your-secret"
export BITGET_PASSPHRASE="your-passphrase"
```

**Wrong account type for transfer:**
- Spot account: `spot`
- USDT futures: `futures_usdt` (not `usdt-futures`)
- Funding account: `mix_usdt`

**Futures productType values:**
- USDT-margined perpetuals: `USDT-FUTURES`
- Coin-margined perpetuals: `COIN-FUTURES`
- USDC-margined perpetuals: `USDC-FUTURES`
