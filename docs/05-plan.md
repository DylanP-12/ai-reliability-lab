# 05 — Backlog, Milestones, and the Plan

## Milestones

| # | Milestone | Demo that proves it |
|---|---|---|
| M1 | Project + GitHub repo created | repo online, README, first PR merged |
| M2 | Shared utilities tested | ids/seededRandom/cost tests green |
| M3 | First safe API smoke test | one real call made, key security checklist passed |
| M4 | Scenario parser working | parser + validator + round-trip tests green |
| M5 | Conversation runner working | isolation tests green |
| M6 | Collection CLI resumable | kill/resume drill passed with zero duplicates |
| M7 | Scoring pipeline working | mock + tiny real evals, read-only proof |
| M8 | App data prepared | validator passes on generated app data |
| M9 | React transcript browser working | Transcripts screen renders real data |
| M10 | All screens working | five screens + export all functional |
| M11 | Acceptance tests passing | full acceptance matrix green in CI |
| M12 | Deployed and documented | live URL, v1.0.0 release, docs complete |

## M1 Backlog

## Scope (out of bounds for now)

- User accounts / login — enhancement backlog, below M12, only if handoff-compatible
- Real-time collaborative editing of scenarios — enhancement backlog
- Multi-language support in the app UI — enhancement backlog
- (carry forward the 3 out-of-scope items already logged in 03-requirements.md)

## Risks

| Risk | Mitigation |
|---|---|
| Cost overrun | `cost.js` (L022) enforces a spend cap before any real API run |
| Provider/model changes | pin exact model versions in config; log them with every API call (provenance, L024) |
| Research-data contamination | append-only JSONL + frozen files (never edited after write) + isolation tests (L032) |
| Rubric validity | rubric is versioned (L038), judges are blind to worker identity, human review step exists |
| Domain risk (mental-health-adjacent content) | stated exit/pause option while authoring/reviewing scenarios; AI-judge/human disagreement gets flagged, not silently trusted |

# Decision Log

## D001 — Use T-shirt sizing (S/M/L) instead of hour estimates
- Date: 2026-08-11
- Context: beginners consistently misjudge hours; false precision creates false confidence
- Options considered: hour estimates, story points, T-shirt sizes
- Choice: T-shirt sizes (S/M/L)
- Reason: relative sizing is more honest early on, when there's no track record yet
- Consequences: milestone table (not hour totals) is the real progress tracker
- Revisit when: a real velocity history exists across several milestones

Decision: Use T-shirt sizes (S/M/L) for backlog estimates, not hours
Date: 2026-08-11
Context: Backlog tasks need some sense of size for planning, but hour estimates from a beginner are unreliable.
Options considered: Hour estimates; T-shirt sizes (S/M/L); no estimates at all
Choice: T-shirt sizes
Reason: Beginners are consistently bad at estimating hours; relative sizing (S/M/L) is more honest and still useful for spotting oversized tasks.
Consequences: Tasks sized "L" are a signal to split them before starting.
Revisit-when: If backlog tasks start slipping badly despite reasonable S/M/L sizing.