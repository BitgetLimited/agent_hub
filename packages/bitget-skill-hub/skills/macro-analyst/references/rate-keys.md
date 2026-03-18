# Rate Keys & Indicator Reference

## Available Rate Keys (`rates_yields`)

| Key | Description |
|-----|-------------|
| `t3m` | 3-Month Treasury yield |
| `t1y` | 1-Year Treasury yield |
| `t2y` | 2-Year Treasury yield |
| `t5y` | 5-Year Treasury yield |
| `t10y` | 10-Year Treasury yield |
| `t30y` | 30-Year Treasury yield |
| `fed_funds` | Effective Federal Funds Rate |
| `fed_funds_target_upper` | Fed Funds target upper bound |
| `fed_funds_target_lower` | Fed Funds target lower bound |
| `spread_10y2y` | 10Y–2Y yield spread (recession indicator) |
| `breakeven_10y` | 10Y breakeven inflation rate |
| `sofr` | Secured Overnight Financing Rate |
| `prime_rate` | US Prime Rate |
| `mortgage_30y` | 30-Year mortgage rate |
| `hy_spread` | High Yield credit spread |
| `ig_spread` | Investment Grade credit spread |
| `tips_10y` | 10-Year TIPS yield (real rate) |

## Available Macro Indicators (`macro_indicators`)

| Indicator | Description |
|-----------|-------------|
| `cpi` | Consumer Price Index (YoY%) |
| `core_cpi` | Core CPI (ex food & energy) |
| `pce` | Personal Consumption Expenditures |
| `core_pce` | Core PCE (Fed's preferred inflation measure) |
| `nonfarm_payrolls` | Non-Farm Payrolls (monthly jobs added) |
| `unemployment` | Unemployment rate (%) |
| `gdp` | GDP (level) |
| `gdp_growth` | GDP growth rate (QoQ annualized) |
| `retail_sales` | Retail Sales (MoM%) |
| `industrial_production` | Industrial Production index |
| `ppi` | Producer Price Index |
| `consumer_sentiment` | University of Michigan Consumer Sentiment |
| `ism_manufacturing` | ISM Manufacturing PMI |
| `housing_starts` | New residential construction starts |
| `initial_claims` | Initial jobless claims (weekly) |
| `m2` | M2 Money Supply |

## Built-in Cross-Asset Keys (`cross_asset`)

| Key | Asset |
|-----|-------|
| `btc` | Bitcoin (BTC-USD) |
| `eth` | Ethereum (ETH-USD) |
| `gold` | Gold (GC=F) |
| `silver` | Silver (SI=F) |
| `oil` | WTI Crude Oil (CL=F) |
| `dxy` | US Dollar Index (DX-Y.NYB) |
| `spx` | S&P 500 (^GSPC) |
| `ndx` | Nasdaq 100 (^NDX) |
| `dji` | Dow Jones Industrial Average (^DJI) |
| `vix` | CBOE Volatility Index (^VIX) |
| `t10y` | 10-Year Treasury yield (^TNX) |
| `t2y` | 2-Year Treasury yield (^IRX) |
| `eur` | EUR/USD |
| `jpy` | USD/JPY |
| `gbp` | GBP/USD |

## Signal Thresholds

### Yield Curve Interpretation
- `spread_10y2y > 0` → Normal curve (growth expected)
- `spread_10y2y < 0` → Inverted curve (recession watch — typically leads recession by 12–24 months)
- `spread_10y2y < -0.5` → Deep inversion (elevated recession probability)

### Inflation Regime
- Core PCE < 2%: Below target → dovish pressure
- Core PCE 2–2.5%: On target → neutral
- Core PCE > 2.5%: Above target → hawkish pressure
- Core PCE > 3%: Significantly above → active tightening

### Labor Market
- Unemployment < 4%: Tight labor market → wage pressure → hawkish
- Unemployment > 5%: Slack → dovish room
- NFP < 100k: Weak → dovish signal
- NFP > 250k: Strong → hawkish signal
