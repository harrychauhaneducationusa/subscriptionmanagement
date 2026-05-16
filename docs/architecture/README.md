# Architecture Docs

This section is for business-facing and solution architecture documentation.

## Current source

The current architecture overview lives inside `../../BRD.md`, including:

- platform structure
- mobile-optimized web MVP delivery model
- recurring detection engine concepts
- AI orchestration approach
- bank aggregation model
- security and compliance framing

## Current documents

- `solution-architecture.md` - target architecture recommendation for SubSense AI
- `frontend-delivery-strategy.md` - frontend and channel strategy for the web-first MVP
- `data-model-overview.md` - high-level fintech domain and entity model
- `integration-landscape.md` - external system boundaries, provider responsibilities, and fallback design
- `multi-market-aggregation.md` - India (Setu AA) and US (Plaid) provider isolation, shared ingestion pipeline, env model
- `security-and-compliance-controls.md` - launch-ready control framework for trust, privacy, consent, and auditability
- `scalability-and-reliability.md` - horizontal scale, capacity discipline, rate limiting, and operational reliability expectations
- `ai-governance.md` - rules and guardrails for grounded, safe, evidence-backed AI usage
- `platform-evolution-implementation-plan.md` - phased engineering plan (scheduled sync, webhooks, snapshots, events, AI layer) with **test regression matrix**

**Implemented in code (incremental):** migration `000011_link_sync_schedule` introduces the `link_sync_schedule` table (per `institution_links` row: tier, effective interval, `next_run_at`). Successful `link.ingest` jobs bump `next_run_at` via `backend/src/modules/sync/linkSyncSchedule.store.ts` so a future scheduler can enqueue delta syncs without new product logic in the ingest path. Until migrations are applied, the bump is skipped with a warning (safe for older databases).

## Purpose

Use this folder for documents that translate product strategy into:

- system boundaries
- service responsibilities
- integration dependencies
- data flow expectations
- trust, security, and compliance design
- scalability, reliability, and growth-stage operational expectations
