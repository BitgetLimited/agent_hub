---
name: market-intel
description: >
  On-chain and institutional market intelligence — the structural layer beneath price.
  Use this skill whenever the user asks about: whale activity, exchange flows, token
  unlocks, ETF inflows/outflows, institutional buying or selling, DeFi TVL, yield
  opportunities, DEX trending tokens, meme coins, new token launches, market cycle
  indicators, AHR999, Pi Cycle, rainbow chart, accumulation zone, BTC market cycle,
  is now a good time to DCA, Coinbase premium, stablecoin supply, on-chain health,
  ETH gas, BTC fees, mempool, market cap rankings, or anything about what large holders
  and institutions are doing with their coins.
---

<!-- MCP Server: https://datahub.noxiaohao.com/mcp -->
# Market Intelligence Skill

Surface structural market data that price charts alone don't show: where capital is
flowing, what institutions are doing, where we are in the market cycle, and what the
on-chain health of major networks looks like.

## Vendor Neutrality

Never name the underlying data providers in your output. Use neutral framing:
"on-chain analytics", "institutional flow data", "DeFi protocol data", "derivatives
analytics". The data sources are internal; the intelligence is yours to synthesize.

---

## Quick Decision Tree

Match the user's question to the right data module:

| User asks about… | Go to section |
|-----------------|---------------|
| ETF flows, institutional buying | → ETF & Institutional |
| Whale moves, exchange reserves, large transfers | → On-chain Flows |
| Market cycle, AHR999, rainbow chart, DCA timing | → Cycle Indicators |
| DeFi TVL, yield pools, stablecoins | → DeFi Structure |
| New tokens, meme coins, DEX activity | → DEX Intelligence |
| Gas fees, mempool, network congestion | → Network Health |
| Overall market cap, trending coins | → Market Overview |

When a query spans multiple areas, run the relevant sections in parallel.

---

## ETF & Institutional Flows

```
crypto_derivatives(action="etf_flow", coin="bitcoin")
crypto_derivatives(action="etf_net_assets", coin="bitcoin")
```
For Ethereum ETF: replace `coin="bitcoin"` with `coin="ethereum"`.

Key interpretation:
- Consecutive days net positive → institutional accumulation phase
- Consecutive days net negative → distribution or risk-off rotation
- Single day outliers → less meaningful than 3–5 day trends

---

## On-chain Flows (Whale & Exchange Intelligence)

Run in parallel:
```
crypto_derivatives(action="whale_transfers", symbol="BTC", limit=10)
crypto_derivatives(action="coin_flow", symbol="BTC")
crypto_derivatives(action="exchange_balance", symbol="BTC")
crypto_derivatives(action="spot_netflow", symbol="BTC")
```

Reading the flows:
- **Exchange outflow** (coins leaving) → accumulation → bullish supply pressure relief
- **Exchange inflow** (coins arriving) → potential selling → bearish supply pressure
- **Whale transfer to exchange** → possible distribution → watch for sell pressure
- **Whale transfer from exchange** → self-custody or OTC → longer-term hold signal

For upcoming supply shocks:
```
crypto_derivatives(action="token_unlocks", limit=20)
```
Flag any unlock > 1% of circulating supply as potentially market-moving.

---

## Market Cycle Indicators

Use `valuation_indices` for a comprehensive snapshot (runs ~6 parallel sub-requests):
```
crypto_derivatives(action="valuation_indices")
```
Returns: AHR999, Puell Multiple, Stock-to-Flow, Pi Cycle, Rainbow Chart,
Bubble Index, Coinbase Premium, Stablecoin Mcap trend, Bull Market Peak signals.

Or call individually if only one is needed:
```
crypto_derivatives(action="ahr999")          # < 0.45 = accumulate, > 1.2 = overvalued
crypto_derivatives(action="pi_cycle")        # Top signal when two MAs converge
crypto_derivatives(action="rainbow_chart")   # Price band position in log-scale model
crypto_derivatives(action="coinbase_premium") # US buyer premium vs global — institutional demand proxy
crypto_derivatives(action="bubble_index")    # Multi-factor bubble risk score
crypto_derivatives(action="stablecoin_mcap") # Stablecoin supply growth = dry powder
```

---

## DeFi Structure

```
defi_analytics(action="tvl_rank", limit=20)
defi_analytics(action="chains", limit=10)
defi_analytics(action="stablecoins")
defi_analytics(action="yields", min_tvl=10000000)   # Filters out illiquid pools
defi_analytics(action="fees")
```

For yield queries, filter results by `chain="Ethereum"` if user specifies.
Flag `min_tvl=10000000` as the minimum for meaningful liquidity.

---

## DEX Intelligence (New Tokens, Meme Coins)

```
dex_market(action="trending", limit=20)
dex_market(action="search", query="{token_name_or_symbol}", limit=10)
```
For a specific token address: `dex_market(action="token", token_address="{address}")`

**Always flag**: DEX trending lists include paid token promotions. Note this in output.
Use `dex_market` for tokens not yet on major exchanges — for established tokens, prefer `crypto_market`.

---

## Market Overview & Rankings

```
crypto_market(action="global")
crypto_market(action="markets", per_page=50, vs_currency="usd")
crypto_market(action="trending")
```

---

## Network Health

```
network_status(action="eth_gas")      # Ethereum: slow/standard/fast/instant gwei
network_status(action="btc_fees")     # Bitcoin: fastestFee/halfHourFee sat/vB
network_status(action="btc_mempool")  # Bitcoin: pending tx count, total fee
```

High gas/fees = high network demand = active market.
Low gas = quieter on-chain activity.

---

## Output Templates

### Institutional Flow Report
```
## Institutional Flow Intelligence — {ASSET}
*{date}*

### ETF Activity
- Today's net flow: {+/-}${amount}M
- 5-day trend: {Accumulation / Distribution / Mixed}
- Total assets under management: ${amount}B

### Signal
{1–2 sentences: What is the institutional money doing? Is this a sustained trend
or a one-day anomaly? How does this compare to recent weeks?}
```

### On-chain Intelligence Report
```
## On-chain Intelligence — {ASSET}
*{date/time}*

### Exchange Flow (24h)
Net flow: {+/-}{amount} {ASSET} → **{Accumulation / Distribution}**

### Whale Activity
{Top 3 notable transfers with direction and size, or "No anomalous transfers"}

### Supply Pressure Outlook
{1–2 sentences on what the flows suggest about near-term selling pressure}
```

### Market Cycle Assessment
```
## Market Cycle Intelligence — BTC
*{date}*

| Indicator | Value | Zone |
|-----------|-------|------|
| AHR999 | {value} | {Accumulate / Fair Value / Overvalued} |
| Rainbow Band | {color/name} | {zone description} |
| Coinbase Premium | {+/-}{value} | {US demand premium / neutral / discount} |
| Bubble Index | {value} | {Low / Medium / High} |
| Pi Cycle | {status} | {No signal / Approaching / TOP signal} |
| Stablecoin Supply | {trend} | {Dry powder building / Deployed / Shrinking} |

### Cycle Assessment
{2–3 sentences: Where does the weight of evidence point in the market cycle?
Is this an accumulation zone, mid-bull, late-bull, or distribution phase?
What does this mean for DCA or lump-sum decisions?}
```

---

## Notes

- `valuation_indices` makes ~6 parallel sub-requests — allow 5–10s for response
- ETF flow data reflects the **prior business day** (T+1 reporting lag)
- Token unlock data: express unlock size as % of circulating supply for context
- DEX trending tokens may include paid promotions — always disclose this
- If `crypto_derivatives` returns `{"error": "..."}`, note "some on-chain data is currently unavailable" — never name the underlying provider or API key requirement
- When any tool fails, use neutral language: "data temporarily unavailable" not provider names or technical error details
