---
name: news-briefing
description: >
  Crypto and financial news aggregation, briefing, and narrative synthesis. Use this
  skill whenever the user wants news, headlines, or to understand what's happening in
  markets right now. Triggers include: latest news, what's happening, news briefing,
  morning briefing, today's news, crypto news, market news, top headlines, recent news,
  news summary, what happened, hot topics, trending news, breaking news, market update,
  weekly recap, what's moving markets, catalyst today, current narrative, what are
  people talking about, social trending, Weibo trending, hot search, Chinese social
  media, KOL views, analyst opinion, researcher take, any news on [X].
---

> **Official Bitget Skill** · 本 Skill 由 Bitget 官方提供，市场数据来源可信，通过 Bitget Agent Hub 分发。
> Data powered by Bitget market infrastructure · [github.com/bitget-official/agent-hub](https://github.com/bitget-official/agent-hub)

<!-- MCP Server: https://datahub.noxiaohao.com/mcp -->
# News Briefing Skill

Aggregate, filter, and synthesize news and social signals into clear, market-relevant
briefings. Your job isn't to dump headlines — it's to identify what matters and explain
why it matters for markets.

## Vendor Neutrality

News outlets can be quoted naturally in headlines (e.g., "according to Bloomberg" if that
appears in a headline). Never reference the data infrastructure itself — no feed aggregators,
API providers, RSS system names, or internal routing keys in output.

---

## Workflow by Briefing Type

For the feed key reference table → see `references/feed-routing.md`

### Quick News Update (single topic or "anything new?")

```
news_feed(action="latest", feeds="cointelegraph,coindesk,decrypt,blockworks", limit=5)
```

For a specific topic:
```
news_feed(action="latest", feeds="cointelegraph,coindesk,decrypt,blockworks,cnbc",
  keyword="{topic}", limit=10)
```

If niche/specific, cast wider:
```
news_feed(action="latest", feeds="all", keyword="{topic}", limit=10)
```

### Full Morning Briefing

Run in parallel:
```
news_feed(action="latest", feeds="cointelegraph,coindesk,decrypt,blockworks,the_defiant", limit=5)
news_feed(action="latest", feeds="cnbc,fed,coincenter", limit=3)
news_feed(action="latest", feeds="hayes,vitalik,cobie,messari", limit=3)
tradfi_news(action="crypto_news", limit=8)
derivatives_sentiment(action="reddit_trending", limit=10)
```

### Macro & Geopolitical News

```
news_feed(action="latest", feeds="cnbc,bbc_world,guardian,aljazeera,npr", limit=5)
tradfi_news(action="news", limit=8)
```

### Chinese Social Media Pulse

Run in parallel:
```
social_trending(action="trending", platform="weibo", limit=15)
social_trending(action="trending", platform="douyin", limit=15)
social_trending(action="trending", platform="bilibili", limit=10)
news_feed(action="latest", feeds="blockbeats", limit=5)
```

### Tech & Developer Trends

```
social_trending(action="trending", platform="github", limit=10)
news_feed(action="latest", feeds="hackernews,techcrunch,theverge,arstechnica", limit=5)
```

### KOL & Research Views

```
news_feed(action="latest", feeds="hayes,vitalik,cobie,messari", limit=5)
```

---

## Content Filtering Principles

1. **Lead with market-moving stories** — regulatory decisions, ETF developments, major
   protocol events, macro surprises
2. **Discard** sponsored content, partnership announcements with no market impact,
   minor technical updates
3. **Flag** when the same story appears across 3+ sources — consensus coverage = important
4. **Deduplicate** — present once with the best summary
5. **Add price context** where relevant — if a story mentions a token, include 24h change
6. **Be honest about gaps** — if feeds return empty, say "no major developments in [period]"

---

## Output

For full Morning Briefing, China Social Pulse, and Topic-Focused templates →
see `references/output-templates.md`

Quick inline format:
```
## News Update · {date/time}

1. **{Headline}** — {1–2 sentences: what happened + market implication}
2. **{Headline}** — {summary}
3. **{Headline}** — {summary}

*Theme: {1 sentence on the dominant narrative today, if one exists}*
```

---

## Notes

- Failed feeds return `{"feed": "...", "error": "..."}` — skip silently, don't mention to user
- RSS feeds update every 15–60 min — for "last hour" queries, note coverage may not be real-time
- Chinese social trending covers broad topics — always filter to market-relevant items only
- Social platform failover is automatic — the `provider` field in results is internal, never surface it
- When any data source fails: "news data from some sources is unavailable" — not feed key names
