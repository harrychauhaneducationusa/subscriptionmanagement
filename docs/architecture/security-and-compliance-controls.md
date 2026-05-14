# Security and Compliance Controls

## Purpose

This document defines the minimum security and compliance control framework for `SubSense AI`.

It expands the high-level security posture described in `../../BRD.md` and translates it into concrete architectural expectations for the MVP and early growth phases.

It is intended to answer a practical question:

**What controls must exist for the platform to be trustworthy enough to launch and scalable enough to mature into a fintech-grade recurring-intelligence product?**

The goal is not to imitate a full certification handbook. The goal is to define the controls that matter most for:

- user trust
- financial data protection
- consent integrity
- household privacy
- operational auditability
- regulator-friendly system behavior
- future partner and enterprise readiness

## Security posture statement

SubSense AI handles sensitive identity, consent, and transaction-derived financial data. Because the product makes recommendations and presents recurring-spend intelligence, trust is part of the product itself, not only an infrastructure concern.

The platform should therefore be designed around five non-negotiable principles:

1. **Least privilege by default**
   People, services, and integrations should only access the minimum data and actions required.

2. **Consent and purpose limitation are first-class**
   Financial data access must always be bounded by explicit user permission and clearly stated product purpose.

3. **Explainability matters alongside protection**
   Users should understand what data is being used, why it is used, and what confidence level applies to the resulting insights.

4. **Auditability must exist from the first release**
   Sensitive actions should be reconstructable for support, security review, and compliance investigation.

5. **Manual fallback is part of the security model**
   When integrations fail or confidence is weak, the product should fail safely and fall back to review-driven flows instead of pretending certainty.

## Control objectives

| Objective | Why it matters |
|---|---|
| Protect identity and financial data | prevents unauthorized disclosure, fraud exposure, and loss of user trust |
| Preserve consent integrity | ensures data use matches authorized scope and purpose |
| Enforce safe access boundaries | protects households, private recurring items, and partner evolution |
| Make sensitive actions traceable | supports supportability, incident response, and future audits |
| Reduce operational security risk | limits blast radius from code, credentials, and vendor failures |
| Support privacy-aligned product behavior | keeps product copy, AI usage, and retention practices honest |

## Data classification model

The product should use a simple but explicit internal classification model.

| Data class | Examples | Required posture |
|---|---|---|
| Public | marketing copy, documentation, generic UI assets | no special restriction beyond integrity controls |
| Internal operational | system metrics, queue health, deploy metadata | restricted to team and service operations |
| Sensitive personal | phone number, household membership, notification preferences | encrypted at rest, minimized in logs, permission-gated |
| Sensitive financial | consent records, bank account metadata, transactions, recurring patterns, savings opportunities | highest protection, auditable access, prompt minimization, strict retention review |
| Security-critical | OTP artifacts, session state, secrets, audit logs, admin actions | strongest access restrictions, rotation controls, tamper awareness |

## Control domains

## 1. Identity, authentication, and session control

The MVP is web-first and mobile-browser-first, so authentication controls must be strong without adding unnecessary friction.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| OTP verification | login and sensitive-account access require verified OTP flow | supports India-first mobile-first access patterns |
| Session protection | authenticated sessions are durable, revocable, and invalidated safely on auth changes | reduces stale access risk |
| Step-up protection | especially sensitive actions may require re-verification | useful for exports, account-link repair, or profile changes |
| Brute-force protection | rate limits and abuse controls exist for OTP and login attempts | reduces account abuse risk |
| Device/session visibility | user can understand active access state at a basic level | improves trust and supportability |

### Additional guidance

- Guest-style setup before full registration is acceptable only if sensitive persistence is not exposed prematurely.
- Authentication failures must not silently discard onboarding or recurring-setup progress.
- Session tokens or credentials must never be stored in a way that weakens browser security posture.

## 2. Authorization and least-privilege access

SubSense AI will eventually support households, internal operators, and partner-facing surfaces. Authorization must therefore be deliberate from day one.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| Role-aware access | household and internal roles are explicit, not inferred ad hoc | prevents accidental privilege spread |
| Action-level checks | sensitive mutations require explicit permission evaluation | protects data and recurring actions |
| Service least privilege | worker, API, and integrations use separate access scopes where practical | limits blast radius |
| Admin isolation | support or admin tooling is restricted and audited | avoids invisible internal data access |

### Household privacy rule

Shared-finance features must not implicitly expose personal recurring items. The system should support:

- private recurring items
- shared recurring items
- role-based household visibility
- auditability when privacy scope changes

## 3. Consent and financial-data governance

Consent is one of the highest-risk control areas because it connects legal trust, product trust, and external integration behavior.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| Explicit purpose messaging | users are told why bank data is requested and how it will be used | supports trust and purpose limitation |
| Consent state lifecycle | issued, active, expired, revoked, failed, and repair-needed states are modeled | avoids ambiguity in data use |
| Scope persistence | scope, timestamps, institution context, and relevant metadata are stored | supports auditability |
| Revocation handling | revoked or expired access is reflected in product behavior promptly | prevents stale-authority misuse |
| Read-only posture | MVP connectivity remains read-only and recommendation-oriented | reduces regulatory and risk exposure |

### Product behavior requirements

- The UI must not imply that consent is mandatory for all product value.
- Skip-linking must remain available without punitive UX.
- If consent is revoked or stale, the product must indicate freshness limits rather than silently presenting old outputs as current.

## 4. Data protection and encryption

The platform should apply stronger controls to financial and consent-linked data than to generic application data.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| Encryption in transit | all sensitive data traverses encrypted channels | baseline fintech requirement |
| Encryption at rest | identity, consent, financial, and security-sensitive records are protected at rest | protects against storage-layer exposure |
| Secret management | credentials are stored in managed secret systems, not code or loose config | reduces credential leakage |
| Backup protection | backups inherit security controls and restoration access limits | avoids backdoor exposure paths |
| Object storage controls | exports, files, and artifacts use private access patterns and expiry where relevant | prevents accidental public leakage |

### Data-handling rules

- Raw financial payloads should be preserved for lineage, but not broadly replicated.
- Sensitive fields must be excluded from debug logs and analytics events unless there is a strong, approved reason.
- Test environments should not use production financial data without appropriate masking or synthetic replacement.

## 5. Application and API security

The platform should assume that the responsive web app, API service, and future partner surfaces all expand the attack surface.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| Secure defaults | headers, CORS, CSRF posture, and input validation are reviewed intentionally | reduces common web attack risk |
| Dependency hygiene | critical dependency review and update practice exists | reduces avoidable supply-chain risk |
| Route protection | all sensitive endpoints have authentication and authorization gates | prevents accidental exposure |
| Input and output validation | incoming data is validated and dangerous outputs are controlled | limits injection and integrity issues |
| Abuse controls | rate limiting exists for exposed high-risk routes | protects auth and sensitive APIs |

### Architectural note

Because the product is starting as a modular monolith, clear domain separation is itself a security control. It reduces the chance that unrelated modules can access or mutate sensitive financial data casually.

## 6. Logging, auditability, and evidence trails

Observability is not enough on its own. The platform also needs a trustworthy historical record of sensitive actions.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| Audit events | auth changes, consent changes, exports, deletes, admin access, and important recurring mutations are logged | supports investigations and support |
| Log minimization | logs avoid storing raw PII or full financial payloads unnecessarily | reduces secondary exposure risk |
| Time coherence | security-relevant records preserve reliable timestamps | supports incident reconstruction |
| Access to logs | only authorized operators can access sensitive logs | prevents internal overexposure |
| Retention policy | audit and operational logs have explicit retention expectations | improves governance and cost control |

### Minimum evidence set

For the MVP, the team should be able to answer:

- who accessed or changed a sensitive area
- when a consent state changed
- when bank-link state moved to stale, failed, or repaired
- when user data was exported or deleted
- which recommendations or insights were generated from which underlying data windows

## 7. Monitoring, detection, and incident readiness

SubSense AI does not need a giant security operations function at launch, but it does need enough visibility to detect meaningful failures and respond responsibly.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| Health monitoring | web, worker, queue, and critical provider paths are observable | supports reliable operations |
| Error alerting | repeated failures in auth, ingestion, or notification flows trigger review | reduces silent degradation |
| Security anomaly review | suspicious login, abuse, or unusual admin activity can be detected | improves defensive awareness |
| Incident playbooks | there is a basic response path for auth, data, and provider incidents | shortens response confusion |
| Escalation ownership | named owners exist for investigation and decision-making | avoids ambiguity during incidents |

### High-priority incident classes

- unauthorized access or suspected takeover
- accidental exposure of household or financial data
- consent misapplication or post-revocation data use
- large-scale ingestion corruption or replay issues
- misleading AI output that creates trust or compliance risk

## 8. Privacy and data-lifecycle controls

Privacy posture must be visible in product behavior, not only in policy documents.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| Data minimization | only retain data that supports product value, supportability, or compliance needs | reduces privacy and breach risk |
| Access and delete support | user requests for access, deletion, or correction can be supported operationally | prepares for rights-based privacy expectations |
| Retention review | financial and operational data classes have intentional retention decisions | prevents indefinite accumulation |
| Export governance | user data export flows are authenticated, auditable, and bounded | protects a high-risk action |
| Analytics minimization | analytics events avoid unnecessary personal or financial payload detail | reduces shadow-data creation |

### MVP lifecycle rule

The team should not wait for later scale to decide deletion, export, and retention behavior. These controls should exist in basic operational form at launch.

## 9. Third-party and integration risk controls

SubSense AI depends on external providers for AA connectivity, notifications, and AI. Third-party usage should not undermine the platform's trust posture.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| Provider inventory | the team maintains a clear list of critical external providers and their purpose | supports risk review and change control |
| Credential scoping | provider credentials are separated and rotated responsibly | limits cascading compromise |
| Timeout and retry policy | upstream failures do not cause uncontrolled retries or confusing product behavior | improves resilience and cost control |
| Fallback behavior | degraded provider states map to defined product behavior | prevents unsafe automation assumptions |
| Contract awareness | providers used for sensitive data have reviewed usage and retention posture | improves governance maturity |

### Special handling for AI providers

AI integrations should additionally enforce:

- prompt minimization
- exclusion of unnecessary identifiers
- evidence-backed prompting
- timeout and suppression policies
- ability to disable or degrade AI features without breaking core product value

## 10. Secure product and delivery lifecycle

Security is also affected by how the team ships changes.

### Required controls

| Control | MVP expectation | Rationale |
|---|---|---|
| Migration review | schema changes are reviewed and versioned | protects financial-data integrity |
| Environment separation | production and non-production environments are not loosely mixed | reduces accidental exposure |
| Change traceability | key releases and infrastructure changes are attributable | improves incident response |
| Secret rotation path | there is a usable process for replacing compromised credentials | supports operational recovery |
| Pre-release review | sensitive flows receive focused product and engineering review before launch | reduces obvious trust regressions |

### Delivery note

For this product, a fast-moving startup workflow is acceptable only if it still preserves:

- change visibility
- rollback awareness
- ownership clarity
- evidence for security-sensitive decisions

## 11. Compliance alignment model

The MVP does not need to claim more than it can operationally support. It should instead align clearly to the most relevant obligations and principles.

### A. RBI Account Aggregator alignment

The product should be designed to respect:

- explicit consent
- read-only financial-data usage
- purpose limitation
- revocation handling
- downstream storage governance

### B. India privacy posture

The platform should operate with DPDP-aligned thinking, especially around:

- consent clarity
- purpose limitation
- data minimization
- retention discipline
- user rights handling where applicable

### C. GDPR-style future readiness

For future geographic expansion, the architecture should already support:

- data access requests
- deletion workflows
- correction handling
- clear processing-purpose reasoning
- auditable personal-data handling

### D. Product-communication compliance

The product must also avoid trust-damaging claims such as:

- overstating AI certainty
- implying unsupported financial advice
- obscuring affiliate or partner influence
- presenting stale or partial data as current truth

## 12. MVP control checklist by domain

| Domain | Minimum launch-ready control state |
|---|---|
| Authentication | OTP protection, abuse controls, revocation-safe sessions |
| Authorization | explicit permission checks for household, recurring, and support actions |
| Consent | lifecycle modeling, purpose messaging, revocation handling |
| Data protection | encryption in transit and at rest, secret management, protected storage |
| Logging and audit | sensitive actions logged, logs minimized, access restricted |
| Monitoring | provider health, queue health, auth failures, ingestion failures observable |
| Privacy | export, delete, retention, and minimization posture defined |
| Third-party risk | provider inventory, scoped credentials, fallback behavior defined |
| AI safety | prompt minimization, grounding, suppress low-confidence output |

## 13. Deferred but likely next controls

As the product grows, the following controls should likely be added or deepened:

- stronger device and session management views
- formal key-management review
- partner tenant-isolation controls
- deeper vulnerability-management workflows
- structured security training and access review cadences
- more formalized vendor risk review
- penetration testing before larger public scale or enterprise distribution

## Final recommendation

SubSense AI should treat security and compliance controls as part of the product architecture, not as a post-MVP legal layer.

For phase 1, the most important outcome is not perfect enterprise bureaucracy. It is a system where:

- consent is real and explainable
- financial data is protected and minimized
- household privacy boundaries hold
- sensitive actions are auditable
- providers can fail without breaking trust
- AI cannot silently invent product truth

If those controls are present from the first launch, the platform will be much better positioned for premium consumer trust, future partner integrations, and eventual fintech-grade maturity.
