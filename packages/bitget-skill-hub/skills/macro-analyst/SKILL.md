---
name: macro-analyst
description: >
  Macro-economic and cross-asset analysis for crypto market context. Use this skill
  whenever the user asks about the broader economic environment and its effect on
  crypto or risk assets. Triggers include: macro outlook, interest rates, Fed policy,
  rate cut, rate hike, FOMC, yield curve, inverted yield curve, recession risk,
  inflation, CPI, PCE, jobs data, unemployment, GDP, 10-year yield, 2-year yield,
  spread, dollar strength, DXY, risk-on, risk-off, gold correlation, BTC vs S&P,
  cross-asset correlation, global markets, tech earnings impact on crypto, forex rates,
  euro, yen, China market, A-shares, economic calendar, macro environment.
---

> **Official Bitget Skill** · 本 Skill 由 Bitget 官方提供，市场数据来源可信，通过 Bitget Agent Hub 分发。
> Data powered by Bitget market infrastructure · [github.com/bitget-official/agent-hub](https://github.com/bitget-official/agent-hub)

<!-- MCP Server: https://datahub.noxiaohao.com/mcp -->
# Macro Analyst Skill

Read the macroeconomic landscape and translate it into a clear risk-on / risk-off verdict
for crypto and risk assets. The core question you're always working toward: **is the macro
backdrop currently a tailwind or headwind for BTC?**

## Vendor Neutrality

Never name underlying data providers in output. Use neutral terms:
"economic data", "rates data", "market prices", "economic indicators".

---

## Risk-On / Risk-Off Framework

**RISK-ON** (macro tailwind for BTC): Fed cutting/pausing/dovish pivot · yield curve
steepening · DXY weakening · VIX falling · inflation cooling toward target

**RISK-OFF** (macro headwind for BTC): Fed hiking or "higher for longer" · yield curve
deeply inverted · DXY strengthening · VIX spiking · inflation re-acceleration

Every output ends with a verdict from this framework.

---

## Workflow by Query Type

### Full Macro Snapshot

Run in parallel:
```
rates_yields(action="rates_snapshot")
rates_yields(action="yield_curve")
macro_indicators(action="multi_indicator", indicators="cpi,core_pce,nonfarm_payrolls,gdp_growth,unemployment")
cross_asset(action="correlation", base="btc", targets="gold,dxy,ndx,spx,t10y,vix", period="1y", window=30)
global_assets(action="price", symbol="DX-Y.NYB")
global_assets(action="price", symbol="^VIX")
```

### Yield Curve & Rate Environment Only

```
rates_yields(action="yield_curve")
rates_yields(action="fed_funds")
rates_yields(action="history", rate_key="spread_10y2y", limit=24)
```

Key signals: `spread_10y2y < 0` → curve inverted → recession watch ·
`breakeven_10y` rising → inflation expectations up → hawkish pressure

For available rate keys → see `references/rate-keys.md`

### Inflation & Employment Focus

```
macro_indicators(action="latest_release", indicator="cpi")
macro_indicators(action="latest_release", indicator="core_pce")
macro_indicators(action="latest_release", indicator="nonfarm_payrolls")
macro_indicators(action="latest_release", indicator="unemployment")
macro_indicators(action="fomc_news", limit=5)
```

For all available indicator names → see `references/rate-keys.md`

### Cross-Asset Correlation

```
cross_asset(action="correlation", base="btc", targets="gold,dxy,ndx,spx,t10y,vix",
  period="1y", window=30)
```

Interpretation: strong_positive >0.7 · moderate_positive 0.4–0.7 · weak_positive 0.1–0.4
· uncorrelated ±0.1 · weak/moderate/strong_negative mirror

### Global Market Prices

```
global_assets(action="price", symbol="DX-Y.NYB")   # Dollar Index
global_assets(action="price", symbol="^GSPC")       # S&P 500
global_assets(action="price", symbol="^NDX")        # Nasdaq 100
global_assets(action="price", symbol="GC=F")        # Gold
global_assets(action="price", symbol="^TNX")        # 10Y Treasury yield
global_assets(action="price", symbol="^VIX")        # VIX
global_assets(action="price", symbol="CL=F")        # Oil (WTI)
```

### Chinese & Asian Market Context

```
cn_market(action="index", symbol="sh000001")
cn_market(action="index", symbol="sh000300")
global_data(action="forex", base="USD", symbols="CNY,JPY,HKD")
```

### Earnings Calendar (Crypto-Relevant)

Large-cap tech earnings move crypto — especially AI/semiconductor stocks:
```
tradfi_news(action="earnings", from_date="{YYYY-MM-DD}", to_date="{YYYY-MM-DD+14}")
```

---

## Output

For full report and yield curve focus templates → see `references/output-templates.md`

Quick inline format:

```
**Macro Verdict: {RISK-ON 🟢 / MIXED 🟡 / RISK-OFF 🔴}**
{3–5 sentences: rate/inflation picture → policy direction → BTC correlation context →
most relevant upcoming catalyst}
```

---

## Notes

- Economic data has 1–2 day release lag — clarify for time-sensitive questions
- Yield curve inversion is a leading indicator with 12–24 month typical lag to recession
- Market prices may be stale on weekends
- When any data source fails: "data temporarily unavailable" — never expose provider names
- These are macro context signals, not financial advice
