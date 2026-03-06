# Error Codes

All packages return structured errors with a consistent format:

```json
{
  "ok": false,
  "error": {
    "type": "BitgetApiError",
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient USDT balance. Available: 10.5, required: 100.0",
    "suggestion": "Check your account balance with account_get_balance before placing orders."
  }
}
```

## Error Types

| Type | Description |
|---|---|
| `ConfigError` | Invalid or missing configuration (env vars, CLI flags) |
| `BitgetApiError` | Bitget API returned a non-zero business error code |
| `ValidationError` | Tool parameter failed schema validation |
| `RateLimitError` | Client-side rate limit exceeded |
| `AuthenticationError` | HMAC signature rejected by Bitget |
| `NetworkError` | Network timeout or connection failure |

## Common Error Codes

| Code | Type | Cause | Recovery |
|---|---|---|---|
| `AUTH_MISSING` | ConfigError | Private tool called without credentials | Set `BITGET_API_KEY`, `BITGET_SECRET_KEY`, `BITGET_PASSPHRASE` |
| `PARTIAL_AUTH` | ConfigError | Only some credentials set | All three env vars must be provided together |
| `CONFIG_ERROR` | ConfigError | Invalid env var value (e.g. bad timeout) | Check env var values |
| `MODULE_FILTERED` | BitgetApiError | Tool not loaded (module not enabled) | Add module to `--modules` flag |
| `TOOL_NOT_AVAILABLE` | BitgetApiError | Tool name not found in current session | Check tool name in [Tools Reference](tools-reference.md) |
| `RATE_LIMITED` | RateLimitError | Too many requests to this endpoint | Wait 1 second and retry |
| `INSUFFICIENT_BALANCE` | BitgetApiError | Account balance too low | Check balance with `account_get_balance` |
| `INVALID_SYMBOL` | BitgetApiError | Unknown trading pair | Use format `BTCUSDT` (not `BTC/USDT`) |
| `INVALID_ORDER_TYPE` | ValidationError | Wrong value for `orderType` | Use `limit` or `market` |
| `ORDER_NOT_FOUND` | BitgetApiError | Order ID does not exist | Verify order ID with `spot_get_orders` |
| `NETWORK_TIMEOUT` | NetworkError | Request timed out | Retry; increase `BITGET_TIMEOUT_MS` if persistent |

## MCP Server Error Format

The MCP server wraps errors in the MCP tool call result:

```json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "{\"tool\":\"spot_place_order\",\"ok\":false,\"error\":{...}}"
  }]
}
```

## CLI Error Format

`bgc` writes errors to stderr and exits with code 1:

```bash
$ bgc account account_get_balance
# stderr:
{
  "ok": false,
  "error": {
    "type": "ConfigError",
    "code": "AUTH_MISSING",
    "message": "No API credentials configured.",
    "suggestion": "Set BITGET_API_KEY, BITGET_SECRET_KEY and BITGET_PASSPHRASE environment variables."
  }
}
```

Check exit code in scripts:
```bash
if ! bgc account account_get_balance > /dev/null 2>&1; then
  echo "Failed to fetch balance"
fi
```
