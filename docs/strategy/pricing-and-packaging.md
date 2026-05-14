# Pricing and Packaging

## Purpose

This document defines the recommended pricing and packaging strategy for `SubSense AI`.

It expands the monetization section in `../../BRD.md` into a more practical operating model for:

- product planning
- premium feature boundary decisions
- family-plan strategy
- future paywall and billing design
- investor and partner conversations about monetization

It is intended to answer five practical questions:

1. What should be free versus paid in the MVP and early growth stages?
2. How should `Pro`, `Family`, and future enterprise packaging differ?
3. What value should justify payment without weakening trust in the free tier?
4. Which monetization moves are safe early, and which should wait?
5. What future implementation implications will pricing create for the codebase?

Use this document with:

- `../../BRD.md`
- `positioning-and-messaging.md`
- `../product/personas.md`
- `../product/PRD.md`
- `../roadmap/implementation-sequence.md`

## Packaging principles

1. **The free plan must create real value**
   Free should not feel broken, deceptive, or deliberately crippled. It should prove recurring-spend clarity and trust.

2. **Paid plans should monetize outcomes, not basic understanding**
   Users should pay for deeper optimization, richer alerts, household expansion, and advanced intelligence, not for access to the product's core truth.

3. **Family packaging should reinforce the product's strongest differentiator**
   Household-aware recurring intelligence is one of the clearest strategic moats and should become a meaningful packaging lever.

4. **Monetization must not undermine trust**
   Recommendations, alerts, and AI explanations should not feel biased toward upsell or affiliate revenue.

5. **Packaging should stay simple in phase 1**
   The team should avoid over-designing plan complexity before product-market fit and retention are proven.

## Packaging strategy summary

Recommended package ladder:

| Plan | Role in strategy | Core buyer motivation |
|---|---|---|
| `Free` | acquisition, trust, product education | understand recurring burden and basic recurring control |
| `Pro` | primary individual monetization | save more money, get richer intelligence, reduce recurring waste |
| `Family` | higher-ARPU differentiation tier | manage shared recurring finances and optimize household spend |
| `Enterprise APIs` | later-stage B2B monetization | integrate recurring intelligence into third-party products |

## Core monetization thesis

SubSense AI should make money because it helps people:

- see recurring commitments clearly
- reduce waste
- avoid renewal regret
- optimize household recurring spend
- act on grounded recommendations

The product should **not** make money by:

- hiding basic visibility behind a paywall
- artificially degrading the free experience
- turning every alert into an upsell moment
- biasing recommendations toward affiliate yield instead of user value

## Packaging goals by phase

## Phase 1: MVP

Primary goal:

- validate that recurring-spend clarity and optimization create willingness to pay

Secondary goal:

- identify whether `Pro` or `Family` is the stronger monetization wedge first

### MVP packaging philosophy

- Free proves product usefulness
- Pro monetizes depth and actionability
- Family monetizes shared-finance complexity and stronger household value
- Enterprise packaging remains conceptual, not implementation-critical

## Phase 2: Growth

Primary goal:

- improve conversion and retention by sharpening plan differences

Possible additions:

- richer household controls
- premium benchmarks
- more advanced alerting and insights
- annual pricing emphasis

## Phase 3 and beyond

Primary goal:

- expand monetization beyond D2C subscriptions into partner and embedded channels

Possible additions:

- API usage tiers
- white-label pricing
- enterprise reporting modules
- partner-based revenue-sharing models

## Recommended plan structure

## 1. Free

### Purpose

Establish trust, create recurring-spend clarity, and prove the product is useful before payment.

### Recommended capabilities

- onboarding and activation
- OTP-based account access
- household or individual context setup
- manual subscription entry
- manual recurring bill and utility setup
- basic recurring dashboard
- limited linked-account support
- basic renewal visibility
- essential reminders
- basic recurring review actions

### Free-tier promise

The user should be able to answer:

- What recurring things am I paying for?
- Roughly how much recurring burden do I carry?
- What is renewing soon?

### Free-tier boundaries

Free should **not** include the deepest value layers such as:

- advanced duplicate intelligence
- richer savings engine depth
- premium recommendation ranking
- advanced household analytics
- benchmark and comparison modules
- richer alert controls

## 2. Pro

### Purpose

Convert individual users who want better recurring optimization, richer alerts, and stronger intelligence.

### Recommended capabilities

- everything in `Free`
- advanced recurring insights
- duplicate subscription detection
- richer optimization and savings recommendations
- more powerful alerting and renewal support
- stronger trend and recurring movement analysis
- higher linked-account limits
- richer AI-backed explanation surfaces where grounded

### Buyer motivation

This plan is for users who say:

- “Help me reduce waste more effectively.”
- “Tell me what actually deserves action.”
- “Give me more confidence and control over recurring spending.”

## 3. Family

### Purpose

Monetize the strongest differentiated value proposition: household recurring intelligence.

### Recommended capabilities

- everything in `Pro`
- multi-member household support
- stronger shared-plan and ownership controls
- household analytics and contribution views
- privacy-aware family settings
- family-plan optimization logic
- future benchmark or comparison capabilities if added

### Buyer motivation

This plan is for users who say:

- “I need to manage recurring spending across a household, not just myself.”
- “I want to see shared and personal obligations more clearly.”
- “I need a better family finance coordination layer.”

## 4. Enterprise APIs

### Purpose

Provide a future monetization path for banks, fintechs, wellness platforms, and embedded-finance partners.

### Recommended early package framing

- recurring detection APIs
- recommendation or insight APIs
- white-label widgets
- household-aware recurring intelligence modules
- benchmark or reporting packages later

### Important note

This tier should not affect phase-1 product implementation decisions except for preserving clean contracts and tenant-ready architecture.

## Recommended pricing ranges

The BRD already proposes a strong starting point. This document recommends keeping those price anchors for early planning:

| Plan | Recommended indicative pricing | Why it works |
|---|---|---|
| `Free` | INR 0 | reduces trust friction and supports acquisition |
| `Pro` | INR 199/month or INR 1,499/year | accessible premium tier with meaningful savings-logic justification |
| `Family` | INR 299/month or INR 2,499/year | strong upsell for shared-finance value and higher household willingness to pay |
| `Enterprise APIs` | custom pricing | depends on usage, integration depth, and partner type |

## Pricing rationale

### Why `Pro` should stay accessible

The strongest individual use case is often “save money and reduce recurring clutter,” so the price should feel easy to justify against one or two avoided bad renewals or low-value subscriptions.

### Why `Family` can command a premium

Household visibility is both:

- more differentiated
- more emotionally valuable

If the product genuinely helps reduce duplicate family plans or make recurring spending easier to coordinate, `Family` becomes a stronger long-term monetization wedge than `Pro` alone.

## Packaging matrix

| Capability area | Free | Pro | Family | Enterprise APIs |
|---|---|---|---|---|
| Manual recurring setup | yes | yes | yes | n/a |
| Basic recurring dashboard | yes | yes | yes | partial via APIs later |
| Limited bank linking | yes | yes | yes | n/a |
| Basic renewals and reminders | yes | yes | yes | n/a |
| Advanced duplicate detection | limited or no | yes | yes | future |
| Advanced savings recommendations | limited or no | yes | yes | future |
| Rich alerting controls | limited | yes | yes | future |
| Multi-member household support | no or minimal | limited | yes | future |
| Shared-plan optimization | no | limited | yes | future |
| Household analytics | no | limited | yes | future |
| Partner widgets or APIs | no | no | no | yes |

## Entitlement design guidance

The packaging model suggests the following entitlement categories should exist conceptually, even if not fully implemented immediately:

| Entitlement type | Examples |
|---|---|
| usage limits | number of linked accounts, household members, or advanced recommendation views |
| feature access | duplicate detection depth, premium alert controls, household analytics |
| workflow depth | advanced review tools, deeper trend or recommendation drill-down |
| collaboration scope | household membership and privacy controls |

## What should stay free

The following should remain available in the free product to protect trust and activation:

- basic recurring visibility
- manual setup for subscriptions and bills
- ability to skip linking and still get value
- core dashboard understanding
- basic renewals
- basic recurring review and correction actions

If these are paywalled too early, the product will risk feeling like:

- an upsell shell instead of a useful product
- a narrow lead-gen tool
- a trust-light finance app

## What should move to paid first

The safest early premium packaging candidates are:

1. advanced duplicate and overlap intelligence
2. richer savings and optimization recommendations
3. advanced alerting and reminder control
4. richer recurring trend explanations
5. household expansion and shared-plan intelligence

These features are strong premium candidates because they are:

- meaningful
- measurable
- clearly more advanced than baseline visibility

## Monetization guardrails

## Product guardrails

- Never make basic recurring visibility feel broken in free.
- Do not paywall trust explanations or stale-state clarity.
- Do not gate correction flows that protect dashboard accuracy.
- Do not make bank linking feel like a paywalled feature.

## Recommendation guardrails

- Recommendations must be ranked for user value first, not partner yield.
- Affiliate-linked opportunities must be disclosed when relevant.
- Free users should still trust recommendations, even if premium users receive deeper versions.

## Alerting guardrails

- Alerts should not become monetization spam.
- Essential reminders should remain useful in free.
- Premium alerting should deepen control and precision, not create artificial anxiety.

## AI guardrails

- AI should never be positioned as a premium magic box detached from evidence.
- Paid AI-related features should be framed as clearer explanations or deeper insights, not as automated financial authority.

## Free-to-paid conversion logic

The product should try to convert users at moments of proven value, not at arbitrary time gates.

### Best upgrade triggers

- user sees a clear duplicate or optimization opportunity
- user wants deeper household visibility
- user wants more powerful alerts and control
- user hits a meaningful linked-account or household boundary
- user has already experienced a clear recurring “aha” moment

### Weak upgrade triggers

- immediately after signup
- before dashboard value exists
- before the user sees any recurring burden
- generic feature wall without context

## Messaging for packaging

## Free plan message

Use language like:

- “Start free and see your recurring spending clearly.”
- “Track subscriptions and recurring bills in one place.”

Avoid language like:

- “Limited forever unless you upgrade immediately.”

## Pro plan message

Use language like:

- “Get deeper savings insights and stronger recurring control.”
- “Spot duplicate subscriptions and act on smarter recommendations.”

## Family plan message

Use language like:

- “Manage recurring spending across your household.”
- “See shared and personal recurring obligations more clearly.”
- “Optimize family subscriptions and recurring bills together.”

## Enterprise message

Use language like:

- “Bring recurring-spend intelligence into your product.”
- “Use recurring detection and insight layers without building them from scratch.”

## Packaging experiments to run later

After MVP validation, the team should test:

- monthly versus annual pricing emphasis
- conversion from Free to Pro after recurring optimization signals
- conversion from Pro to Family after household or shared-plan behaviors appear
- whether linked-account count limits or household member limits are better packaging levers
- whether benchmark or comparison features improve willingness to pay

## Success metrics for packaging

| Metric | Why it matters |
|---|---|
| Free-to-paid conversion | validates willingness to pay |
| Pro versus Family mix | reveals strongest monetization wedge |
| Paid retention | tests whether premium value is durable |
| Upgrade trigger effectiveness | shows whether paywall timing is intelligent |
| Savings-action rate by plan | validates whether premium drives real user outcomes |
| Household adoption among paid users | tests differentiated monetization strategy |

## Early implementation implications

Even if billing is not built immediately, pricing and packaging create future implementation requirements.

The codebase should eventually support:

- feature flags or plan entitlements
- linked-account limits
- household-member or household-feature entitlements
- recommendation-depth entitlements
- alert-control entitlements
- plan-aware analytics

### Important implementation note

The team does **not** need to build full billing and paywall infrastructure before Stage 0 or Stage 1 implementation.

But the product should avoid deep assumptions that make later entitlement checks painful or scattered.

## Recommended rollout order for monetization

The safest monetization rollout path is:

1. launch with strong free value
2. validate activation and recurring trust
3. introduce or sharpen `Pro` around optimization depth
4. expand `Family` once shared recurring usage is visible
5. explore partner and enterprise monetization after D2C learning is stronger

This order matches the product's trust-first strategy.

## Things to defer

The following should likely be deferred until after early validation:

- complex plan matrices
- usage-based consumer pricing
- hard paywalls inside onboarding
- aggressive affiliate monetization
- too many promotional discounts
- enterprise packaging implementation details

## Final recommendation

SubSense AI should package itself around a simple, credible value ladder:

- `Free` for recurring clarity and trust
- `Pro` for deeper optimization and control
- `Family` for household intelligence and shared recurring visibility
- `Enterprise APIs` for later platform leverage

The most important monetization discipline is this:

**Charge for deeper outcomes, not for basic understanding.**

If the product keeps that principle intact, it can monetize meaningfully without damaging trust, activation, or the premium recurring-intelligence positioning it is trying to establish.
