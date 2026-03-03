# Bitget API Authentication Setup

## Environment Variables (recommended)

Set these before running bgc:

```bash
export BITGET_API_KEY="your-api-key"
export BITGET_SECRET_KEY="your-secret-key"
export BITGET_PASSPHRASE="your-passphrase"
```

## Get API Credentials

1. Log in to https://www.bitget.com
2. Go to Settings → API Management
3. Create a new API key with the permissions you need:
   - Read Only: for market data and account queries
   - Trade: for placing/cancelling orders

## Read-Only Mode

To prevent any write operations:
```bash
bgc --read-only spot spot_get_ticker --symbol BTCUSDT
```
