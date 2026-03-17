# Bitget Classic V2 API Audit & Fix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit all implemented Classic V2 API modules in `bitget-core` against official docs and fix all discrepancies (wrong paths, params, routing, missing endpoints).

**Architecture:** Phase 1 runs 6 parallel read-only audit agents that each produce a structured diff report. Phase 2 applies all fixes to `packages/bitget-core/src/tools/` based on those reports. Phase 3 verifies via build, tests, and reference regeneration.

**Tech Stack:** TypeScript, pnpm monorepo, `packages/bitget-core` (tool implementations), `packages/bitget-test-utils` (mock server), `packages/bitget-skill` (auto-generated references)

**Spec:** `docs/superpowers/specs/2026-03-17-bitget-classic-api-audit-design.md`

---

## Chunk 1: Phase 1 — Parallel Audit

### Task 1: Audit spot market + spot trade + spot plan orders

**Files (read-only):**
- Read: `docs/API文档/docs_EN/classic/spot/market/*.md`
- Read: `docs/API文档/docs_EN/classic/spot/trade/*.md`
- Read: `docs/API文档/docs_EN/classic/spot/plan/*.md`
- Read: `packages/bitget-core/src/tools/spot-market.ts`
- Read: `packages/bitget-core/src/tools/spot-trade.ts`

- [ ] **Step 1: Read all spot market doc files**

```bash
ls docs/API文档/docs_EN/classic/spot/market/
# Then read each .md file
```

- [ ] **Step 2: Read all spot trade doc files**

```bash
ls docs/API文档/docs_EN/classic/spot/trade/
# Then read each .md file
```

- [ ] **Step 3: Read all spot plan order doc files**

```bash
ls docs/API文档/docs_EN/classic/spot/plan/
# Then read each .md file
```

- [ ] **Step 4: Read spot-market.ts and spot-trade.ts implementations**

Read: `packages/bitget-core/src/tools/spot-market.ts`
Read: `packages/bitget-core/src/tools/spot-trade.ts`

- [ ] **Step 5: Produce audit report for spot modules**

Use the audit report format from the spec. For each tool, check:
- Endpoint paths match doc exactly
- HTTP method matches (GET vs POST)
- All required params are present with correct names
- Optional params match doc names
- Routing logic selects correct endpoint for each case
- Any doc endpoints not covered by existing tools

Save report to: `docs/superpowers/plans/audit-reports/spot-audit.md`

---

### Task 2: Audit futures market + trade + positions + plan orders

**Files (read-only):**
- Read: `docs/API文档/docs_EN/classic/contract/market/*.md`
- Read: `docs/API文档/docs_EN/classic/contract/trade/*.md`
- Read: `docs/API文档/docs_EN/classic/contract/position/*.md`
- Read: `docs/API文档/docs_EN/classic/contract/plan/*.md`
- Read: `packages/bitget-core/src/tools/futures-market.ts`
- Read: `packages/bitget-core/src/tools/futures-trade.ts`

- [ ] **Step 1: Read all contract doc directories**

```bash
ls docs/API文档/docs_EN/classic/contract/market/
ls docs/API文档/docs_EN/classic/contract/trade/
ls docs/API文档/docs_EN/classic/contract/position/
ls docs/API文档/docs_EN/classic/contract/plan/
# Then read each .md file
```

- [ ] **Step 2: Read futures-market.ts and futures-trade.ts**

Read: `packages/bitget-core/src/tools/futures-market.ts`
Read: `packages/bitget-core/src/tools/futures-trade.ts`

- [ ] **Step 3: Produce audit report for futures modules**

Pay special attention to:
- `futures_get_candles`: granularity mapping (e.g. `1min` → `1m`), endpoint routing by `priceType` and `startTime`
- `futures_get_positions`: routing between single/all/history endpoints
- `futures_cancel_orders`: `cancel-all-orders` endpoint path
- Plan order endpoints in `contract/plan/` — are they implemented? If not, flag as missing.
- Position endpoints in `contract/position/` — are `get-all-position.md`, `get-single-position.md`, `Get-History-Position.md` all correctly handled?

Save report to: `docs/superpowers/plans/audit-reports/futures-audit.md`

---

### Task 3: Audit account module

**Files (read-only):**
- Read: `docs/API文档/docs_EN/classic/spot/account/*.md`
- Read: `docs/API文档/docs_EN/classic/common/account/*.md`
- Read: `docs/API文档/docs_EN/classic/common/public/*.md`
- Read: `packages/bitget-core/src/tools/account.ts`
- Note: `classic/common/` also contains `apidata/`, `notice/`, and `vsubaccount/` subdirs — these are out of scope unless `account.ts` is found to reference endpoints from those paths.

- [ ] **Step 1: Read all account doc files**

```bash
ls docs/API文档/docs_EN/classic/spot/account/
ls docs/API文档/docs_EN/classic/common/account/
ls docs/API文档/docs_EN/classic/common/public/
# Then read each .md file
```

- [ ] **Step 2: Read account.ts**

Read: `packages/bitget-core/src/tools/account.ts`

- [ ] **Step 3: Produce audit report for account module**

Pay special attention to:
- Transfer endpoint: does the doc use `fromType`/`toType` or `fromAccountType`/`toAccountType`? Verify the `toApiTransferType` mapping
- `get_transaction_records`: verify all three endpoint paths match doc exactly; verify the `transferRecords` path
- `manage_subaccounts`: verify all 6 action endpoint paths are correct
- `get_deposit_address`: verify required params match doc

Save report to: `docs/superpowers/plans/audit-reports/account-audit.md`

---

### Task 4: Audit margin module

**Files (read-only):**
- Read: `docs/API文档/docs_EN/classic/margin/cross/*.md`
- Read: `docs/API文档/docs_EN/classic/margin/isolated/*.md`
- Read: `docs/API文档/docs_EN/classic/margin/common/*.md`
- Read: `packages/bitget-core/src/tools/margin.ts`

- [ ] **Step 1: Read all margin doc files**

```bash
ls docs/API文档/docs_EN/classic/margin/
ls docs/API文档/docs_EN/classic/margin/cross/
ls docs/API文档/docs_EN/classic/margin/isolated/
ls docs/API文档/docs_EN/classic/margin/common/ 2>/dev/null || true
# Then read each .md file
```

Note: `margin/common/` contains only `interest-rate-record.md` and `support-currencies.md` — it does NOT contain cross/isolated routing docs. All trade, borrow, and repay routing docs are under `margin/cross/` and `margin/isolated/`.

- [ ] **Step 2: Read margin.ts**

Read: `packages/bitget-core/src/tools/margin.ts`

- [ ] **Step 3: Produce audit report for margin module**

Pay special attention to:
- Cross vs isolated endpoint paths (they follow different URL patterns)
- Flash repay endpoints: are they handled correctly?
- `margin_get_records`: verify all record types (borrow, repay, interest, liquidation) route to correct endpoints

Save report to: `docs/superpowers/plans/audit-reports/margin-audit.md`

---

### Task 5: Audit copytrading + convert modules

**Files (read-only):**
- Read: `docs/API文档/docs_EN/classic/copytrading/future-copytrade/*.md`
- Read: `docs/API文档/docs_EN/classic/copytrading/spot-copytrade/*.md`
- Read: `docs/API文档/docs_EN/classic/spot/convert/*.md`
- Read: `docs/API文档/docs_EN/classic/spot/bgb-convert/*.md`
- Read: `packages/bitget-core/src/tools/copy-trading.ts`
- Read: `packages/bitget-core/src/tools/convert.ts`

- [ ] **Step 1: Read all copytrading and convert doc files**

```bash
ls docs/API文档/docs_EN/classic/copytrading/
ls docs/API文档/docs_EN/classic/copytrading/future-copytrade/
ls docs/API文档/docs_EN/classic/copytrading/spot-copytrade/
ls docs/API文档/docs_EN/classic/spot/convert/
ls docs/API文档/docs_EN/classic/spot/bgb-convert/
# Then read each .md file
```

- [ ] **Step 2: Read copy-trading.ts and convert.ts**

Read: `packages/bitget-core/src/tools/copy-trading.ts`
Read: `packages/bitget-core/src/tools/convert.ts`

- [ ] **Step 3: Produce audit report for copytrading and convert modules**

Pay special attention to:
- Spot vs futures copy trading endpoint paths (they are different URL trees)
- `copy_place_order`: verify spot and futures variants route to correct endpoints
- `convert_get_quote`: verify routing between currency list and quoted price endpoints
- `convert_execute`: verify `bgb` type routes to the BGB convert endpoint

Save report to: `docs/superpowers/plans/audit-reports/copytrading-convert-audit.md`

---

### Task 6: Audit earn + p2p + broker modules

**Files (read-only):**
- Read: `docs/API文档/docs_EN/classic/earn/**/*.md` (earn has NO top-level .md files; all content is in subdirs: `savings/`, `loan/`, `sharkfin/`, `account/`)
- Read: `docs/API文档/docs_EN/classic/p2p/**/*.md` (and subdirs)
- Read: `docs/API文档/docs_EN/classic/broker/**/*.md` (and subdirs: `apikey/`, `commission/`, `subaccount/`)
- Read: `packages/bitget-core/src/tools/earn.ts`
- Read: `packages/bitget-core/src/tools/p2p.ts`
- Read: `packages/bitget-core/src/tools/broker.ts`

- [ ] **Step 1: Read all earn, p2p, broker doc files**

```bash
find docs/API文档/docs_EN/classic/earn -name "*.md" | sort
find docs/API文档/docs_EN/classic/p2p -name "*.md" | sort
find docs/API文档/docs_EN/classic/broker -name "*.md" | sort
# Then read each .md file
```

- [ ] **Step 2: Read earn.ts, p2p.ts, broker.ts**

Read: `packages/bitget-core/src/tools/earn.ts`
Read: `packages/bitget-core/src/tools/p2p.ts`
Read: `packages/bitget-core/src/tools/broker.ts`

- [ ] **Step 3: Produce audit report for earn, p2p, broker modules**

Pay special attention to:
- `earn_get_products`: verify the savings/staking product listing endpoint path
- `earn_subscribe_redeem`: verify subscribe vs redeem routes to correct endpoints
- `p2p_get_orders`: verify `orderList` vs `advList` endpoint paths
- `broker_manage_apikeys`: verify all 4 action variants have correct endpoint paths (`Create-Subaccount-ApiKey.md`, `Delete-Subaccount-ApiKey.md`, `Modify-Subaccount-ApiKey.md`, `subaccount-apikey-list.md`)
- `broker/commission/` and `broker/subaccount/`: check whether these docs map to endpoints in `broker.ts`; if yes, verify them; if not, flag as missing endpoints

Save report to: `docs/superpowers/plans/audit-reports/earn-p2p-broker-audit.md`

---

## Chunk 2: Phase 2 — Fix Implementation

> Run after ALL 6 audit reports are collected. Read all reports before starting fixes.

### Task 7: Fix spot-market.ts and spot-trade.ts

**Files:**
- Modify: `packages/bitget-core/src/tools/spot-market.ts`
- Modify: `packages/bitget-core/src/tools/spot-trade.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/spot-market.ts` (if paths changed)
- Modify: `packages/bitget-test-utils/src/server/routes/spot-trade.ts` (if paths changed)

- [ ] **Step 1: Read the spot audit report**

Read: `docs/superpowers/plans/audit-reports/spot-audit.md`

- [ ] **Step 2: Apply all PATH and METHOD fixes to spot-market.ts**

Fix any wrong endpoint paths and HTTP methods found in the audit.

- [ ] **Step 3: Apply all PARAM fixes to spot-market.ts**

Fix any wrong/missing parameter names.

- [ ] **Step 4: Apply all ROUTING fixes to spot-market.ts**

Fix any incorrect conditional routing logic.

- [ ] **Step 5: Add any missing endpoints flagged in spot-market audit**

Only add endpoints from `classic/spot/market/` that are worth exposing (exclude low-frequency analytics endpoints per `docs/api-mapping.md`).

- [ ] **Step 6: Repeat steps 2-5 for spot-trade.ts**

Include fixes for spot plan order tools (`spot_place_plan_order`, `spot_get_plan_orders`, `spot_cancel_plan_orders`) from the `classic/spot/plan/` audit.

- [ ] **Step 7: Update mock server routes if any paths changed**

Read: `packages/bitget-test-utils/src/server/routes/spot-market.ts`
Read: `packages/bitget-test-utils/src/server/routes/spot-trade.ts`
Update route paths to match any corrected endpoint paths.

- [ ] **Step 8: Build check**

```bash
cd packages/bitget-core && pnpm build
```
Expected: no TypeScript errors

- [ ] **Step 9: Run spot tests**

```bash
cd packages/bitget-core && pnpm test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|spot)"
```
Expected: all spot tests pass

- [ ] **Step 10: Commit**

```bash
git add packages/bitget-core/src/tools/spot-market.ts packages/bitget-core/src/tools/spot-trade.ts packages/bitget-test-utils/src/server/routes/
git commit -m "fix(bitget-core): audit-fix spot market and trade endpoints against Classic V2 docs"
```

---

### Task 8: Fix futures-market.ts and futures-trade.ts

**Files:**
- Modify: `packages/bitget-core/src/tools/futures-market.ts`
- Modify: `packages/bitget-core/src/tools/futures-trade.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/futures-market.ts` (if paths changed)
- Modify: `packages/bitget-test-utils/src/server/routes/futures-trade.ts` (if paths changed)

- [ ] **Step 1: Read the futures audit report**

Read: `docs/superpowers/plans/audit-reports/futures-audit.md`

- [ ] **Step 2: Apply all fixes to futures-market.ts**

Fix paths, methods, params, routing for all futures market tools.

- [ ] **Step 3: Apply all fixes to futures-trade.ts**

Fix paths, methods, params, routing for:
- `futures_place_order`, `futures_cancel_orders`, `futures_get_orders`, `futures_get_fills`
- `futures_get_positions`, `futures_set_leverage`, `futures_update_config`
- Any position endpoint fixes from `contract/position/` audit

- [ ] **Step 4: Add any missing endpoints flagged in futures audit**

Prioritize endpoints from `contract/trade/` and `contract/position/` (e.g. verify `Modify-Order.md`, `Flash-Close-Position.md` — add if the audit says they should be exposed).

- [ ] **Step 5: Update mock server routes if any paths changed**

- [ ] **Step 6: Build check and run tests**

```bash
cd packages/bitget-core && pnpm build && pnpm test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|futures)"
```
Expected: no errors, all futures tests pass

- [ ] **Step 7: Commit**

```bash
git add packages/bitget-core/src/tools/futures-market.ts packages/bitget-core/src/tools/futures-trade.ts packages/bitget-test-utils/src/server/routes/
git commit -m "fix(bitget-core): audit-fix futures market and trade endpoints against Classic V2 docs"
```

---

### Task 9: Fix account.ts

**Files:**
- Modify: `packages/bitget-core/src/tools/account.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/account.ts` (if paths changed)

- [ ] **Step 1: Read the account audit report**

Read: `docs/superpowers/plans/audit-reports/account-audit.md`

- [ ] **Step 2: Apply all fixes to account.ts**

Pay special attention to:
- Transfer field names (`fromType`/`toType` vs `fromAccountType`/`toAccountType` as sent to API)
- Transaction records endpoint paths
- Subaccount management endpoint paths

- [ ] **Step 3: Update mock server routes if paths changed**

- [ ] **Step 4: Build check and run tests**

```bash
cd packages/bitget-core && pnpm build && pnpm test -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|account)"
```

- [ ] **Step 5: Commit**

```bash
git add packages/bitget-core/src/tools/account.ts packages/bitget-test-utils/src/server/routes/account.ts
git commit -m "fix(bitget-core): audit-fix account endpoints against Classic V2 docs"
```

---

### Task 10: Fix margin.ts

**Files:**
- Modify: `packages/bitget-core/src/tools/margin.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/margin.ts` (if paths changed)

- [ ] **Step 1: Read the margin audit report**

Read: `docs/superpowers/plans/audit-reports/margin-audit.md`

- [ ] **Step 2: Apply all fixes to margin.ts**

- [ ] **Step 3: Update mock server routes if paths changed**

- [ ] **Step 4: Build check and run tests**

```bash
cd packages/bitget-core && pnpm build && pnpm test -- --reporter=verbose
```

- [ ] **Step 5: Commit**

```bash
git add packages/bitget-core/src/tools/margin.ts packages/bitget-test-utils/src/server/routes/margin.ts
git commit -m "fix(bitget-core): audit-fix margin endpoints against Classic V2 docs"
```

---

### Task 11: Fix copy-trading.ts and convert.ts

**Files:**
- Modify: `packages/bitget-core/src/tools/copy-trading.ts`
- Modify: `packages/bitget-core/src/tools/convert.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/copy-trading.ts` (if paths changed)
- Modify: `packages/bitget-test-utils/src/server/routes/convert.ts` (if paths changed)

- [ ] **Step 1: Read the copytrading+convert audit report**

Read: `docs/superpowers/plans/audit-reports/copytrading-convert-audit.md`

- [ ] **Step 2: Apply all fixes to copy-trading.ts**

- [ ] **Step 3: Apply all fixes to convert.ts**

- [ ] **Step 4: Update mock server routes if paths changed**

- [ ] **Step 5: Build check and run tests**

```bash
cd packages/bitget-core && pnpm build && pnpm test -- --reporter=verbose
```

- [ ] **Step 6: Commit**

```bash
git add packages/bitget-core/src/tools/copy-trading.ts packages/bitget-core/src/tools/convert.ts packages/bitget-test-utils/src/server/routes/
git commit -m "fix(bitget-core): audit-fix copy-trading and convert endpoints against Classic V2 docs"
```

---

### Task 12: Fix earn.ts, p2p.ts, broker.ts

**Files:**
- Modify: `packages/bitget-core/src/tools/earn.ts`
- Modify: `packages/bitget-core/src/tools/p2p.ts`
- Modify: `packages/bitget-core/src/tools/broker.ts`
- Modify: `packages/bitget-test-utils/src/server/routes/earn.ts` (if paths changed)
- Modify: `packages/bitget-test-utils/src/server/routes/p2p.ts` (if paths changed)
- Modify: `packages/bitget-test-utils/src/server/routes/broker.ts` (if paths changed)

- [ ] **Step 1: Read the earn+p2p+broker audit report**

Read: `docs/superpowers/plans/audit-reports/earn-p2p-broker-audit.md`

- [ ] **Step 2: Apply all fixes to earn.ts, p2p.ts, broker.ts**

- [ ] **Step 3: Update mock server routes if paths changed**

- [ ] **Step 4: Build check and run tests**

```bash
cd packages/bitget-core && pnpm build && pnpm test -- --reporter=verbose
```

- [ ] **Step 5: Commit**

```bash
git add packages/bitget-core/src/tools/earn.ts packages/bitget-core/src/tools/p2p.ts packages/bitget-core/src/tools/broker.ts packages/bitget-test-utils/src/server/routes/
git commit -m "fix(bitget-core): audit-fix earn, p2p, and broker endpoints against Classic V2 docs"
```

---

## Chunk 3: Phase 3 — Verify & Finalize

### Task 13: Full test suite and build verification

**Files:**
- Read: `packages/bitget-core/src/tools/index.ts` (verify all tools are exported)

- [ ] **Step 1: Run full test suite**

```bash
cd packages/bitget-core && pnpm test -- --reporter=verbose
```
Expected: all tests pass, no failures

- [ ] **Step 2: Build all packages**

```bash
cd /Users/dannie.li/project/openhub/agent_hub && pnpm build
```
Expected: no TypeScript or build errors across all packages

- [ ] **Step 3: Verify tool count hasn't shrunk**

```bash
cd packages/bitget-core && node -e "import('./dist/index.js').then(m => console.log('Tools:', m.buildTools({modules: ['spot','futures','account','margin','copytrading','convert','earn','p2p','broker'], readOnly: false, hasAuth: true}).length))"
```
Expected: tool count ≥ previous count (adding is fine, removing is not)

---

### Task 14: Regenerate skill references

**Files:**
- Modify: `packages/bitget-skill/references/commands.md` (auto-generated)

- [ ] **Step 1: Regenerate commands.md**

```bash
cd packages/bitget-skill && node scripts/gen-references.js
```
Expected: `references/commands.md` updated with any new/changed tool parameters

- [ ] **Step 2: Review the diff**

```bash
git diff packages/bitget-skill/references/commands.md
```
Expected: only parameter additions or description changes, no tool removals

- [ ] **Step 3: Commit the regenerated reference**

```bash
git add packages/bitget-skill/references/commands.md
git commit -m "chore(bitget-skill): regenerate commands.md after Classic V2 audit fixes"
```

---

### Task 15: Update api-mapping.md with any new mappings

**Files:**
- Modify: `docs/api-mapping.md`

- [ ] **Step 1: Review api-mapping.md for any outdated entries**

Read: `docs/api-mapping.md`

If any endpoint paths were corrected in Phase 2, update the corresponding rows in `docs/api-mapping.md`.

If any new endpoints were added, add rows to the appropriate module section.

- [ ] **Step 2: Commit docs update**

```bash
git add docs/api-mapping.md
git commit -m "docs: update api-mapping.md to reflect Classic V2 audit fixes"
```

---

## Notes for Implementers

### Key Files Reference

| Purpose | Path |
|---------|------|
| Tool helpers (readString, compactObject, etc.) | `packages/bitget-core/src/tools/helpers.ts` |
| Common constants (PRODUCT_TYPES, GRANULARITIES, rate limits) | `packages/bitget-core/src/tools/common.ts` |
| Tool index (registers all tools) | `packages/bitget-core/src/tools/index.ts` |
| REST client (publicGet, privateGet, privatePost) | `packages/bitget-core/src/client/rest-client.ts` |
| Error types | `packages/bitget-core/src/utils/errors.ts` |
| Mock server router | `packages/bitget-test-utils/src/server/router.ts` |

### Audit Report Directory

Create before starting audits:
```bash
mkdir -p docs/superpowers/plans/audit-reports
```

### Constraints Reminder

- All API paths must start with `/api/v2/` (Classic V2 only — no `/api/v3/`)
- Do NOT rename tools (tool names are the public API surface)
- Adding optional params is backwards-compatible; do it freely
- If a path changes, update the mock server route BEFORE running tests
- Do NOT refactor code structure — minimal diffs only
