# MVP Web Scope

## Purpose

This document defines the phase-1 delivery surface for SubSense AI as a **mobile-optimized responsive web application**. It clarifies what must ship in the web MVP, what is explicitly out of scope, and how the team should think about mobile-first UX without requiring native apps.

## Product stance

The MVP is:

- web-first in delivery
- mobile-first in UX
- browser-first in distribution
- native-app-deferred until product and retention evidence justify expansion

This means the team should design for phone-sized screens first while keeping the application fully usable on larger screens.

## MVP objectives

The web MVP must prove that users will:

1. complete onboarding with low friction
2. connect financial data or manually configure recurring expenses
3. trust the recurring detection and dashboard outputs
4. act on at least one savings or management prompt
5. return because the product continues to add value

## In-scope capabilities

### 1. Onboarding and account setup

- landing and value proposition flow
- household selection
- essential recurring expense setup
- subscription seed setup
- OTP-based authentication
- draft continuation for interrupted onboarding

### 2. Financial connectivity and recurring intelligence

- Account Aggregator-based bank linking
- consent explanation and approval flow
- transaction ingestion status visibility
- recurring detection review queue
- merchant/category enrichment display

### 3. Core recurring management

- manual subscription entry
- utility and recurring bill setup
- confirm, edit, dismiss, or merge detected recurring items
- shared versus personal ownership assignment at the household level

### 4. Dashboard and insights

- recurring spend summary
- category breakdown
- renewal calendar
- savings potential
- duplicate subscription indicators
- trend analysis
- AI-backed insight feed

### 5. Retention and action surfaces

- in-app notification center
- email reminders for renewals and important alerts
- browser-based reminder and follow-up flows

## UX requirements for the web MVP

- primary layout designed for mobile browser widths first
- touch-friendly controls and spacing
- responsive dashboard cards and charts
- low-friction form design for one-handed mobile use
- clear recovery when network or consent flows are interrupted
- strong data-freshness and trust messaging

## Desktop support stance

Desktop is a **secondary convenience surface**, not the primary design target for MVP.

Desktop support should:

- allow review of dashboards and documents
- support partner, founder, and investor demos
- provide broader accessibility for users who prefer browser-based review

Desktop support should **not** drive the core UX decisions for the initial product.

## Deferred native capabilities

The following are intentionally out of MVP scope unless they become critical during validation:

- app-store distribution
- native iOS and Android shells
- deep device-native push engagement strategy
- advanced biometric unlock flows
- rich offline behavior
- device-specific polish that does not change core user value

## Delivery implications

This scope favors:

- one primary frontend surface for rapid iteration
- faster onboarding experimentation
- easier user testing through shared links
- simpler investor and partner demonstrations
- less operational dependency on app-store release cycles

## Exit criteria for phase 1

The web MVP should be considered validated when:

- users can complete onboarding from mobile browsers reliably
- bank linking and manual fallback both produce usable dashboards
- recurring detection earns trust
- savings prompts drive measurable action
- repeat usage is strong enough to decide whether native apps would compound value
