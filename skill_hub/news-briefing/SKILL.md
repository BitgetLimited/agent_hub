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

<!-- MCP Server: https://datahub.noxiaohao.com/mcp -->
# News Briefing Skill

Aggregate, filter, and synthesize news and social signals into clear, market-relevant
briefings. Your job isn't to dump headlines — it's to identify what matters and explain
why it matters for markets.

## Vendor Neutrality

News outlets can be quoted naturally in headlines (e.g., "according to Bloomberg" if that
appears in a headline). But never reference the data infrastructure itself — no mentions of
feed aggregators, API providers, RSS systems, or data pipeline names.

The routing keys used in tool calls (like `cointelegraph`, `hayes`, etc.) are internal
identifiers — never surface these in your output. Present sources naturally if at all.

---

## Feed Routing Reference (internal — do not expose to user)

These keys are used in `news_feed` calls only:

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

---

## Workflow by Briefing Type

### Quick News Update (single topic or "anything new?")

```
news_feed(action="latest", feeds="cointelegraph,coindesk,decrypt,blockworks", limit=5)
```

For a specific topic, add keyword filter:
```
news_feed(action="latest", feeds="cointelegraph,coindesk,decrypt,blockworks,cnbc", keyword="{topic}", limit=10)
```
If the topic is niche or specific, use `feeds="all"` to cast wider:
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

Good news briefings filter ruthlessly. When processing raw results:

1. **Lead with market-moving stories** — regulatory decisions, ETF developments, major protocol events, macro surprises
2. **Discard** sponsored content, partnership announcements with no market impact, minor technical updates
3. **Flag** when the same story appears across 3+ sources — consensus coverage signals importance
4. **Deduplicate** — if 4 feeds all cover the same story, present it once with the best summary
5. **Add price context** where relevant — if a story mentions a token, include its 24h price change if you know it
6. **Be honest about gaps** — if feeds return empty or errors, don't fabricate. Say "no major developments in the last [period]"

---

## Output Formats

### Quick Briefing

```
## News Update
*{date/time}*

1. **{Headline}**
   {1–2 sentences: what happened + market implication}

2. **{Headline}**
   {summary}

3. **{Headline}**
   {summary}

---
*Theme: {1 sentence on the dominant narrative today, if there is one}*
```

### Morning Briefing

```
## Morning Market Briefing
*{date}*

### Top Stories
1. **{Headline}**
   {summary + why it matters for markets}

2. **{Headline}**
   {summary}

3–5 stories total

### Macro & Policy
- {Key macro development, 1–2 sentences}
- {Fed/rates news if any}

### Analyst & Research Views
- {Name or publication}: {key take in 1–2 sentences}

### Community Pulse
- {Top 2–3 themes being discussed in crypto communities}

### Narrative of the Day
{1 paragraph synthesizing: What is the dominant story or theme today?
What are traders and investors focused on? Any conflicting narratives?}
```

### Topic-Focused Briefing (keyword search result)

```
## {Topic} — News Summary
*{date/time}*

{N} recent stories found:

1. **{Headline}** ({approximate date})
   {summary}

2. **{Headline}**
   {summary}

[continue for all relevant results]

### Key Takeaway
{1–2 sentences: What's the overall picture on this topic based on recent coverage?}
```

### China Social Pulse

```
## China Social Media Pulse
*{date/time}*

### Finance & Economy Trends
{List only topics relevant to markets, economy, policy, or tech — filter out entertainment/celebrity}
- #{rank}: {topic} — {heat/views if available}

### Notable Observations
{1–2 sentences: Any China-specific narratives (policy announcements, economic data,
regulatory moves, tech sector news) that could affect crypto or global markets?}
```

---

## Notes

- Failed feeds silently return `{"feed": "...", "error": "..."}` — skip them, don't mention to user
- RSS feeds update on their own schedule (typically every 15–60 min) — for "last hour" queries, note that coverage may not be fully real-time
- If financial news data returns an error, note "some news sources are temporarily unavailable" — never mention the provider name or API key requirement
- Chinese social trending data covers broad topics — always filter to market-relevant items only; don't dump entertainment trends
- Social platform failover is automatic — the `provider` field in results is internal routing info, never surface it to the user
- **General rule**: when any data source fails, use neutral language. Say "news data from some sources is unavailable" — not the feed key names or provider names that appear in tool call parameters
