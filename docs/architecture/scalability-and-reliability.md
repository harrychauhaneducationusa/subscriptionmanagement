# Scalability and Reliability

## Purpose

This document defines **scalability** and **reliability** expectations for SubSense AI’s implementation: how the system should behave under growth, how it stays available and trustworthy, and how today’s modest footprint (~order of **1,000 active users**) can evolve toward **horizontal scale** and much larger cohorts without a rewrite.

It complements:

- `solution-architecture.md` — target stack and modular monolith direction
- `security-and-compliance-controls.md` — trust, privacy, and control framing
- `integration-landscape.md` — external boundaries and failure modes

It is **not** a capacity guarantee or a runbook. It is the **architectural contract** engineering and operations should follow when sizing services, choosing defaults, and prioritizing hardening work.

---

## Design principles

1. **Stateless API tier**  
   Any number of identical API processes should serve traffic behind a load balancer. Long-lived user state belongs in **PostgreSQL** and **Redis**, not in process memory (except short-lived request scope).

2. **Async work off the request path**  
   Ingestion, normalization, recurring detection, and notification dispatch should remain **queue-driven** so spikes do not tie up HTTP threads or overload the database synchronously.

3. **Defense in depth**  
   Reliability and abuse resistance combine **edge controls** (TLS, WAF, optional CDN rate limits), **application controls** (Redis-backed rate limits, auth/session policies), and **data-tier discipline** (pooling, indexes, backpressure).

4. **Explicit degradation**  
   When Redis or a provider is unavailable, behavior should be **predictable** (queue inline fallback where implemented, read-only modes, or clear errors)—not silent data corruption.

5. **Observable by default**  
   Health checks, structured logs, and metrics exist to support **SLO-minded** operations and incident response. See `security-and-compliance-controls.md` for monitoring and incident alignment.

---

## Current implementation snapshot (codebase)

The repository today aligns with a **modular monolith**:

| Component | Role |
|-----------|------|
| **Express API** (`backend`) | HTTP `/v1/*` routes, Zod validation, sessions, domain modules |
| **Worker process** (`backend` worker entry) | BullMQ consumers: aggregation lifecycle, transaction ingest/normalize, recurring detection, notification dispatch |
| **PostgreSQL** | System of record (users, sessions, households, transactions, insights, notifications, audit, analytics events, etc.) |
| **Redis** | BullMQ queues; suitable extension point for **rate limiting** and **session cache** |
| **Frontend** (Vite + React) | SPA calling the API; no server-side session in the browser beyond stored session token |

**Scaling caveat:** the API uses a **single shared `pg` pool** per process with a bounded `max` connection count. As replica count grows, **total** DB connections = `max × replicas` unless a pooler is used—see Data tier below.

---

## Scalability

### Horizontal scale model

| Tier | Scale mechanism | Notes |
|------|-----------------|-------|
| **API** | Add identical replicas behind a load balancer | Requires no sticky sessions if auth is header-based (`Authorization: Bearer …`) and shared session store |
| **Workers** | Add worker replicas consuming the same BullMQ queues | Job handlers must be **idempotent** and safe under concurrent consumers |
| **Redis** | Scale Redis for memory/ops (managed Redis, clustering as needed) | Queue throughput and rate-limit counters depend on Redis availability |
| **PostgreSQL** | Vertical scale first; then **read replicas** / **partitioning** for hot paths | Fintech reporting and large transaction history benefit from read path separation later |

### Near-term capacity stance (~1,000 users)

For early production and demos:

- Run **at least two API replicas** in non-production (or staging) to prove **no singleton assumptions**.
- Keep **worker count** modest (1–2 replicas) unless queue depth or latency requires more.
- Tune **`pg` pool `max` per replica** from environment (small per instance; avoid exhausting Postgres `max_connections`).
- Prefer **PgBouncer** (or equivalent) in **transaction pooling** mode before multiplying API replicas in production—industry standard for many small connections from many Node processes.

### Rate limiting and abuse resistance (architecture requirement)

Rate limiting is a **scalability and security** control. It should be implemented in layers:

| Layer | Responsibility |
|-------|----------------|
| **Edge** (WAF / CDN / gateway) | Broad IP throttles, bot mitigation, DDoS absorption |
| **Application** (Express + Redis) | Per-route and per-identity limits (e.g. OTP request/verify, public webhooks, expensive aggregation triggers) |
| **Workers** | Concurrency caps and **retry backoff** so downstream systems are not hammered |

Public and sensitive routes (including **provider callbacks**) must have **authentication or shared-secret verification**, **idempotency**, and **strict** rate limits as described in `security-and-compliance-controls.md` and `integration-landscape.md`.

### Session and read path at scale

| Pattern | When |
|---------|------|
| **DB session lookup every request** | Acceptable at small scale; simple and correct |
| **Redis session cache** (TTL, invalidate on logout/password change) | Recommended before large replica counts or high RPS to cut DB read load and latency |
| **Short-lived tokens** (if JWT introduced later) | Requires rotation, revocation strategy, and careful XSS posture |

### Data tier and hot paths

- **Indexes and query budgets**: recurring, transaction, and insight queries must stay within agreed **p95 latency** budgets as data grows.
- **Archival / retention**: raw and normalized transaction volumes grow indefinitely; define **retention classes** and archival strategy (product + legal), not only disk growth.
- **Partitioning** (time or household shards) is a **later** lever for very large transaction tables—not required for the first thousand users if indexing is sound.

### Frontend and static assets

- Serve the SPA and static assets through a **CDN** in production for latency and offload.
- API remains on the **API origin** with strict CORS.

---

## Reliability

### Service-level expectations

| Concern | Architectural expectation |
|---------|---------------------------|
| **Availability** | API and worker processes are independently deployable; failure of workers should not take down read-only API paths where acceptable |
| **Health** | Liveness/readiness distinguish “process up” from “can reach Postgres and Redis” |
| **Queues** | Jobs are **retryable** with limits; poison messages surface via metrics/alerts; completed job retention policies avoid unbounded Redis growth |
| **Deploys** | Rolling deploys across replicas; **backward-compatible** migrations when traffic is continuous |
| **Backups** | Postgres **automated backups** and tested restore (RPO/RTO owned by operations; architecture assumes restore is possible) |
| **Secrets** | No secrets in logs; rotation path for DB, Redis, and provider keys |

### Idempotency and consistency

- **Webhooks / callbacks**: store idempotency keys or natural keys so duplicate delivery does not double-apply financial effects.
- **Job processors**: assume **at-least-once** delivery; handlers must tolerate duplicates.
- **User-visible writes**: use clear transactional boundaries for money-adjacent state (consent, link status, transaction inserts).

### Observability and operations

- **Structured logs** (correlation / request id) across API and workers.
- **Metrics**: HTTP volume, error rates, queue depth, job failures, DB pool saturation, Redis latency.
- **Tracing** (optional phase): distributed trace from API enqueue to worker completion for hard-to-debug pipelines.

### Disaster and dependency failure

| Dependency fails | Expected posture |
|------------------|------------------|
| **Redis down** | Queues may not enqueue; product should surface **degraded** status; optional inline processing only where explicitly designed |
| **Postgres down** | API returns **5xx** with health failing; no partial writes that violate invariants |
| **Worker stalled** | Queue depth alerts; ability to scale workers or drain queues after fix |

---

## SLO and capacity targets (starter)

The numbers below are **architectural starter targets** for early production on Railway (or equivalent): they guide sizing, alerting, and backlog prioritization. They are **not** a customer-facing SLA unless explicitly agreed with stakeholders and legal. **Revise after** you have measured p50/p95/p99 from production traffic.

### Availability and errors

| Target | Starter value | Notes |
|--------|---------------|--------|
| **API monthly availability** | **99.5%** (excluding announced maintenance) | MVP-appropriate; tighten toward **99.9%** as revenue and regulatory exposure grow |
| **HTTP 5xx rate** (steady state) | **below 0.1%** of requests excluding load tests | Alert on sustained elevation; exclude client-induced overload if measured separately |
| **Worker process** | Running or restartable within **minutes** | Liveness restarts; alert if worker absent while queue depth grows |

### Latency (API, authenticated “typical” paths)

| Class | p95 target (starter) | Examples |
|-------|----------------------|----------|
| **Light read** | **≤ 400 ms** | session resolve, single-entity fetch, health with dependencies warm |
| **Standard read / aggregate** | **≤ 900 ms** | dashboard summary, list views with modest joins |
| **Write / orchestration** | **≤ 2 s** | consent create, mutation that enqueues follow-on work |

**p99** should not be ignored: investigate tail latency **more than triple p95** as a default rule of thumb.

### Async pipeline (queues)

| Target | Starter value | Notes |
|--------|---------------|--------|
| **Time from enqueue to completion** (normal load) | **≤ 5 min p95** for full ingest → normalize → detect path | Tune per job type once metrics exist; alert on sustained backlog |
| **Queue depth** | Alert if **waiting jobs exceed a baseline threshold** for **more than 10 minutes** | Threshold set from baseline (e.g. hundreds of jobs, not thousands stuck) |

### Data protection (backup and restore)

| Target | Starter value | Notes |
|--------|---------------|--------|
| **RPO (Postgres)** | **≤ 24 hours** unless managed **PITR** is enabled | Align with Railway (or host) backup window; **tighten RPO** when financial reconciliation requires it |
| **RTO (restore drill)** | **≤ 4 hours** to a verified read-write instance | Run a **restore test** at least quarterly; document actual minutes and close gaps |

### Early-scale footprint (~1,000 active users)

| Dimension | Starter stance |
|-----------|----------------|
| **API replicas (production)** | **2** minimum for HA; **1** acceptable only for non-HA demos with eyes open |
| **Worker replicas** | **1–2**; scale when queue wait or CPU sustained high |
| **Postgres** | Single primary; **PgBouncer** before large replica fan-out |
| **Redis** | Sized for queue + future rate limits; monitor **memory** and **eviction** (should not evict queue data unexpectedly—use correct Redis policy for BullMQ) |

---

## Railway and multi-service layout

The recommended deployment shape (see `solution-architecture.md`) remains:

- **Service A — API**: `npm run build` then start compiled API (or `node dist/index.js`).
- **Service B — Worker**: same image or artifact, different start command (`node dist/worker.js` or equivalent).
- **Managed Postgres** and **managed Redis** attached to both.

Horizontal scale on Railway (or any host) is then: **increase replica count** for API and/or Worker services, subject to **Postgres connection limits** and **Redis** sizing.

---

## Maturity roadmap (architecture checkpoints)

Use this as a **gated** checklist—not all at once.

| Phase | Focus |
|-------|--------|
| **Now (MVP / first ~1k users)** | Two API replicas in staging; Redis-backed **rate limits** on auth and callbacks; env-tuned DB pool; health/readiness; backups |
| **Growth** | PgBouncer; Redis session cache; worker autoscaling on queue depth; Sentry or equivalent; stricter CSP in production |
| **Scale** | Read replicas for analytics; table partitioning strategy; optional split of read-heavy services; edge WAF as default |

---

## Related documents

- `solution-architecture.md` — stack and modular monolith
- `security-and-compliance-controls.md` — security controls including brute-force and monitoring
- `integration-landscape.md` — provider boundaries and retries
- `data-model-overview.md` — entities that drive scaling hotspots

---

## Summary

SubSense AI’s **modular monolith + Postgres + Redis + BullMQ** architecture is **appropriate** for early scale and can grow **horizontally** if the API remains stateless, workers stay idempotent, the database tier uses **pooling discipline** (and eventually PgBouncer), and **rate limiting / edge protections** are treated as first-class. This document is the **reliability and scalability contract**; implementation should converge on it as traffic and regulatory expectations grow.
