# Skill Hub

**Skill Hub** is a curated collection of plug-and-play AI skills bundled with Bitget Agent Hub. Each skill is a structured prompt that instructs Claude Code (or any compatible AI) how to use the market-data MCP server to answer a specific category of questions — turning raw API calls into coherent, analyst-grade outputs.

Skills live in `packages/bitget-skill-hub/skills/`, one subdirectory per skill, with a standard `SKILL.md` entry point.

---

## What Is a Skill?

A skill is a `SKILL.md` file with a YAML front matter `description` (used for trigger matching) and a body that defines:

- **What data to fetch** — which MCP tools to call and in what order
- **How to interpret it** — signal thresholds, frameworks, decision trees
- **How to present it** — output templates with consistent formatting
- **Error handling** — neutral language when data is unavailable

Skills are self-contained. Install with `npm install -g bitget-skill-hub` and they activate automatically in Claude Code.

---

## Bundled Skills

### `macro-analyst`
**Path:** `packages/bitget-skill-hub/skills/macro-analyst/SKILL.md`

Macro-economic and cross-asset analysis for crypto market context.

**What it does:**
- Reads the full rate environment: Fed funds, Treasury yield curve, 10Y–2Y spread
- Pulls key economic indicators: CPI, Core PCE, NFP, unemployment, GDP
- Computes BTC's rolling correlation to Gold, DXY, Nasdaq, S&P 500, VIX, 10Y yield
- Monitors global market prices: DXY, S&P 500, Nasdaq, Gold, Oil, VIX
- Tracks Chinese and Asian market context (Shanghai Composite, CNY/JPY/HKD)
- Delivers a **RISK-ON / MIXED / RISK-OFF** verdict for crypto

**Trigger phrases:** macro outlook, Fed policy, FOMC, rate cut, yield curve, recession risk, inflation, CPI, DXY, cross-asset correlation, China market, global markets…

---

### `market-intel`
**Path:** `packages/bitget-skill-hub/skills/market-intel/SKILL.md`

On-chain and institutional market intelligence — the structural layer beneath price.

**What it does:**
- Tracks Bitcoin and Ethereum **ETF flows** and institutional accumulation/distribution trends
- Surfaces **whale activity**: large transfers, exchange inflows/outflows, spot net flows
- Reads **market cycle indicators**: AHR999, Pi Cycle, Rainbow Chart, Coinbase Premium, Bubble Index, Stablecoin supply
- Monitors **DeFi structure**: TVL rankings by protocol and chain, yield pools, stablecoin market caps, protocol fees
- Identifies **trending DEX tokens** and new launches (with paid-promotion disclosure)
- Reports **network health**: ETH gas, BTC fees, mempool congestion

**Trigger phrases:** whale activity, exchange flows, ETF inflows, DeFi TVL, AHR999, rainbow chart, market cycle, DCA timing, meme coins, new token launches, gas fees…

---

### `news-briefing`
**Path:** `packages/bitget-skill-hub/skills/news-briefing/SKILL.md`

Crypto and financial news aggregation, briefing, and narrative synthesis.

**What it does:**
- Aggregates headlines from 20+ crypto, macro, tech, and geopolitical RSS feeds
- Delivers **morning briefings** combining top stories, macro/policy news, analyst views, and community pulse
- Supports **keyword-filtered topic searches** across all feeds
- Monitors **Chinese social media pulse**: Weibo, Douyin, Bilibili trending topics (filtered for market-relevant content)
- Tracks **KOL and research views** from key crypto thinkers
- Synthesizes the dominant market narrative of the day

**Trigger phrases:** latest news, morning briefing, crypto news, what's happening, market update, Weibo trending, Chinese social media, KOL views, breaking news…

---

### `sentiment-analyst`
**Path:** `packages/bitget-skill-hub/skills/sentiment-analyst/SKILL.md`

Crypto market sentiment and trader positioning analysis.

**What it does:**
- Reads the **Fear & Greed Index** with 14-day trend context
- Analyzes **long/short ratios** — both retail and top-trader accounts — to detect crowded positioning
- Monitors **funding rates** to identify over-leveraged market conditions
- Tracks **taker buy/sell ratio** for real-time buying/selling pressure
- Surfaces **open interest** trends to gauge leverage build-up or unwinding
- Scans **Reddit community buzz** for trending assets
- Synthesizes divergences between retail and smart-money positioning

**Trigger phrases:** fear and greed, long/short ratio, funding rate, open interest, overleveraged, short squeeze, market mood, community sentiment, Reddit trending…

---

### `technical-analyst`
**Path:** `packages/bitget-skill-hub/skills/technical-analyst/SKILL.md`

Technical analysis and strategy backtesting for crypto assets.

**What it does:**
- Runs **full technical analysis** on any crypto pair: RSI, MACD, Bollinger Bands, MA, EMA, ATR, support/resistance — all in one call
- **Batch scans** multiple symbols at once for a market-wide view
- Produces a clear verdict: `STRONG BULLISH` → `BULLISH` → `NEUTRAL` → `BEARISH` → `STRONG BEARISH`
- Identifies **price levels**: key support/resistance zones with ATR-based stop suggestions
- **Backtests trading strategies** against historical data — compares strategy returns vs buy-and-hold, Sharpe ratio, max drawdown, win rate, profit factor
- Supports all timeframes from scalp (`5m`) to position (`1w`)

**Trigger phrases:** RSI, MACD, Bollinger Bands, EMA, support/resistance, overbought, oversold, buy signal, backtest, 4h analysis, should I buy/sell…

---

## Using Skills Together

The five skills are designed to complement each other for a complete market picture:

| Question type | Skills to combine |
|---------------|-------------------|
| Full market assessment | `macro-analyst` + `sentiment-analyst` + `technical-analyst` |
| Is now a good time to buy BTC? | `market-intel` (cycle position) + `sentiment-analyst` (positioning) + `technical-analyst` (entry levels) |
| What's moving markets today? | `news-briefing` + `macro-analyst` |
| Is this altcoin worth looking at? | `market-intel` (DEX/on-chain) + `technical-analyst` (TA) + `sentiment-analyst` (crowd positioning) |

---

## Directory Structure

```
packages/bitget-skill-hub/skills/
├── macro-analyst/
│   └── SKILL.md          # Macro & cross-asset analysis
├── market-intel/
│   └── SKILL.md          # On-chain & institutional intelligence
├── news-briefing/
│   └── SKILL.md          # News aggregation & narrative synthesis
├── sentiment-analyst/
│   └── SKILL.md          # Sentiment & positioning analysis
└── technical-analyst/
    └── SKILL.md          # Technical analysis & backtesting
```

---

## Required MCP Server

All skills depend on the **market-data MCP server** (`https://datahub.noxiaohao.com/mcp`) for live data. Configure it in your Claude Code MCP settings before using these skills.

The server provides: `technical_analysis`, `backtest`, `crypto_market`, `defi_analytics`, `dex_market`, `sentiment_index`, `derivatives_sentiment`, `news_feed`, `social_trending`, `tradfi_news`, `network_status`, `rates_yields`, `macro_indicators`, `cross_asset`, `global_assets`, `global_data`, `cn_market`.
