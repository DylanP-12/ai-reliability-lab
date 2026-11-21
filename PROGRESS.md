# PROGRESS — AI Reliability Lab

Copy this file into your project repository as `PROGRESS.md` during Lesson 9.
Check items off as you go. At each milestone, paste the evidence link (PR, tag,
or test output).

Lesson numbering follows the 66-lesson guide (updated 08/19/26): Phase R
(L059–L062) sits before Phase Q (L063–L066). Milestones: M11 = Phase R,
M12 = acceptance tests, M13 = deployed and documented.

## End-of-lesson record (copy this at the end of every lesson chat)

```text
Lesson:
Completed: yes / partially (resume point: ...)
Concepts I can explain:
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1–5:
What I need help with:
Next lesson:
```

## Lessons

Phase A — Understand the idea
- [x] L001 The research question and the system — date: ___ conf: _/5
- [x] L002 Reading a technical design — date: ___ conf: _/5
- [x] L003 Requirements: functional vs nonfunctional — date: ___ conf: _/5
- [x] L004 Architecture on paper — date: ___ conf: _/5
- [x] L005 Backlog, milestones, and the plan — date: ___ conf: _/5

Phase B — Development environment
- [x] L006 Editor, terminal, Node.js — date: ___ conf: _/5
- [x] L007 Project folder, package.json, ES modules — date: ___ conf: _/5
- [x] L008 Secrets, .env, .gitignore — date: ___ conf: _/5

Phase C — Git & GitHub
- [x] L009 Git: init, status, add, commit — date: 2026-08-17 conf: 3/5
- [x] L010 GitHub: remote, push, README — date: 2026-08-17 conf: 2/5
- [x] L011 Branches, merges, pull requests — date: 2026-08-17 conf: 2/5
- [x] L012 Issues, milestones, labels + Review 1 — date: 2026-08-17 conf: 3/5

  **M1 complete** — repo: https://github.com/DylanP-12/ai-reliability-lab
   Evidence: issues #2, #3, #4 (closed)

Phase D — JavaScript foundations
- [x] L013 Modern JS: data and destructuring — date: ___ conf: _/5
- [x] L014 Functions, purity, modules, scope — date: ___ conf: _/5
- [x] L015 Data formats: JSON, JSONL, CSV — date: ___ conf: _/5
- [x] L016 Async JS, fetch, HTTP — date: ___ conf: _/5
- [x] L017 Errors and unit testing — date: ___ conf: _/5

Phase E — Repository scaffold
- [x] L018 Scaffold the real repository — date: 2026-08-22 conf: _/5
- [x] L019 Architecture rules as code — date: ___ conf: _/5

Phase F — Deterministic utilities
- [x] L020 core/ids.js — date: ___ conf: _/5
- [x] L021 core/seededRandom.js — date: ___ conf: _/5
- [x] L022 core/cost.js + Review 2 — date: 2026-08-27 conf: 3.5/5

Phase G — LLM client
- [x] L023 Anatomy of an LLM API call — date: ___ conf: _/5
- [x] L024 llmClient.js part 1 — date: ___ conf: _/5
- [x] L025 llmClient.js part 2 — date: ___ conf: 3/5
- [x] L026 First real API call — date: 2026-08-31 conf: _/5

  **M3 complete** — PR: `cli/smoke-call` merged into `main` @ f41db95
   Evidence: one real chatCompletion call to deepseek-v3.1 (deepinfra pin);
   all provenance fields validated (upstream_provider: "DeepInfra",
   finish_reason: "stop", attempts: 1); estimated cost ~$0.0000085 vs
   actual $0.00000391; reasoning_tokens nested-extraction bug found via
   real payload and fixed with new test coverage (62/62 tests green,
   purity check clean); docs/api-notes.md reconciled with dated
   CONFIRMED/CORRECTED rows; M3 milestone closed on GitHub (2/2 issues)

Phase H — Scenario CSV
- [x] L027 Parsing scenarios.csv — date: ___ conf: _/5
- [x] L028 Validating scenarios — date: ___ conf: _/5
- [x] L029 Round-trips and the sample dataset — date: ___ conf: 4/5

Phase I — Conversation runner
- [x] L030 Conversation history on paper — date: ___ conf: _/5
- [x] L031 Build runConversation.js — date: ___ conf: _/5
- [x] L032 History-isolation tests + Review 3 — date: ___ conf: _/5

Phase J — Batch collection
- [x] L033 collect.js part 1: units and scheduling — date: 2026-10-10 conf: 3/5
- [x] L034 collect.js part 2 — date: ___ conf: _/5
- [x] L035 collect.js part 3 — date: ___ conf: _/5
- [x] L036 Kill it and resume it + Review 4 — date: ___ conf: _/5

Phase K — Smoke run
- [x] L037 The smoke run — date: ___ conf: _/5

Phase L — Blinded scoring
- [x] L038 Rubrics — date: ___ conf: _/5
- [x] L039 buildJudgePacket.js — date: ___ conf: _/5
- [x] L040 parseJudge.js — date: ___ conf: _/5
- [x] L041 cli/score.js — date: ___ conf: _/5
- [x] L042 Mock → real judge + Review 5 — date: ___ conf: _/5

Phase M — App data
- [x] L043 prepare-app-data part 1 — date: ___ conf: _/5
- [x] L044 prepare-app-data part 2 + Review 6 — date: 2026-10-28 conf: _/5

Phase N — React foundations
- [x] L045 Components, JSX, props — date: ___ conf: _/5
- [x] L046 State, events, lists — date: ___ conf: _/5
- [x] L047 Forms and lifting state — date: ___ conf: _/5
- [x] L048 useEffect and async data + Review 7 — date: 2026-11-03 conf: _/5
  Review 7 ✓ — 2026-11-03, evidence: PR #48 (M9 continues through L052)

Phase O — Shell & data layer
- [x] L049 App shell — date: ___ conf: _/5
- [x] L050 dataStore.js — date: ___ conf: _/5

Phase P — Screens
- [x] L051 Transcripts I — date: ___ conf: _/5
- [x] L052 Transcripts II + Review 8 — date: 2026-11-07 conf: _/5
- [x] L053 Scenarios screen — date: 2026-11-08 conf: _/5
- [x] L054 Scoring screen — date: ___ conf: _/5
- [x] L055 Results I — date: ___ conf: _/5
- [x] L056 Results II — date: ___ conf: _/5
- [x] L057 Run screen — date: ___ conf: _/5
- [x] L058 Export + Review 9 — date: ___ conf: _/5

Phase R — Calibration and manual collection (skippable; taken)
- [x] L059 Blind human-scoring export — date: ___ conf: _/5
- [x] L060 Importing human scores — date: 2026-11-15 conf: _/5
- [x] L061 Manual transcript ingest — date: 2026-11-18 conf: _/5
- [x] L062 Phase R integration + Review 10 — date: 2026-11-21 conf: _/5

Phase Q — Hardening and release
- [ ] L063 Acceptance-test sweep — date: ___ conf: _/5
- [ ] L064 Security review + CI — date: ___ conf: _/5
- [ ] L065 Build, deploy, release — date: ___ conf: _/5
- [ ] L066 Docs, defense + Review 11 — date: ___ conf: _/5

## Milestones

- [x] M1 Project + GitHub repo created — evidence: PR #1, Milestone Review 1 passed at L012
- [x] M2 Shared utilities tested — evidence: PR #13, Milestone Review 2 passed at L022, 25/25 tests passing
- [x] M3 First safe API smoke test — evidence: PR merged (`cli/smoke-call` → `main` @ f41db95); real call validated (upstream_provider: "DeepInfra", finish_reason: "stop", attempts: 1); reasoning_tokens extraction bug found + fixed (62/62 tests green); M3 closed on GitHub
- [x] M4 Scenario parser working — evidence: L029; parse, validate, serialize all round-trip-proven (see L029 notes below)
- [x] M5 Conversation runner tested — evidence: PR #23 merged (main @ 948e7d0), tests "§11-1" to "§11-6", 92/92 passing. Review 3: "what breaks if" round done, four beats restated after review. Follow-up: six-rule recall and why test 3 shares one client, revisit at start of L033. Follow-up revisited 2026-10-10 at start of L033: six rules reviewed (1 recalled unaided, then regrouped as in / isolated / never out), test 3 reasoning reached with a hint.
- [x] M6 Collection CLI resumable — evidence: Review 4 at L036; kill/resume drill passed (see M6 notes below)
- [x] M7 Scoring pipeline working — evidence: PR #40; read-only hashes identical (3x) on responses.smoke.jsonl; Review 5 passed at L042. (Its 7/7 practice agreement was later superseded by the L060 rehearsal: 9 disagreements, all from v1 setup_respected anchors, #67.)
- [x] M8 App data prepared — evidence: PR #43, validator PASS, Review 6 passed at L044
- [x] M9 Transcript browser working — evidence: Review 8 passed at L052 (see notes below)
- [x] M10 All screens working — evidence: five screens + export, Review 9 passed at L058 (PR #__)
- [x] M11 Calibration + manual collection (Phase R) — evidence: PR #75 (merge 2f64c1d), Review 10 passed at L062: continue
- [ ] M12 Acceptance tests passing — evidence: ___
- [ ] M13 Deployed and documented — evidence: ___


# End-of-lesson records

Lesson: L001
Completed: Yes
Concepts I can explain:
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L002

Lesson: L002
Completed: Yes
Concepts I can explain:
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L003

Lesson: L003
Completed: Yes
Concepts I can explain:
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L004

Lesson: L004
Completed: Yes
Concepts I can explain:
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L005

Lesson: L005
Completed: Yes
Concepts I can explain:
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L006

Lesson: L006
Completed: Yes
Concepts I can explain:
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L007

Lesson: L007
Completed: Yes
Concepts I can explain:
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L008

Lesson: L008
Completed: Yes
Concepts I can explain: environment variables, .env / .env.example pattern, .gitignore before first commit
Files created: .gitignore, .env, .env.example, playground/read-env.js
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L009

Lesson: L009-L011
Completed: Yes
Concepts I can explain: git init/status/add/commit, remotes/push/pull, branches, merges, pull requests
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR: PR #1 - merged
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L012

Lesson: L012
Completed: Yes - Milestone Review 1 passed
Concepts I can explain: GitHub issues, milestones, labels
Files created:
Files modified: PROGRESS.md (M1 backlog reconstructed and logged)
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L013

Lesson: L013
Completed: Yes
Concepts I can explain: modern JS data structures, destructuring
Files created: playground/d01-data.js
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L014

Lesson: L014
Completed: Yes
Concepts I can explain: functions, purity, modules, scope
Files created: playground/labmath.js (exporting mean, clamp, weightedScore)
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L015

Lesson: L015
Completed: Yes
Concepts I can explain: JSON, JSONL, CSV data formats; frozen-data / lab-notebook-pages analogy for append-only files
Files created: playground/d03-formats.js
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L016

Lesson: L016
Completed: Yes
Concepts I can explain: promises, async/await, fetch, sequential vs. parallel execution, HTTP status code families
Files created:
Files modified:
Tests run:
Test results:
Git branch:
Commit:
GitHub issue/PR:
Problems still open:
My confidence from 1-5:
What I need help with:
Next lesson: L017

Lesson: L017
Completed: Yes - full lesson, including PR review cycle
Concepts I can explain: typed errors/classification, node:test + assert.strict, equal vs deepEqual, assert.throws (and why the arrow wrapper), red-to-green, export requirements, top-level code runs on import
Files created: playground/d05-errors.js, tests/labmath.test.js, tests/errors.test.js
Files modified: package.json (test script), playground/labmath.js (empty-array guard)
Tests run: npm test - red run (missing throw) + green run (guard added) + full 5-test suite
Test results: 5 passing, 0 failing, verified green on main post-merge
Git branch: main (playground/js-foundations merged via PR #8, deleted)
Commit: 17a4f21 (final fix commit), merged to main
GitHub issue/PR: PR #8 - merged, included one real review cycle (missing export + missing test coverage)
Problems still open: arrow function syntax - solidifying; for...of loops - needed a from-scratch explanation; top-level vs. function-scoped code - new gap surfaced
My confidence from 1-5:
What I need help with:
Next lesson: L018

Lesson: L018
Completed: Yes - full lesson, including PR review cycle
Concepts I can explain: git tracks files not directories (empty dirs invisible to git status); export keyword and named exports (multiple exports per file); destructuring in function parameters happens before the function body runs, so calling with no args throws before reaching custom code; JSON vs JS (data vs. logic, no comments/trailing commas/unquoted keys); why /core/ can't do file I/O (browser-compatible constraint); placeholder-throw vs placeholder-return-fake-value (fails loud vs. fails silent); when a PR should/shouldn't close a GitHub issue (stub != implementation)
Files created: core/ids.js, core/seededRandom.js, core/llmClient.js, core/runConversation.js, core/buildJudgePacket.js, core/parseJudge.js, core/cost.js, core/parseScenarios.js, cli/collect.js, cli/score.js, cli/prepare-app-data.js, config/models.json, config/run.config.json, app/.gitkeep, app/README.md, data/.gitkeep, tests/README.md
Files modified: none
Tests run: node -e smoke test on core/ids.js module import
Test results: n/a (no automated tests this lesson - smoke test confirmed module graph resolves; buildUnitId({}) correctly throws "not implemented: L020")
Git branch: repo/scaffold (merged via PR #9, deleted)
Commit: 5a0eee8 ("Scaffold repository per handoff section 2 with placeholder modules"), merged to main as d6e4931
GitHub issue/PR: PR #9 - merged. Confirmed issues #5/#6/#7 ("Implement...") should NOT be closed by this PR since stubs aren't implementations - left open for their real lessons (L020/L021/L022)
Problems still open: -
My confidence from 1-5:
What I need help with: -
Next lesson: L019

Lesson: L022
Completed: Yes - full lesson, including Milestone Review 2 and recovery from an accidental PR revert
Concepts I can explain: per-million token pricing conversion, fail-closed vs fail-open for safety-critical calculations, reasoning tokens billing as output, quadratic input-cost growth in multi-turn conversations, round numbers vs tolerance-checked floating point assertions
Files created: tests/cost.test.js
Files modified: core/cost.js, config/models.json
Tests run: npm test (full suite, red-first TDD confirmed before implementation)
Test results: 25/25 passing, purity check clean
Git branch: core/cost (merged to main)
Commit: baa1484 (implementation); ab8a2d8 (recovery after accidental revert via PR #14)
GitHub issue/PR: PR #13 - merged; PR #14 - accidental revert of PR #13, corrected via git revert of the revert
Problems still open: reasoning_tokens vs completion_tokens overlap assumption unverified until L023/L026 real API payloads; provider_pin still VERIFY-IN-L023 in models.json
My confidence from 1-5: 3.5
What I need help with: distinguishing "computes the number a safety feature relies on" vs "is the safety feature itself" - landed after discussion, not yet automatic recall
Next lesson: L023

Lesson: L023
Completed: Yes
Concepts I can explain: statelessness ⇒ history burden, roles, provider pinning, provenance mapping (API/measured/derived), mock-transport seam
Files created: docs/api-notes.md
Files modified: config/models.json (pins + dates)
Tests run: documentary verification (all facts dated)
Test results: no remaining VERIFY-IN-L023 markers
Git branch: main (docs/api-notes merged)
Commit:
GitHub issue/PR: L024/L025 issues filed against M3
Problems still open: reasoning_tokens vs completion_tokens overlap assumption still unverified until L026's real payload
My confidence from 1-5:
What I need help with:
Next lesson: L024

Lesson: L024
Completed: Yes
Concepts I can explain: three-phase client (build/send+measure/extract), ISO-vs-elapsed clocks, ?? vs ||, transport injection, spy pattern
Files created: tests/llmClient.test.js
Files modified: core/llmClient.js (stub → happy path)
Tests run: npm test (buildRequest, happy path, spy)
Test results: green
Git branch: core/llm-client (opened, stayed open through L025)
Commit: 4361dca (Implement chatCompletion happy path: send, measure, extract with provenance)
GitHub issue/PR: issue checklist updated (happy path done, errors/retries deferred to L025)
Problems still open: typed errors + retries (L025); spy-wrapper pattern and upstream_provider nested extraction still fuzzy at lesson close
My confidence from 1-5:
What I need help with:
Next lesson: L025

Lesson: L025
Completed: Yes
Concepts I can explain: backoff vs jitter (what each prevents), retry vs permanent classification, cap enforcement via attempt < max_attempts
Files created:
Files modified: core/llmClient.js (complete — LlmError, classify, backoffDelay, retry loop), tests/llmClient.test.js (final: 19 new tests)
Tests run: npm test — 61/61 passing, purity check clean
Test results: 61/61 passing
Git branch: main (core/llm-client merged via PR, deleted)
Commit: dc8b4b1 (typed errors/classification/backoff/timeouts); merge commit 0ffd8fe
GitHub issue/PR: PR merged — Closes #16, #17
Problems still open: spy-wrapper pattern, upstream_provider nested extraction (openrouter_metadata.endpoints.available[] with selected: true) — both still fuzzy going into L026
My confidence from 1-5: 3/5
What I need help with:
Next lesson: L026

## L028 — Validating scenarios
- parseScenarios written from scratch: all 8 validation rules, collect-all error reporting, checkpoint derivation, sidecar-driven category validation with graceful degradation
- 10 fixtures, including a real bug you found and fixed (the swapped bad-gap/bad-blank-prompt bodies) and the boundary case from §9 (bad-gap-start.csv)
- 12 tests written, 80/80 passing, zero regressions on L027's work
- Student checkpoint and full knowledge check both completed
- Committed, pushed, PR'd, merged, branch deleted, main pulled

## L029 — Round-trips and the sample dataset
- csvField + serializeScenarios written and tested (quoting rules, round-trip Direction 1, semantic stability)
- Fixed a real CRLF bug in tests/parseScenarios.test.js via .gitattributes + editor EOL conversion
- Authored ds-v1: 6 scenarios, 8 checkpoints, 1 single-turn scenario, 1 custom evaluation_note
- Caught and fixed a second CRLF bug (data/scenarios.csv) and an empty dataset-notes.md, both after merge
- Milestone 4 (Phase H) complete: parse, validate, serialize — all round-trip-proven
- Confidence: 4/5 (CSV mechanics: 3/5, dataset design: 4/5)
- Next: L030 — Conversation history on paper

Lesson: L032
Completed: yes (explain-back partial, resume point: six rules + test 3 reasoning)
Concepts I can explain: aliasing (reference vs snapshot), four beats, deepEqual vs includes, sabotage checks
Files created: tests/runConversation.test.js
Files modified: core/runConversation.js (whitespace only)
Tests run: npm test
Test results: 92 pass, 0 fail
Git branch: core/run-conversation (merged, deleted)
Commit: 2036103 (merged to main as 948e7d0)
GitHub issue/PR: PR #23
Problems still open: none in code; recall of the six rules and the shared-client test
My confidence from 1-5: _
What I need help with: why tests must be able to fail; the six rules
Next lesson: L033 collect.js part 1

## M6: Collection CLI resumable (Review 4, L036)
- Verdict: continue, with repairs before L037: explain-back of schedule/run/persist/account/pace; #27 config validation before first paid run
- Evidence: kill/resume drill (Ctrl-C at 22/120, resume 98 run / 22 skipped), exactly-once proof PASS, 114 tests green incl. re-run-zero, resume-missing, cap-halts, failure-isolation; PR (data/manifest)

Lesson: L044
Completed: 2026-10-28
Concepts I can explain: Node-side aggregation, join-not-mutate, exclude-not-zero-fill, denominators-always, the data validator
Files created: cli/validateAppData.js, tests/validateAppData.test.js, app/public/data/scores.json (derived), app/public/data/results/degradation.json (derived)
Files modified: cli/prepare-app-data.js (aggregates), PROGRESS.md (M8)
Tests run: npm test; real validator run on app/public/data
Test results: 187 pass, 0 fail; validator PASS exit 0; frozen file hashes unchanged after prep
Git branch: data/app-prep (merged into main)
Commit: 58c9598 (review fix); merge hash after merge
GitHub issue/PR: PR #43 closes #41, #42; M8 closed
Review 6 verdict: continue
Problems still open: explain-it-back needed guidance (join field, app only reads); revisit in L048/L050
My confidence from 1-5: _
What I need help with:
Next lesson: L045 - React: components, JSX, props

## Milestone Review 8 (L052) - 2026-11-07
Verdict: continue. M9 complete: the React transcript browser works on real data.

- Demo: grid -> cell -> repetition list -> lazy transcript with scored turns badged -> side-by-side compare (two C005/deepseek repetitions; no scenario was run by both models in the smoke data)
- Graceful degradation: the real dataset declares no setup turn; the view renders cleanly with no badge and no console errors
- Architecture: all reads go through dataStore (grep: fetch appears only in dataStore.js); no conversations/ request until a repetition is picked; repeats served from cache
- Tests: 199 passing. Fixed getConversation (colon vs underscore 404); sabotage made both new store tests fail
- Race safety: verified with a temporary 3 s delay, with and without the cancel flag and the immediate clear; unit_id mismatch guard added
- Integrity: grid still shows the four states; transcripts show full text, unscored turns visible by default
- Debt: FilterBar left out; search resets on screen change; stray-fetch rule not in check-core-purity.js; Chrome Issues panel form-field hints; index.css unused

### L053 · Scenarios screen (2026-11-08)
- Scenario table with expandable turns; checkpoint styling shared with Transcripts (transcript.css)
- CSV import: file picker + paste, live collect-all validation via core parseScenarios,
  problem table with row numbers, row preview with problem rows marked
- Export via core serializer; hand round trip passed (6 scenarios, 8 checkpoints, C005 hostile prompt intact)
- Core: structured err.problems, empty-input guard, no fake gap after duplicate, row numbers count blank lines
- prepare-app-data publishes scenarios.meta.json (categories only), with leak test
- CLI/browser equivalence: cli/validate-scenarios.js and the browser report identical problems on l053-three-errors.csv
- Tests: 206 passing

## L060 — Importing human scores (2026-11-15)
- Key join (not positional), blank != zero, separate append-only human evals file, agreement with denominators
- 291 passing; PR #71 merged
- Rehearsal (practice grades, not calibration): deepseek 3 of 5, qwen 6 of 10; all 9 disagreements human-stricter, all from v1 setup_respected anchors (#39/#67)

## L061 — Manual transcript ingest (2026-11-18)
- buildManualRecord, parseManualFile, ingestManual; collection protocol and limitations docs
- 308 passing; PR #73 merged; one real unit (C004, meta-ai, r01), judged unchanged by score.js
- Frozen hashes unchanged: responses.smoke CAC292DE...8624, evaluations.smoke 88C105FB...B88

## L062 — Phase R integration + Review 10 (2026-11-21)
- Manual units in the app with a data-derived collection flag: MANUAL badge on grid, transcript header, legend, and Compare view; kept out of curve, heatmap, spread
- Computed agreement block (results/agreement.json) from study human grades only; empty state today
- Stale hand-typed calibration (7/7) moved to data/archive/
- Validator: byte-identity per frozen source, collection checks, agreement reconciliation; absent-file pipeline test
- 323 passing (308 before); frozen hashes unchanged; PR #75 merged (2f64c1d)
- Review 10 verdict: continue (review questions explained by tutor). M11 complete.
- Next: L063 — Acceptance-test sweep