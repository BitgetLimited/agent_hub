# Feed Routing Reference

Internal use only — do not expose these keys or categories to the user.

## Feed Key Table

| Category | Keys |
|----------|------|
| Core crypto | `cointelegraph,coindesk,decrypt,blockworks,the_defiant` |
| Extended crypto | `bitcoinist,watcherguru,cryptonews_com,u_today,newsbtc,ambcrypto` |
| Macro/policy | `cnbc,fed,coincenter,rekt` |
| KOL/research | `hayes,vitalik,cobie,messari` |
| Tech/AI | `hackernews,techcrunch,theverge,wired,arstechnica` |
| Geo/world | `bbc_world,npr,guardian,aljazeera,nhk` |
| Community | `reddit_tech,reddit_worldnews,reddit_economics,reddit_ml` |
| Chinese crypto | `blockbeats` |
| Japanese crypto | `coinpost` |

## Query Strategy by Use Case

### Breaking crypto news
`feeds="cointelegraph,coindesk,decrypt,blockworks"` — fastest major outlets

### DeFi / on-chain focus
`feeds="the_defiant,blockworks,decrypt"` + `keyword="DeFi"` or `keyword="on-chain"`

### Regulatory / policy
`feeds="coincenter,cnbc,coindesk"` + `keyword="SEC"` / `keyword="regulation"`

### Fed / monetary policy
`feeds="cnbc,fed"` + `keyword="Fed"` / `keyword="FOMC"`

### Altcoin-specific
`feeds="all"` + `keyword="{coin name or ticker}"`, `limit=10`

### Deep research / opinion
`feeds="hayes,vitalik,cobie,messari"` — for in-depth takes, not breaking news

### Chinese crypto market
`feeds="blockbeats"` — covers Chinese-language crypto news in English/Chinese

### Japanese crypto market
`feeds="coinpost"` — Japan-focused crypto coverage

## Keyword Tips

- Use English even for Chinese/Japanese news queries — feed aggregator normalizes titles
- For coin names, try both the full name and ticker: `keyword="Solana"` or `keyword="SOL"`
- For regulatory topics, try: `keyword="SEC"`, `keyword="CFTC"`, `keyword="MiCA"`, `keyword="regulation"`
- For macro: `keyword="CPI"`, `keyword="FOMC"`, `keyword="rate cut"`, `keyword="tariff"`
- For ETF: `keyword="ETF"`, `keyword="spot ETF"`, `keyword="BlackRock"`, `keyword="Fidelity"`

## Social Platform Keys (`social_trending`)

| Platform | Coverage |
|----------|----------|
| `weibo` | Chinese microblog — broad public sentiment |
| `douyin` | Chinese short video — viral/trending topics |
| `bilibili` | Chinese video platform — tech/finance-leaning audience |
| `github` | Global developer trending repos |
| `zhihu` | Chinese Q&A platform — informed discussion |
| `baidu` | Chinese search trending |
| `toutiao` | Chinese news aggregator trending |
| `xueqiu` | Chinese stock & crypto investor community |

## Error Behavior

Failed feeds return: `{"feed": "feed_key", "error": "error_message"}`

Strategy: skip silently. Never mention the failing feed name to the user.
If all feeds in a category fail, say: "news data from some sources is temporarily unavailable."
