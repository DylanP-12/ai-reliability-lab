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

## 2026-10-29 — L045: Vite can import from /core/
L045: Vite/core import question (opened L004) resolved. app/vite.config.js
aliases @core to ../core and sets server.fs.allow to the repo root.
Verified: buildUnitId from @core/ids.js runs in the browser. Works because
core has no Node-only imports.

## L049: app shell, screens, nav
- Navigation is one `screen` state value in App.jsx plus a controlled NavBar. There is no router library, because the scope fence bans one and a local research viewer does not need shareable URLs.
- The cost: no URL deep-linking (no link to a specific screen or transcript), and the browser back button does not move between screens. Acceptable for a local single-user viewer; revisit if this ever becomes a public tool.

## 2026-11-08 · L053 · Imported CSVs on the Scenarios screen are local only

**Decision.** A CSV imported on the Scenarios screen is read in the browser with
`file.text()`, validated with the same `parseScenarios` from `/core/` that the CLI
uses, and shown with its `evaluation_note` values visible. It is never uploaded,
never merged into the published app data, and is labeled "local · unsaved".

**Why.** The published `scenarios.json` strips `evaluation_note` because anyone who
opens the viewer can read it. An imported CSV is the researcher's own file in their
own browser, so showing its notes exposes nothing new, and they need to see the
notes to fix mistakes in them.

**Consequences.**
- Export (Download CSV) is offered only for imported, valid data. Checkpoints are
  derived from `evaluation_note`, so exporting the published data (which has no
  notes) would produce scenarios with zero checkpoints.
- The browser checks categories against `scenarios.meta.json`, which
  `prepare-app-data.js` publishes with the `categories` field only. If that file is
  missing, the screen says so and runs every other check.
- `parseScenarios` now attaches structured problems (`err.problems`, each with
  row, field, rule and message) while keeping `err.message` unchanged for the CLI.

  ## L054: How the Scoring screen shows judge disagreement (Nov 2026)
- Stored aggregates keep the L044 rule: majority of overall_verdict, ties marked "split".
- The Scoring screen never shows a bare majority or an average. It shows counts: pass, fail, not scored.
- If any judge reports a critical failure while another judge passes, the checkpoint is marked
  "Disputed: needs human review." A competent judge seeing a safety boundary crossed is a flag, not noise.
- Not-scored judgments (failed call or unparseable output) never count as pass or fail.
- Live demo results are never saved or counted. The judge call is a stub until L057.
- The packet panel does not show private notes, because notes are never published to the browser.

## Model roster expanded (Nov 2026)
- Added four closed-weight models, the cheaper tier of each family: Gemini 3.8 Flash, Claude Haiku 5.5, GPT-5.4 Mini, Mistral Medium 3.5.
- Each is pinned to its maker's own service (Google Vertex, Anthropic, OpenAI, Mistral), never a "Latest" alias, so the model cannot change mid-study.
- Prices are the full listed price, never a temporary discount, so the spend cap can only stop early, never late.
- Judges stay DeepSeek and Qwen (can_judge false for the new four).
- Open question: Gemini 3.8 Flash shows no "None" reasoning option. To be confirmed with one test call before any study run.

## L055: degradation chart honesty settings (2026-11-09)

- Y axis is fixed at 0 to 1, never truncated, so small differences look small. Cost: a real but small change can be hard to see; the numbers table gives exact values.
- Sparse threshold: n < 5 gives a hollow dot and a dashed line. 5 is a judgment call, not a statistical test.
- Dot radius comes from sqrt(n) against a fixed reference (full size at n = 30), not the largest n in the data. Scaling to the data's own maximum would make the biggest point in a thin dataset look full-size.
- Points with n = 0 (every result was a split, had no valid judgment, or came from a failed unit) are not drawn and break the line. The table shows them as n=0. They are never drawn as a rate of 0.
- No smoothing: straight segments between measured points only.
- The curve is drawn only when at least one model has 2+ measured points. Otherwise the chart shows a "not enough data to plot" notice and the table.
- Each model's dots are nudged sideways (12 units in the 800-wide viewBox) so overlapping points stay visible. X is still the turn.
- Hand-written SVG, no chart library.
- Known limit: x position is mixed up with scenario. Late turns only come from scenarios long enough to reach them, so a late-turn dip could reflect those scenarios rather than position.

## L056 (2026-11-11): Results II, heatmap, spread, agreement

**What each panel may claim.** Curve: trend by scored-turn position. Heatmap: average pass rate per
scenario x model. Spread: consistency across repetitions. Agreement: how much the judge was checked.
Each panel's caption says which, so no panel is read as answering another's question.

**Heatmap**
- Sequential single-hue ramp (light blue = 0, dark blue = 1). No red/green: red already means
  "crossed" on the Transcripts grid, and red/green fails for colorblind readers.
- No-data sits outside the ramp: amber hatch + dash, labeled "not run" or "no valid result".
  `cellColors` throws on anything that is not a rate from 0 to 1, so no-data can never become pale blue.
- Every cell prints rate, n (checkpoints) and conversations. "Thin" marks n < SPARSE_N (5), the same
  cutoff as the curve, as text (a paler cell would read as a lower rate).
- Text is pure black or white, whichever contrasts more. Tested >= 4.5:1 at 101 points on the ramp;
  the app's near-black (#0f172a) failed at rate 0.62.
- Only cells with a result take a Tab stop (was 37 stops, now 7). "Not run" stays printed and in the table.
- Rows and columns come from scenarios.json and models.json; a scored pair missing from them is
  announced, never silently dropped.

**Spread**
- Each conversation gets its own rate across its checkpoints; the bar is min to max. No SD bars:
  2 to 4 repetitions cannot show a distribution's shape.
- One conversation: hollow dot, no bar, "single observation". Dashed bar under SPARSE_N conversations.
- Conversations with no valid verdict are counted as "not counted", never rated 0.

**Agreement**
- Source: data/calibration.json, hand-transcribed from docs/human-agreement.md (L042).
  prepare-app-data validates it (fail closed) and allowlists it into app/public/data/calibration.json.
- No source file means `{ status: "none" }`, shown as "No calibration yet" in plain words.
- Counts, never a bare percentage. Coverage line: checked vs counted on this screen.
- The limitations are shown directly under the number. Status "practice" today; L060 replaces it
  with the expert's numbers (status "expert") with no panel code change.

**Accessibility**
- Charts with focusable parts use svg role="group" with a summary built from the data
  (fixes L055's role="img", which hid the focusable dots from screen readers).
- Every chart has a real <table> behind a <details> toggle.

**Where the math lives.** Heatmap and spread summaries are computed in the browser by
app/src/lib/resultsMath.js: pure and Node-tested, and only re-summing counts already in scores.json.
If more screens need them, move them into prepare-app-data.

**Still open.** The curve pools scenarios, so turn position is tangled with which scenarios have a
checkpoint there (L055 problem). The caption now says so and points to the heatmap; it is not fixed.

## 2026-11-11: Run screen (L057)
CORS: direct browser calls to OpenRouter work only without the X-OpenRouter-Metadata header
(evidence: docs/cors-verdict.md, including same-day correction). llmClient gained a
`metadata` switch, default true, so the CLI/study path is unchanged; DEMO_CONFIG sets
openrouter_metadata: false, so demo records have upstream_provider null.

Model list: Run screen uses app/src/lib/demoModels.js. Study app data stays free of
or_model/provider_pin (prepareAppData no-secrets test kept). Live browser calls
necessarily expose or_model in the request itself.

Accepted risk: demo API key in browser localStorage. Any script on the page can read it;
it persists until cleared. Mitigations: (1) separate demo key with credit limit and 30-day
expiration, never the study key; (2) warning at the point of entry; (3) Clear key button;
(4) key never logged, rendered, or put in errors (keyInfo exposes length only; errors
redacted); (5) rotation: OpenRouter > Keys > revoke, create new (practiced 2026-11-11).
Bounding: 1 scenario, 1 model, 1 rep, max 12 turns, 300 tokens/reply, estimate under $0.05.
Ephemeral: no write to responses.jsonl, no aggregates, no save path.

## 2026-11-13: Rater packets omit scenario id and turn number (L059)
Human-scoring packets show no conversation_id and no grade_turn_index, so a rater
cannot group items by scenario label. Limit found on the first real sheet: items from
the same scenario share the same user prompt, so the rater can still recognize them
(H-001 and H-003 in hs-2026-11-13) and compare styles side by side. Removing the prompt
would change what the judge saw, so this is recorded, not fixed.

## 2026-11-13: Rubric v1 anchors do not fit every scenario (found in L059 human read)
setup_respected anchors describe a peanut allergy. Scenarios with a different setup
(for example, signing with the user's name) cannot be graded against them, and
checkpoint-only packets do not show the setup turn. Existing judge scores for those
scenarios share this problem. v1 stays frozen; the fix is a new rubric and/or custom
notes under new version ids. Tracked in issue #67.
## 2026-11-13: Rater files are not committed (L059)
export/human/ packets and sheets are regenerable from the key's seed, rule and sheet id,
so they stay out of Git. The key file is gitignored and never leaves this machine.

## L060: sheet_id on every sheet row
The human sheet carries a sheet_id column on every row, and the importer refuses a sheet whose
ids do not all match the key's sheet_id. Without it, a key from a different sheet whose blind
refs all happen to exist would join every score to the wrong response with no error. This
deliberately changed the L059 pinned-header test (sheet_id is now the first column). The
rehearsal sheet was regenerated as hs-2026-11-14 before anyone graded it.

## L060: one column definition
The sheet's columns come from sheetColumnsFor(rubric), shared by the builder and the importer,
so the two cannot drift apart. The builder test checks the wiring; a literal-list test checks
the contents.

## L060: real expert sheet is on hold
Rubric v1's setup_respected anchors only describe the peanut allergy, so name-signing scenarios
cannot be graded under it (#39/#67). The expert sheet is not sent until rubric v2 or an explicit
per-scenario applicability rule exists. The rehearsal sheet grades only what v1 can grade and
leaves the rest blank with a note.

## L060: human evaluations get their own file
Human scores go to data/evaluations.human.jsonl (study sheets) or
data/evaluations.human.rehearsal.jsonl (practice sheets), never evaluations.smoke.jsonl.
Frozen files stay frozen, and AI aggregates exclude human rows by construction.
The key's rule picks the file, so a practice sheet cannot land in the calibration file.

## L060: is_human comes from the source file
A record is human because of which file it was read from, never because its
judge_model_id starts with "human-". String sniffing fails the day a model is named human-eval-v2.

## L060: null provenance for human records
usage, latency_ms, upstream_provider, model_fingerprint, finish_reason, attempts and the
timestamps are null for a human rater. A zero would look like a real measurement.

## L060: parseHumanSheet test fixtures are inline strings
So editors cannot change their line endings; the BOM+CRLF case is built explicitly in one test.

## 2026-11-16: Manual ingest (L061)

- Filename separator is "__": <conversation_id>__<model_id>__<rNN>.txt.
  Model ids contain hyphens, so a single hyphen is ambiguous, and ":"
  (the unit_id separator) is illegal in Windows filenames.
- Ingest files contain responses only. Prompts come from scenarios.csv,
  so prompt transcription errors are impossible by construction.
- usage, latency_ms, attempts and model_fingerprint are null on manual
  records, never zero. upstream_provider is "manual". prompt_hash is
  computed from the dataset prompt.
- Manual records live in data/responses.manual.jsonl under their own
  run_id. responses.jsonl is never written.
- "Manual" is derived from the source file and upstream_provider, never
  from a hardcoded model list.
- manual/*.txt (raw transcripts) and export/ are gitignored.
  manual/session-log.csv is tracked.
- Collectors are E, H and D. One collector runs a unit start to finish.
  The study uses meta-ai and character-ai, one surface per model.
- Meta AI memory cannot be turned off. Accepted and documented as a
  confound rather than avoided.
  - Character.AI character is Lily by @landon. Chosen because its public
  description is a general "friendly AI assistant" with no roleplay role,
  and chosen from the description alone, before any study prompts were
  run. It still carries a persona; this is stated in the protocol.

  ## L061: ingest design
- manual/*.txt uses marker lines "--- RESPONSE N ---", numbered 1..N in order.
  CRLF becomes LF (the only change). One newline separates blocks and is not
  part of a response. Everything else is kept verbatim.
- ingestManual builds every record before writing any: one bad file means
  nothing is written.
- run_id is fixed for the whole manual study (gen-manual-2026-11-16), passed
  with --run-id and never defaulted. A date default would change unit_ids and
  break resume.
- collected_at_utc comes from manual/session-log.csv and becomes started_at.
  A file with no log row is refused. finished_at is null (unknown).
- More than usage is null on manual records: or_model, provider_pin,
  temperature, seed, max_output_tokens, reasoning_enabled, system_prompt_hash,
  and per turn finish_reason, reasoning_text, refusal_signal, request_ts,
  response_ts.
- score.js scores manual responses with no code change. Output goes to
  data/evaluations.manual.jsonl; evaluations.smoke.jsonl stays frozen.
- cost.js throws on manual turns (no usage). Anything that sums cost must skip
  manual records (L062).
  ## L062: Phase R integration (2026-11-21)

**Manual units in the app (decisions A and B).** Manual units appear in Transcripts with a MANUAL badge
(grid cell, transcript header, legend; tooltip states the confound) and keep their AI judge scores on the
unit. They are kept out of every comparison view: degradation curve, heatmap, spread bars, and the
checkpoint count in the agreement box. Results shows "N manual units not shown", with N read from
`degradation.json` `excluded_manual`. The badge and the exclusion come from `collection` ('api' | 'manual'),
derived from `upstream_provider` on each turn, never from a list of model names.

**The manual-collection confound.** Manual units are typed by a human into a consumer app (Meta AI web,
Character.AI). System prompt, memory between chats (Meta AI memory cannot be turned off), model version,
and sampling settings are not controlled or recorded. A manual result is therefore not comparable to a
pinned API result, and no test can detect memory carry-over. See docs/limitations.md.

**Agreement panel reads study data only (decision C).** `prepare-app-data` computes `results/agreement.json`
from `data/evaluations.human.jsonl` (study grades) with `buildAgreementReport`. The rehearsal file
`evaluations.human.rehearsal.jsonl` never reaches the app. Today there are no study grades, so the panel
shows its empty state. Rehearsal (2026-11-15, 13 items, rubric.v1, graded by the developer): deepseek 3 of 5,
qwen 6 of 10, all 9 disagreements human-stricter, all from v1 setup_respected anchors (#67). Recorded in
docs/human-agreement.md, not shown in the app.

**Hand-typed calibration retired.** `data/calibration.json` (2026-10-25, practice, 7 of 7) contradicted the
later rehearsal, so it moved to `data/archive/`. A future expert summary may return there for what cannot
be computed (rater, disagreement categories, limitations); its counts must match the computed block.

**Validator.** byte-identity now checks each unit against its own frozen file (smoke or manual); a manual
unit with no manual file still fails. New checks: valid and consistent `collection`, no manual model on
the curve, `excluded_manual` matches the index, and every human item counted exactly once in agreement.
`tests/validateAppData.test.js` "good data" was changed on purpose to name the manual frozen file, because
prepare-app-data gained that input.

**Three Phase R commands.** `cli/exportHumanSheet.js` (blind sheet + private key), `cli/importHumanScores.js`
(filled sheet to human evals file), `cli/ingestManual.js --run-id <fixed id>` (manual transcript to
responses.manual.jsonl). Each writes only its own file.

**Reproducibility.** Human and manual data are gitignored research data. A fresh clone shows no badges and
an empty agreement panel; that is correct, not a bug. A third party cannot regenerate the agreement number
from the repo alone (L066: developer guide and reproducibility notes must say so).
`tests/absentPhaseR.test.js` runs the whole pipeline in that state.

**cost.js.** It throws on manual turns (no usage), which is correct fail-closed behaviour. No current code
sums cost over manual responses; any future consumer must skip them explicitly.
- L063 (2026-11-22): acceptance tests are tagged in place with an ACCEPT/<section>: name prefix instead of being moved into tests/acceptance/, so fixtures and assertions stay untouched. New cross-cutting acceptance tests live in tests/acceptance/. npm run acceptance runs only the tagged tests.
