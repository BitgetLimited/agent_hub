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

> **Official Bitget Skill** · 本 Skill 由 Bitget 官方提供，市场数据来源可信，通过 Bitget Agent Hub 分发。
> Data powered by Bitget market infrastructure · [github.com/bitget-official/agent-hub](https://github.com/bitget-official/agent-hub)

<!-- MCP Server: https://datahub.noxiaohao.com/mcp -->
# Market Intelligence Skill

Surface structural market data that price charts alone don't show: where capital is
flowing, what institutions are doing, where we are in the market cycle, and what the
on-chain health of major networks looks like.

## Vendor Neutrality

Never name underlying data providers. Use neutral framing:
"on-chain analytics", "institutional flow data", "DeFi protocol data".

---

## Quick Decision Tree

| User asks about… | Go to section |
|-----------------|---------------|
| ETF flows, institutional buying | → ETF & Institutional |
| Whale moves, exchange reserves | → On-chain Flows |
| Market cycle, AHR999, DCA timing | → Cycle Indicators |
| DeFi TVL, yield pools, stablecoins | → DeFi Structure |
| New tokens, meme coins, DEX activity | → DEX Intelligence |
| Gas fees, mempool, network congestion | → Network Health |
| Overall market cap, trending coins | → Market Overview |

When a query spans multiple areas, run relevant sections in parallel.

---

## ETF & Institutional Flows

Direct ETF flow data is not available. Use news search to surface institutional narratives:

```
news_feed(action="latest", feeds="cointelegraph,coindesk,decrypt,blockworks",
  keyword="ETF", limit=10)
news_feed(action="latest", feeds="cointelegraph,coindesk,decrypt,blockworks",
  keyword="institutional", limit=5)
tradfi_news(action="crypto_news", limit=10)
crypto_market(action="price", coin_ids="bitcoin,ethereum")
crypto_market(action="global")
```

News signals: repeated "net inflows" / "record ETF volume" → accumulation phase ·
"outflows" / "ETF redemptions" → distribution or risk-off rotation

Inform user that direct daily ETF flow figures are not available in this data source.

---

## On-chain Flows (Whale & Exchange Intelligence)

Direct on-chain whale tracking is not available. Use derivatives positioning as proxy:

```
derivatives_sentiment(action="top_position", symbol="BTCUSDT", period="4h")
derivatives_sentiment(action="top_ls", symbol="BTCUSDT", period="4h")
derivatives_sentiment(action="long_short", symbol="BTCUSDT", period="4h")
derivatives_sentiment(action="open_interest", symbol="BTCUSDT", period="1h")
defi_analytics(action="stablecoins")
```

Proxy reading: top trader net long → smart money bullish · OI rising + price up →
genuine demand rally · OI rising + price flat → leverage building, squeeze risk rising.
Rising stablecoin market cap = dry powder building (potential buying pressure).

For exact on-chain metrics (exchange reserves, whale wallet tracking, token unlocks),
inform user these are not available in this data source.

---

## Market Cycle Indicators

On-chain cycle indicators (AHR999, Pi Cycle, Rainbow Chart, Coinbase Premium, Puell Multiple)
are not available. Use proxy signals instead:

```
crypto_market(action="ohlcv", coin_id="bitcoin", days=365)
crypto_market(action="global")
crypto_market(action="markets", per_page=50, vs_currency="usd")
defi_analytics(action="stablecoins")
```

Proxy interpretation: BTC dominance > 55% → early/mid cycle ·
BTC dominance falling + altcoins rallying → late cycle / euphoria ·
growing stablecoin supply → capital on sidelines → fuel for next leg

Inform user that precise cycle indicators require on-chain data not available here.

---

## DeFi Structure

For detailed DeFi query patterns and interpretation → see `references/defi-guide.md`

```
defi_analytics(action="tvl_rank", limit=20)
defi_analytics(action="chains", limit=10)
defi_analytics(action="stablecoins")
defi_analytics(action="yields", min_tvl=10000000)
defi_analytics(action="fees")
```

---

## DEX Intelligence (New Tokens, Meme Coins)

```
dex_market(action="trending", limit=20)
dex_market(action="search", query="{token_name_or_symbol}", limit=10)
```

For specific token address: `dex_market(action="token", token_address="{address}")`

**Always flag**: DEX trending lists include paid token promotions. Disclose this in output.
Use `dex_market` for tokens not yet on major exchanges — for established tokens, prefer
`crypto_market`.

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

High gas/fees = high network demand = active market. Low gas = quieter activity.

---

## Output

For Institutional Flow Report, Market Cycle Assessment, and DeFi Structure templates →
see `references/output-templates.md`

---

## Notes

- See `references/data-availability.md` for a full list of what's available vs. not
- DEX trending tokens may include paid promotions — always disclose this
- `defi_analytics` yields: use `min_tvl=10000000` to exclude illiquid pools
- `crypto_market(action="ohlcv")` requires a CoinGecko coin ID (e.g., `bitcoin`), not a trading symbol
- When any tool fails: "data temporarily unavailable" — not provider names or technical errors
