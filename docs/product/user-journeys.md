# SubSense AI User Journeys

## Purpose

This document defines the end-to-end user journeys for the `SubSense AI` phase-1 MVP.

It is intended to bridge:

- the strategic product intent in `../../BRD.md`
- the scoped requirements in `PRD.md`
- the delivery breakdown in `epics-and-stories.md`

The journeys in this document are written for a **mobile-optimized responsive web MVP** and should guide product design, UX decisions, acceptance criteria, and release sequencing.

---

## 1. Journey Principles

- Optimize for mobile-browser-first interaction.
- Lead with value before asking for sensitive permissions.
- Preserve usefulness even if bank linking is skipped.
- Make financial trust explicit at each sensitive step.
- Ensure every major journey ends with a clear next action.

---

## 2. Journey Map Overview

| Journey ID | Journey name | Primary user outcome |
|---|---|---|
| J1 | Discover and start | User understands the product and enters the setup flow |
| J2 | Onboard and define context | User defines individual or household recurring context |
| J3 | Add essential recurring obligations | User captures fixed recurring financial commitments |
| J4 | Seed subscriptions | User quickly creates initial dashboard density |
| J5 | Authenticate and save progress | User becomes persistent without losing flow momentum |
| J6 | Link bank accounts and grant consent | User enables automation through AA flows |
| J7 | Continue without linking | User still gets value through manual mode |
| J8 | Review recurring detections | User confirms, edits, or dismisses system-detected recurring items |
| J9 | Activate dashboard and understand spend | User reaches the first recurring-intelligence “aha” moment |
| J10 | Take a savings or management action | User acts on duplicate, renewal, or savings insight |
| J11 | Return through reminders and alerts | User re-engages because the product continues to help |

---

## 3. Primary End-to-End MVP Journey

### Journey summary

This is the ideal first-time user path for the MVP:

1. user lands on value-oriented entry
2. user chooses household context
3. user adds essential recurring expenses
4. user seeds subscriptions
5. user authenticates
6. user links bank account or chooses manual path
7. system prepares dashboard
8. user reviews recurring suggestions
9. user reaches dashboard
10. user takes first action

### Desired outcome

The user should leave the first session with:

- visibility into recurring burden
- confidence that the product understands their context
- at least one actionable next step

---

## 4. Detailed Journeys

## J1. Discover and Start

### User intent

The user wants to know whether this product is worth trying.

### Entry points

- direct link
- founder or investor demo link
- social or referral traffic
- partner-distributed entry point

### Flow

1. User lands on the product.
2. Product explains recurring-spend pain clearly.
3. Product highlights subscriptions, utilities, duplicate detection, and AI insights.
4. User decides to start setup.

### Product requirements

- immediate clarity of product value
- no unnecessary jargon
- clear CTA to begin setup
- fintech-grade visual trust and polish

### Trust moments

- clear explanation of what the product does
- clear distinction between subscriptions and recurring bills
- visible seriousness, not gimmick positioning

### Success signal

User starts onboarding.

---

## J2. Onboard and Define Context

### User intent

The user wants the product to reflect whether they are managing only themselves or a broader household.

### Flow

1. User selects individual or household context.
2. User chooses household type if applicable.
3. User sees why this matters for shared subscriptions and recurring burden.
4. Product stores context for later ownership and analytics.

### Product requirements

- simple selection flow
- clear explanation of why household context matters
- no need to invite others in phase 1

### Decision points

- individual mode
- household-aware mode

### Success signal

The system knows whether recurring items should default to personal-only or shared-capable logic.

---

## J3. Add Essential Recurring Obligations

### User intent

The user wants the app to understand serious recurring financial commitments, not just OTT subscriptions.

### Flow

1. Product asks about utilities and essential recurring bills.
2. User selects or manually enters relevant recurring essentials.
3. Product saves these as part of the recurring model.

### Product requirements

- support utilities, broadband, postpaid, maintenance, rent-like obligations, and similar recurring essentials
- keep input lightweight
- avoid making this feel like a long budgeting setup

### Trust moments

- product demonstrates seriousness and practical utility
- product broadens user understanding of recurring spend

### Success signal

User enters at least one essential recurring obligation or consciously skips forward.

---

## J4. Seed Subscriptions

### User intent

The user wants to quickly tell the product about familiar recurring services so the first dashboard is not empty.

### Flow

1. Product presents common recurring service suggestions.
2. User selects known subscriptions or manually adds a few.
3. Product stores them as initial recurring items.

### Product requirements

- fast input
- recognizable service examples
- support free-text and manual creation

### Experience goals

- create quick recognition
- reduce empty-state risk
- show progress toward a useful dashboard

### Success signal

User finishes setup with enough recurring context for a meaningful initial dashboard.

---

## J5. Authenticate and Save Progress

### User intent

The user wants to continue, save progress, and trust that their setup is not temporary.

### Flow

1. Product asks for authentication after value has already been shown.
2. User authenticates with OTP.
3. Product restores in-progress setup seamlessly.
4. User continues to linking or dashboard activation.

### Product requirements

- delayed authentication
- no loss of setup context
- mobile-browser-friendly OTP flow

### Trust moments

- authentication feels like a continuation, not an interruption
- user understands why sign-in is now needed

### Success signal

User becomes persistent and stays in flow.

---

## J6. Link Bank Accounts and Grant Consent

### User intent

The user wants to unlock automation, but only if the product earns trust.

### Flow

1. Product explains what financial data is requested and why.
2. User starts AA-based linking.
3. User reviews consent details.
4. User approves or exits.
5. Product reflects link state and next steps.

### Product requirements

- purpose-led trust copy
- skip path
- visible status for active, pending, stale, and failed states
- no broken experience if the user exits the linking flow

### Trust moments

- explicit “why this data” explanation
- clarity that the product is helping with recurring detection and insights, not generic data harvesting

### Success signal

User either:

- successfully links and enables automation, or
- intentionally skips while keeping progress and product utility

---

## J7. Continue Without Linking

### User intent

The user wants value without granting financial-data access yet.

### Flow

1. User declines or skips linking.
2. Product routes them to a dashboard based on manual and seeded recurring items.
3. Product suggests adding more recurring items or linking later.

### Product requirements

- manual mode must feel like a supported experience, not a degraded failure path
- dashboard still needs to be useful
- product should encourage later linking without being coercive

### Success signal

User can still activate and understand recurring value without linked bank data.

---

## J8. Review Recurring Detections

### User intent

The user wants to verify that the product’s automation is accurate.

### Flow

1. Product surfaces detected recurring candidates.
2. User reviews each candidate.
3. User confirms, edits, dismisses, or merges items.
4. Product updates dashboard totals and recommendations accordingly.

### Product requirements

- detected vs confirmed status distinction
- clear confidence/explanation support where useful
- simple review actions
- no silent auto-commit of low-confidence candidates

### Trust moments

- explainability
- visible user control
- correction of automation instead of blind trust

### Success signal

User confirms at least one valid recurring item and improves the dashboard’s trustworthiness.

---

## J9. Activate Dashboard and Understand Spend

### User intent

The user wants immediate clarity.

### Flow

1. Product loads recurring dashboard.
2. User sees recurring total, category breakdown, renewals, and recommendations.
3. User sees data freshness and connection status.
4. User identifies a useful next step.

### Product requirements

- top-line recurring burden is visible immediately
- dashboard remains readable on mobile web
- stale or incomplete data is clearly labeled
- widgets support both linked and manual states

### Success signal

User feels the first “aha” moment: the product has turned recurring clutter into understandable structure.

---

## J10. Take a Savings or Management Action

### User intent

The user wants to use the product to improve their financial behavior, not just observe it.

### Possible actions

- confirm a recurring item
- dismiss an incorrect recurring item
- mark an item shared or personal
- review a renewal
- inspect a duplicate subscription
- act on a savings prompt

### Product requirements

- recommendations must feel grounded
- actions must be simple and low-friction
- every action should clearly affect user understanding or future experience

### Success signal

User completes at least one meaningful action in or after the first session.

---

## J11. Return Through Reminders and Alerts

### User intent

The user wants the product to stay useful over time.

### Flow

1. Product identifies a relevant future event such as renewal, anomaly, or duplicate risk.
2. Product delivers in-app or email reminder.
3. User returns to the relevant dashboard or recurring item context.
4. User takes action or confirms status.

### Product requirements

- alerts must be timely, relevant, and non-noisy
- destination context should be precise
- user should be able to dismiss or snooze where applicable

### Success signal

The product earns repeat visits because it helps at the right time.

---

## 5. Journey-Specific UX Risks

| Risk | Journey affected | Mitigation |
|---|---|---|
| Too much friction early | J1, J2, J3 | keep early setup light and value-led |
| Bank-link trust drop-off | J6 | explain purpose clearly and preserve skip path |
| Empty dashboard feeling | J4, J7, J9 | seed subscriptions and support manual mode well |
| Automation distrust | J8 | review-first candidate flow with user control |
| Dashboard overload on mobile | J9 | prioritize visual hierarchy and concise widgets |
| Alert fatigue | J11 | throttle and deduplicate reminders |

---

## 6. Journey Success Metrics

| Journey | Primary metric |
|---|---|
| J1 Discover and start | start rate |
| J2 Define context | progression to next onboarding step |
| J3 Essential recurring setup | completion or intentional skip rate |
| J4 Seed subscriptions | average seeded recurring count |
| J5 Authenticate and save progress | auth completion rate |
| J6 Link bank accounts | bank-link completion rate |
| J7 Continue without linking | activation rate in manual-only cohort |
| J8 Review recurring detections | confirmation and dismissal rate |
| J9 Activate dashboard | dashboard activation rate |
| J10 Take first action | first action rate |
| J11 Return through alerts | alert-driven return rate |

---

## 7. Design and Delivery Notes

### Most important UX design priorities

- onboarding should feel short, confident, and benefit-led
- the bank-linking step must feel safe and optional
- the dashboard must make recurring burden obvious quickly
- user review of recurring detections must increase trust, not create workload fatigue

### Most important engineering priorities

- preserve setup state across authentication and linking boundaries
- ensure manual and automated paths converge into one dashboard model
- clearly separate detected and confirmed recurring entities
- support data freshness and stale-state messaging as first-class product behavior

---

## 8. Recommended Next Step

After user journeys, the next most useful product-delivery document is:

- `phase-1-milestones.md`

That document should sequence the roadmap around validated user flows rather than only around technical workstreams.
