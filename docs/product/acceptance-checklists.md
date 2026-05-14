# SubSense AI Acceptance Checklists

## Purpose

This document translates the MVP product plan into practical acceptance and launch-readiness checklists for cross-functional teams.

It is intended to be used after:

- `../../BRD.md`
- `PRD.md`
- `epics-and-stories.md`
- `user-journeys.md`
- `phase-1-milestones.md`

The goal is to answer a simple question:

**Is the phase-1 MVP truly ready to launch, review, or hand off to execution?**

---

## 1. Checklist Principles

- Checklists should validate user value, not just feature existence.
- A feature is not “done” unless the user journey around it is clear and trustworthy.
- Manual and linked-bank paths must both be accepted.
- Phase-1 checklists must stay aligned to the web-first MVP and avoid native-app assumptions.
- Launch readiness requires product, design, engineering, QA, data, and operations alignment.

---

## 2. Usage Model

Use these checklists in three moments:

1. **Milestone review**  
   Confirm whether a milestone outcome is really achieved.

2. **Pre-launch review**  
   Confirm whether the MVP is coherent enough for external use.

3. **Internal readiness review**  
   Confirm whether engineering, product, and operations can observe and support the MVP after release.

---

## 3. Product Acceptance Checklist

### A. Core product value

- [ ] The product clearly communicates that it manages subscriptions and recurring expenses, not just OTT subscriptions.
- [ ] The user can understand their recurring burden within the first meaningful dashboard view.
- [ ] The product supports both subscriptions and essential recurring bills.
- [ ] The product offers at least one actionable next step after dashboard activation.
- [ ] Manual setup users still receive meaningful value without bank linking.

### B. MVP scope discipline

- [ ] The MVP does not depend on native apps.
- [ ] The MVP does not include direct bill payment initiation.
- [ ] The MVP does not include direct cancellation execution.
- [ ] The MVP does not attempt to become a broad budgeting or wealth platform.
- [ ] AI remains scoped to explanation and insight support, not critical correctness.

### C. Milestone outcome alignment

- [ ] Activation Foundations outcomes are complete.
- [ ] Manual Value Path outcomes are complete.
- [ ] Financial Connectivity outcomes are complete.
- [ ] Recurring Intelligence Core outcomes are complete.
- [ ] Dashboard and Actionability outcomes are complete.
- [ ] Retention and MVP Readiness outcomes are complete.

---

## 4. UX and Design Acceptance Checklist

### A. Mobile-web quality

- [ ] All core flows work well on mobile-browser widths.
- [ ] Touch targets and input controls are comfortable for one-handed use.
- [ ] Layouts do not assume desktop screen width for critical tasks.
- [ ] Core dashboard widgets remain readable on small screens.
- [ ] Empty, loading, and stale-data states are intentionally designed.

### B. Onboarding clarity

- [ ] The landing flow clearly explains product value without excessive jargon.
- [ ] Household context is explained clearly enough that users can choose the right mode.
- [ ] Essential recurring setup feels useful, not burdensome.
- [ ] Subscription seeding reduces empty-state risk.
- [ ] Authentication appears at the correct moment and does not feel premature.

### C. Trust design

- [ ] Bank-linking screens clearly explain why data is requested.
- [ ] Skip-linking behavior is visible and non-punitive.
- [ ] Users understand whether data is fresh, stale, or incomplete.
- [ ] Recurring detections are visibly reviewable rather than silently accepted.
- [ ] Savings recommendations feel grounded and non-gimmicky.

### D. Journey quality

- [ ] J1 Discover and start is clear and compelling.
- [ ] J6 Link bank accounts and grant consent feels safe and optional.
- [ ] J8 Review recurring detections improves trust instead of adding fatigue.
- [ ] J9 Activate dashboard delivers an “aha” moment.
- [ ] J11 Return through reminders and alerts supports re-engagement without noise.

---

## 5. Engineering Acceptance Checklist

### A. Product architecture

- [ ] The MVP is implemented as a mobile-optimized web application.
- [ ] The backend preserves modular boundaries for auth, households, aggregation, transactions, merchants, subscriptions, insights, notifications, and partners.
- [ ] Schema changes are migration-driven only.
- [ ] Manual and linked-bank paths are both supported by the same core recurring model.
- [ ] Dashboard behavior is not tightly coupled to a single ingestion path.

### B. Functional implementation readiness

- [ ] OTP-based authentication works reliably.
- [ ] Onboarding progress survives auth boundaries.
- [ ] Bank-linking status is queryable and visible.
- [ ] Recurring candidate review actions update state correctly.
- [ ] Manual recurring items feed dashboard and reminder logic correctly.
- [ ] Notification delivery supports at least in-app and email channels for phase 1.

### C. Operational readiness

- [ ] Web and worker responsibilities are separated appropriately.
- [ ] Critical async jobs are queue-backed where necessary.
- [ ] Health and failure states are visible for key background processing paths.
- [ ] Logs and error monitoring are in place for launch support.
- [ ] Sensitive actions are auditable enough for early fintech operations.

---

## 6. Data and Integration Acceptance Checklist

### A. Data model readiness

- [ ] Users, households, and household membership are represented cleanly.
- [ ] Consent and institution-link state are represented separately.
- [ ] Raw transaction data is preserved with lineage.
- [ ] Normalized transaction views are separate from raw ingestion records.
- [ ] Merchant normalization supports recurring detection quality.
- [ ] Recurring candidates are distinct from confirmed recurring items.

### B. Financial connectivity readiness

- [ ] Account Aggregator integration supports consent initiation and completion.
- [ ] Link failures and stale states can be represented and surfaced.
- [ ] Skip-linking paths do not break the product.
- [ ] Data freshness can be measured and shown.

### C. Recommendation and insight readiness

- [ ] Recommendations trace to recurring data and product facts.
- [ ] Insight generation does not fabricate unsupported financial conclusions.
- [ ] Duplicate and overlap logic can surface reviewable candidates.

---

## 7. QA Acceptance Checklist

### A. Core journey coverage

- [ ] First-time user onboarding is tested on mobile-browser layouts.
- [ ] Manual-only activation path is tested end to end.
- [ ] Linked-account activation path is tested end to end.
- [ ] Recurring detection review path is tested end to end.
- [ ] Dashboard activation and first action flow are tested end to end.
- [ ] Reminder-driven return path is tested end to end.

### B. State and edge-case coverage

- [ ] Interrupted onboarding can be resumed safely.
- [ ] Authentication expiration is handled correctly.
- [ ] Linking failures do not strand the user.
- [ ] Stale data messaging appears correctly.
- [ ] Duplicate alerts are suppressed correctly.
- [ ] Manual and detected recurring items reconcile correctly where intended.

### C. UX regression coverage

- [ ] Key flows are validated on common mobile viewport sizes.
- [ ] Dashboard layout regressions are tested for narrow screens.
- [ ] Long-form explanations do not break usability on mobile web.

---

## 8. Security and Trust Acceptance Checklist

### A. Security posture

- [ ] Sensitive routes require valid authentication.
- [ ] Sensitive actions require appropriate permission checks.
- [ ] Consent state changes are logged.
- [ ] Data-access boundaries are not implicitly broadened by household context.
- [ ] No phase-1 flow weakens trust for convenience.

### B. Trust and compliance posture

- [ ] Consent explanations match actual product usage.
- [ ] Product copy does not overstate AI certainty.
- [ ] Product copy does not imply unsupported regulated financial advice.
- [ ] Private or personal recurring items are not accidentally exposed in shared contexts.

---

## 9. Product Analytics Acceptance Checklist

- [ ] Onboarding completion is measurable by step.
- [ ] Authentication completion is measurable.
- [ ] Bank-link start, completion, failure, and skip are measurable.
- [ ] Manual-item creation is measurable.
- [ ] Recurring confirm and dismiss behavior is measurable.
- [ ] Dashboard activation is measurable.
- [ ] First action rate is measurable.
- [ ] Alert-driven return rate is measurable.
- [ ] Savings action behavior is measurable.
- [ ] Product metrics support future native-app go/no-go decisions.

---

## 10. Go / No-Go Review Checklist

Before launch, the team should be able to answer **yes** to all of the following:

- [ ] Can a user reach value on mobile web without needing desktop?
- [ ] Can a user reach value even if they skip bank linking?
- [ ] Are bank-linking flows trustworthy and understandable?
- [ ] Does recurring detection feel reviewable and believable?
- [ ] Does the dashboard provide real clarity rather than just data density?
- [ ] Can the user take at least one meaningful action from the product?
- [ ] Can the team observe onboarding, activation, and retention quality after launch?
- [ ] Can the team support operational issues in web, worker, and integration flows?

If any of these answers is **no**, the MVP is not yet truly launch-ready.

---

## 11. Recommended Review Cadence

| Review stage | Checklist focus |
|---|---|
| Milestone review | relevant product, design, and engineering sections |
| Internal release candidate review | all sections except final go/no-go |
| Launch review | full checklist including go/no-go |
| Post-launch week 1 review | analytics, trust, and operational sections |

---

## 12. Recommended Next Document

After acceptance checklists, the next useful planning artifact would be:

- `personas.md`

That would complete the core product-planning set by giving design, product, and messaging teams a concise user-reference document aligned to the rest of the repo.
