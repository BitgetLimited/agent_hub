# Bitget Demo Trading

Demo Trading lets you trade with virtual funds in a real-market environment.
Use it to test strategies without risking real money.

## Prerequisites

1. Log in to https://www.bitget.com
2. Switch to Demo Trading mode (toggle in the top navigation bar)
3. Go to **Personal Center → API Key Management**
4. Create a **Demo API Key** with Trade permissions
5. Note: Demo API Keys are completely separate from live trading keys

## Using Demo Mode with bgc CLI

Set your Demo API Key credentials as environment variables:

```bash
export BITGET_API_KEY="your-demo-api-key"
export BITGET_SECRET_KEY="your-demo-secret-key"
export BITGET_PASSPHRASE="your-demo-passphrase"
```

Then add `--paper-trading` flag to any bgc command:

```bash
# Check demo account balance
bgc --paper-trading account get_account_assets

# Place a demo spot order
bgc --paper-trading spot spot_place_order --orders '[{"symbol":"BTCUSDT","side":"buy","orderType":"market","size":"0.01"}]'

# Check demo futures positions
bgc --paper-trading futures futures_get_positions --productType USDT-FUTURES

# Place a demo futures order
bgc --paper-trading futures futures_place_order --orders '[{"symbol":"BTCUSDT","productType":"USDT-FUTURES","marginCoin":"USDT","size":"0.01","side":"open_long","orderType":"market"}]'
```

## Using Demo Mode with bitget-mcp

Start the MCP server with the `--paper-trading` flag:

```bash
bitget-mcp --paper-trading --modules spot,futures,account
```

All tools in that MCP session will operate in demo mode.

## Important Caveats

- **Demo keys ≠ Live keys**: Never mix them. Demo keys only work with `--paper-trading`.
- **Virtual funds only**: No real money is involved; balances reset periodically.
- **Real market data**: Prices reflect live market conditions.
- **All modules supported**: Spot, futures, account, etc. all work in demo mode.
