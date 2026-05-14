# Frontend Delivery Strategy

## Purpose

This document defines the recommended frontend architecture for `SubSense AI` as a **mobile-optimized web MVP**.

It is intentionally separate from the full solution architecture so that product, design, and engineering can align on delivery-channel choices without conflating them with backend or data decisions.

## Frontend strategy summary

| Topic | Recommendation |
|---|---|
| MVP channel | Responsive web application |
| UX priority | Mobile-browser-first |
| Desktop support | Secondary convenience surface |
| Native apps | Defer until retention and channel economics justify them |
| Product posture | Fintech-grade, premium, simple, trustworthy |

## Why web-first is the right choice

The MVP’s core workflows are:

- onboarding
- household setup
- bank linking and consent review
- recurring detection review
- dashboard analytics
- manual subscription and utility entry
- savings recommendations

These workflows do not require native-only device capabilities.

A web-first approach gives the team:

- one frontend surface to iterate quickly
- easier distribution for research, pilots, and investor demos
- fewer release bottlenecks than app-store-based iteration
- faster validation of product-market fit

## Recommended frontend stack

| Layer | Recommendation | Why |
|---|---|---|
| Framework | React + TypeScript | team familiarity plus stronger maintainability |
| Build/runtime | Modern React build stack | cleaner developer experience than older CRA setups |
| Routing | Client-side routing with clear app-shell boundaries | fits dashboard-style product UX |
| State | Query/data-fetching layer plus lightweight client state | better separation between server and UI state |
| Component system | Mature component library with strong responsive support | helps move fast while maintaining consistency |
| Charts | Lightweight charting layer for dashboards | required for recurring-spend analytics |
| PWA features | Optional, not foundational | useful later for installability, but not phase-one critical |

## Delivery model

### Phase 1

- responsive web application
- optimized for phone-sized screens first
- full functionality in mobile browsers
- desktop available but secondary

### Phase 2

- refine browser performance and engagement
- improve installability if PWA behavior proves valuable
- strengthen retention loops

### Phase 3

- decide whether native apps add enough value to justify packaging and maintenance cost

## Rendering and app model

For the MVP, the product can ship as a client-rendered application with strong responsive design and well-structured API boundaries.

This means:

- a clean authenticated app shell
- focused feature routes instead of a broad, multiproduct route graph
- explicit separation between public entry flows and authenticated product views

## UX requirements

### Mobile-first requirements

- touch-friendly navigation
- large, readable form fields
- one-handed interaction for common flows
- compact but trustworthy dashboard layouts
- clear empty, loading, and stale-data states
- visible explanation of data freshness and bank-sync status

### Dashboard requirements

- recurring summary visible without scrolling excessively
- strong visual hierarchy for alerts and savings opportunities
- easy transition from insight to action
- charts that degrade gracefully on narrow screens

### Consent and onboarding requirements

- purpose-led explanations
- clear why-this-data language
- low-friction fallback paths when linking is skipped
- no dependence on desktop-size layouts to complete bank or setup flows

## What to keep from the existing stack

- responsive React delivery model
- component-based app shell approach
- PWA awareness where useful
- API-driven SPA product experience

## What to avoid copying directly

- older CRA-era scaffolding for a new build
- very large all-in-one route trees
- auth and token lifecycle logic centralized in a large global context
- localStorage-heavy patterns for primary sensitive-session handling without stronger security review

## Security posture for frontend architecture

The frontend should be designed assuming it handles sensitive financial views.

That means:

- careful session handling
- strict route protection
- minimal exposure of sensitive tokens in browser storage patterns where avoidable
- clear stale-session handling
- strong auditability and trust messaging around bank data

## Native app decision criteria

Native apps should be considered only when:

- repeat usage is strong
- reminders are a major retention driver
- installability measurably improves acquisition or trust
- mobile web limitations are clearly hurting product value

## Final recommendation

SubSense AI should launch with a **clean, mobile-optimized responsive web frontend**, not a native mobile app.

The frontend architecture should stay intentionally small, focused, and fintech-friendly:

- modern React
- TypeScript
- responsive mobile-browser-first design
- clear authenticated app shell
- product-specific routes only

That gives the team speed and architectural clarity without overcommitting to native packaging before the product earns it.
