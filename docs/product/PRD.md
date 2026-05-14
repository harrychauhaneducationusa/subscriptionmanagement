# SubSense AI Product Requirements Document

## Document Information

**Product:** SubSense AI  
**Document Type:** Product Requirements Document  
**Release Focus:** Phase 1 MVP  
**Delivery Channel:** Mobile-optimized responsive web application  
**Primary Market:** India  
**Document Purpose:** Translate the BRD and architecture guidance into an execution-ready product specification for design, engineering, and delivery planning

---

## 1. Product Summary

SubSense AI is a recurring-expense intelligence product that helps users identify, organize, and optimize subscriptions and recurring household bills. The MVP will launch as a mobile-optimized responsive web application and focus on proving five core user outcomes:

1. users can quickly understand their recurring financial obligations
2. users can connect financial data or configure recurring items manually
3. users trust the product’s recurring detection and dashboard
4. users can act on at least one savings or management recommendation
5. users return because the product continues to add value over time

The MVP is intentionally web-first so the team can validate product-market fit, onboarding effectiveness, recurring-detection trust, and retention behavior before investing in native mobile apps.

---

## 2. Problem Statement

Users increasingly live in a subscription-first economy, but they do not have reliable visibility into:

- active subscriptions across different payment methods
- recurring utility and household obligations
- duplicate services across family members
- plan price creep and forgotten renewals
- the total monthly burden of recurring financial commitments

Existing products either:

- focus too broadly on generic budgeting or wealth tracking, or
- focus too narrowly on cancellation or bill negotiation

SubSense AI’s product goal is to become the trusted recurring-intelligence layer that turns fragmented recurring activity into clear, actionable decisions.

---

## 3. Product Goals

### User goals

- understand total recurring spend within minutes of activation
- avoid forgotten renewals and hidden recurring leakage
- identify at least one realistic savings opportunity
- manage both subscriptions and essential recurring bills in one place
- support personal and household recurring-spend contexts

### Business goals

- achieve strong mobile-web onboarding and activation
- validate recurring-detection trust and actionability
- create a strong base for premium monetization
- establish architecture and data models that can support later B2B APIs

### Product goals

- deliver a premium but simple fintech experience
- be AI-enhanced but not AI-dependent
- prove value on web before native expansion
- keep the MVP operationally lean and architecturally clean

---

## 4. Success Metrics

| Metric | Definition | MVP target intent |
|---|---|---|
| Onboarding completion | Users who complete initial setup flow | At least 60% |
| Dashboard activation | Users who reach a populated dashboard | At least 70% of completed onboarding users |
| Bank-link rate | Activated users who connect at least one account | At least 45% |
| Manual setup completion | Users who successfully add recurring items without bank linking | High enough to preserve activation in non-linked cohorts |
| Detection confirmation rate | Share of detected recurring items confirmed by users | Strong trust signal for recurring engine |
| First action rate | Users who confirm, dismiss, merge, snooze, or act on a recommendation | Must show real product usefulness in session one |
| D30 retention | Activated users returning after 30 days | At least 35% to 40% aspiration |
| Savings action rate | Users who act on a recommendation or optimization prompt | Core proof-of-value metric |

---

## 5. Target Users

### Primary users

- salaried urban professionals
- family finance managers
- OTT-heavy digital consumers
- budget-conscious planners

### Secondary users

- affluent convenience-driven users
- students and early-career users with shared-plan behavior

### MVP user lens

The MVP should primarily optimize for:

- users who already feel subscription or recurring-spend clutter
- users comfortable using mobile web
- users willing to connect financial data if value and trust are clear
- users who can still get value from manual fallback flows if they skip linking

---

## 6. Product Principles

- **Mobile-first experience, web-first delivery**
- **Trust before automation**
- **Actionability before novelty**
- **Simple setup, rich insight**
- **AI for explanation, not for critical correctness**
- **Household-aware by design**

---

## 7. MVP Scope

### In scope

#### A. Onboarding and activation

- value-oriented landing experience
- household selection
- essential recurring expense setup
- subscription seed setup
- OTP-based authentication
- interrupted-flow draft continuation

#### B. Financial connectivity

- Account Aggregator-based bank linking
- consent explanation and approval flow
- institution connection status visibility
- data freshness and sync-state messaging

#### C. Core recurring management

- recurring payment detection review queue
- confirm, edit, dismiss, and merge actions
- manual subscription entry
- utility and recurring bill setup
- personal vs shared ownership tagging

#### D. Dashboard and intelligence

- recurring spend summary
- category breakdown
- renewal calendar
- duplicate subscription indicators
- savings potential module
- recurring trend analysis
- AI-backed insight feed grounded in product facts

#### E. Retention surfaces

- in-app notification center
- email reminders for renewals and important alerts
- browser-based follow-up and action flows

### Explicitly out of scope for MVP

- native iOS or Android applications
- app-store distribution
- deep device-native push strategies beyond web and email retention support
- direct cancellation execution
- bill payment initiation
- advanced B2B partner APIs
- autonomous finance actions
- full multilingual rollout

---

## 8. MVP Non-Goals

The MVP is not intended to be:

- a full personal finance or wealth management suite
- a generic monthly budgeting application
- a bill-payment platform
- a cancellation concierge
- a full embedded-finance partner platform

These may become adjacent opportunities later, but they should not distract from validating recurring-intelligence value first.

---

## 9. User Stories by Capability

### 9.1 Onboarding

As a new user, I want to define whether I am managing only myself or a household so that the product reflects my real recurring financial context.

As a new user, I want to add a few known recurring expenses before linking my bank so that I can see value quickly.

As a new user, I want authentication to happen after I see product value so that setup feels lighter and more trustworthy.

### 9.2 Bank linking and consent

As a user, I want to understand why financial data is being requested so that I feel comfortable granting consent.

As a user, I want to skip bank linking and still use the product so that privacy concerns do not block activation.

As a user, I want to see whether my connection is active or stale so that I trust the dashboard.

### 9.3 Recurring detection and management

As a user, I want the app to identify recurring charges automatically so that I do not have to reconstruct them manually.

As a user, I want to confirm or dismiss suggested recurring items so that the dashboard reflects reality.

As a user, I want to add recurring items manually if they are not detected so that the product remains complete and useful.

### 9.4 Dashboard and insights

As a user, I want to see my total recurring burden clearly so that I know how much of my monthly cash flow is committed.

As a user, I want to know which renewals are coming up so that I can avoid unwanted charges.

As a user, I want suggestions on duplicate or low-value subscriptions so that I can reduce waste.

As a user, I want plain-language explanations of spend changes so that I understand what happened without reading raw transactions.

### 9.5 Household use

As a family finance manager, I want to mark some recurring items as shared so that household analytics are more accurate.

As a user, I want some items to remain personal or private so that shared visibility does not compromise trust.

### 9.6 Retention and alerts

As a user, I want to receive timely reminders for renewals and unusual recurring charges so that I can act before money is wasted.

As a user, I want alerts to be relevant and not noisy so that I continue trusting the product.

---

## 10. Functional Requirements

### 10.1 Onboarding

The onboarding flow must:

- work fully on mobile browsers
- allow a user to choose individual or household context
- capture essential recurring obligations before account linking
- allow users to seed known subscriptions quickly
- defer authentication until persistence or sensitive actions are needed

Acceptance criteria:

- a user can complete setup from a mobile browser without desktop dependency
- a user can reach a meaningful dashboard with manual input alone
- incomplete onboarding sessions can be resumed

### 10.2 Authentication

The authentication system must:

- support OTP-led mobile-first sign-in
- protect persistent dashboard access
- gate sensitive actions such as bank linking and account-level changes
- allow guest-like setup before registration where product flow requires it

Acceptance criteria:

- verified users can return to the same recurring setup context
- auth state failures do not silently corrupt setup progress

### 10.3 Bank linking

The bank-linking flow must:

- support Account Aggregator-based consent
- explain purpose and value before consent
- show link status, refresh state, and stale-state conditions
- gracefully support skipped or failed linking

Acceptance criteria:

- users can complete or skip linking without breaking the dashboard
- stale or broken connections are visible and understandable

### 10.4 Recurring detection

The recurring engine must:

- cluster transactions into recurring candidates
- assign confidence and reason signals
- distinguish fixed subscriptions from variable recurring bills where possible
- never silently convert uncertain candidates into confirmed subscriptions

Acceptance criteria:

- low-confidence candidates remain review-first
- each detected item can be traced to source financial data

### 10.5 Manual recurring setup

The manual setup system must:

- support subscriptions and utilities
- support cadence, amount, due date, and ownership
- participate in dashboarding and reminders immediately
- merge with later detections where applicable

Acceptance criteria:

- manual flows produce a usable recurring dashboard without linked bank data
- merge proposals preserve user edits and notes

### 10.6 Dashboard

The dashboard must present:

- recurring total
- category mix
- renewals
- savings potential
- duplicate risk
- trend movement
- AI insight feed

Acceptance criteria:

- key dashboard information is usable on mobile browser widths
- empty and partial states guide next actions rather than appearing broken

### 10.7 Notifications

The notification system must:

- deliver in-app notices
- support email reminders for important recurring events
- allow users to snooze or dismiss alerts
- deduplicate repeated triggers

Acceptance criteria:

- alerts feel useful and specific
- duplicate notifications do not overwhelm the user

### 10.8 Household context

The MVP must support:

- household selection during onboarding
- shared vs personal recurring ownership
- privacy-aware behavior for future household expansion

Acceptance criteria:

- the recurring model supports household-aware data from day one
- future member and role expansion does not require redesigning the core data model

---

## 11. UX and Flow Requirements

### Primary product flow

1. landing and value framing
2. household context selection
3. essential recurring setup
4. subscription seed setup
5. authentication
6. bank linking or skip path
7. dashboard activation
8. first savings or management action

### UX requirements

- phone-sized screens are the primary design target
- form completion must be low friction and touch-friendly
- financial trust signals must be visible during data-sensitive steps
- the dashboard should prioritize clarity over information density
- the first session should produce at least one obvious next step

---

## 12. AI Product Requirements

AI in the MVP should be limited to:

- insight narration
- explanation of spend changes
- summarization of recurring patterns
- recommendation wording and prioritization support

AI must not be relied on for:

- consent or security decisions
- primary recurring classification correctness
- savings calculations
- unsupported financial advice

Acceptance criteria:

- every AI insight can be grounded in product facts
- low-value or low-confidence insights are suppressed
- AI output improves clarity rather than creating noise

---

## 13. Analytics and Instrumentation Requirements

The MVP must instrument:

- onboarding step completion
- bank-link start and completion
- skip-vs-link behavior
- recurring candidate confirm/dismiss rates
- manual entry usage
- dashboard module interaction
- alert open and action rates
- recommendation action rates

This instrumentation is required for:

- validating product-market fit
- deciding whether the web-first MVP is working
- evaluating whether future native apps are justified

---

## 14. Dependencies

### Product dependencies

- design system for mobile-browser-first UX
- product copy for trust and consent explanations
- analytics instrumentation plan

### Technical dependencies

- Account Aggregator partner integration
- secure auth and OTP provider
- PostgreSQL, Redis, and worker infrastructure
- notification delivery channels
- AI orchestration layer for insight generation

### Architecture dependencies

- modular backend boundaries
- migration-only schema management
- explicit data models for households, consents, accounts, transactions, merchants, and recurring entities

---

## 15. Risks

| Risk | Product impact | Mitigation |
|---|---|---|
| Low bank-link conversion | weaker automation and trust | preserve strong manual mode and clear consent messaging |
| False positive recurring detection | lower user trust | review-first UX and confidence gating |
| Weak retention on web | unclear platform signal | instrument retention carefully before native decisions |
| Poor mobile-browser UX | reduced activation | optimize flows for mobile widths from day one |
| Too much MVP scope | delivery drag | keep direct cancellation, payments, and partner APIs out of phase 1 |
| AI noise | product feels gimmicky | keep AI grounded and tightly scoped |

---

## 16. Release Readiness Criteria

The MVP is ready for launch when:

### User-value criteria

- users can complete onboarding on mobile web
- users can build a meaningful recurring dashboard with either bank data or manual inputs
- users can understand recurring totals and upcoming renewals without assistance
- users can act on at least one recurring management or savings prompt

### Product-quality criteria

- dashboard data freshness and stale-state behavior are clear
- recurring detection review flows are understandable
- alerting works without excessive duplication
- core AI insights are grounded and not misleading

### Platform criteria

- web and worker services operate reliably
- background jobs handle syncs and alerts safely
- migrations control schema changes cleanly
- audit-sensitive actions are logged appropriately

---

## 17. Future Handoff to Delivery

After this PRD, the recommended next breakdown is:

- epics
- user stories
- MVP milestones
- acceptance criteria by module
- API and data-model contracts

Suggested next docs:

- `epics-and-stories.md`
- `user-journeys.md`
- `phase-1-milestones.md`

---

## 18. Final Recommendation

The phase-1 PRD should remain disciplined around one question:

**Can SubSense AI prove recurring-spend value, trust, and repeat usage through a mobile-optimized web MVP?**

If the team builds toward that question clearly, the product will generate the right evidence for later decisions around premium growth, native apps, and B2B platform expansion.
