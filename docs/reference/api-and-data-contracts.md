# API and Data Contracts

## Purpose

This document translates the approved product and architecture decisions for `SubSense AI` into a practical implementation-facing contract reference.

It is intended to bridge the gap between:

- business and product requirements
- architecture guidance
- engineering planning
- future API design and schema work

It does **not** attempt to freeze every endpoint or database column in final form. Instead, it defines the minimum contract expectations that should remain stable as the phase-1 MVP is implemented.

Use this document alongside:

- `../../BRD.md`
- `../product/PRD.md`
- `../architecture/solution-architecture.md`
- `../architecture/data-model-overview.md`
- `../architecture/integration-landscape.md`
- `../architecture/multi-market-aggregation.md`
- `../architecture/security-and-compliance-controls.md`
- `../architecture/ai-governance.md`

## Goals

This document should make the following clear:

- which domain modules exist in the MVP
- what each module owns
- which APIs should exist between frontend and backend
- which records and fields are critical to preserve
- how state transitions should be represented
- which async jobs and webhooks are required
- how permissions, freshness, lineage, and auditability appear in contracts

## Contract design principles

1. **Domain ownership must stay explicit**
   Auth, households, aggregation, transactions, merchants, recurring items, insights, and notifications should not collapse into one generic API surface.

2. **Contracts should favor product truth over transport convenience**
   API shapes should reflect business entities and user workflows, not only backend table layout.

3. **Lineage must be preservable**
   Any recurring item, recommendation, or insight derived from financial data should remain traceable to normalized and source financial records.

4. **Freshness is a product contract**
   Data freshness and stale-state messaging are not optional UI details. They should appear in backend responses where relevant.

5. **Manual and linked-bank paths must share a common recurring model**
   The user should not experience two separate products depending on how data entered the system.

6. **Async boundaries must be first-class**
   Ingestion, normalization, detection, notification, and AI work should be contractable and observable as background workflows.

## Audience and usage

This document is most useful for:

- backend API planning
- frontend state and type modeling
- schema and migration planning
- QA scenario design
- partner and webhook boundary review later

## MVP module map

| Module | Owns | Primary API responsibility |
|---|---|---|
| `auth` | user identity, OTP verification, session state | login, verify, session retrieval, logout |
| `households` | households, member roles, privacy scopes | create/select household, view household context |
| `aggregation` | bank-link consents and institution links (Setu IN, Plaid US, mock dev) | start link, check status, refresh, repair visibility |
| `transactions` | raw and normalized financial records, freshness state | internal query support, sync state, lineage references |
| `merchants` | canonical merchants, aliases, category normalization | mostly internal MVP surface, supports recurring and insight APIs |
| `recurring` | candidates, subscriptions, utility bills, confirm/dismiss/edit flows | recurring review and management APIs |
| `insights` | dashboard summaries, recommendations, AI narratives | dashboard queries, recommendation actions, insight feed |
| `notifications` | preferences, in-app inbox, reminder states | fetch inbox, dismiss, snooze, preference update |
| `audit` | sensitive action trail | mostly internal MVP surface |

## Shared API conventions

## 1. Envelope shape

For MVP, external API responses should use a consistent envelope.

### Success shape

```json
{
  "data": {},
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-05-13T23:15:00Z"
  }
}
```

### Error shape

```json
{
  "error": {
    "code": "CONSENT_EXPIRED",
    "message": "Your bank connection needs to be refreshed.",
    "details": {}
  },
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-05-13T23:15:00Z"
  }
}
```

## 2. Identifier conventions

The platform should use stable opaque IDs across public-facing contracts.

| Entity | Example ID shape | Notes |
|---|---|---|
| user | `usr_...` | never expose internal sequence IDs |
| household | `hh_...` | stable across module boundaries |
| consent | `con_...` | lifecycle-critical |
| institution link | `lnk_...` | distinct from consent ID |
| bank account | `acct_...` | may map to masked provider reference |
| recurring candidate | `rc_...` | review queue entity |
| subscription | `sub_...` | confirmed recurring item |
| utility bill | `utl_...` | separate from subscription |
| recommendation | `rec_...` | actionable optimization item |
| insight event | `ins_...` | explanation or AI narrative unit |
| notification | `ntf_...` | inbox and delivery object |

## 3. Timestamps and audit fields

The following fields should be standard where applicable:

- `created_at`
- `updated_at`
- `created_by` when a human or system actor matters
- `source_type` such as `manual`, `detected`, `aggregator`, or `system`
- `last_evaluated_at` for derived entities where freshness matters

## 4. Freshness contract

Any dashboard, connection, or insight surface that depends on financial data should expose freshness metadata.

### Suggested freshness block

```json
{
  "freshness": {
    "status": "fresh",
    "last_successful_sync_at": "2026-05-13T21:30:00Z",
    "stale_after": "2026-05-15T21:30:00Z",
    "message": "Updated 2 hours ago"
  }
}
```

Allowed `freshness.status` values:

- `fresh`
- `stale`
- `syncing`
- `needs_repair`
- `unavailable`

## 5. Permission and visibility contract

Responses that can vary by household or privacy context should expose viewer scope where useful.

### Suggested visibility block

```json
{
  "visibility": {
    "ownership_scope": "shared",
    "viewer_access": "full"
  }
}
```

Suggested values:

- `ownership_scope`: `personal`, `shared`
- `viewer_access`: `full`, `limited`, `hidden`

## Core entity contracts

## 1. User

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | opaque user identifier |
| `phone_number_masked` | string | do not return raw phone number unnecessarily |
| `auth_state` | string | `guest`, `verified`, `locked`, `inactive` |
| `default_household_id` | string nullable | selected active context |
| `lifecycle_status` | string | onboarding and account lifecycle state |

### Contract notes

- user records should not embed household membership data directly
- bank-link state should not live on the user entity

## 2. Household

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | opaque household identifier |
| `name` | string | user-facing name |
| `type` | string | `individual`, `family`, `shared_home`, or similar |
| `owner_user_id` | string | owner reference |
| `privacy_mode` | string | top-level privacy posture |
| `selected_at` | timestamp nullable | useful for recent-session context |

### Household member fields

| Field | Type | Notes |
|---|---|---|
| `household_id` | string | parent household |
| `user_id` | string | member reference |
| `role` | string | `owner`, `member`, future `viewer` if needed |
| `member_status` | string | `pending`, `active`, `removed` |
| `visibility_scope` | string | how much shared detail is allowed |

## 3. Consent

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | consent identifier |
| `household_id` | string | consent belongs to household context |
| `provider` | string | `setu_aa` (India / Setu), `plaid` (US); stored on consent/link, not inferred from env alone |
| `provider_consent_ref` | string nullable | external id (Setu ConsentHandle; Plaid `item_id` after exchange) |
| `purpose` | string | user-facing purpose limitation |
| `scope` | array | approved data scope |
| `status` | string | see lifecycle below |
| `issued_at` | timestamp nullable | consent start |
| `expires_at` | timestamp nullable | consent expiry |
| `revoked_at` | timestamp nullable | revocation time |

### Allowed status values

- `draft`
- `pending_user_action`
- `active`
- `expired`
- `revoked`
- `failed`

## 4. Institution link

This entity is operational and distinct from consent.

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | link identifier |
| `consent_id` | string | parent consent |
| `institution_name` | string | user-facing bank name |
| `link_status` | string | see lifecycle below |
| `last_successful_sync_at` | timestamp nullable | operational state |
| `last_failure_reason` | string nullable | user-supportable reason |
| `repair_required` | boolean | whether re-linking is needed |

### Allowed `link_status` values

- `pending`
- `active`
- `syncing`
- `stale`
- `failed`
- `repair_required`
- `disconnected`

## 5. Bank account

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | account identifier |
| `institution_link_id` | string | parent connection |
| `household_id` | string | household mapping |
| `account_type` | string | savings, current, card-like account, etc. |
| `masked_account_reference` | string | safe display form only |
| `provider_account_id` | string nullable | internal/protected provider mapping |
| `account_status` | string | `active`, `inactive`, `hidden` |

## 6. Raw transaction

This should remain mostly internal, but lineage-aware APIs may expose references.

### Minimum internal fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | raw record identifier |
| `bank_account_id` | string | source account |
| `provider_transaction_id` | string nullable | upstream reference |
| `description_raw` | string | original descriptor |
| `amount` | decimal | source amount |
| `direction` | string | `debit`, `credit` |
| `occurred_at` | timestamp | source transaction time |
| `ingestion_batch_id` | string | replay and lineage support |
| `consent_id` | string | source consent lineage |

## 7. Normalized transaction

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | normalized record identifier |
| `raw_transaction_id` | string | source lineage |
| `merchant_profile_id` | string nullable | canonical merchant mapping |
| `description_normalized` | string | cleaned descriptor |
| `category` | string | normalized category |
| `amount` | decimal | normalized amount |
| `recurring_signals` | object | cadence and pattern hints |
| `duplicate_flags` | object nullable | duplicate suppression metadata |

## 8. Merchant profile

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | canonical merchant identifier |
| `display_name` | string | user-facing merchant name |
| `merchant_type` | string | streaming, utility, SaaS, education, etc. |
| `category_default` | string | default normalized category |
| `quality_score` | number nullable | normalization quality signal |

## 9. Recurring candidate

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | candidate identifier |
| `household_id` | string | household context |
| `merchant_profile_id` | string nullable | canonical merchant where known |
| `candidate_type` | string | `subscription`, `utility`, `other_recurring` |
| `confidence_score` | number | model or rules confidence |
| `reason_codes` | array | why it was detected |
| `suggested_amount` | decimal | current expected amount |
| `cadence` | string | monthly, yearly, variable monthly, etc. |
| `review_status` | string | see lifecycle below |
| `source_transaction_refs` | array | lineage to normalized or raw data |

### Allowed `review_status` values

- `pending_review`
- `confirmed`
- `dismissed`
- `merged`
- `expired`

## 10. Subscription

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | confirmed recurring identifier |
| `household_id` | string | owning household |
| `merchant_profile_id` | string nullable | canonical merchant |
| `display_name` | string | user-facing label |
| `cadence` | string | monthly, quarterly, yearly, etc. |
| `amount` | decimal | current amount |
| `normalized_monthly_amount` | decimal | common comparison amount |
| `renewal_date` | timestamp nullable | next known renewal |
| `ownership_scope` | string | `personal`, `shared` |
| `source_type` | string | `manual`, `detected`, `merged` |
| `status` | string | see lifecycle below |

### Allowed `status` values

- `active`
- `paused`
- `watchlist`
- `cancelled`
- `archived`

## 11. Utility bill

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | utility identifier |
| `household_id` | string | owning household |
| `provider_name` | string | utility provider display name |
| `bill_type` | string | electricity, gas, broadband, water, mobile, etc. |
| `typical_amount` | decimal nullable | expected average |
| `last_amount` | decimal nullable | latest known amount |
| `due_date_rule` | string nullable | due cadence or due-day rule |
| `ownership_scope` | string | `personal`, `shared` |
| `status` | string | `active`, `watchlist`, `inactive` |

## 12. Recommendation

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | recommendation identifier |
| `household_id` | string | household context |
| `recommendation_type` | string | cancel, downgrade, share, bundle, monitor |
| `target_entity_type` | string | subscription, utility_bill, household_bundle |
| `target_entity_id` | string | target record |
| `estimated_monthly_value` | decimal | expected savings or monitored impact |
| `confidence` | number | deterministic or hybrid confidence |
| `assumptions` | array | explicit user-visible assumptions |
| `priority_rank` | integer | ordering support |
| `status` | string | see lifecycle below |

### Allowed `status` values

- `open`
- `accepted`
- `dismissed`
- `snoozed`
- `expired`

### Response extensions (API only, not DB columns)

For **`GET /v1/insights/dashboard-summary`** (and **`GET /v1/insights/recommendations`** when returning the same recommendation shape), each recommendation object may include:

| Field | Type | Notes |
|---|---|---|
| `alternatives` | array optional | Curated substitution options from the manual inventory; keyed off recurring **category** of the target subscription or utility. Each item: `id`, `label`, `priceBandLabel`, `regionNote` (optional), `disclaimer`, `source` (e.g. `manual_catalog`), `lastVerifiedAt` (ISO date), `moreInfoUrl` (optional). Omitted when no inventory match. **Not persisted** on `recommendations` rows in MVP. |

## 13. Insight event

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | insight identifier |
| `household_id` | string | household context |
| `insight_type` | string | dashboard summary, spend change, recommendation explanation |
| `source_recommendation_id` | string nullable | if tied to recommendation |
| `generated_text` | string | user-facing explanation |
| `evidence_refs` | array | source facts |
| `freshness_status` | string | aligns to freshness contract |
| `confidence_label` | string nullable | optional UX-level confidence |
| `generation_mode` | string | `rules`, `ai_grounded`, `template` |

## 14. Notification

### Minimum fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | notification identifier |
| `household_id` | string | household context |
| `notification_type` | string | renewal, anomaly, stale_link, recommendation |
| `channel` | string | `in_app`, `email` |
| `delivery_state` | string | `queued`, `sent`, `failed`, `read`, `dismissed`, `snoozed` |
| `trigger_entity_type` | string | source object type |
| `trigger_entity_id` | string | source object identifier |
| `deep_link` | string nullable | frontend route target |

## API surface by module

The endpoints below are implementation-facing recommendations, not final route freezes.

## 1. Auth APIs

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/auth/request-otp` | `POST` | start verification flow |
| `/v1/auth/verify-otp` | `POST` | verify OTP and create session |
| `/v1/auth/session` | `GET` | fetch current session and active user context |
| `/v1/auth/logout` | `POST` | revoke session |

### Request and response requirements

- OTP request should return cooldown and retry guidance
- verify response should include selected household context if one exists
- session response should include `auth_state`, `user`, and active household summary

## 2. Household APIs

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/households` | `POST` | create initial household |
| `/v1/households/current` | `GET` | get active household context |
| `/v1/households/current/select` | `POST` | change current household |
| `/v1/households/current` | `PATCH` | update household metadata and privacy settings |

### Contract rules

- household selection should be explicit during onboarding
- responses should include role and viewer scope
- future invite APIs can be deferred until post-MVP

## 3. Aggregation APIs

### Regional providers (India vs US)

| Market | `AGGREGATION_PROVIDER` | Start link | Provider callback |
|--------|------------------------|------------|-------------------|
| India | `setu` | `POST /consents` → Setu Create Consent + redirect | `POST /v1/aggregation/callbacks/setu` |
| US | `plaid` | `POST /consents` → Plaid `link_token` | `POST /v1/aggregation/plaid/exchange` |
| Dev | `mock` | mock redirect URL | `POST .../consents/:id/mock-callback` |

India and US share the same consent/link **response shapes** after ingest. Provider-specific logic stays in adapters; see `../architecture/multi-market-aggregation.md`.

### Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/aggregation/consents` | `POST` | create consent initiation session (adapter: Setu, Plaid, or mock) |
| `/v1/aggregation/consents/:id` | `GET` | fetch consent state |
| `/v1/aggregation/consents/:id/mock-callback` | `POST` | dev-only simulate provider approval/failure |
| `/v1/aggregation/callbacks/setu` | `POST` | **Setu only** — `CONSENT_STATUS_UPDATE` webhooks |
| `/v1/aggregation/plaid/exchange` | `POST` | **Plaid only** — exchange `public_token` after Link |
| `/v1/aggregation/consents/:id/plaid-link-token` | `GET` | **Plaid only** — fresh `link_token` for OAuth return / reconnect |
| `/v1/aggregation/links` | `GET` | list institution links for current household |
| `/v1/aggregation/links/:id/refresh` | `POST` | request a data refresh |
| `/v1/aggregation/links/:id/repair` | `POST` | start repair or reconnect flow |

### Response requirements

- consent and link responses must expose lifecycle state separately
- `redirect.provider_name` identifies Setu vs Plaid vs mock for the frontend
- links must include freshness and last sync data
- skip-linking should not be represented as an error state

## 4. Recurring candidate APIs

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/recurring/candidates` | `GET` | fetch pending candidate queue |
| `/v1/recurring/candidates/:id/confirm` | `POST` | confirm candidate into recurring source of truth |
| `/v1/recurring/candidates/:id/dismiss` | `POST` | dismiss candidate |
| `/v1/recurring/candidates/:id` | `PATCH` | edit details before confirm |
| `/v1/recurring/candidates/:id/merge` | `POST` | merge candidate into existing recurring item |

### Candidate query filters

- `review_status`
- `candidate_type`
- `confidence_min`
- `ownership_scope`

## 5. Subscription and utility APIs

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/recurring/subscriptions` | `GET` | list subscriptions |
| `/v1/recurring/subscriptions` | `POST` | create manual subscription |
| `/v1/recurring/subscriptions/:id` | `PATCH` | edit subscription |
| `/v1/recurring/subscriptions/:id/archive` | `POST` | archive or cancel tracked item |
| `/v1/recurring/utilities` | `GET` | list utility bills |
| `/v1/recurring/utilities` | `POST` | create manual utility |
| `/v1/recurring/utilities/:id` | `PATCH` | edit utility |

### Shared contract rules

- manual and detected items should return a consistent recurring-item summary shape
- ownership scope should be explicit in responses
- merge history should remain traceable

## 6. Dashboard and insight APIs

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/dashboard/summary` | `GET` | recurring totals, counts, freshness, top actions |
| `/v1/dashboard/renewals` | `GET` | upcoming renewals and due items |
| `/v1/dashboard/trends` | `GET` | recurring trend analysis |
| `/v1/insights/recommendations` | `GET` | ranked optimization opportunities |
| `/v1/insights/recommendations/:id/action` | `POST` | accept, dismiss, snooze recommendation |
| `/v1/insights/feed` | `GET` | insight event feed |

### Dashboard response expectations

Responses should include:

- household summary
- recurring totals
- freshness block
- empty-state or partial-state cues where relevant
- ability to distinguish linked-bank and manual-only value sources

## 7. Notification APIs

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/notifications` | `GET` | list inbox notifications |
| `/v1/notifications/:id/read` | `POST` | mark notification as read |
| `/v1/notifications/:id/dismiss` | `POST` | dismiss notification |
| `/v1/notifications/:id/snooze` | `POST` | snooze notification |
| `/v1/notification-preferences` | `GET` | get current channel preferences |
| `/v1/notification-preferences` | `PATCH` | update channel preferences |

## State transition contracts

## 1. Onboarding state

Suggested onboarding state values:

- `not_started`
- `household_selected`
- `essentials_seeded`
- `subscriptions_seeded`
- `authenticated`
- `bank_link_skipped`
- `bank_link_started`
- `dashboard_activated`

This state can live in an onboarding progress model or be derived from events, but it should remain queryable.

## 2. Recurring candidate to subscription transition

Expected transition path:

`pending_review -> confirmed -> subscription created`

Alternative paths:

- `pending_review -> dismissed`
- `pending_review -> merged`

The system should never silently move low-confidence candidates straight into `confirmed` recurring status without explicit review logic.

## 3. Recommendation action transitions

Expected recommendation states:

- `open`
- `accepted`
- `dismissed`
- `snoozed`
- `expired`

Every state change should preserve:

- timestamp
- actor
- rationale if system-triggered

## 4. Notification transitions

Typical notification lifecycle:

`queued -> sent -> read`

Alternative user actions:

- `sent -> dismissed`
- `sent -> snoozed`
- `queued -> failed`

## Async job contracts

Async work should be explicit enough that engineers can reason about queue boundaries and QA can reason about eventual consistency.

### Per-link sync schedule (persistence)

When migration **`000011_link_sync_schedule`** is applied, PostgreSQL holds **`link_sync_schedule`** (keyed by `institution_links.id`) with **`next_run_at`** and tier-driven baseline intervals. Each successful **`link.ingest`** job updates this row so a future scheduler can select due links without coupling to dashboard API traffic. If the table is absent (unmigrated database), ingest still succeeds and the bump is skipped (logged). Details: `../architecture/platform-evolution-implementation-plan.md` and `../architecture/data-model-overview.md`.

## 1. Required job families

| Job family | Trigger | Output |
|---|---|---|
| `transaction_ingestion` | consent activation, refresh request, scheduled sync (Phase 1.2 worker), completion bumps `link_sync_schedule.next_run_at` | raw transaction records persisted; per-link **next scheduled pull** updated when migration `000011` is applied |
| `transaction_normalization` | new raw transactions | normalized transactions and merchant mapping attempts |
| `recurring_detection` | normalized transaction updates | recurring candidates updated |
| `recommendation_generation` | recurring changes or scheduled evaluation | recommendations refreshed |
| `insight_generation` | dashboard refresh or recommendation update | insight events created or suppressed |
| `notification_dispatch` | renewal, stale link, anomaly, recommendation trigger | in-app or email notifications created and sent |
| `data_export` | user export request | export artifact generated |
| `data_deletion` | deletion workflow | deletion/audit completion record |

## 2. Suggested job payload shape

```json
{
  "job_id": "job_123",
  "job_type": "recurring_detection",
  "household_id": "hh_123",
  "entity_refs": [
    "acct_123"
  ],
  "requested_at": "2026-05-13T23:15:00Z"
}
```

## 3. Async observability requirements

Each job family should support:

- enqueue time
- start time
- completion time
- retry count
- last error code
- impacted entity references

## Webhook contracts

## 1. Account Aggregator webhooks

The MVP should be ready for provider callbacks related to:

- consent approved
- consent failed
- consent revoked
- data available
- link failure

### Suggested webhook handling contract

| Webhook event | Internal effect |
|---|---|
| `consent.active` | mark consent active, create sync work |
| `consent.expired` | mark consent expired, flag stale state |
| `consent.revoked` | mark revoked, suppress future syncs |
| `link.failed` | mark link failed, store failure reason |
| `data.ready` | enqueue ingestion |

## 2. Notification provider callbacks

Useful but non-critical callback classes:

- delivered
- bounced
- suppressed
- failed

These should update delivery state, not create a second notification record.

## Permission matrix

| Action | Guest | Verified user | Household owner | Future admin/support |
|---|---|---|---|---|
| Seed onboarding data | yes | yes | yes | yes |
| Persist dashboard context | limited | yes | yes | restricted |
| Start bank linking | no | yes | yes | restricted |
| Confirm recurring candidate | no | yes | yes | restricted |
| Edit shared recurring scope | no | limited | yes | restricted |
| Export personal data | no | yes | yes | restricted and audited |
| View private household item not owned by viewer | no | no | policy-bound | restricted and audited |

## Error model

Recommended error-code families:

- `AUTH_*`
- `HOUSEHOLD_*`
- `CONSENT_*`
- `LINK_*`
- `RECURRING_*`
- `RECOMMENDATION_*`
- `NOTIFICATION_*`
- `RATE_LIMIT_*`
- `INTERNAL_*`

### Important product-facing examples

| Error code | Meaning | UX expectation |
|---|---|---|
| `AUTH_REQUIRED` | user must authenticate | route to OTP flow without losing progress |
| `CONSENT_EXPIRED` | data access needs renewal | show trust-forward reconnect messaging |
| `LINK_REPAIR_REQUIRED` | institution connection broken | show repair CTA |
| `RECURRING_ALREADY_MERGED` | candidate resolved already | refresh queue cleanly |
| `INSUFFICIENT_SCOPE` | viewer lacks permission | show privacy-aware failure, not generic crash |

## Audit and lineage contract

The following actions should create auditable records:

- OTP verification success or lockout
- household context changes affecting visibility
- consent creation, activation, expiry, and revocation
- bank-link repair and refresh attempts
- recurring candidate confirm, dismiss, edit, and merge
- recommendation accept, dismiss, and snooze
- data export and deletion actions

Derived entities should preserve lineage fields or references to:

- consent
- institution link
- bank account
- raw transaction
- normalized transaction
- recommendation evidence sources

## Versioning guidance

For phase 1, the API can remain under `v1`, but contract discipline should still exist.

Recommended rules:

- additive changes are preferred over breaking renames
- enum expansion should be planned carefully
- frontend and backend should share documented status values
- deprecated fields should be marked before removal

## MVP implementation priorities

The first contracts to finalize in delivery should be:

1. auth and session
2. household context
3. consent and institution link lifecycle
4. recurring candidate review
5. manual subscription and utility CRUD
6. dashboard summary and recommendation APIs
7. notification inbox and preference contracts

This sequence aligns with the MVP epic order and helps the team build the core value loop without over-designing later partner APIs.

## Deliberately deferred contracts

The following contract areas can wait until later phases:

- partner tenant APIs
- white-label embedding contracts
- direct cancellation execution
- payment initiation
- advanced household invite management
- marketplace or affiliate fulfillment APIs

## Final recommendation

SubSense AI should use this contract reference to keep phase-1 implementation disciplined around a few high-value truths:

- recurring intelligence is household-aware
- bank connectivity and manual setup converge into one recurring model
- freshness, lineage, and auditability are part of the contract
- async workflows are explicit
- AI outputs remain subordinate to deterministic product truth

If these contracts are held consistently, the team can move from planning into implementation without losing the trust and clarity built into the earlier product and architecture documents.
