# Implementation Sequence

## Purpose

This document defines the recommended implementation order for the `SubSense AI` phase-1 MVP.

It is the final pre-build planning bridge between:

- product scope and milestones
- architecture and integration design
- API and data contracts
- actual engineering execution order

It is intended to answer a practical question:

**What should the team build first, second, and third so the MVP reaches useful internal demos quickly while minimizing architecture and trust risk?**

Use this document with:

- `../../BRD.md`
- `../product/PRD.md`
- `../product/epics-and-stories.md`
- `../product/phase-1-milestones.md`
- `../architecture/solution-architecture.md`
- `../architecture/integration-landscape.md`
- `../architecture/multi-market-aggregation.md`
- `../architecture/platform-evolution-implementation-plan.md` — post-MVP platform sequencing (scheduled sync, snapshots, notification decoupling, events, AI orchestration) and **regression test matrix**
- `../reference/api-and-data-contracts.md`

## Post-MVP platform hardening (engineering)

After the stage-0–6 MVP spine is stable, use **`../architecture/platform-evolution-implementation-plan.md`** as the authoritative engineering backlog for:

- scheduled delta sync (scheduler reading `link_sync_schedule`)
- passive notification / digest batches
- dashboard snapshots and decoupled recommendation recompute
- transactional outbox and webhook idempotency

This document’s **stage ordering** remains the primary guide for first demos; the platform plan layers on **without replacing** MVP scope in `../product/phase-1-milestones.md`.

## Planning principles

1. **Ship a useful manual path before depending on bank automation**
   The product must create recurring-spend value even when financial connectivity is incomplete or skipped.

2. **Build trust-sensitive foundations early**
   Authentication, household context, consent state, auditability, and freshness handling should not be deferred.

3. **Sequence by user-value loops, not only by technical layers**
   Each phase should unlock a better internal demo, not just a larger codebase.

4. **Keep the architecture modular from day one**
   Even in a modular monolith, backend modules, migrations, and APIs should preserve ownership boundaries.

5. **Treat async workflows as first-class implementation work**
   Ingestion, recurring detection, notifications, and AI insight generation should not be bolted on as afterthoughts.

6. **Build evidence before polish-heavy expansion**
   The first phases should validate activation, clarity, and recurring intelligence before more ambitious packaging or partner concerns.

7. **Regional bank providers are plug-in adapters, not separate products**
   India (Setu AA) and the United States (Plaid) share one app, one schema, and one enrichment pipeline. Provider-specific code stays isolated. See `../architecture/multi-market-aggregation.md`.

## Target build posture

The implementation sequence assumes:

- a fresh codebase
- responsive web-first frontend
- Node.js modular monolith backend
- PostgreSQL with migration-only schema management
- Redis plus BullMQ for background work
- separate `web` and `worker` runtime roles

This matches the recommended target architecture and avoids inheriting product-specific debt from older systems.

## Implementation outcomes by stage

| Stage | Primary outcome | Why it matters |
|---|---|---|
| Stage 0 | repo, environments, and engineering skeleton | creates a stable base for all feature work |
| Stage 1 | authentication, household context, and onboarding persistence | unlocks the first coherent product flow |
| Stage 2 | manual recurring value path | proves the MVP can create value without bank linking |
| Stage 3 | financial connectivity and sync state | enables automation without breaking trust |
| Stage 4 | recurring detection and review | turns raw financial data into product intelligence |
| Stage 5 | dashboard, recommendations, and first actions | creates the first full recurring-intelligence experience |
| Stage 6 | notifications, analytics, and readiness | makes the MVP measurable and re-engageable |

## Recommended repo bootstrap

## 1. Repository structure

The team should start with a structure that cleanly maps to the target runtime shape.

### Suggested top-level layout

```text
/frontend
/backend
/docs
/infra
```

### Suggested backend module structure

```text
/backend/src/modules/auth
/backend/src/modules/households
/backend/src/modules/aggregation
/backend/src/modules/transactions
/backend/src/modules/merchants
/backend/src/modules/recurring
/backend/src/modules/insights
/backend/src/modules/notifications
/backend/src/modules/audit
```

### Suggested backend shared infrastructure

```text
/backend/src/config
/backend/src/db
/backend/src/queues
/backend/src/workers
/backend/src/middleware
/backend/src/lib
```

## 2. Environment setup priorities

Before feature work accelerates, the team should establish:

- local environment bootstrap
- `.env.example` contract
- migration runner
- queue bootstrap
- base logging
- health check endpoint
- API versioning convention
- frontend environment strategy

## 3. Definition of “engineering ready”

The repo should be considered ready for active feature work when:

- frontend and backend start locally
- database migrations run cleanly
- worker process starts independently
- health endpoint responds
- structured logging works
- a sample protected route and sample background job both succeed

## Stage 0: Foundation and Skeleton

## Goal

Create the minimum engineering foundation required to build safely and iteratively.

## Included work

- initialize frontend and backend applications
- configure TypeScript if chosen across both layers
- set up routing shell on frontend
- set up API server and modular route mounting
- add PostgreSQL connection and migration framework
- add Redis and BullMQ bootstrap
- add health, readiness, and base metrics surfaces
- configure error tracking and structured logs

## Backend build order

1. base server bootstrap
2. config and environment loading
3. DB connection and migration tooling
4. queue and worker bootstrap
5. common API error envelope
6. auth middleware skeleton
7. audit event utility

## Frontend build order

1. app shell and route foundation
2. mobile-first layout system
3. base theme and design tokens
4. API client and auth-state shell
5. protected route behavior

## Exit criteria

- local full-stack startup works
- `web` and `worker` can run independently
- migrations are the only schema path
- a minimal CI or local verification flow exists

## Stage 1: Identity, Onboarding, and Household Foundations

## Goal

Implement the first trustworthy user flow from landing through saved onboarding state.

## Why this stage comes first

Without identity, draft persistence, and household context, later recurring and dashboard logic either gets rebuilt or becomes too single-user and brittle.

## Backend module order

1. `auth`
2. `households`
3. onboarding draft persistence model or event flow
4. audit logging for auth and household changes

## Frontend screen order

1. landing and value framing
2. household selection
3. essential recurring setup shell
4. subscription seed setup shell
5. OTP authentication flow

## First migrations to create

1. `users`
2. `households`
3. `household_members`
4. onboarding draft or equivalent persistence structure
5. `audit_events`

## First APIs to implement

| API area | Why now |
|---|---|
| auth request OTP | required for persistence and secure flows |
| auth verify OTP | required for session establishment |
| auth session | required for app continuity |
| create household | required for core context |
| get current household | required for active product state |
| select current household | required for future-ready context switching |

## Internal demo checkpoint

**Demo 1: Saved onboarding flow**

The team should be able to show:

- landing into onboarding
- individual or household context selection
- a few seeded recurring items in draft state
- OTP login
- restored progress after authentication

## Stage 2: Manual Value Path

## Goal

Make the product genuinely useful without bank linking.

## Why this stage is critical

This stage proves that:

- privacy-sensitive users can still activate
- the dashboard can work without perfect data automation
- the recurring model is not overcoupled to aggregation

## Backend module order

1. `recurring` manual CRUD
2. recurring ownership and visibility rules
3. initial dashboard summary query layer
4. recommendation placeholder logic for manual cohorts

## Frontend screen order

1. manual subscription creation
2. manual utility creation
3. recurring list and edit flows
4. first dashboard summary state

## Migrations to add

1. `subscriptions`
2. `utility_bills`
3. recurring ownership fields and source fields
4. minimal summary-support indexes

## APIs to implement

| API area | Why now |
|---|---|
| create subscription | manual value path |
| edit subscription | recurring maintenance |
| create utility bill | essential recurring capture |
| edit utility bill | essential recurring maintenance |
| recurring list queries | dashboard and management support |
| dashboard summary | first visible product value |

## Stage-specific product rules

- manual and future detected items must share the same recurring source-of-truth shape
- ownership scope must be explicit
- utilities must not be forced into a streaming-subscription model

## Internal demo checkpoint

**Demo 2: Manual recurring dashboard**

The team should be able to show:

- a user who never links bank data
- manual creation of subscriptions and recurring bills
- personal versus shared tagging
- a dashboard with recurring total, categories, and renewals

## Stage 3: Financial Connectivity and Sync State

## Goal

Enable trust-forward bank linking and connection state visibility without yet overpromising recurring intelligence quality.

## Why it comes after manual value

This order protects the MVP from becoming:

- blocked on aggregator integration
- unusable for non-linked users
- too fragile when provider coverage or flows fail

## Multi-market scope (India + United States)

Stage 3 in the original plan assumed a single Account Aggregator (Setu). The **target architecture** is now explicit:

| Market | Provider | Config | Status in repo (baseline) |
|--------|----------|--------|---------------------------|
| India | Setu AA | `AGGREGATION_PROVIDER=setu` | Adapter + webhooks + Create Consent; mock transaction ingest; **FI fetch from Setu still TODO** |
| US | Plaid | `AGGREGATION_PROVIDER=plaid` | **Implemented** — Link, exchange, `transactions/sync`, Plaid PFC category mapping |
| Dev (both) | Mock | `AGGREGATION_PROVIDER=mock` | **Done** — full link lifecycle + mock ingest for demos |

**Same application, separate adapters.** Do not build a second repo for the US. Do not merge Setu and Plaid into one provider class.

### India track (primary — unchanged priority)

1. Complete Setu FI data fetch into `raw_transactions` (replace mock-only ingest for `setu` links).
2. Production Setu credentials from Bridge (India team); US developers use `mock` or shared secrets, not Bridge UI.
3. Keep `/v1/aggregation/callbacks/setu` and all `SETU_AA_*` env vars India-only in prod.

### US track (parallel POC — does not block India)

Run on branch `feature/plaid-integration` while India track continues on `main` or merges independently:

1. Add `plaid` to adapter registry and `env.ts`.
2. Implement `plaidProviderAdapter` + `POST /v1/aggregation/plaid/exchange`.
3. Plaid `transactions/sync` → existing `raw_transactions` path (Plaid links only).
4. Plaid Link on Bank Link when `redirect.provider_name` indicates Plaid.
5. Sandbox only until Plaid production approval.

### Future: one deploy serving both markets

When both countries ship from one hostname:

- Add `household.market` (`IN` | `US`) and route `getAggregationProviderAdapter(market)` — do **not** rely on a single global `AGGREGATION_PROVIDER` alone.
- Optional: `household.default_currency`, locale, and institution lists per market.

Until then, **separate deployments** (India env = `setu`, US env = `plaid`) are simpler and safer.

## Backend module order

1. `aggregation` consent model
2. `aggregation` institution link model
3. connection-state APIs
4. webhook receiver skeleton (**Setu**: `/callbacks/setu`; **Plaid**: dedicated exchange route)
5. refresh and repair orchestration
6. **India:** Setu FI ingestion worker path
7. **US (parallel):** Plaid item + transaction sync ingestion path

## Frontend screen order

1. bank-link education screen
2. consent initiation and return flow
3. active or stale connection state surfaces
4. skip and retry experience

## Migrations to add

1. `consents`
2. `institution_links`
3. `bank_accounts`
4. consent and link audit events

## APIs to implement

| API area | Why now |
|---|---|
| create consent session | start AA flow |
| get consent state | support post-consent handling |
| list institution links | show connection status |
| refresh link | prepare sync lifecycle |
| repair link | support degraded states |

## Async and webhook rollout

The team should introduce:

- AA callback endpoint handling
- consent activation processing
- data-ready event enqueueing
- link failure state updates

## Internal demo checkpoint

**Demo 3: Trust-forward linking**

The team should be able to show:

- a user reaching bank-link step
- clear consent explanation
- successful or mocked link creation
- visible connection state in the product
- skip flow without product breakage

## Stage 4: Ingestion, Merchant Intelligence, and Recurring Detection

## Goal

Turn financial connectivity into recurring candidate generation that users can review and trust.

## Why this is the first true intelligence stage

Only after this stage does the product begin to earn its recurring-intelligence positioning through automated detection rather than manual setup alone.

## Backend module order

1. raw transaction ingestion
2. normalized transaction pipeline
3. merchant alias and profile handling
4. recurring candidate generation
5. recurring review actions
6. candidate-to-subscription merge logic

## Worker build order

1. `transaction_ingestion`
2. `transaction_normalization`
3. `merchant_resolution`
4. `recurring_detection`

## Migrations to add

1. `raw_transactions`
2. `normalized_transactions`
3. `merchant_profiles`
4. `merchant_aliases`
5. `recurring_candidates`

## APIs to implement

| API area | Why now |
|---|---|
| list recurring candidates | expose review queue |
| confirm candidate | create trusted recurring item |
| dismiss candidate | support user correction |
| edit candidate | improve pre-confirmation control |
| merge candidate | prevent duplication with manual items |

## Detection implementation guidance

The first version should prioritize:

- explainable rule output
- reason codes
- confidence thresholds
- conservative review-first behavior

It should not prioritize:

- overly aggressive automation
- opaque ML-heavy logic
- silent background confirmation of weak candidates

## Internal demo checkpoint

**Demo 4: Automated recurring review**

The team should be able to show:

- ingested transactions for a linked account
- normalized merchant names
- generated recurring candidates
- confirm, dismiss, and edit actions
- dashboard updates after confirmation

## Stage 5: Dashboard, Recommendations, and First Actionability

## Goal

Deliver the first complete recurring-intelligence experience, combining visibility, explanation, and an actionable next step.

## Backend module order

1. dashboard summary aggregations
2. renewals query logic
3. duplicate indicator logic
4. recommendation generation
5. insight event generation
6. AI-backed narrative layer only after deterministic outputs exist

## Frontend screen order

1. dashboard summary cards
2. category breakdown
3. renewals list
4. duplicate indicator surface
5. savings recommendations
6. insight feed

## Migrations to add

1. `recommendations`
2. `insight_events`
3. optional dashboard materialization support if needed

## APIs to implement

| API area | Why now |
|---|---|
| dashboard summary | top-line recurring visibility |
| dashboard renewals | time-sensitive value |
| dashboard trends | recurring change context |
| recommendations list | actionability |
| recommendation action endpoint | accept, dismiss, snooze |
| insight feed | grounded narrative layer |

## AI rollout order

AI should enter only after:

- recommendations exist without AI
- dashboard facts are queryable
- freshness and confidence metadata exist
- suppression rules are available

Recommended AI rollout:

1. template-backed explanation fallback
2. grounded summary generation
3. recommendation explanation wording
4. bounded assistant later, not in the initial implementation loop

## Internal demo checkpoint

**Demo 5: First complete recurring-intelligence experience**

The team should be able to show:

- a user with manual and/or linked recurring data
- recurring total, categories, and renewals
- at least one grounded recommendation
- explanation of why a recommendation exists
- a first meaningful action such as dismiss, confirm, or snooze

## Stage 6: Notifications, Analytics, and Launch Readiness

## Goal

Make the MVP measurable, supportable, and capable of re-engaging users after the first session.

## Backend and worker order

1. notification preference model
2. in-app notification creation
3. email delivery integration
4. deduplication and snooze behavior
5. product analytics event capture
6. health and queue observability refinement

## Frontend order

1. in-app inbox
2. notification actions
3. preference management
4. alert deep-link routing

## Migrations to add

1. `notification_preferences`
2. `notifications`
3. analytics event support if event store is owned internally

## APIs to implement

| API area | Why now |
|---|---|
| list notifications | inbox visibility |
| read, dismiss, snooze actions | retention usability |
| notification preferences | user control |
| analytics event intake or internal wiring | measure MVP behavior |

## Instrumentation priorities

The team must be able to measure:

- onboarding completion by step
- auth success and failure
- bank-link start, success, failure, and skip
- manual recurring creation
- recurring candidate confirm and dismiss
- dashboard activation
- first action rate
- alert engagement
- recommendation action rate

## Internal demo checkpoint

**Demo 6: MVP launch candidate**

The team should be able to show:

- end-to-end onboarding
- manual or linked activation
- recurring dashboard and first action
- working reminders and inbox behavior
- visible operational and funnel metrics

## Recommended migration sequence

To reduce rework and preserve clean ownership, migrations should usually be introduced in this order:

1. `users`
2. `households`
3. `household_members`
4. onboarding persistence
5. `audit_events`
6. `subscriptions`
7. `utility_bills`
8. `consents`
9. `institution_links`
10. `bank_accounts`
11. `raw_transactions`
12. `normalized_transactions`
13. `merchant_profiles`
14. `merchant_aliases`
15. `recurring_candidates`
16. `recommendations`
17. `insight_events`
18. `notification_preferences`
19. `notifications`

This order keeps the model aligned to activation, manual value, automation, and re-engagement.

## Recommended API rollout order

The first external contract set to stabilize should be:

1. auth and session
2. households and active context
3. manual recurring CRUD
4. dashboard summary
5. aggregation consent and link state
6. recurring candidate review
7. recommendation and insight surfaces
8. notifications and preferences

This order matches the product value loop and keeps frontend and backend teams aligned on the highest-value surfaces first.

## Recommended frontend route rollout

Suggested MVP route order:

1. landing and value entry
2. onboarding flow
3. authentication flow
4. dashboard shell
5. manual recurring management
6. bank-link state flow
7. recurring candidate review queue
8. recommendations and insight detail
9. notifications inbox

## First usable internal demo definition

The team should treat the following as the first truly meaningful internal demo milestone:

### Demo target

A user can:

1. open the product in mobile-browser layout
2. select individual or household context
3. add a few subscriptions and bills
4. authenticate with OTP
5. see a recurring dashboard with at least one obvious next step

### Why this matters

This demo proves:

- onboarding is coherent
- manual value path works
- the recurring model is real
- the product is no longer just infrastructure

The team should aim to reach this before deep work on bank automation or AI.

## Risk management by sequence

| Risk | Sequence mitigation |
|---|---|
| Aggregator delays block MVP | manual path is built first |
| Schema churn across modules | migrations follow explicit domain order |
| Household logic arrives too late | household foundations appear in stage 1 |
| AI arrives before truth | AI enters only after deterministic dashboard and recommendation outputs exist |
| Dashboard quality depends on perfect automation | dashboard begins with manual and mixed-source states |
| Teams optimize for features, not demos | each stage ends in an internal demo checkpoint |

## Team workstream framing

This plan works best if the team loosely coordinates around four streams:

| Stream | Early priority | Later priority |
|---|---|---|
| Frontend | onboarding, auth, dashboard shell | candidate review, inbox, polish |
| Backend API | auth, households, recurring CRUD | recommendations, notifications, analytics |
| Workers and integrations | queue bootstrap, stubs | ingestion, detection, alerts, AI |
| Product and QA | acceptance framing, flow validation | instrumentation review, launch readiness |

## Recommended build cadence

The implementation sequence should be run in short delivery cycles where each cycle produces:

- one user-visible capability increase
- one demoable internal milestone
- one updated acceptance view
- one validated set of API or state assumptions

The team should avoid:

- building all backend modules before the first visible flow exists
- delaying dashboard rendering until automation is perfect
- introducing AI surfaces before deterministic facts are trustworthy

## Definition of code-start readiness

The team is ready to start implementation when:

- this implementation order is accepted
- the target stack is confirmed
- the repo bootstrap decision is final
- MVP module ownership is understood
- the contract and migration sequence are accepted as the initial baseline

## Current application state vs this plan (review snapshot)

Use this when judging fit for India + US on **one** codebase.

| Stage | Plan intent | Current state | India launch gap | US POC gap |
|-------|-------------|---------------|------------------|------------|
| 0–1 Foundation | Repo, auth, households | **Largely done** | — | — |
| 2 Manual recurring | Value without banks | **Done** | — | — |
| 3 Connectivity | AA / link lifecycle | **Partial** — mock + Setu consent/webhook; Plaid Link + exchange on US path | Setu real FI data | Production Plaid approval, token encryption |
| 4 Ingestion + recurring | raw → candidates | **Done** — mock, Plaid, and linked data; Plaid categories from PFC | Needs real Setu txns | Incremental sync cursor, webhooks |
| 5 Dashboard / insights | Actionability | **Largely done** | Content/locale INR | USD/locale |
| 6 Notifications / ops | Retention, readiness | **Largely done** | — | — |

**Conclusion:** The staged plan still fits. Stage 3 splits into two **adapter completion** efforts that feed the **same** Stage 4 pipeline. Stages 4–6 do not need duplication per country.

## Combine vs separate — recommendation

| Approach | Verdict |
|----------|---------|
| **One app, one database, provider adapters** (`mock` / `setu` / `plaid`) | **Recommended** — matches current `aggregation.adapterRegistry` direction |
| **One deployment, both providers always on** | **Not recommended** — wrong credentials, compliance blur, harder ops |
| **Two separate codebases** (India app vs US app) | **Not recommended** — duplicates recurring, dashboard, auth |
| **Two deployments, same image, different env** (India `setu`, US `plaid`) | **Recommended for near term** |
| **One deployment, `household.market` routing** | **Recommended before true dual-country GA** |

**Can you integrate both Setu and Plaid?** Yes — as **sibling adapters** into the same internal model, not as one combined upstream integration.

## Final recommendation

SubSense AI should be implemented in the same order that users will learn to trust it:

1. safe identity and context
2. useful manual recurring value
3. trust-forward financial connectivity (**India: finish Setu ingest**; **US: Plaid POC in parallel on feature branch**)
4. explainable recurring intelligence (shared — no fork per country)
5. actionable dashboard recommendations (shared; localize per market later)
6. measurable retention and launch readiness

That sequence gives the team the best chance to reach a credible MVP quickly without undermining trust, overbuilding too early, or coupling the entire product to bank automation before the manual value path is proven.

For architecture and env rules: `../architecture/multi-market-aggregation.md`.
