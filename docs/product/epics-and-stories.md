# SubSense AI Epics and Stories

## Purpose

This document translates the phase-1 MVP PRD into delivery-ready epics and stories for product, engineering, and design planning.

It is intentionally structured for execution:

- a small set of MVP epics
- clear story groupings
- priority guidance
- dependencies
- acceptance framing

This document should be used after:

- `../../BRD.md`
- `PRD.md`
- `mvp-web-scope.md`

---

## 1. Delivery Principles

- Keep phase 1 focused on validating recurring-intelligence value.
- Optimize for mobile-browser-first UX.
- Prioritize trust, clarity, and data correctness before AI depth.
- Preserve strong manual fallback flows where automation is incomplete.
- Avoid expanding into adjacent finance capabilities such as payments or cancellation execution.

---

## 2. MVP Epic Map

| Epic ID | Epic name | Goal | Priority |
|---|---|---|---|
| E1 | Onboarding and activation | Get users to first dashboard value quickly | P0 |
| E2 | Authentication and account foundation | Secure user identity and persistent product access | P0 |
| E3 | Bank linking and consent | Enable financial data connectivity through AA flows | P0 |
| E4 | Recurring detection and review | Turn ingested transactions into reviewable recurring candidates | P0 |
| E5 | Manual recurring management | Ensure users can still get value without bank automation | P0 |
| E6 | Dashboard and recurring insights | Deliver a trusted recurring-intelligence dashboard | P0 |
| E7 | Notifications and retention | Re-engage users around renewals and recurring anomalies | P1 |
| E8 | Household-ready data foundations | Support shared and personal recurring context from day one | P1 |
| E9 | Product analytics and admin visibility | Instrument the MVP for learning and iteration | P0 |

---

## 3. Epic Details

## E1. Onboarding and Activation

### Goal

Help users reach a meaningful recurring-spend dashboard with minimal friction.

### Stories

| Story ID | Story | Priority |
|---|---|---|
| E1-S1 | As a user, I can land on a value-oriented entry experience that explains what the product does | P0 |
| E1-S2 | As a user, I can choose whether I am managing myself or a household | P0 |
| E1-S3 | As a user, I can enter essential recurring expenses before linking my bank | P0 |
| E1-S4 | As a user, I can seed a few known subscriptions quickly during onboarding | P0 |
| E1-S5 | As a user, I can resume setup if I leave before finishing onboarding | P1 |
| E1-S6 | As a user, I am guided to either link my bank or continue with manual setup | P0 |

### Acceptance criteria

- users can complete the onboarding flow fully on mobile web
- onboarding creates enough data to avoid a blank dashboard
- users who skip linking still reach a meaningful post-onboarding state

### Dependencies

- E2 authentication
- E5 manual recurring setup
- E6 dashboard rendering

---

## E2. Authentication and Account Foundation

### Goal

Provide secure, low-friction identity handling that supports delayed sign-up and persistent product usage.

### Stories

| Story ID | Story | Priority |
|---|---|---|
| E2-S1 | As a user, I can authenticate with OTP on mobile web | P0 |
| E2-S2 | As a user, my onboarding progress is preserved when I authenticate | P0 |
| E2-S3 | As a user, I am required to authenticate before sensitive actions such as bank linking are finalized | P0 |
| E2-S4 | As a returning user, I can access my recurring dashboard without rebuilding my setup | P0 |
| E2-S5 | As a user, expired or invalid auth states are handled clearly and safely | P1 |

### Acceptance criteria

- sign-in works reliably in mobile browsers
- users do not lose draft progress at auth boundaries
- protected product routes require valid auth

### Dependencies

- base user model
- secure auth backend and OTP provider

---

## E3. Bank Linking and Consent

### Goal

Allow users to connect financial accounts through clear, trust-forward consent flows.

### Stories

| Story ID | Story | Priority |
|---|---|---|
| E3-S1 | As a user, I can see why the app is requesting financial data before I begin consent | P0 |
| E3-S2 | As a user, I can initiate AA-based consent and account linking from the onboarding or dashboard flow | P0 |
| E3-S3 | As a user, I can skip bank linking without blocking product usage | P0 |
| E3-S4 | As a user, I can see whether my financial connection is active, stale, or needs repair | P0 |
| E3-S5 | As a user, I receive understandable feedback when linking fails or consent expires | P1 |

### Acceptance criteria

- users can successfully enter and exit consent journeys from mobile web
- skipped linking preserves activation
- link state is visible and understandable in the product

### Dependencies

- E2 authentication
- aggregation backend
- consent and connection data model

---

## E4. Recurring Detection and Review

### Goal

Transform raw financial data into user-reviewable recurring candidates with enough confidence and explainability to build trust.

### Stories

| Story ID | Story | Priority |
|---|---|---|
| E4-S1 | As a user, I can see a queue of detected recurring candidates after transactions are processed | P0 |
| E4-S2 | As a user, I can confirm a recurring candidate so that it appears in my recurring dashboard | P0 |
| E4-S3 | As a user, I can dismiss a recurring candidate that is incorrect | P0 |
| E4-S4 | As a user, I can edit detected recurring details before saving them | P0 |
| E4-S5 | As a user, I can see enough explanation to understand why something was identified as recurring | P1 |
| E4-S6 | As a user, duplicate or overlapping detected items are surfaced for review instead of silently saved | P1 |

### Acceptance criteria

- recurring candidates are clearly separated from confirmed recurring items
- users can confirm, dismiss, and edit without confusion
- candidate handling updates the dashboard and recurring state correctly

### Dependencies

- E3 bank linking
- transaction ingestion
- merchant normalization
- recurring-detection engine

---

## E5. Manual Recurring Management

### Goal

Ensure the product remains valuable even when users skip linking or when recurring detection is incomplete.

### Stories

| Story ID | Story | Priority |
|---|---|---|
| E5-S1 | As a user, I can manually add a subscription | P0 |
| E5-S2 | As a user, I can manually add a utility or recurring bill | P0 |
| E5-S3 | As a user, I can edit or remove a manually created recurring item | P0 |
| E5-S4 | As a user, I can mark a recurring item as shared or personal | P1 |
| E5-S5 | As a user, later detection results can be reconciled with manual items instead of duplicating them | P1 |

### Acceptance criteria

- manual recurring items immediately feed the dashboard and reminders
- subscriptions and utilities are both supported
- manually entered items can be maintained over time without breaking insight logic

### Dependencies

- recurring item domain model
- dashboard views
- notification logic

---

## E6. Dashboard and Recurring Insights

### Goal

Deliver a premium, trusted recurring-intelligence surface that gives users visibility and actionability.

### Stories

| Story ID | Story | Priority |
|---|---|---|
| E6-S1 | As a user, I can see my total recurring burden on first dashboard load | P0 |
| E6-S2 | As a user, I can view recurring spend by category | P0 |
| E6-S3 | As a user, I can view upcoming renewals and due dates | P0 |
| E6-S4 | As a user, I can see duplicate subscription indicators where applicable | P0 |
| E6-S5 | As a user, I can see savings potential or optimization opportunities | P0 |
| E6-S6 | As a user, I can view recurring spend movement over time | P1 |
| E6-S7 | As a user, I can read AI-backed insight summaries grounded in my recurring data | P1 |
| E6-S8 | As a user, I can understand when dashboard data is stale or incomplete | P0 |

### Acceptance criteria

- dashboard remains understandable on mobile-browser widths
- core widgets work for both linked and manual-only users
- insight and recommendation modules do not appear speculative or ungrounded

### Dependencies

- E4 recurring detection
- E5 manual recurring setup
- E7 notifications
- analytics and query APIs

---

## E7. Notifications and Retention

### Goal

Create timely and trustworthy re-engagement loops around recurring events and actionable product insights.

### Stories

| Story ID | Story | Priority |
|---|---|---|
| E7-S1 | As a user, I can receive in-app notifications for renewals and recurring anomalies | P1 |
| E7-S2 | As a user, I can receive email reminders for important recurring events | P1 |
| E7-S3 | As a user, I can dismiss or snooze certain alerts | P1 |
| E7-S4 | As a user, I do not receive duplicate notifications for the same event | P1 |
| E7-S5 | As a user, alerts take me directly to the relevant subscription, utility, or dashboard context | P1 |

### Acceptance criteria

- important reminder flows are operational in phase 1
- alerts are specific, understandable, and actionable
- alert fatigue is reduced through suppression and snooze behavior

### Dependencies

- notification preferences
- email provider
- recurring and insight event generation

---

## E8. Household-Ready Data Foundations

### Goal

Ensure the MVP can represent personal and shared recurring contexts without needing a later core-model rewrite.

### Stories

| Story ID | Story | Priority |
|---|---|---|
| E8-S1 | As a user, I can choose a household or individual mode during onboarding | P1 |
| E8-S2 | As a user, I can assign recurring items as personal or shared | P1 |
| E8-S3 | As the system, I can store household-aware recurring ownership in a way that supports later member expansion | P0 |
| E8-S4 | As the system, I can preserve privacy-aware boundaries for future household roles and visibility rules | P1 |

### Acceptance criteria

- household context exists in the core model from day one
- recurring ownership is not hard-coded to a single-user assumption
- future household-member expansion is enabled without redesigning the base schema

### Dependencies

- household entity and membership model
- recurring item model

---

## E9. Product Analytics and Admin Visibility

### Goal

Instrument the MVP so the team can learn quickly and make evidence-based roadmap decisions.

### Stories

| Story ID | Story | Priority |
|---|---|---|
| E9-S1 | As the team, we can measure onboarding step completion | P0 |
| E9-S2 | As the team, we can measure bank-link start, success, failure, and skip behavior | P0 |
| E9-S3 | As the team, we can measure recurring confirm and dismiss behavior | P0 |
| E9-S4 | As the team, we can measure dashboard activation and module interaction | P0 |
| E9-S5 | As the team, we can measure alert engagement and recommendation action rates | P1 |
| E9-S6 | As the team, we can observe core service health, sync reliability, and queue execution behavior | P0 |

### Acceptance criteria

- product learning metrics exist for the core activation funnel
- system health is visible enough to operate recurring ingestion and alerts safely
- native-app decisions can later be made from actual retention and engagement evidence

### Dependencies

- event instrumentation strategy
- metrics and observability stack
- admin or internal reporting access

---

## 4. Delivery Sequence

## Phase 1A: Activation foundations

Recommended build order:

1. E2 Authentication and account foundation
2. E1 Onboarding and activation
3. E8 Household-ready data foundations

## Phase 1B: Core recurring value

Recommended build order:

4. E5 Manual recurring management
5. E3 Bank linking and consent
6. E4 Recurring detection and review
7. E6 Dashboard and recurring insights

## Phase 1C: Retention and learning

Recommended build order:

8. E7 Notifications and retention
9. E9 Product analytics and admin visibility

---

## 5. Suggested Milestone Grouping

| Milestone | Included epics | Outcome |
|---|---|---|
| M1 | E1, E2, E8 | User can onboard, authenticate, and establish recurring context |
| M2 | E5, E3 | User can create value manually and optionally link financial data |
| M3 | E4, E6 | User can review recurring detections and see a trusted dashboard |
| M4 | E7, E9 | Team can drive re-engagement and measure MVP quality |

---

## 6. Cross-Epic Dependencies

| Dependency | Needed by | Why it matters |
|---|---|---|
| Auth and session foundation | E1, E3, E6, E7 | Persistent and sensitive product flows depend on it |
| Household-aware core model | E5, E6, E8 | Shared vs personal ownership must be represented early |
| Transaction ingestion and normalization | E4, E6, E7 | Detection, dashboarding, and alerts depend on it |
| Merchant normalization | E4, E6 | Duplicate and recurring quality depend on it |
| Notification infrastructure | E7 | Renewal and anomaly loops require it |
| Product analytics instrumentation | E9 and all user-facing epics | Needed to evaluate MVP performance |

---

## 7. Engineering Notes

### Recommended implementation posture

- keep the backend as a modular monolith
- treat bank-linking, transactions, merchants, subscriptions, insights, households, and notifications as explicit domains
- keep migrations-only schema control
- use queue-backed processing for async ingestion, recurring detection, alerts, and AI jobs

### Strong anti-patterns to avoid

- building phase 1 as a generic broad finance app
- delaying manual setup until after bank connectivity
- overbuilding native-only capabilities into the web MVP
- coupling dashboard behavior tightly to only one ingestion path
- using AI to hide weak deterministic logic

---

## 8. Definition of MVP Completion

The epics in this document are complete enough for MVP launch when:

- mobile-web onboarding is reliable
- users can reach value with or without bank linking
- recurring detection is reviewable and trustworthy
- dashboard data is clear and useful
- at least basic reminders and notifications are active
- the team can measure activation, retention, and action rates

---

## 9. Recommended Next Documents

After this epic breakdown, the next logical documents are:

- `user-journeys.md`
- `phase-1-milestones.md`
- `acceptance-checklists.md`

These would take the product from epic planning into sprint and release planning.
