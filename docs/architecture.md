# Architecture

> Version: 3.0.0 — Bitget UTA (Unified Trading Account) v3 API
> Status: Current

## 1. Overview

Bitget Agent Hub is a layered system: one **foundation SDK** wraps the Bitget UTA v3 REST API as a typed, annotated catalog, and three **surfaces** (CLI, MCP server, skill) project that catalog into whatever shape a given AI host expects. An independent **signal product** (`@bitget-ai/bitget-signal`) sits alongside for market analysis without an API key.

```
                         ┌───────────────────────────┐
                         │   AI assistant / agent     │
                         └─────────────┬──────────────┘
            shell (bgc)   │   MCP (stdio)   │   skill (md)
        ┌─────────────────┼─────────────────┼──────────────────┐
        ▼                 ▼                 ▼                  
  ┌───────────┐     ┌───────────┐     ┌───────────┐           
  │ agent-cli │     │ agent-mcp │     │agent-skill│           
  └─────┬─────┘     └─────┬─────┘     └─────┬─────┘           
        └───────────┬─────┴─────────────────┘                 
                    ▼                                          
              ┌───────────┐   (foundation — 109 ops)          
              │ agent-sdk │   catalog · REST client · tools    
              └─────┬─────┘   builder · mock server            
                    │ HMAC-SHA256, HTTPS                        
                    ▼                                          
              api.bitget.com  (UTA v3 — /api/v3/...)           
```

**Design goals:** zero version drift between the API spec and the tools the AI sees; one foundation reused by every surface; a tool surface small enough to fit host tool caps yet able to reach every operation on demand.

---

## 2. Spec-driven pipeline

The SDK is generated from the Bitget UTA v3 OpenAPI spec — it is not hand-maintained tool-by-tool.

```
openapi.yaml  ──(pnpm run gen)──►  src/generated/catalog.ts  ──►  REST client
                                                              ──►  tool builder
                                                              ──►  mock server
```

- **`openapi.yaml`** — the source of truth for every operation, parameter, and response shape.
- **`catalog.ts`** — generated. Exposes `CATALOG` (every operation with `operationId`, `module`, `domain`, `auth`, `riskLevel`, `isWrite`, JSON Schema), plus `CATALOG_OPERATION_COUNT` (109) and `CATALOG_SPEC_VERSION` (`3.0.0`).
- Everything downstream reads the catalog, so regenerating from a new spec updates the REST client, the tools, and the mock server in lockstep. No tool can describe an operation the spec doesn't define.

**Catalog shape (3.0.0):** 109 operations — 89 visible across 6 to-C modules (`account` 39, `trade` 17, `market` 16, `strategy` 5, `cryptoloans` 11, `tax` 1) and 20 hidden across 2 institutional modules (`broker` 11, `instloan` 9). 93 operations are private (signed), 16 public; 39 are writes, 70 reads.

---

## 3. Tool surfaces

Each surface chooses how the catalog is projected into AI-callable tools.

### 3.1 `intent` (default)

16 curated, workflow-oriented **verbs** whose combined `fronts` cover every catalog operation — so the intent surface loses no capability versus the 1:1 tier. Each verb routes to a concrete operation by its `action`. `discover` groups them by **business domain** (the intent axis), which is distinct from the gating module below:

| Domain | Verbs |
|---|---|
| market | `market` |
| trade | `order`, `position`, `strategy_order` |
| account | `account_overview`, `account_config`, `repayment` |
| funds | `transfer_funds`, `deposit`, `withdraw`, `funds_records` |
| subaccount | `subaccount` |
| loan | `loan` |
| tax | `tax` |
| broker | `broker` |
| instloan | `inst_loan` |

Verbs are gated by their **primary module**, a different axis from the domain — the `account` module alone gates every account, funds, and subaccount verb. `modules: "market"` yields only the `market` verb; `modules: "all"` yields the **14 to-C verbs** (the hidden `broker` and `inst_loan` verbs load only when their modules are named explicitly). `strategy_order` is gated on `trade` (not `strategy`): strategy orders are a trading capability an agent expects whenever trading is on, and the underlying strategy-module operations remain callable via `raw` regardless.

### 3.2 `full`

One tool per operation, 1:1 with the catalog, bounded by the loaded modules. Use it when the AI should see every operation explicitly.

### 3.3 Always-on tools

- **`discover`** — progressive disclosure of the catalog: domains → a domain's verbs → a verb's actions and parameter contract. Lets an agent navigate 109 operations without all of them being resident as tools.
- **`raw`** — call any operation directly by `operationId` with a JSON `args` payload. The escape hatch that guarantees full API reach from a small tool surface.

Switch surface with `--surface intent|full` (CLI / MCP) or the `surface` option (SDK).

---

## 4. Module system

A single package with module filtering (rather than many packages) keeps one shared REST client, signer, and rate limiter, and one version line.

- **`DEFAULT_MODULES`** = `account`, `trade`, `market` (72 operations) — the lean profile.
- **`HIDDEN_MODULES`** = `broker`, `instloan` — excluded from the to-C surface unless named in `--modules`.
- `--modules <list>` loads a subset; `--modules all` loads the six to-C modules. `broker` and `instloan` stay hidden — `all` excludes them, so name them explicitly (e.g. `--modules broker,instloan`) to expose them.

Why filter: Cursor caps MCP servers at 40 tools; each tool description also costs context. The intent surface on the lean profile is ~14 tools, leaving headroom for other servers. See the module table in the project README, or run `bgc discover` for the live list.

---

## 5. Safety model

Every operation carries a `riskLevel` (`read` · `write` · `high`) derived from the spec. Surfaces enforce four independent guardrails:

| Guardrail | Effect |
|---|---|
| `readOnly` | `full` surface strips write tools entirely. Intent verbs stay (their read actions remain useful) but any write action self-blocks at the safety gate. |
| `confirm` | High-risk / destructive operations self-gate: a first call returns `{ confirmationRequired: true }` instead of executing, so the agent must explicitly re-issue with confirmation. |
| `paperTrading` | Routes calls to Bitget's Demo Trading environment for safe rehearsal. |
| `dryRun` | Builds and validates the request, then returns it without sending. |

All invocations return a uniform envelope via `safeInvoke`: `{ ok: true, ... }` on success or `{ ok: false, error: { type, ... } }` on failure — never a thrown exception across the tool boundary. `riskLevel` is also mapped to MCP tool annotations so MCP hosts can surface read-vs-write intent natively.

---

## 6. Request lifecycle

```
AI issues a tool call (verb + action, or operationId via raw)
  └─► resolve operation in CATALOG; confirm its module is loaded
      └─► validate params against the operation's JSON Schema
          ├─ readOnly / risk gate (writes blocked or confirm-gated)
          ├─ auth check (private ops require all three credentials)
          └─► REST client
              ├─ client-side rate limiter (token bucket)
              ├─ build URL + query/body for /api/v3/...
              ├─ HMAC-SHA256 sign (private ops)
              ├─ HTTPS request (paperTrading → demo host)
              ├─ parse response, map Bitget business codes
              └─► safeInvoke envelope back to the AI
```

---

## 7. Tech stack

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript 5.x | MCP ecosystem standard, type-safe |
| Runtime | Node.js ≥ 20 | Native `fetch`, `crypto`, `parseArgs`; Node 18 is EOL |
| Module format | ESM-only | Modern, tree-shakeable |
| SDK dependencies | **Zero runtime deps** | Signing, HTTP, and arg parsing all use Node built-ins |
| MCP transport | `@modelcontextprotocol/sdk` | Official SDK, protocol-compatible (used by `agent-mcp`) |
| Output dir | `lib/` | Compiled ESM published to npm |

The SDK ships a built-in **mock server** (`@bitget-ai/bitget-agent-sdk/testing`) seeded with deterministic tickers, instruments, and balances, so surfaces and the cross-repo e2e test can exercise every operation offline.

---

## 8. Packages

| Package | Role |
|---|---|
| `@bitget-ai/bitget-agent-sdk` | Foundation — catalog, typed REST client, tool builder, mock server |
| `@bitget-ai/bitget-agent-cli` | Shell surface — the `bgc` CLI |
| `@bitget-ai/bitget-agent-mcp` | MCP surface — local stdio server for MCP hosts |
| `@bitget-ai/bitget-agent-skill` | Skill surface — markdown that teaches Claude Code / Codex / OpenClaw to drive `bgc` |
| `@bitget-ai/bitget-signal` | Independent market-signal product (no API key); not part of the UTA v3 trading surface |

See each package's own repo (linked in the project README) for per-package detail.

---

## 9. Versioning

- Semantic Versioning. The SDK, CLI, MCP, and skill share the **3.0.0** line, aligned to the Bitget **UTA v3** API.
- `CATALOG_SPEC_VERSION` tracks the spec the catalog was generated from.
- `@bitget-ai/bitget-signal` versions independently — it has no API-key trading surface and was not part of the UTA v3 upgrade.
- Operation additions/removals follow from regenerating the catalog against a new spec and are recorded per-repo in CHANGELOG.
