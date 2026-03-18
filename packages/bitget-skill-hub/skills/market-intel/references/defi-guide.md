# DeFi Analysis Guide — Market Intelligence

## DeFi Data Overview

DeFi analytics covers: protocol TVL, chain-level TVL, stablecoin supply,
yield pools, and protocol fees/revenue.

## TVL Analysis

```python
defi_analytics(action="tvl_rank", limit=20)   # Top 20 protocols by TVL
defi_analytics(action="chains", limit=10)      # TVL by blockchain
```

**What TVL tells you:**
- Rising TVL → capital flowing into DeFi → bullish on-chain activity
- Falling TVL → capital leaving DeFi → risk-off or bear market signal
- TVL concentrated in 2–3 protocols → less distributed ecosystem
- TVL spreading across many protocols → mature, healthy DeFi ecosystem

**Chain TVL interpretation:**
- Ethereum dominant (>50%) → ETH ecosystem health indicator
- Alternative L1s gaining TVL share → ecosystem rotation
- L2 TVL rising → Ethereum scaling working, fee reduction

## Stablecoin Analysis

```python
defi_analytics(action="stablecoins")
```

**What stablecoin supply tells you:**
- Total stablecoin market cap rising → new capital entering crypto as dry powder
- Total stablecoin market cap falling → capital leaving ecosystem or deployed
- USDT dominance high → centralized stablecoin preference (risk awareness)
- USDC gaining on USDT → institutional/regulated demand
- DAI/FRAX/LUSD growing → DeFi-native activity expanding

**Dry powder signal:**
High stablecoin supply relative to total market cap = significant capital waiting to deploy.
This is a bullish leading indicator — stablecoins don't stay idle forever.

## Yield Pool Analysis

```python
defi_analytics(action="yields", min_tvl=10000000)   # Min $10M TVL for liquidity
```

Use `min_tvl=10000000` ($10M) as the baseline filter. Below this, pools lack
sufficient liquidity for meaningful comparison.

For user-specific queries, adjust filter:
- Conservative yield seekers: `min_tvl=100000000` ($100M)
- Broader overview: `min_tvl=5000000` ($5M)

**Yield interpretation:**
- APY > 100%: Typically unsustainable token emissions — high impermanent loss risk
- APY 20–100%: Incentivized pools — check token inflation rate
- APY 5–20%: Moderate yield — check if from real fees or emissions
- APY < 5%: Usually fee-based yield — more sustainable

**Pool types by risk:**
1. Stablecoin/stablecoin pools — lowest IL risk, yield from fees + emissions
2. ETH/stablecoin pools — moderate IL, correlated to ETH price
3. Altcoin/stablecoin pools — high IL risk, high APY common
4. Altcoin/altcoin pools — highest IL risk

## Protocol Fee Revenue

```python
defi_analytics(action="fees")
```

Fee revenue = real economic activity. Compare:
- Fees: total fees paid by users
- Revenue: fees retained by protocol (after LP share)

**Revenue/fee ratio:**
- High ratio (protocol keeps most fees) → protocol-friendly tokenomics
- Low ratio (most goes to LPs) → LP-friendly, user acquisition focus

**Protocols with high fee revenue are healthier businesses** — more sustainable
than those relying purely on token emissions.

## Cross-DeFi Signals

### DeFi Health Composite
Strong: TVL rising + stablecoin supply growing + fee revenue stable/up
Weak: TVL falling + stablecoin supply shrinking + fee revenue declining
Mixed: one indicator diverging from others — investigate which

### Altcoin Season Leading Indicator
DeFi TVL in altcoin ecosystems (Solana, Avalanche, BNB Chain) rising significantly
often precedes altcoin price appreciation by 2–4 weeks.

### Stablecoin Depeg Monitoring
If user asks about stablecoin health, check:
- USDC, USDT, DAI market caps vs their $1 peg
- `defi_analytics(action="stablecoins")` returns current prices
- Any stablecoin showing > 0.5% depeg warrants mention

## Output Template

```
## DeFi Market Structure
*{date}*

### TVL Overview
Total DeFi TVL: ${value}B ({trend vs prior period})

**Top Protocols by TVL:**
| Protocol | TVL | Chain | 7d Change |
|----------|-----|-------|-----------|
| {name} | ${value}B | {chain} | {+/-pct}% |

### Chain Distribution
| Chain | TVL | Share |
|-------|-----|-------|
| Ethereum | ${value}B | {pct}% |
| {chain} | ${value}B | {pct}% |

### Stablecoin Dry Powder
Total stablecoin market cap: ${value}B ({trend})
Interpretation: {rising = dry powder building / falling = capital deployed or leaving}

### Best Yield Opportunities (≥$10M TVL)
| Pool | APY | TVL | Risk |
|------|-----|-----|------|
| {pool} | {pct}% | ${value}M | {low/medium/high} |

### DeFi Health Assessment
{2–3 sentences: What does the combination of TVL trend, stablecoin supply,
and fee revenue suggest about the health and momentum of DeFi right now?}
```
