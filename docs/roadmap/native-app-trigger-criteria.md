# Native App Trigger Criteria

## Purpose

This document defines when SubSense AI should move from a mobile-optimized web MVP to native mobile applications.

The goal is to prevent premature platform expansion and ensure native investment happens only when it is likely to improve retention, acquisition, or user value materially.

## Decision principle

Native apps should be built when they are expected to **compound a validated product**, not when they are being used to compensate for unproven product-market fit.

## Trigger framework

The team should prioritize native app expansion only when at least **2 to 3 trigger categories** below are clearly positive.

| Trigger category | Signal | Why it matters |
|---|---|---|
| Retention intensity | Users are returning often enough that installation convenience matters | Native packaging is more valuable for habitual products than occasional-use tools |
| Notification dependence | Reminders and alerts become a primary driver of repeat engagement | Native apps can improve persistent retention mechanics |
| Channel trust | App-store presence materially improves perceived legitimacy or conversion | Some fintech users trust installed apps more than browser experiences |
| Product capability gap | Roadmap priorities require mobile-device behaviors the web handles poorly | Native should solve real product constraints, not aesthetics alone |
| Economics | Native acquisition or retention improvements justify the added engineering cost | Platform expansion should strengthen unit economics |

## Suggested measurable thresholds

These are decision-support benchmarks, not rigid laws:

| Metric | Suggested threshold for native consideration | Interpretation |
|---|---|---|
| D30 retention of activated users | 35% to 40% or better | Product habit is forming |
| WAU / MAU | 0.45 or higher | Users engage regularly enough for installability to matter |
| Share of sessions on mobile browsers | 70% or higher | Mobile is clearly the dominant usage channel |
| Renewal / alert re-engagement rate | Strong repeat re-entry from reminders and alerts | Retention loops may benefit from native packaging |
| Premium conversion among activated cohorts | Stable upward trend with repeat-use cohorts | Suggests the product has enough depth to justify deeper channel investment |

## Qualitative trigger conditions

Native apps become more compelling when:

- users repeatedly ask for an installable app experience
- onboarding and dashboard usage are already strong on mobile web
- browser limitations materially hurt the reminders or repeat-access experience
- partnerships or trust-sensitive distribution channels favor app-store presence

## Signals that mean “do not build native yet”

- low activation despite responsive web availability
- weak recurring-detection trust
- poor retention not clearly linked to delivery channel
- little evidence that notification or install behavior would change outcomes
- channel expansion being driven mainly by founder preference or competitor parity pressure

## Decision cadence

Review the native expansion decision at:

- end of phase-1 MVP validation
- after at least one meaningful retention cycle
- once alerting, repeat usage, and premium conversion data are available

## Recommended decision output

At the end of the web MVP phase, the team should make one of three decisions:

1. **Proceed with native apps** because the product is validated and native packaging is likely to improve growth or retention.
2. **Delay native apps** because the product still needs stronger retention or clearer value proof.
3. **Stay web-first longer** because mobile web is meeting user needs efficiently.
