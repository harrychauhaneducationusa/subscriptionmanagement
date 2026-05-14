# AI Governance

## Purpose

This document defines how `SubSense AI` should govern the use of AI across product, data, architecture, and operations.

It complements:

- `../../BRD.md`
- `solution-architecture.md`
- `integration-landscape.md`
- `security-and-compliance-controls.md`

The goal is to answer a simple but critical question:

**How can SubSense AI use AI to improve recurring-spend clarity and actionability without creating trust, compliance, or product-correctness risks?**

This is intentionally not an "AI transformation" manifesto. It is a practical governance model for a fintech product where user trust depends on accuracy, explainability, and restraint.

## Governance posture

SubSense AI should be **AI-enhanced, not AI-dependent**.

That means:

- AI improves explanation quality, summarization, and prioritization
- deterministic systems remain the source of truth for recurring classification, savings math, consent, and security-sensitive logic
- weak or low-confidence AI output should be hidden rather than forced into the user experience
- the product must continue to function in a useful way when AI providers are unavailable

This posture is especially important because the product handles:

- transaction-derived financial data
- recurring-spend interpretations
- household privacy boundaries
- optimization recommendations that could influence user decisions

## Governance objectives

| Objective | Why it matters |
|---|---|
| Keep AI grounded in product facts | reduces hallucination and misleading financial guidance |
| Protect user trust | ensures AI feels helpful, not speculative or gimmicky |
| Limit compliance and advice risk | avoids unsupported financial or regulatory claims |
| Preserve operational resilience | ensures core product value survives provider outages |
| Support measurable product value | keeps AI tied to clarity, actionability, and retention rather than novelty |

## AI use policy

## 1. Allowed AI use cases

For the MVP and near-term growth phases, AI should be used only in bounded areas where the output can be grounded in internal facts.

### Approved use cases

| Use case | Description | Governance posture |
|---|---|---|
| Insight narration | explain spend changes, recurring patterns, and dashboard meaning in plain language | allowed when grounded in structured product data |
| Recommendation explanation | explain why a cancellation, downgrade, bundle, or monitor suggestion exists | allowed when assumptions are explicit |
| Dashboard summaries | summarize recurring burden, upcoming renewals, and notable changes | allowed when freshness and confidence are known |
| Assistant responses | answer user questions about their own recurring data and recommendations | allowed only through grounded retrieval |
| Prioritization support | help rank recommendation presentation when deterministic rules supply the evidence | allowed as secondary ranking support |

### Product requirement

Every approved AI output must trace to:

- known user or household context
- structured recurring or transaction-derived facts
- explicit assumptions
- defined freshness state

## 2. Restricted or prohibited AI use cases

Some decisions should remain explicitly outside AI authority.

### Prohibited use cases

| Use case | Why prohibited |
|---|---|
| Consent interpretation or consent-state authority | legal and trust-sensitive logic must remain deterministic |
| Security decisions such as authentication, authorization, or fraud adjudication by AI alone | too sensitive and too hard to explain safely |
| Primary recurring classification correctness | the recurring engine must rely on deterministic signals and reviewable confidence |
| Savings calculations as an opaque AI estimate | financial math must remain reproducible and auditable |
| Unsupported financial advice or suitability guidance | creates trust and compliance risk |
| Silent auto-action execution based only on AI output | too risky in a finance product |

### Restricted use cases requiring extra review

- multilingual assistant expansion
- partner-facing AI outputs
- benchmark narratives using anonymized peer data
- personalized recommendation ranking models
- any AI feature that materially changes pricing, monetization, or perceived advice posture

## Governance principles

## 1. Grounding before generation

AI should not invent product facts. It should transform, summarize, or explain facts that already exist within trusted internal systems.

Every AI flow should start from:

- normalized transaction views
- recurring candidates or confirmed recurring items
- recommendations produced by deterministic or hybrid logic
- freshness metadata
- confidence metadata
- user-visible permission and privacy context

## 2. Deterministic truth, AI narration

The product should clearly separate:

- truth generation
- recommendation logic
- narrative generation

### Decision allocation model

| Product task | Primary authority | AI role |
|---|---|---|
| recurring candidate detection | deterministic logic | none or secondary support only |
| merchant normalization | deterministic rules | optional exception support later |
| savings opportunity calculation | deterministic rules and explicit assumptions | wording and summarization only |
| recommendation ranking | deterministic ranking first | optional supporting rerank later |
| user-facing explanation | product facts plus AI | primary narrative layer |
| chat interaction | grounded retrieval plus AI | response synthesis only |

## 3. Suppress weak outputs

The system should prefer no AI output over low-quality AI output.

AI-generated content should be suppressed when:

- evidence is incomplete
- freshness is stale
- confidence is below threshold
- the insight is redundant or low-value
- the wording risks overclaiming certainty

## 4. Privacy and minimization by design

AI should receive only the minimum context required to complete the task.

Prompt inputs should avoid unnecessary:

- raw PII
- full transaction histories when summaries are enough
- identifiers unrelated to the requested insight
- household-private data outside the viewer's permission scope

## 5. User trust over engagement tactics

AI copy must not manipulate users with exaggerated urgency, fake certainty, or pseudo-personal authority.

The voice should remain:

- clear
- specific
- evidence-backed
- non-judgmental
- financially responsible

## AI risk tiers

SubSense AI should classify AI features by product risk.

| Tier | Example feature | Risk profile | Governance requirement |
|---|---|---|---|
| Tier 1 | dashboard summary or explanation copy | low to medium | grounding, prompt minimization, output checks |
| Tier 2 | recommendation wording and ranking support | medium | stronger evaluation, suppression thresholds, monitoring |
| Tier 3 | assistant answers about personal recurring finances | medium to high | retrieval constraints, refusal behavior, confidence handling |
| Tier 4 | partner-facing or action-triggering AI | high | not MVP, requires formal review before release |

The MVP should stay primarily in **Tier 1** and carefully selected **Tier 2** use cases.

## Core governance controls

## 1. Input controls

Every AI workflow should define:

- approved input fields
- prohibited fields
- freshness requirements
- privacy scope checks
- token or context limits

### Minimum input rules

- use normalized and filtered data instead of raw ingestion payloads where possible
- remove or mask unnecessary identifiers
- avoid sending more historical detail than the use case requires
- include confidence and freshness context in the AI request when relevant

## 2. Prompt controls

Prompt design should be treated as a governed product artifact, not a casual implementation detail.

Each AI prompt should define:

- task objective
- allowed evidence sources
- prohibited claims
- tone requirements
- refusal conditions
- output structure

### Required prompt guardrails

- do not imply guaranteed savings
- do not claim certainty when evidence is weak
- do not present financial advice beyond product-supported suggestions
- do not expose hidden internal reasoning or private household detail
- do not fabricate causes for spend changes that are not supported by evidence

## 3. Output controls

Before AI output reaches the user, the system should apply checks for:

- missing evidence
- stale or missing data freshness
- unsupported recommendation claims
- inappropriate confidence language
- duplicated or noisy insight generation

### Output expectation

User-facing AI content should ideally include:

- the core observation
- the product evidence behind it
- the action or implication
- any limitation or uncertainty if material

## 4. Fallback controls

If AI is unavailable or suppressed, the product should degrade gracefully to:

- deterministic recommendation cards
- non-AI dashboard metrics
- static explanation templates where appropriate
- review-first user flows

Core product value must not depend on AI uptime.

## Retrieval and assistant governance

The conversational assistant is valuable only if it remains tightly bounded.

### Assistant rules

The assistant should:

- answer questions about the user's own recurring spend context
- explain dashboard numbers and recommendation logic
- summarize recent recurring changes
- clarify what the product knows versus does not know

The assistant should not:

- give unsupported regulated financial advice
- infer hidden personal intent or household behavior without evidence
- answer outside the user's permission scope
- claim that a recommendation will certainly save money

### Retrieval requirements

Any assistant response should use:

- scoped internal retrieval
- current privacy permissions
- freshness metadata
- explicit refusal or limitation messaging when evidence is insufficient

## Human oversight model

AI features should not be launched as unattended black boxes.

### Required human governance

| Area | Human oversight expectation |
|---|---|
| Feature approval | product, engineering, and trust review before rollout |
| Prompt and policy review | documented review for sensitive or user-facing prompt changes |
| Output evaluation | sampled review of production outputs for quality and risk |
| Incident handling | clear ownership for misleading, harmful, or privacy-risking outputs |
| Scope expansion | explicit review before moving into higher-risk AI tiers |

### Launch posture

For MVP, AI features should be:

- narrow in scope
- measurable in value
- easy to disable
- easy to suppress when quality drops

## Evaluation and monitoring

AI quality should be measured as a product-quality function, not just a model-quality function.

### Minimum evaluation dimensions

| Dimension | Question to answer |
|---|---|
| Groundedness | does the output match the underlying product facts? |
| Clarity | does it help the user understand the situation faster? |
| Actionability | does it support a real product action or decision? |
| Safety | does it avoid overclaiming, advice risk, and privacy leakage? |
| Redundancy | is it distinct enough to deserve surface area? |

### Production monitoring expectations

The team should track:

- AI insight open and dismissal rates
- recommendation interaction rates with and without AI narration
- suppression rates
- fallback rates when AI is unavailable
- user feedback on helpfulness or confusion
- incidents involving misleading or stale outputs

## Governance metrics

| Metric | Why it matters |
|---|---|
| Grounded output pass rate | indicates whether AI is staying tied to evidence |
| Suppression rate | shows whether quality thresholds are working sensibly |
| User helpfulness feedback | indicates whether AI creates value rather than noise |
| Escalated output incident count | monitors trust and compliance risk |
| AI-assisted action rate | shows whether AI improves real product behavior |
| Cost per useful interaction | ensures AI economics remain rational |

## Compliance and communication guardrails

AI governance must align with the platform's broader trust posture.

### Required communication rules

- AI-generated text must not imply professional financial advice unless the product is actually authorized and designed for that posture
- partner or affiliate influence must not be hidden behind AI wording
- product copy should distinguish between detected facts, inferred patterns, and generated explanations
- stale or partial data must not be presented as current truth

### Privacy alignment

AI behavior must remain consistent with:

- consent purpose limitation
- household privacy boundaries
- data minimization rules
- retention and deletion obligations

## Release governance by phase

## Phase 1: MVP

Allowed:

- dashboard summaries
- recommendation explanations
- insight narration
- bounded assistant capabilities if grounded strongly enough

Not allowed:

- AI-only recurring classification
- auto-action execution
- open-ended financial coaching
- broad partner-facing AI services

## Phase 2: Growth

Possible additions after proven value:

- stronger recommendation ranking support
- multilingual narration
- richer explanation personalization
- benchmark storytelling with strict privacy safeguards

## Phase 3 and beyond

Only after significant review:

- broader assistant memory or coaching capabilities
- enterprise or partner AI surfaces
- higher-risk personalization models
- semi-automated action orchestration

## MVP AI governance checklist

Before launch, the team should be able to answer **yes** to all of the following:

- [ ] Is every AI feature clearly subordinate to deterministic product truth?
- [ ] Can every AI insight be grounded in product facts?
- [ ] Are low-confidence outputs suppressed instead of shown?
- [ ] Can the product function acceptably when AI is unavailable?
- [ ] Are prompts and outputs reviewed for advice, privacy, and overclaim risk?
- [ ] Are freshness and confidence considered before generation?
- [ ] Are analytics in place to measure AI helpfulness versus noise?
- [ ] Is there a clear owner for AI quality and incident response?

## Deferred but recommended next controls

As the platform matures, the following should likely be added:

- formal prompt versioning and approval workflows
- structured evaluation datasets for grounded finance outputs
- model-level A/B testing with trust metrics, not only engagement metrics
- deeper refusal and red-team scenarios for assistant behavior
- partner-specific AI governance when B2B APIs are introduced

## Final recommendation

SubSense AI should use AI where language, summarization, and prioritization improve clarity, but it should avoid using AI as the hidden authority behind finance-critical product truth.

The safest and strongest posture is:

- deterministic recurring intelligence
- evidence-backed recommendations
- AI-generated explanation only when grounded
- suppression of weak outputs
- graceful fallback when AI is unavailable
- explicit governance before expanding into higher-risk AI use cases

That approach gives the product room to feel modern and premium without sacrificing the correctness and trust required in a recurring-finance platform.
