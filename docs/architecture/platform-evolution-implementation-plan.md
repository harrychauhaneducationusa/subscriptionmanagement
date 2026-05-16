# SubSense platform evolution — implementation plan

This document tracks delivery of the **scalable, deterministic-first, low-AI-cost** architecture (scheduled sync, webhooks, snapshots, event orchestration, AI layer, notification decoupling). Work proceeds in **vertical slices** with **regression gates** so existing behavior stays intact.

## Related documentation

| Topic | Document |
|-------|----------|
| Entity definition for `link_sync_schedule` | `data-model-overview.md` |
| Provider boundaries and ingest triggers | `integration-landscape.md`, `multi-market-aggregation.md` |
| Modular monolith modules (includes `sync` responsibility) | `solution-architecture.md` |
| Scale / scheduler expectations | `scalability-and-reliability.md` |
| API and async job contracts | `../reference/api-and-data-contracts.md` |
| MVP build order vs this backlog | `../roadmap/implementation-sequence.md` |

## Guiding principles

- Deterministic pipelines own money-adjacent truth; AI only interprets structured signals.
- Every slice ships with **unit tests** (and selective **e2e** where user flows change).
- Prefer **additive** schema and **feature flags** over big-bang rewrites.

---

## Test validation strategy (do not skip)

### Automated gates (run locally and in CI)

| Gate | Command | Purpose |
|------|---------|---------|
| Backend unit | `npm run test -w backend` | Workers, stores, enqueue paths, aggregation, transactions, insights edge cases |
| Frontend unit | `npm run test -w frontend` | API client, session helpers |
| Typecheck | `npm run check` | TS contracts after refactors |
| E2E (when flows touch UI/API contracts) | `npm run test:e2e` | Smoke + critical journeys |

### Regression matrix — existing modules

After each phase or meaningful PR, confirm coverage still passes for these **canonical** test files (extend the list when you add adjacent code):

| Area | Vitest file(s) | What must still pass |
|------|----------------|----------------------|
| Queue registry | `backend/src/queues/registry.test.ts` | Queue names / construction when Redis mocked |
| Transaction jobs | `backend/src/modules/transactions/transactions.jobs.test.ts` | `link.ingest` → `raw.normalize` → recurring enqueue chain |
| Transaction enqueue | `backend/src/modules/transactions/transactions.enqueue.test.ts` | Queue vs inline fallback |
| Aggregation jobs | `backend/src/modules/aggregation/aggregation.jobs.test.ts` | Consent lifecycle enqueue behavior |
| Recurring jobs | `backend/src/modules/recurring/recurring.jobs.test.ts` | Detection enqueue |
| Plaid exchange | `backend/src/modules/aggregation/plaid/plaidExchange.test.ts` | Token exchange side effects |
| Plaid ingest | `backend/src/modules/transactions/plaidIngest.test.ts` | Ingest mapping |
| Insights substitution | `backend/src/modules/insights/substitution_inventory.store.test.ts` | Inventory rules |
| Auth / session middleware | `backend/src/middleware/requireSession.test.ts`, `backend/src/modules/auth/auth.store.test.ts` | Session gating |
| Health | `backend/src/config/healthchecks.test.ts`, `backend/src/modules/health/health.routes.test.ts` | Ops endpoints |
| Link sync schedule | `backend/src/modules/sync/linkSyncSchedule.store.test.ts` | Tier intervals, ingest bump behavior (mocked DB), undefined-table guard |

**New code in this effort** should add **co-located** `*.test.ts` files (e.g. `linkSyncSchedule.store.test.ts`) rather than only relying on e2e.

### Manual smoke (short)

- `npm run dev` — API + worker + frontend; link refresh still ingests.
- Dashboard summary still returns 200 with session (notifications may still sync on read until Phase 1b).

---

## Phase 1 — Operational foundations (highest ROI)

**Goal:** Fresh data and predictable workloads without tying everything to dashboard reads.

| Step | Deliverable | DB / code | Validation |
|------|-------------|-----------|------------|
| **1.1** | `link_sync_schedule` + tier intervals + bump after successful ingest | Migration `000011_*`, `linkSyncSchedule.store.ts`, hook from `processTransactionJob` | New unit tests + full `transactions.jobs.test.ts` |
| **1.2** | Scheduler worker / cron: enqueue `link.delta_sync` for due rows | New queue `link_sync_orchestration` or reuse lifecycle; lease column optional | Unit + integration test with mocked Redis |
| **1.3** | `sync_run` idempotency + outcomes | Migration + store | Tests for duplicate jobId |
| **1.4** | Decouple **notification sync** from `GET /dashboard-summary` | `notification_sync` queue + worker; route becomes thin | Extend or add `insights.routes` test with supertest; e2e dashboard |
| **1.5** | Household **dashboard snapshot** read path (async refresh) | `household_dashboard_snapshots` + worker | New store tests + snapshot API contract test |

**Dependencies:** Redis/BullMQ already present; migrations via `npm run migrate -w backend` (required for `link_sync_schedule`; until migrated, schedule bumps are skipped with a warning when a DB pool is active).

---

## Phase 2 — Events & webhooks

| Step | Deliverable | Validation |
|------|-------------|------------|
| 2.1 | Transactional **outbox** (`domain_events_outbox`) + publisher worker | Unit tests for outbox write + publish |
| 2.2 | Event types: `TransactionIngested`, `TransactionsNormalized`, … | Consumer idempotency tests |
| 2.3 | **Webhook** ingest: `provider_webhook_events` + `webhook_processing` queue | Signature + dedupe tests |
| 2.4 | Replay tooling (admin/internal) | Manual + unit |

---

## Phase 3 — Split recommendation generation & AI layer

| Step | Deliverable | Validation |
|------|-------------|------------|
| 3.1 | Dedicated queue `recommendation_generation` (split from hot path) | Job contract tests |
| 3.2 | **Recommendation snapshots** for digests | Store + migration tests |
| 3.3 | **AI orchestration** module (bounded): digest copy, explanations only | Mock LLM; cost recorder unit tests |
| 3.4 | Merchant normalization pipeline (rules → fuzzy → embeddings → rare LLM) | Golden-file tests for descriptors |

---

## Phase 4 — Conversational assistant

| Step | Deliverable | Validation |
|------|-------------|------------|
| 4.1 | RAG context pack from snapshots + rollups (no raw tx dump) | Retrieval unit tests |
| 4.2 | Session memory + rate limits | Abuse / budget tests |

---

## Phase 5 — Scale path (as load demands)

- Kafka or JetStream when outbox fanout exceeds BullMQ comfort.
- pgvector / dedicated vector service for merchant clustering at volume.
- Read replicas + time-partitioned webhook/outbox tables.

---

## Cursor / delivery discipline

1. One **vertical slice** per PR (e.g. “1.1 only”).
2. Update this doc’s **Step** row with **PR link / date** when merged.
3. **Forbidden without ADR:** LLM calls in ingest, normalize, or core recurring detection.
4. Run the **regression matrix** commands before requesting review.

---

## Current implementation status

| Step | Status |
|------|--------|
| 1.1 Link sync schedule schema + ingest hook | **Done** — migration `000011_link_sync_schedule.cjs`, `linkSyncSchedule.store.ts`, `processTransactionJob` hook, Vitest coverage |
| 1.2–1.5 | Not started |
