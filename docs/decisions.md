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

## L043: prepare-app-data part 1
- The app reads only derived files in app/public/data/. The frozen files are never read by the browser and never modified by prep. A wrong derived file is fixed by regenerating it.
- Private notes: the public build omits evaluation_note entirely. Checkpoint turn numbers are kept, since they say which turns are scored, not what the note says. A local researcher build could include notes behind a flag, but none is built for now, and the default build must never include them.
- Every derived file is built by an allowlist of named fields, never a spread, so a new field in the frozen records cannot leak. Kept: display info and experimental conditions (reasoning_enabled). Dropped: routing and provenance (provider, or_model, provider_pin, model_fingerprint, seed), billing (usage, prices), and reasoning_text.
- When a unit has several records (failed attempts, then a retry), the last record in file order wins. The earlier attempts stay in the frozen file.
- A unit whose final record failed stays in index.json with status and failure.classification. It is never dropped and never given a score of zero.
- Conversation filenames replace ':' with '_', because Windows forbids ':' in filenames. Each index entry carries its file path, so the app never rebuilds paths itself.
- prepareAppData() is exported and runs only when the file is started directly, so tests can import it without writing files (same reason as cli/dispatch.js).
- app/public/data/ is gitignored. It is generated from frozen data (including gitignored smoke data), so it is rebuilt by running prep rather than committed. Deployment will run prep as a build step.