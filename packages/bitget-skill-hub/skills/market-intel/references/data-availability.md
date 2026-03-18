# Data Availability Reference — Market Intelligence

## What IS Available

### Market & Price Data (`crypto_market`)
- Real-time coin prices, 24h change, volume, market cap
- Top N coins by market cap (up to 250)
- Global market stats (total market cap, BTC dominance, active coins)
- Trending coins on CoinGecko
- OHLCV history (requires CoinGecko coin ID, not trading symbol)
- Coin ID lookup via `action="search"`

### DeFi Data (`defi_analytics`)
- Protocol TVL rankings (top protocols by total value locked)
- Per-chain TVL breakdown
- Stablecoin market caps and supply
- Yield pool data (APY, TVL by pool — filter with `min_tvl`)
- Protocol fee and revenue data

### DEX Data (`dex_market`)
- Trending token pairs across DEXes (includes paid boosts — always disclose)
- Search for token pairs by name or symbol
- Token pair data by contract address
- Specific pair data by chain + pair address

### Derivatives Sentiment (used as proxy for smart money)
- Top trader long/short ratio by account count
- Top trader position ratio (by position size)
- Retail long/short ratio
- Open interest and history
- Taker buy/sell ratio
- Reddit crypto community trending

### Network Health (`network_status`)
- Ethereum gas prices (slow/standard/fast/instant in gwei)
- Bitcoin recommended fees (fastest/halfHour/hour in sat/vB)
- Bitcoin mempool stats (pending count, total fees)
- Bitcoin recent blocks

### News (as proxy for institutional flows)
- 44+ RSS/Atom feeds across crypto, macro, tech
- Keyword filtering
- Tradfi financial news and earnings calendar

---

## What is NOT Available (use proxies or inform user)

| Requested Data | Status | Proxy |
|----------------|--------|-------|
| ETF net flows (daily Grayscale/BlackRock numbers) | ❌ Not available | News keyword search for "ETF flows" |
| Exchange BTC/ETH reserve balances | ❌ Not available | Derivatives positioning as proxy |
| Whale wallet tracking | ❌ Not available | Top trader L/S ratio as proxy |
| Token unlock schedules | ❌ Not available | News search for "[token] unlock" |
| AHR999 index | ❌ Not available | 1-year price range + BTC dominance |
| Pi Cycle Top indicator | ❌ Not available | Qualitative cycle assessment |
| Rainbow Chart / log regression bands | ❌ Not available | Market dominance + stablecoin dry powder |
| Coinbase Premium Index | ❌ Not available | News search for "institutional demand" |
| Puell Multiple | ❌ Not available | Not proxied — inform user |
| MVRV ratio | ❌ Not available | Not proxied — inform user |
| NVT ratio | ❌ Not available | Not proxied — inform user |
| Lightning Network stats | ❌ Not available | — |
| NFT sales volume | ❌ Not available | DEX trending as partial proxy |
| Specific wallet addresses | ❌ Not available | — |
| Liquidation heatmaps | ❌ Not available | — |

---

## CoinGecko Coin ID vs Trading Symbol

Many `crypto_market` calls require a CoinGecko **coin ID**, not a trading symbol:

| Asset | Coin ID | Trading Symbol |
|-------|---------|---------------|
| Bitcoin | `bitcoin` | BTC, BTCUSDT |
| Ethereum | `ethereum` | ETH, ETHUSDT |
| Solana | `solana` | SOL, SOLUSDT |
| BNB | `binancecoin` | BNB, BNBUSDT |
| XRP | `ripple` | XRP, XRPUSDT |
| Avalanche | `avalanche-2` | AVAX, AVAXUSDT |
| Polygon | `matic-network` | MATIC, MATICUSDT |
| Chainlink | `chainlink` | LINK, LINKUSDT |
| Uniswap | `uniswap` | UNI, UNIUSDT |
| Dogecoin | `dogecoin` | DOGE, DOGEUSDT |
| Shiba Inu | `shiba-inu` | SHIB, SHIBUSDT |

For unknown tokens: use `crypto_market(action="search", query="{name}")` to find the coin ID.

---

## Error Language Guide

When a data source fails or data is not available:

| Situation | What to say |
|-----------|-------------|
| Tool call fails | "Data is temporarily unavailable." |
| Data category not in server | "This type of data is not available in this data source." |
| Partial data returned | "Note: [X] data is unavailable. The analysis below is based on [Y] and [Z]." |
| User asks for specific unavailable metric | "Direct [metric] data is not available here. As a proxy, [describe proxy approach]." |

Never say: provider names, API names, database names, HTTP error codes, or internal tool names.
