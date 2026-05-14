# SubSense AI Phase 1 Milestones

## Purpose

This document defines the recommended milestone sequence for the `SubSense AI` phase-1 MVP.

It translates the existing product artifacts into a practical release path:

- `../../BRD.md`
- `PRD.md`
- `epics-and-stories.md`
- `user-journeys.md`
- `mvp-web-scope.md`

The milestone plan is intentionally product-first. Each milestone should unlock a meaningful increase in user value, product confidence, or operating readiness.

---

## 1. Milestone Planning Principles

- Sequence work around user-value progression, not just technical subsystems.
- Preserve a useful manual path before depending on bank automation.
- Make trust and clarity visible in every milestone, especially around onboarding and financial-data linking.
- Avoid treating native-mobile concerns as phase-1 blockers.
- Ensure each milestone has measurable exit criteria.

---

## 2. Phase 1 Milestone Summary

| Milestone | Name | Primary outcome |
|---|---|---|
| M1 | Activation Foundations | User can enter the product, define context, and persist progress |
| M2 | Manual Value Path | User can create recurring value without bank linking |
| M3 | Financial Connectivity | User can safely link accounts and understand connection state |
| M4 | Recurring Intelligence Core | Product can detect, review, and confirm recurring items |
| M5 | Dashboard and Actionability | User reaches trusted dashboard value and takes a first action |
| M6 | Retention and MVP Readiness | Alerts, instrumentation, and launch-readiness signals are in place |

---

## 3. Milestone Detail

## M1. Activation Foundations

### Goal

Enable users to start using the product with a clear mobile-web flow, define their recurring context, and persist progress safely.

### Included areas

- value-oriented landing and start flow
- household or individual context setup
- essential recurring setup shell
- subscription seed setup shell
- OTP authentication
- onboarding draft persistence
- base household-aware data foundations

### Primary epics and stories

- E1 Onboarding and activation
- E2 Authentication and account foundation
- E8 Household-ready data foundations

### Primary journeys supported

- J1 Discover and start
- J2 Onboard and define context
- J3 Add essential recurring obligations
- J4 Seed subscriptions
- J5 Authenticate and save progress

### Exit criteria

- user can complete onboarding on mobile web without desktop dependency
- user can authenticate without losing progress
- the system stores individual vs household-aware context correctly
- the first-time flow has no hard dependency on bank linking

### Risks to watch

- too much friction before first value
- auth interruption breaking setup momentum
- weak explanation of household context

---

## M2. Manual Value Path

### Goal

Ensure the product remains useful and activation-worthy even when users skip linking financial data.

### Included areas

- manual subscription entry
- utility and recurring bill setup
- ownership tagging for personal vs shared items
- basic recurring state management
- initial recurring totals from manual inputs

### Primary epics and stories

- E5 Manual recurring management
- parts of E6 Dashboard and recurring insights

### Primary journeys supported

- J3 Add essential recurring obligations
- J4 Seed subscriptions
- J7 Continue without linking
- J9 Activate dashboard and understand spend

### Exit criteria

- user can create a meaningful recurring dashboard without linked financial data
- subscriptions and utilities both contribute to recurring visibility
- manual-only cohorts can still activate successfully

### Risks to watch

- manual mode feeling like a fallback failure state
- dashboard feeling empty or too weak without bank data
- ownership logic not mapping cleanly to future household support

---

## M3. Financial Connectivity

### Goal

Enable safe, understandable, trust-forward bank linking and connection lifecycle visibility.

### Included areas

- AA consent initiation
- purpose-led trust messaging
- connection state visibility
- skip and retry behavior
- stale, pending, and failed connection handling

### Primary epics and stories

- E3 Bank linking and consent
- supporting parts of E2 and E9

### Primary journeys supported

- J6 Link bank accounts and grant consent
- J7 Continue without linking

### Exit criteria

- user can complete AA-based linking from mobile web
- user can skip linking without product breakage
- the product shows clear active, stale, pending, and failed states
- the team can measure start, success, failure, and skip behavior

### Risks to watch

- trust drop-off before or during consent
- unclear error states
- stale-data confusion after initial linking

---

## M4. Recurring Intelligence Core

### Goal

Transform ingested financial data into recurring candidates and give users review-first control over confirmation.

### Included areas

- transaction ingestion readiness for recurring analysis
- merchant normalization support
- recurring candidate generation
- review queue
- confirm, dismiss, edit, and merge actions

### Primary epics and stories

- E4 Recurring detection and review
- supporting parts of E6

### Primary journeys supported

- J8 Review recurring detections
- portions of J9 Activate dashboard and understand spend

### Exit criteria

- detected recurring items are visible and reviewable
- low-confidence items are not silently committed
- confirmation and dismissal actions update recurring state correctly
- the system begins to earn trust through explainable recurring detection behavior

### Risks to watch

- false positives eroding confidence
- weak candidate explanations
- review flows feeling tedious instead of empowering

---

## M5. Dashboard and Actionability

### Goal

Deliver the first complete recurring-intelligence experience: visibility, recommendation, and first user action.

### Included areas

- recurring summary
- category breakdown
- renewal visibility
- duplicate indicators
- savings potential
- trend analysis
- AI-backed but grounded insight feed
- data freshness and stale-state messaging

### Primary epics and stories

- E6 Dashboard and recurring insights
- supporting parts of E5 and E4

### Primary journeys supported

- J9 Activate dashboard and understand spend
- J10 Take a savings or management action

### Exit criteria

- dashboard is usable on mobile-browser widths
- user can see recurring total, renewals, and at least one meaningful optimization opportunity
- dashboard supports both linked and manual-only states
- user can take at least one meaningful action from the dashboard

### Risks to watch

- mobile information overload
- insights feeling ungrounded
- dashboard quality depending too heavily on perfect data completeness

---

## M6. Retention and MVP Readiness

### Goal

Add the minimum re-engagement and operational-learning systems needed to validate the MVP after launch.

### Included areas

- in-app notifications
- email reminders for critical recurring events
- snooze and dismissal behavior
- notification deduplication
- product analytics instrumentation
- internal visibility into health and funnel performance

### Primary epics and stories

- E7 Notifications and retention
- E9 Product analytics and admin visibility

### Primary journeys supported

- J11 Return through reminders and alerts
- validation of all upstream journeys

### Exit criteria

- reminders and alerts operate for critical phase-1 scenarios
- alert engagement and re-entry can be measured
- onboarding, linking, dashboard activation, and first action metrics are available
- the team can judge whether the MVP is earning repeat usage

### Risks to watch

- alert fatigue
- poor routing from alert to action context
- missing instrumentation preventing useful product decisions

---

## 4. Recommended Release Sequence

### Wave 1: Foundation

- M1 Activation Foundations
- M2 Manual Value Path

Reason:
These milestones ensure the product can create value even before automation is fully trusted or available.

### Wave 2: Automation and trust

- M3 Financial Connectivity
- M4 Recurring Intelligence Core

Reason:
These milestones bring in bank automation and recurring detection, but only after the product already has a usable manual path.

### Wave 3: Dashboard and validation

- M5 Dashboard and Actionability
- M6 Retention and MVP Readiness

Reason:
These milestones turn the product into a complete recurring-intelligence loop and make the MVP measurable after release.

---

## 5. Dependency Matrix

| Milestone | Depends on | Why |
|---|---|---|
| M1 | Base product shell, auth, data model foundations | Needed to enter and persist setup |
| M2 | M1 | Manual value path depends on saved user and household context |
| M3 | M1 | Linking should occur after account foundation is stable |
| M4 | M3 | Recurring intelligence depends on connected financial data and ingestion readiness |
| M5 | M2, M4 | Dashboard must support both manual and automated paths |
| M6 | M5 | Retention signals only matter after the core value loop exists |

---

## 6. Suggested Team Framing

### Product

- focus milestone reviews on user outcomes, not just shipped screens
- use each milestone to validate or reduce one major product risk

### Design

- treat onboarding, linking, recurring review, and dashboard activation as one connected experience
- prioritize trust and clarity over visual density

### Engineering

- keep backend domains clean as milestones expand
- preserve manual and linked paths as first-class states
- avoid coupling dashboard readiness to any one incomplete subsystem

### Analytics

- instrument each milestone exit criterion as early as possible
- ensure the launch team can observe activation and retention clearly

---

## 7. MVP Readiness Checklist by Milestone

| Milestone | Must be true before advancing |
|---|---|
| M1 | users can start, authenticate, and persist recurring context |
| M2 | users can derive recurring value without linked financial data |
| M3 | users can link or skip safely, and connection state is understandable |
| M4 | recurring detections are reviewable and trusted enough to proceed |
| M5 | dashboard creates clear recurring-intelligence value and enables action |
| M6 | alerts and product analytics allow the team to learn after launch |

---

## 8. Recommended Next Document

Once phase-1 milestones are accepted, the next useful planning artifact is:

- `acceptance-checklists.md`

That document would translate milestone and epic outcomes into launch-readiness checklists for product, design, engineering, QA, and operations.
