# Decision log

Format: date — decision — reasons — alternatives considered.

## 2026-08-17 — License: MIT
Reasons: simple, permissive, standard for learning/research code.
Alternatives: Apache-2.0 (fine, longer), no license (forbids reuse — bad).

## 2026-08-17 — Repository visibility: private
Reasons: ...
Alternatives: ...

## 2026-08-17 — Merge style: merge commits (not squash)
Reasons: honest history for a learning project; simple mental model.

## 2026-08-17 — Repository visibility: private
Reasons: project involves API keys and config (.env, gitignored) — keeping
the repo private is an extra safety margin even though .gitignore already
excludes secrets from history. Can reconsider going public later once
mature.
Alternatives: Public (rejected for now — no benefit yet, adds risk if
.gitignore is ever misconfigured).

   2026-08-31 — L026 smoke call, model: deepseek-v3.1 (deepinfra pin)
   Estimated: ~$0.0000085 | Actual: $0.00000391
   Surprises: model_fingerprint absent for DeepInfra; reasoning_tokens
   nested under completion_tokens_details rather than flat — llmClient
   extraction corrected to normalize it.

   ## 2026-09-12 — Dataset versioning: v1 files are immutable once a run exists
Reasons: matches run.config's dataset_version; changing scenarios.csv after
a run has used it would silently invalidate that run's results with no
record of what changed. Future edits become scenarios.v2.csv plus a
version bump in the sidecar — v1 stays untouched.
Alternatives: editing v1 in place (rejected — no audit trail, breaks
reproducibility of any run already made against v1).

Failed units retry on the next run. Resume counts only status === 'complete', the failed line stays in the append-only file, and failures are often temporary (rate limits, server errors).
The dispatch loop lives in cli/dispatch.js, not collect.js, because importing collect.js runs its top-level code (reads config, prints the plan).

## L035: collect safety rails
- The spend cap is checked BEFORE dispatch, using a conservative worst-case estimate (every turn at max_output_tokens, history re-sent each turn). It fails closed: an unknown model stops the run. Landing exactly on the cap is allowed (> not >=).
- Spacing is one wait of spacing_ms after each unit that ran, through an injectable sleepFn. It is politeness and rate-limit avoidance, not a cost control.
- A failed unit is appended and the loop continues. Only run-level problems (unknown model, cap, stop request) stop the run.
- Ctrl-C only sets a flag. dispatch checks it between units (shouldStop seam), and the handler lives in collect.js.
- collect.js is a dry run unless --go is passed, so nothing spends money by accident. The first real run is L037.