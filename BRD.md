# SubSense AI

## Business Requirements Document

**Document Type:** Enterprise Business Requirements Document  
**Product:** SubSense AI  
**Product Category:** AI-powered subscription intelligence and recurring expense management platform  
**Primary Channels:** Mobile-first application with supporting web surfaces and partner APIs  
**Launch Market:** India  
**Expansion Horizon:** Global  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Problem Statement](#2-business-problem-statement)
3. [Business Goals and Objectives](#3-business-goals-and-objectives)
4. [Product Vision](#4-product-vision)
5. [Target Users and Personas](#5-target-users-and-personas)
6. [User Journey and Onboarding Flow](#6-user-journey-and-onboarding-flow)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [AI and Intelligence Layer](#9-ai-and-intelligence-layer)
10. [Aggregator and Bank Integration Requirements](#10-aggregator-and-bank-integration-requirements)
11. [Household Management Module](#11-household-management-module)
12. [Analytics and Dashboards](#12-analytics-and-dashboards)
13. [Notifications and Alerts](#13-notifications-and-alerts)
14. [Savings and Optimization Engine](#14-savings-and-optimization-engine)
15. [Monetization Model](#15-monetization-model)
16. [Market Analysis](#16-market-analysis)
17. [Technical Architecture Overview](#17-technical-architecture-overview)
18. [Security and Compliance](#18-security-and-compliance)
19. [Scalability Roadmap](#19-scalability-roadmap)
20. [Business Metrics and KPIs](#20-business-metrics-and-kpis)
21. [Risks and Challenges](#21-risks-and-challenges)
22. [Phased Delivery Roadmap](#22-phased-delivery-roadmap)
23. [Future Opportunities](#23-future-opportunities)
24. [Appendix](#24-appendix)

---

## 1. Executive Summary

SubSense AI is an AI-powered subscription intelligence and recurring expense management platform designed to help consumers and households understand, manage, and optimize recurring financial commitments. The product addresses a growing pain point in digitally connected markets: consumers accumulate subscriptions, utility obligations, app-store charges, autopays, memberships, and family-shared plans across multiple accounts, yet do not have a reliable way to consolidate and optimize them.

India is an especially strong launch market because recurring digital consumption is increasing rapidly across OTT, broadband, postpaid mobile, education, software, and household services, while the Account Aggregator ecosystem makes permissioned transaction access increasingly practical. At the same time, mainstream personal finance apps still optimize around broad spending summaries, credit engagement, or wealth tracking rather than recurring-expense intelligence.

SubSense AI aims to become the operating system for recurring spend by combining:

- automatic recurring payment detection
- manual subscription and bill management
- household-aware tracking
- AI-generated explanations and savings suggestions
- premium fintech UX
- India-first financial data connectivity

The strategic opportunity is not only consumer subscription management, but the creation of a recurring-spend intelligence layer that can later serve banks, financial wellness platforms, and embedded-fintech partners through APIs and white-labeled modules.

### Business problem

Consumers lose money and control due to subscription sprawl, hidden recurring charges, overlapping OTT plans, untracked family expenses, and weak visibility into utility and autopay commitments.

### Market opportunity

The market gap sits between generic budgeting tools and wealth apps on one side, and narrow cancellation or bill-negotiation tools on the other. There is a clear opportunity for a premium, mobile-first, AI-enhanced recurring-spend platform localized for India and extensible globally.

### Solution overview

SubSense AI will:

- connect bank accounts through Account Aggregator-based integrations
- identify recurring charges automatically
- allow manual addition of subscriptions and utilities
- organize recurring costs into personal and household views
- detect duplicates and low-value subscriptions
- generate actionable financial insights and savings recommendations
- provide a clear recurring-spend dashboard and alerting system

### Competitive advantage

The platform differentiates through five structural advantages:

| Advantage | Why it matters |
|---|---|
| India-first recurring intelligence | Local market behavior, payment methods, utilities, OTT bundles, and AA infrastructure require localized design |
| Household-aware analytics | Most products optimize for individuals, not family-level subscription behavior |
| AI-enhanced but not AI-dependent architecture | Trust-critical functions remain deterministic and auditable |
| Subscription plus utilities model | Users think in recurring obligations, not only streaming subscriptions |
| Premium fintech UX | Higher trust, stronger activation, and better premium conversion potential |

### Expected business impact

| Impact area | Expected outcome |
|---|---|
| Consumer value | Clearer visibility into recurring obligations and measurable annual savings |
| Engagement | Higher repeat visits driven by renewals, alerts, insights, and household management |
| Monetization | Freemium-to-premium conversion supported by optimization outcomes and premium insights |
| Partnerships | API and embedded distribution opportunities with banks and financial wellness platforms |
| Defensibility | Merchant intelligence, recurring-detection models, and household spend graph compound over time |

---

## 2. Business Problem Statement

Consumers increasingly operate in a subscription-first economy, but their financial awareness has not kept pace with the volume and fragmentation of recurring expenses.

### Core problem dimensions

| Problem area | Description | User consequence | Product implication |
|---|---|---|---|
| Subscription sprawl | Users accumulate many digital plans across entertainment, productivity, education, and memberships | They forget what is active, what is shared, and what is still valuable | Product must provide one recurring-spend source of truth |
| Recurring expense invisibility | Utilities, maintenance, postpaid, broadband, and autopay obligations are not tracked alongside subscriptions | Users underestimate their fixed monthly load | Product must unify all recurring obligations |
| OTT overload | Urban consumers and families pay for overlapping streaming and bundled plans | Duplicate content access and low-utilization spend become common | Product needs duplicate detection and bundle optimization logic |
| Forgotten subscriptions | Trial conversions, annual renewals, and app-store charges are easy to miss | Small leakages compound into material annual waste | Alerts and renewal intelligence are core retention loops |
| Household inefficiency | Different family members pay for different recurring services without shared visibility | Duplicate plans and unfair cost burden remain hidden | Household setup and shared analytics become strategic |
| Lack of recurring intelligence | Existing PFM tools categorize spend but rarely reason about recurring behavior deeply | Users see statements, not decisions | The platform must generate insights, explanations, and next best actions |

### Strategic interpretation

The problem is not simply "users need a subscription tracker." The broader business problem is that recurring financial behavior is becoming a major portion of household cash flow, yet users lack:

- consolidated visibility
- contextual alerts
- family-level coordination
- optimization recommendations
- understandable explanations of why recurring spend is changing

SubSense AI must solve for clarity, actionability, trust, and measurable savings.

---

## 3. Business Goals and Objectives

| Goal area | Objective | Target intent |
|---|---|---|
| User acquisition | Acquire digitally active, subscription-heavy urban users in India through direct, referral, and partner channels | 250k registered users in 18 months |
| Activation | Convert new users to first recurring-spend clarity quickly | 60% onboarding completion, 45% bank-link rate, 70% first-dashboard activation |
| Engagement | Make recurring-spend review a repeat behavior rather than a one-time setup exercise | 50% monthly active rate among activated users |
| Retention | Build a durable financial-hygiene habit | D30 retention above 40% for activated cohorts |
| Monetization | Convert outcome-seeking users into premium plans | 4% to 7% premium conversion by year two |
| Financial wellness | Deliver measurable savings value | Average realized annual savings of INR 2,500 to INR 6,000 per paying household |
| AI value creation | Ensure insights create action, not novelty | At least 70% of surfaced insights rated useful or very useful |

### Goal hierarchy

1. **Trust first:** users must believe the product correctly understands their recurring financial behavior.
2. **Action second:** the platform must help users save money or avoid waste.
3. **Habit third:** recurring events, alerts, and insights must pull users back regularly.
4. **Monetization fourth:** paid value should feel like a natural extension of successful optimization.

---

## 4. Product Vision

### Long-term product vision

SubSense AI will become the default recurring-spend intelligence layer for consumers and households. Over time, it will evolve from a visibility-and-control product into a proactive optimization engine and, later, a partner-distributed recurring-intelligence platform.

### Vision pillars

| Pillar | Vision statement |
|---|---|
| Visibility | Every user should understand recurring obligations across subscriptions, bills, utilities, and household plans in one place |
| Intelligence | The product should explain why recurring spend changes and what the user should do next |
| Optimization | The platform should identify realistic savings opportunities, not just summarize spend |
| Household context | The product should reflect how recurring spend actually happens across families and shared relationships |
| Platform leverage | Core recurring-intelligence services should be reusable across direct-to-consumer and B2B surfaces |

### AI financial intelligence direction

AI in SubSense AI is intended to improve:

- natural-language explanations
- insight prioritization
- conversational querying
- merchant enrichment support
- personalized recommendation wording

AI is not intended to replace deterministic logic for:

- consent and compliance flows
- recurring-detection traceability
- savings calculations
- risk-sensitive classifications

### Future evolution

The product should evolve through four stages:

1. recurring visibility and control
2. optimization and household intelligence
3. conversational finance and personalization
4. partner APIs, embedded-finance distribution, and action orchestration

---

## 5. Target Users and Personas

### Primary target segments

- salaried professionals
- families
- Gen Z and millennial urban users
- OTT-heavy and digitally subscribed users
- users seeking better recurring-spend control without spreadsheet complexity

### Secondary target segments

- banks and fintech partners
- financial wellness providers
- employers or payroll-linked wellness programs

### Detailed personas

| Persona | Demographics | Behaviors | Frustrations | Motivations | Subscription and financial pattern |
|---|---|---|---|---|---|
| Single professional | 25 to 34, salaried, metro city | Pays across cards and UPI autopay, busy lifestyle | Forgets renewals, hates admin overhead | Wants one-screen control | 6 to 10 subscriptions, low statement review frequency |
| Family finance manager | 32 to 45, married, 3 to 5 member household | Tracks school, utilities, OTT, groceries, broadband | Spend is split across spouse accounts and app stores | Wants shared visibility and optimization | High recurring burden with shared and essential items |
| OTT-heavy user | 21 to 35, entertainment-first | Tries trials, switches plans often, follows content cycles | Overlapping plans, low utilization, duplicate family and solo plans | Wants content access without waste | High volume of entertainment subscriptions |
| Budget-conscious planner | 24 to 40, cost-sensitive | Manually tracks monthly spend | Difficult to isolate recurring cost creep | Wants proactive warnings and budget relief | Mixed fixed and discretionary recurring spend |
| High-income optimizer | 30 to 45, affluent, digitally mature | Uses multiple cards and premium fintech apps | Time-poor, will not tolerate clunky UX | Wants concierge-grade insight and control | Many recurring services, low awareness relative to spend |
| Student or early-career user | 18 to 24, lower disposable income | Shares plans, uses app-store billing, student offers | Small charges accumulate quietly | Wants affordability nudges and reminders | Low-value but high-sensitivity recurring landscape |

### Persona implications for product design

| Persona theme | Product requirement |
|---|---|
| Time scarcity | Fast setup and low-maintenance dashboarding |
| Financial sensitivity | Strong reminder and affordability logic |
| Shared usage | Household roles, attribution, and split-aware insights |
| Trust sensitivity | Clear explanations and deterministic grounding |
| Mobile preference | Mobile-first, premium, low-friction UX |

---

## 6. User Journey and Onboarding Flow

The supplied product flow suggests this sequence:

1. household selection
2. essential recurring expense setup
3. subscription setup
4. authentication
5. analytics dashboard

This is a strong value-first foundation and should be preserved, but expanded into a more complete activation model.

### Recommended onboarding journey

| Stage | Purpose | UX strategy | Expected outcome |
|---|---|---|---|
| Household framing | Define the financial unit being managed | Start with user context rather than account creation | Higher relevance and stronger later recommendations |
| Essential recurring setup | Broaden the product beyond OTT subscriptions | Position product as recurring-expense intelligence, not only entertainment tracking | Greater perceived seriousness and utility |
| Subscription seed setup | Create quick dashboard density | Allow quick manual selection of known subscriptions | Faster time to first value |
| Authentication | Convert intent to persistence | Delay sign-up until user sees value | Better completion and lower early drop-off |
| Account linking | Unlock automation | Explain purpose-specific benefits of linking | Better consent completion |
| Dashboard activation | Deliver first "aha" moment | Show clear totals, trends, duplicates, and savings prompts | Stronger engagement and trust |

### Expanded onboarding logic

#### Stage 1: Household selection

- Choose personal, couple, family, or shared household mode
- Capture who usually pays major recurring bills
- Set early defaults for personal vs shared analytics

**UX rationale:** Users think in lived financial units, not abstract account entities.

#### Stage 2: Essential recurring expense setup

- Ask for utilities, broadband, mobile, maintenance, rent-like obligations, and insurance reminders
- Support manual setup with minimal fields

**UX rationale:** Builds credibility by addressing serious recurring spend, not just entertainment services.

#### Stage 3: Subscription setup

- Let users select common services or add a few manually
- Use this to seed categories and dashboard widgets

**UX rationale:** Pre-seeding reduces empty states and creates immediate recognition.

#### Stage 4: Authentication

- Request sign-up only when saving progress, syncing across devices, or linking financial data
- Use OTP-led mobile-first authentication

**UX rationale:** Delayed authentication reduces friction and improves first-session trust.

#### Stage 5: Bank linking

- Offer Account Aggregator-based connect flow
- Clearly explain what access is used for and what is not used for
- Provide skip path to preserve activation for privacy-sensitive users

**UX rationale:** Purpose-led data requests outperform generic permission prompts.

#### Stage 6: Dashboard activation

- Show normalized monthly recurring total
- Surface category mix and renewals
- Highlight duplicate risk and first savings recommendation
- Provide next-step prompts: confirm detected items, invite family, add missing bills

**UX rationale:** The first dashboard must create clarity and control immediately.

### Psychological onboarding principles

- **Value before sensitivity:** demonstrate utility before requesting sensitive data.
- **Progressive disclosure:** move from context to setup to permissions.
- **Cognitive simplicity:** reduce data-heavy complexity in the first session.
- **Trust visibility:** explain why every piece of data is requested.
- **Action orientation:** connect onboarding completion to clear next actions.

---

## 7. Functional Requirements

This section defines the functional scope across core modules. Each feature includes description, business rules, workflows, edge cases, validations, and dependencies.

### A. Authentication

**Feature description**  
Mobile-first user authentication using OTP as the primary India launch identity model, with optional email binding and social sign-in where appropriate.

**Business rules**

- Verified mobile number is the primary user identity key.
- Guest onboarding drafts may exist, but persistent dashboards require registration.
- Security-sensitive actions require recent authentication.
- Household ownership can only be assigned to verified users.

**Workflow**

1. User enters app and begins setup without hard sign-in wall.
2. Draft onboarding data is temporarily stored.
3. Authentication is requested when the user saves, links financial data, or invites household members.
4. Verified user account is created and draft data is restored.

**Edge cases**

- OTP timeout or failure
- duplicate social and phone-based accounts
- device switching mid-onboarding
- invite acceptance before full profile completion

**Validations**

- phone normalization to E.164
- rate limiting on OTP attempts and resends
- suspicious-session expiration rules
- biometric convenience cannot replace server-side session validation

**Dependencies**

- OTP provider
- identity service
- session management
- consent and notification services

### B. Household setup

**Feature description**  
Creation of the financial context the product will manage: self, couple, family, or shared household.

**Business rules**

- One household owner must exist.
- Roles include owner, admin, member, and viewer.
- Expenses and subscriptions may be shared, personal, or private.
- Invite acceptance is required before detailed member data is exposed.

**Workflow**

1. User selects household type and name.
2. User sets approximate member count and primary payers.
3. System creates default attribution logic for shared vs personal items.
4. User may invite others immediately or later.

**Edge cases**

- solo household later converts to family
- member leaves but historical analytics remain
- dependents without direct app accounts
- user wants shared-plan tracking without invites

**Validations**

- household name required
- invite expiry and revocation logic
- private item suppression in shared views
- immediate permission refresh after role changes

**Dependencies**

- identity and permissions services
- notification service
- household analytics model

### C. Subscription management

**Feature description**  
Central module for managing subscriptions across digital services, memberships, and recurring app-store charges.

**Business rules**

- Each subscription must support amount, cadence, merchant, category, renewal date, ownership, source type, and status.
- Automatically detected subscriptions remain suggested until confirmed or dismissed.
- Cancellation tracking is informational unless partner orchestration exists.
- Multiple active plans under the same merchant may be valid.

**Workflow**

1. Subscription is detected or manually added.
2. User confirms or edits the item.
3. Ownership and shared status are assigned.
4. The item becomes part of analytics, notifications, and optimization logic.

**Edge cases**

- annual plans
- bundled telecom services
- app-store aggregate billing
- refunds or charge reversals

**Validations**

- supported cadence enum
- positive amount
- renewal date consistency
- duplicate detection and merge prompt

**Dependencies**

- recurring-detection engine
- merchant catalog
- preference service
- notification scheduler

### D. Recurring payment detection

**Feature description**  
Detect recurring charges from financial transaction streams using deterministic logic supplemented by confidence scoring.

**Business rules**

- Base classification must not depend on generative AI.
- System must distinguish fixed subscriptions from variable recurring bills.
- Every detected item must include confidence and reason codes.
- Low-confidence detections require user review.

**Workflow**

1. Ingest transactions.
2. Normalize merchants and cluster candidate recurring streams.
3. Evaluate cadence, amount tolerance, and merchant continuity.
4. Surface suggested recurring items for review.

**Edge cases**

- annual or quarterly charges
- skipped billing months
- plan upgrades and proration
- shared household payments across different accounts

**Validations**

- traceability to source transactions
- category-aware variance thresholds
- suppression of bursty but non-recurring merchants
- offline labeled benchmarking of precision and recall

**Dependencies**

- transaction ingestion pipeline
- merchant normalization
- scoring engine
- analytics warehouse

### E. Utility management

**Feature description**  
Management of recurring essential household obligations such as electricity, broadband, water, gas, postpaid, maintenance, and rent-like entries.

**Business rules**

- Utilities must roll into recurring totals but remain analytically distinct from subscriptions.
- Variable bill values should support trend and volatility analysis.
- Manual setup must exist even without bank data.
- Due-date reminders must not depend solely on financial ingestion freshness.

**Workflow**

1. User creates provider entry and due information.
2. System attempts automatic matching when transaction data exists.
3. Dashboard tracks expected vs actual values.
4. User may mark paid, split, or update bill details.

**Edge cases**

- prepaid recharge patterns
- irregular cycles
- multiple accounts under same provider
- weak UPI descriptors

**Validations**

- due-day format correctness
- masked provider identifiers in shared views
- sane expected ranges
- outlier confirmation before rebasing forecasts

**Dependencies**

- reminder engine
- recurring-detection engine
- manual entry flows
- household permissions

### F. AI financial insights

**Feature description**  
Narrative insight generation that explains recurring-spend changes, waste patterns, and recommended actions.

**Business rules**

- Insights must be grounded in structured facts.
- Each insight must trace back to transactions, subscriptions, or trends.
- Redundant or low-confidence insights must be suppressed.
- Users should be able to dismiss or rate insights.

**Workflow**

1. Rules engine identifies candidate opportunities.
2. Structured context payload is assembled.
3. AI turns facts into short, user-readable guidance.
4. Delivery and feedback are logged.

**Edge cases**

- sparse data
- intentionally increased spend
- outdated data after consent expiry
- private household items in shared contexts

**Validations**

- evidence pointers per insight
- no guaranteed savings wording without deterministic basis
- fatigue controls on insight frequency
- regulatory-safe language

**Dependencies**

- rules engine
- analytics store
- AI orchestration layer
- feedback capture

### G. Alerts and notifications

**Feature description**  
Timely alerts for renewals, failed payments, price changes, duplicates, unusual recurring spend, and AI recommendations.

**Business rules**

- Functional alerts are distinct from marketing messages.
- Quiet hours and preference settings must be honored.
- Duplicate alerting for the same event must be suppressed.
- Channel performance and auditability must be tracked.

**Workflow**

1. Event is generated.
2. Suppression and preference logic are applied.
3. Best channel is selected.
4. Notification outcome is recorded.

**Edge cases**

- push unavailable
- email bounce
- upstream data delay
- same event triggering multiple rule families

**Validations**

- trigger definition per alert type
- expiry windows
- snooze options
- fallbacks to in-app inbox

**Dependencies**

- event bus
- preference center
- push/email providers
- analytics instrumentation

### H. Dashboard analytics

**Feature description**  
Premium dashboard experience that transforms recurring financial data into decision-ready visibility.

**Business rules**

- Distinguish confirmed, detected, and manual items.
- Always show data freshness and last refresh.
- Support normalized monthly views and actual-billed views.
- Support personal, shared, and household-wide filtering.

**Workflow**

1. User opens dashboard.
2. Core KPIs and charts are displayed.
3. User drills into renewals, trends, and recommendations.
4. User takes action from the dashboard directly.

**Edge cases**

- no linked bank data
- only utilities present
- annual subscriptions distorting monthly totals
- privacy restrictions limiting household detail

**Validations**

- reconciliation with underlying items
- cached fallback for temporary API delays
- mobile chart readability
- persistent filters

**Dependencies**

- analytics APIs
- detection engine
- caching layer
- design system

### I. Bank account aggregation

**Feature description**  
Read-only account and transaction access through Account Aggregator integrations to enable automatic recurring intelligence.

**Business rules**

- Consent must be explicit, revocable, time-bound, and purpose-specific.
- No payment initiation is required for MVP.
- Users may link multiple accounts.
- Historical analytics should remain even if a connection breaks or expires.

**Workflow**

1. User chooses bank connect flow.
2. Consent is granted via AA process.
3. Account metadata and transaction access are established.
4. Periodic refresh supports recurring detection and analytics.

**Edge cases**

- unsupported bank
- consent revoked externally
- duplicate joint-account feeds
- stale transaction windows

**Validations**

- consent artifact storage and lineage
- webhook idempotency
- stale-data visibility
- immediate cessation of pulls after disconnect

**Dependencies**

- Setu AA integration
- consent service
- webhook processor
- transaction normalization pipeline

### J. Manual subscription entry

**Feature description**  
Manual creation and maintenance of recurring items for users without linked banks or for charges that are not reliably detectable.

**Business rules**

- Manual items must remain editable and clearly source-labeled.
- Later-detected matches should prompt merge, not duplicate silently.
- Manual items may be reminder-only or expected-charge entries.
- Manual items participate in dashboard and alert logic once confirmed.

**Workflow**

1. User enters merchant, amount, cadence, and renewal details.
2. System suggests category and duplicate candidates.
3. Item is created and enters recurring totals.
4. Future reconciliation matches against detected transactions when possible.

**Edge cases**

- unknown merchant name
- approximate billing day only
- future subscription before first charge
- duplicate household entries

**Validations**

- required fields for reminder support
- leap-year and month-end date handling
- preservation of notes/history during merge
- support for free-text merchant names

**Dependencies**

- merchant catalog
- reminder engine
- subscription service
- reconciliation logic

### K. Household comparison analytics

**Feature description**  
Comparison of recurring spend across members, categories, and external benchmark cohorts.

**Business rules**

- Private expenses must remain masked unless explicitly shared.
- Benchmarks must be anonymized and sample-threshold protected.
- Owner controls whether member-level comparison is enabled.
- Comparisons should inform, not shame.

**Workflow**

1. User selects household comparison view.
2. Platform computes contribution and overlap patterns.
3. Member and benchmark summaries are shown.
4. Suggested actions link to ownership or plan settings.

**Edge cases**

- dominant payer households
- non-linked members
- insufficient benchmark cohort sizes
- privacy rules degrading comparability

**Validations**

- cohort minimum thresholds
- masking rules
- normalized vs actual labeling
- feature toggle support

**Dependencies**

- household permissions
- benchmark dataset
- analytics service
- privacy controls

### L. Savings recommendation engine

**Feature description**  
Recommendation ranking engine for recurring-spend reduction opportunities.

**Business rules**

- Recommendations are prioritized by realistic value and confidence.
- Categories include cancel, downgrade, share, bundle, negotiate, and monitor.
- User feedback must influence ranking.
- Any partner-influenced recommendation must be transparent.

**Workflow**

1. Evaluate recurring inventory and plan context.
2. Compute opportunity size, effort, and certainty.
3. Rank and surface recommendations.
4. Feed user responses back into model and business analytics.

**Edge cases**

- seemingly expensive family plan that is still optimal
- temporary promotions
- commercial conflicts with best user outcome
- low-utilization signals without direct product usage telemetry

**Validations**

- savings traceability
- cooling period on dismissed suggestions
- ownership and permission-aware delivery
- partner tag disclosure

**Dependencies**

- merchant intelligence
- rules engine
- recommendation analytics
- marketplace layer

### M. AI assistant / chat

**Feature description**  
Conversational interface for answering recurring-spend questions and explaining product findings.

**Business rules**

- Assistant must remain grounded in product data.
- It may explain, summarize, compare, and recommend, but not fabricate or execute unsupported financial actions.
- Unsafe or unsupported intents must be redirected safely.
- Sensitive history retention must follow privacy controls.

**Workflow**

1. User asks a question.
2. Intent routing fetches relevant structured data.
3. Response is generated with grounded explanation.
4. Follow-up and satisfaction are captured.

**Edge cases**

- multilingual prompts
- ambiguous merchant names
- mixed private and shared household contexts
- unsupported requests such as tax or credit advice

**Validations**

- no invented merchants or amounts
- short mobile-friendly answers
- policy filtering
- prompt minimization of raw PII

**Dependencies**

- retrieval layer
- AI orchestration
- policy controls
- observability pipeline

### N. Budgeting intelligence

**Feature description**  
Use recurring-spend patterns to help users understand budget pressure and affordability.

**Business rules**

- Essentials and discretionary subscriptions must be treated differently.
- Income may be manually entered or inferred with confidence labels.
- Budget guidance must be editable and optional.
- Product messaging should focus on relief and planning, not guilt.

**Workflow**

1. User provides or confirms income context.
2. Recurring items are bucketed by essentiality.
3. Forecast of next-month recurring load is created.
4. Recommendations are reframed as budget relief actions.

**Edge cases**

- irregular income
- joint households with asymmetric contribution
- annual insurance spikes
- income-insensitive users

**Validations**

- forecast confidence visibility
- no auto-overwrite of user budget targets
- essential expense protection
- localization support for future currency markets

**Dependencies**

- categorization engine
- income inference or entry flow
- forecasting service
- dashboard analytics

### O. Recurring trend analysis

**Feature description**  
Longitudinal analysis of recurring-spend movement over time.

**Business rules**

- Must support normalized and actual-billed views.
- Explanations must distinguish new services, churn, price changes, and utilities volatility.
- Historical views survive disconnected data sources.
- Manual edits must be reflected in trend logic.

**Workflow**

1. Monthly recurring snapshots are stored.
2. Trend charts and deltas are rendered.
3. AI generates summary narratives where useful.
4. User drills into item-level change reasons.

**Edge cases**

- annual renewals
- merchant normalization retroactivity
- paused services resuming
- data backfills altering prior periods

**Validations**

- item-level traceability of every delta
- re-computation without double counting
- consistent month-end treatment
- incomplete current period labeling

**Dependencies**

- analytics warehouse
- snapshot jobs
- merchant normalization
- insights layer

---

## 8. Non-Functional Requirements

| Area | Requirement | Target / principle |
|---|---|---|
| Scalability | Support rapid growth in users, linked accounts, events, and recurring items | Design for at least 1M MAU |
| Performance | App must feel premium on common Android and iOS devices | Cold start below 2.5s p75; dashboard API under 2s p75 after data readiness |
| Availability | Core app should remain usable even when bank systems are degraded | 99.9% monthly availability target |
| Reliability | Event processing must be durable and auditable | Idempotent ingestion and webhook handling |
| Observability | Critical flows must be measurable and diagnosable | Logs, traces, data quality monitors, alerts |
| Security | Identity and transaction data must be protected end-to-end | Encryption in transit and at rest, least-privilege access |
| Mobile responsiveness | Mobile remains primary form factor | UX optimized for small screens with adaptive chart behavior |
| Accessibility | Product must be inclusive | WCAG 2.1 AA-aligned approach |
| Compliance | Product must support India launch and future global privacy expectations | DPDP-aware governance and GDPR-style principles |
| Latency | Key intelligence flows should feel near real-time | Webhook acknowledgment under 5s, normalization under 2 minutes |

### Additional quality expectations

- graceful degradation during upstream financial-data downtime
- resilient retry and dead-letter behavior for event pipelines
- strong cache strategy for dashboard continuity
- audit-friendly operational logging

---

## 9. AI and Intelligence Layer

### Design principle

SubSense AI should use AI selectively at high-value decision points while keeping classification, compliance, and traceability-heavy operations deterministic wherever possible.

### Intelligence stack

| Capability | Primary method | AI role | Deterministic role |
|---|---|---|---|
| Recurring detection | Rule engine plus confidence scoring | Improve pattern recognition on messy descriptors | Core cadence and amount logic |
| Merchant normalization | Alias graph plus enrichment | Help classify unknown merchant variants | Resolve known merchants cheaply and predictably |
| Insight generation | Structured insight templates plus narrative generation | Convert facts into concise explanations | Ensure factual basis and confidence gating |
| Recommendation ranking | Rules plus scoring | Refine relevance and wording | Calculate savings and eligibility |
| Conversational assistant | Retrieval plus LLM | Natural-language Q&A | Data fetching, grounding, and policy control |

### Where AI should be used

- summarizing month-over-month recurring changes
- generating human-readable savings insight copy
- answering natural-language questions about recurring spend
- classifying edge-case merchants after deterministic fallback
- producing benchmark interpretation narratives

### Where deterministic logic is preferred

- consent workflows
- transaction ingestion and reconciliation
- recurring classification baselines
- amount and cadence calculations
- savings value estimation
- alert triggering
- privacy and permission enforcement

### AI cost optimization strategy

- run AI only on high-value events, not every transaction
- batch summary-generation jobs
- cache generated insights
- use compact models for enrichment tasks
- reserve larger models for user-initiated chat and important narrative generation
- suppress weak or low-value insight candidates before LLM invocation

### AI governance requirements

- grounded generation only
- evidence references per insight
- prompt minimization of unnecessary PII
- response quality monitoring and user feedback capture
- safety fallbacks for unsupported or regulated advice scenarios

---

## 10. Aggregator and Bank Integration Requirements

### Integration scope

Initial integration should focus on Setu-based Account Aggregator connectivity for read-only transaction access.

### Core requirements

| Integration area | Requirement | Notes |
|---|---|---|
| Consent initiation | Explicit, purpose-specific read-only consent flow | Must explain recurring-spend use case clearly |
| Account selection | User can choose one or multiple accounts | Supports selective trust-building |
| Transaction ingestion | Pull and store transactions with source lineage | Must support idempotent ingestion |
| Recurring analysis | Feed normalized transactions into recurring detection | Must handle noisy descriptors and backfills |
| Webhooks | Process consent and data-availability events securely | Signature verification and retry strategy required |
| Lifecycle handling | Active, pending, error, expired, revoked, refresh-needed states | User-visible repair UX required |
| Fallback mode | Manual setup if linking is skipped or unavailable | Prevents activation loss |

### Consent management requirements

- explicit purpose text
- consent scope storage
- duration and expiry tracking
- revocation handling
- consent-to-batch lineage for auditability

### Transaction normalization requirements

Every transaction record should support:

- raw description
- normalized merchant candidate
- amount
- timestamp
- direction
- account reference
- confidence metadata
- consent and source lineage

### Bank connection lifecycle

1. User initiates connect flow.
2. Consent is granted.
3. Account metadata is received.
4. Data fetch eligibility is established.
5. Periodic refreshes support intelligence updates.
6. Connection may transition to refresh-needed, expired, revoked, or error.
7. Historical analytics remain, but automation pauses when the connection is stale.

### Fallback manual flows

If linking fails or is skipped, the user must still be able to:

- create subscriptions manually
- create utility reminders
- receive renewal alerts
- use dashboard summaries based on manual entries
- upgrade later into automated detection

---

## 11. Household Management Module

### Purpose

The household module turns SubSense AI from an individual utility into a shared financial intelligence platform.

### Core capabilities

| Capability | Requirement | Business intent |
|---|---|---|
| Family tracking | Support multi-member households with roles and permissions | Reflect real payment behavior |
| Shared subscriptions | Mark shared services with payer and beneficiaries | Detect duplicates and optimize family plans |
| Cost splitting | Support equal and custom split logic | Increase household fairness and clarity |
| Household analytics | Show total burden, member contribution, and category mix | Differentiate from single-user finance apps |
| Benchmarking | Compare with anonymized peer households | Strengthen premium value proposition |
| Privacy controls | Separate private from shared detail visibility | Preserve trust in multi-user contexts |

### Business rules

- one owner per household
- configurable member roles
- private expenses never appear in restricted views
- shared top-line totals may optionally include masked private categories
- invites must be accepted before personal detail sharing

### Key workflows

- create household
- invite members
- assign shared and personal recurring items
- manage split settings
- view member contributions and household totals

### Strategic value

Household intelligence creates a defensible moat because recurring spend often becomes inefficient precisely when it is distributed across family members and payment sources.

---

## 12. Analytics and Dashboards

### Dashboard objectives

- deliver immediate clarity
- create trust through reconciliation and freshness indicators
- surface actions, not only charts
- support individual and household contexts

### Core dashboard views

| Widget / view | Purpose | KPI / decision supported |
|---|---|---|
| Recurring spend summary | Monthly normalized recurring total and item count | Core top-line awareness |
| Category mix | Breakdown by entertainment, utilities, productivity, education, etc. | Understand composition |
| Renewal calendar | Upcoming renewals and due dates | Timely intervention |
| Savings potential | Ranked estimated optimization value | Paid value and actionability |
| Duplicate detection | Highlight overlaps and redundant plans | Waste reduction |
| Trend analysis | Show why recurring spend changed | Trust and understanding |
| Household comparison | Member contribution and shared-plan burden | Family optimization |
| Insight feed | AI-generated financial narratives | Engagement and premium differentiation |

### Dashboard KPI expectations

- clear recurring total
- number of active recurring items
- renewals in next 30 days
- potential monthly and annual savings
- duplicate risk count
- linked account health and freshness

### Design expectations

- mobile-first visual hierarchy
- minimal clutter
- premium fintech look and feel
- drill-down depth without initial overload
- clear action entry points from every major widget

---

## 13. Notifications and Alerts

### Alert categories

| Alert type | Trigger | User value |
|---|---|---|
| Upcoming renewal | Renewal window reached | Prevent forgotten charges |
| Price increase | Bill exceeds expected threshold | Avoid silent cost creep |
| Duplicate subscription | Same or overlapping service exists | Reduce waste |
| Failed recurring payment | Debit failed or expected payment absent | Prevent service disruption |
| Unusual recurring spend | Variable recurring bill exceeds expected range | Spot anomalies early |
| AI recommendation | High-confidence savings opportunity detected | Encourage action |

### Channel strategy

- push notifications for timely action
- in-app inbox for persistence and catch-up
- optional email for high-importance summaries and less time-sensitive notices

### Business rules

- alerts must respect user preferences and quiet hours
- duplicate events must be deduplicated
- snooze should be supported without disabling a whole category
- channel outcomes must be measured for optimization

### Notification quality standards

- concise and specific copy
- clear next action
- no manipulative urgency
- no marketing disguised as functional alerting

---

## 14. Savings and Optimization Engine

### Objective

The engine should rank the most realistic recurring-spend reduction opportunities, not simply the largest theoretical savings.

### Optimization categories

| Category | Example use case | User action |
|---|---|---|
| Cancel | Unused or low-value standalone subscription | Cancel or pause |
| Downgrade | User is overpaying for a higher tier | Switch to lower plan |
| Share | Separate individual plans within a household | Move to family plan |
| Bundle | Better combined offer exists | Consolidate services |
| Monitor | No immediate action, but risk or increase is emerging | Watchlist or reminder |
| Negotiate | Utility or service can potentially be renegotiated | Partner or external action path |

### Key optimization use cases

| Use case | Input signals | Output |
|---|---|---|
| OTT optimization | overlap, family usage, bundle mismatch | consolidation recommendation |
| Duplicate reduction | same or substitutable service across household | merge or cancel suggestion |
| Utility optimization | rising variance or costly provider behavior | monitor or renegotiate guidance |
| Annual vs monthly optimization | stable long-term use pattern | plan cadence recommendation |
| Budget relief | recurring load nearing affordability threshold | prioritized cuts among non-essentials |

### Recommendation design principles

- prioritize realizable savings
- show explanation and assumptions
- disclose partner influence when relevant
- learn from dismiss and accept patterns
- avoid repeated recommendation fatigue

---

## 15. Monetization Model

### Pricing strategy

| Plan | Indicative pricing | Included capabilities | Purpose |
|---|---|---|---|
| Free | INR 0 | Basic dashboard, manual tracking, limited linked accounts, essential reminders | Acquisition and trust |
| Pro | INR 199/month or INR 1,499/year | Advanced insights, duplicate detection, richer alerts, optimization engine | Primary individual monetization |
| Family | INR 299/month or INR 2,499/year | Multi-member households, shared analytics, benchmarking, privacy controls | Higher ARPU via strongest differentiation |
| Enterprise APIs | Custom | Detection APIs, insights APIs, widgets, benchmarking intelligence | B2B revenue expansion |

### Additional revenue streams

| Revenue stream | Description | Guardrail |
|---|---|---|
| Affiliate commissions | Revenue from plan-switch or offer conversion | Must not bias core recommendation quality |
| Bank partnerships | White-label recurring intelligence for banking apps | Must preserve consent and transparency |
| Financial wellness platforms | Embedded dashboards and insights for employers or providers | Strong privacy partitioning required |
| Marketplace opportunities | Curated plan switching and bundle optimization | Avoid ad-like product behavior |

### Monetization principle

The product should earn revenue because it creates measurable savings, clarity, and control, not because it increases friction in the free experience.

---

## 16. Market Analysis

### Competitive comparison

| Competitor | Strength | Limitation relative to SubSense AI vision | Differentiation path |
|---|---|---|---|
| Rocket Money | Strong subscription-focused UX and savings framing | US-centric and weak on India financial connectivity and household context | Win with India-first localization and family intelligence |
| Truebill | Clear recurring-bill narrative | Not tailored to India's payment and utility realities | Local recurring model and mobile UX |
| CRED | Premium design, affluent user base, payment engagement | Recurring intelligence is not the center of gravity | Own subscription-plus-recurring specialization |
| INDmoney | Strong wealth and account aggregation orientation | Less focused on recurring optimization and household management | Position as recurring-spend specialist |
| Walnut | Indian spend-tracking legacy | Older UX and shallower optimization depth | Deliver premium experience and modern intelligence |
| Mint | Legacy aggregation benchmark | Weak modern relevance and subscription depth | Build a focused, contemporary recurring-intelligence platform |

### Market gaps

The clearest gaps in the current market are:

- subscription intelligence localized for India
- recurring-expense unification across subscriptions and utilities
- household-aware analytics
- AI-generated but evidence-backed recurring financial guidance
- premium fintech UX focused on recurring-spend outcomes

### Positioning statement

SubSense AI should be positioned as the premium recurring financial intelligence platform for modern households, not merely a budgeting app and not merely a cancellation tool.

---

## 17. Technical Architecture Overview

### Architecture principle

The platform should be modular so that recurring intelligence can serve:

- the consumer mobile app
- a supporting web experience
- white-label partner modules
- enterprise APIs

### High-level business-facing architecture

| Layer | Responsibilities |
|---|---|
| Experience layer | Mobile app, web dashboard, partner-facing UI modules |
| Integration layer | Setu AA, notifications, partner feeds, merchant intelligence sources |
| Core domain layer | Identity, household, subscription, utility, consent, recommendation, notification logic |
| Data and intelligence layer | Transaction normalization, merchant graph, recurring detection, analytics warehouse, AI orchestration |
| Trust and governance layer | Security controls, audit logging, permissions, observability, incident support |

### Frontend overview

- mobile-first native or cross-platform experience
- responsive web for browser review, support, and growth pages
- premium design system for consistency across analytics-heavy views

### Backend overview

- service-oriented modular architecture
- event-driven ingestion and notification workflows
- clear separation between operational data, analytics data, and AI orchestration

### Recurring detection engine

Should combine:

- transaction normalization
- merchant alias resolution
- cadence analysis
- amount variance logic
- confidence scoring

### AI architecture

Should include:

- rules-based insight candidate generation
- grounded retrieval from structured data
- model routing by task complexity
- monitoring and feedback loops

---

## 18. Security and Compliance

### Security objectives

- preserve user trust
- protect identity and financial data
- ensure auditable access and change history
- support fintech-grade compliance posture from launch

### Core security requirements

| Control area | Requirement |
|---|---|
| Data encryption | Encrypt identity, consent, and transaction data at rest and in transit |
| Access control | Enforce least privilege for internal users and services |
| Consent management | Store scope, purpose, timestamps, and revocation lifecycle |
| Audit logging | Log auth, consent changes, exports, deletes, and admin actions |
| PII minimization | Keep raw PII out of logs, analytics, and AI prompts wherever not required |
| Secure AI usage | Use prompt minimization and safe retention practices |

### Compliance considerations

| Area | Requirement |
|---|---|
| RBI AA ecosystem | Respect purpose limitation, read-only scope, revocation handling, and downstream storage governance |
| India privacy posture | Design with DPDP-aligned thinking around user rights and purpose limitation |
| GDPR-style principles | Support minimization, user access, deletion, and correction rights for future expansion |
| Household privacy | Private recurring items must not leak into shared views |

### Operational trust controls

- periodic access reviews
- incident response playbooks
- secret management through managed secure infrastructure
- security monitoring and anomaly alerting

---

## 19. Scalability Roadmap

| Stage | Product posture | Platform focus | Strategic unlock |
|---|---|---|---|
| MVP | Consumer recurring-spend visibility and savings suggestions | Strong core data model and reliable automation | Product-market fit validation |
| Growth | Household analytics, benchmarking, richer notifications | Horizontal scaling of ingestion and analytics | Retention and premium conversion |
| AI evolution | Personalized insights and multilingual assistance | Model governance and feedback loops | Premium moat and stronger engagement |
| B2B API platform | Reusable recurring-intelligence services for partners | Tenant isolation and SLA-backed APIs | Enterprise revenue and distribution |
| Embedded finance future | Action orchestration and partner-led optimization | Workflow engines and settlement/compliance capabilities | Full recurring-expense operating platform |

---

## 20. Business Metrics and KPIs

| Metric | Definition | Why it matters |
|---|---|---|
| MAU | Monthly active users interacting with the platform | Measures scale and usage relevance |
| Activation rate | Users reaching dashboard with at least one confirmed recurring item | Validates onboarding effectiveness |
| Bank-link rate | Share of activated users connecting at least one account | Measures automation adoption |
| Detection accuracy | Precision and recall of recurring identification | Core trust KPI |
| D30 retention | Returning usage 30 days post-signup | Measures habit formation |
| Premium conversion | Free-to-paid conversion rate | Core monetization KPI |
| MRR | Monthly recurring revenue from subscriptions and contracts | Revenue health indicator |
| CAC | Blended acquisition cost | Unit economics health |
| LTV/CAC | Customer lifetime value relative to acquisition cost | Long-term viability metric |
| AI engagement | Insight opens, assistant sessions, recommendation interactions | Whether AI adds real product value |
| Savings realized | User-confirmed or inferred recurring savings | Proof-of-value metric |
| Paid churn | Share of paying users who cancel | Product and monetization durability |

### KPI philosophy

The most important success signal is not traffic, but whether users:

- trust the recurring model
- take optimization actions
- save money
- come back because the product continues to help

---

## 21. Risks and Challenges

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Banking integration coverage gaps | Reduced automation and activation | Medium | Preserve strong manual mode and diversify partners later |
| Recurring detection false positives | Erodes trust quickly | Medium-High | Review-first UX, confidence thresholds, explainability |
| AI inaccuracies | Can damage trust and create compliance risk | Medium | Ground outputs in structured facts and suppress weak outputs |
| Privacy concerns | Lower bank-link conversion and reputational risk | High | Transparent consent language and strong privacy controls |
| CAC inflation | Threatens D2C economics | Medium-High | Push partner channels, referrals, and outcome-led retention |
| Compliance change | Slows launch or forces rework | Medium | Conservative consent and governance design from day one |
| Episodic user behavior | Low engagement between billing events | Medium | Build alerts, monthly insight loops, and household interactions |
| Monetization bias perception | Users may distrust partner-linked suggestions | Medium | Disclose partner influence and rank user benefit first |

### Strategic risk interpretation

The biggest long-term risk is not technical complexity alone. It is failing to build trust quickly enough in a product category that handles sensitive financial data and makes optimization claims. The product must therefore prioritize correctness, explainability, and clarity ahead of aggressive growth mechanics.

---

## 22. Phased Delivery Roadmap

| Phase | Timeline | Primary scope | Dependencies | Exit criteria |
|---|---|---|---|---|
| Phase 1: MVP | 4 to 6 months | Onboarding, auth, household setup, manual entry, AA linking, recurring detection, dashboard, reminders, basic savings engine | Design system, transaction model, Setu AA, notifications | Users can see recurring spend and act on at least one recommendation |
| Phase 2: Growth | 6 to 9 months from MVP start | Household invites, shared analytics, duplicate refinement, premium plans, richer alerts | Permissions, paywall, benchmark preparation | Premium monetization and household value are validated |
| Phase 3: AI platform | 9 to 12 months from MVP start | Assistant, richer insights, budget intelligence, multilingual support | Retrieval, safety, feedback systems | AI measurably improves engagement and retention |
| Phase 4: B2B APIs | 12 to 18 months from MVP start | Partner APIs, white-label widgets, enterprise reporting | Tenant isolation, SLA layer, contracts | At least one successful external partner deployment |

### Priority rationale

1. Build core recurring trust.
2. Expand into household and optimization depth.
3. Add AI only where value is proven.
4. Productize the intelligence layer for partners.

---

## 23. Future Opportunities

| Opportunity | Description | Capability required |
|---|---|---|
| AI financial coach | Ongoing recurring-spend and savings assistant | Memory, goals, personalization |
| Autonomous savings recommendations | Product sequences and prioritizes next-best actions automatically | High-confidence action scoring |
| Smart cancellation engine | Turns recommendation into direct action | Partner workflows and authorization |
| Credit optimization | Connect recurring behavior to card strategy and benefits | Card-benefit graph and decision logic |
| Subscription marketplace | Drive plan switching and bundled offers | Offer catalog and recommendation governance |
| Embedded fintech partnerships | Deliver recurring intelligence into partner ecosystems | APIs, tenanting, white-label architecture |

### Strategic lens

These opportunities should only be pursued after the core product establishes a strong trust foundation. The path to platform leverage depends on getting recurring detection, explanation, and optimization right first.

---

## 24. Appendix

### Glossary

| Term | Meaning |
|---|---|
| Recurring item | Any subscription, bill, or repeated financial obligation tracked by the platform |
| Subscription intelligence | Capability set that detects, explains, and optimizes subscription behavior |
| AA | India's Account Aggregator ecosystem for permissioned financial data sharing |
| Normalized recurring value | Monthly-equivalent value used to compare mixed cadences |
| Shared subscription | A recurring service used by multiple household members |
| Confidence score | Engine-estimated reliability of a detection or recommendation |
| Savings realization | User-confirmed or inferred reduction in recurring spend after action |

### Assumptions

- India launch has sufficient recurring-behavior density and AA coverage to support meaningful automation.
- Users will share financial data when the value proposition is clear and trust design is strong.
- MVP remains read-only, with no direct bill payment or money movement requirement.
- Manual tracking remains necessary because not all recurring items are automatically detectable.

### Constraints

- Bank descriptors may be inconsistent or low quality.
- Recurring detection quality depends on history depth.
- Household privacy needs can conflict with analytics richness.
- Mobile-first simplicity constrains how much information can appear at once.

### Dependencies

- Setu AA or equivalent bank connectivity
- merchant intelligence and alias catalog
- notification infrastructure
- analytics and AI orchestration
- privacy and legal alignment

### Success criteria

SubSense AI will be considered successful when:

1. users can understand their recurring commitments within minutes of activation
2. the platform earns trust through accurate recurring identification
3. savings recommendations create measurable action and value
4. household features provide clear differentiation from generic finance apps
5. the intelligence layer is reusable for both consumer and partner distribution

---

## Document Summary

SubSense AI is positioned to occupy a differentiated space at the intersection of subscription management, household expense intelligence, and AI-assisted financial optimization. Its success depends on solving a real and growing recurring-spend pain point with a product that feels premium, accurate, privacy-respecting, and action-oriented from day one.

The correct product strategy is to launch with deterministic trust, mobile-first value delivery, and India-specific integration strength, then expand into household intelligence, AI personalization, and eventually a reusable recurring-intelligence platform for B2B partners.
