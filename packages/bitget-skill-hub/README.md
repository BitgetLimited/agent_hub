# bitget-skill-hub

One-click installer for **Bitget Skill Hub** — 5 official Bitget market-analysis skills for Claude Code, Codex, and OpenClaw.

## Install

```bash
# Install skills + configure market-data MCP (Claude Code default)
npm install -g bitget-skill-hub

# Install to all supported AI tools
npx bitget-skill-hub --target all

# Install to specific targets
npx bitget-skill-hub --target claude,codex

# Interactive mode
npx bitget-skill-hub --interactive
```

## Skills included

| Skill | What it does |
|-------|-------------|
| `macro-analyst` | Macro & cross-asset analysis — Fed policy, yield curve, BTC vs DXY/Nasdaq/Gold |
| `market-intel` | On-chain & institutional intelligence — ETF flows, whale activity, DeFi TVL |
| `news-briefing` | News aggregation & narrative synthesis — morning briefings, keyword search |
| `sentiment-analyst` | Sentiment & positioning analysis — Fear & Greed, long/short ratios, funding rates |
| `technical-analysis` | Technical analysis — 23 crypto indicators, 6 categories (Trend, Volatility, Oscillator, Volume, Momentum, S/R) |

## Requirements

- Skills use the **market-data MCP server** (configured automatically on install). No API key required — all market data is public.
- **`technical-analysis`** skill requires Python with `pandas` and `numpy`: `pip install pandas numpy`
