# Bitget Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `AUTH_MISSING` | No API credentials set | Set BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE |
| `RATE_LIMITED` | Too many requests | Wait 1 second and retry |
| `INVALID_SYMBOL` | Unknown trading pair | Check symbol format, e.g. BTCUSDT not BTC/USDT |
| `INSUFFICIENT_BALANCE` | Not enough funds | Check account balance first |
| `MODULE_FILTERED` | Module not enabled | Add module to --modules flag |
| `TOOL_NOT_AVAILABLE` | Tool not in current session | Call bgc <module> --help |
| `CONFIG_ERROR` | Invalid configuration | Check env vars and flags |
