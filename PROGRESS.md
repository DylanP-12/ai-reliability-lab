# PROGRESS — AI Reliability Lab

Copy this file into your project repository as `PROGRESS.md` during Lesson 9.
Check items off as you go. At each milestone, paste the evidence link (PR, tag,
or test output).

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
- [ ] L001 The research question and the system — date: ___ conf: _/5
- [ ] L002 Reading a technical design — date: ___ conf: _/5
- [ ] L003 Requirements: functional vs nonfunctional — date: ___ conf: _/5
- [ ] L004 Architecture on paper — date: ___ conf: _/5
- [ ] L005 Backlog, milestones, and the plan — date: ___ conf: _/5

Phase B — Development environment
- [ ] L006 Editor, terminal, Node.js — date: ___ conf: _/5
- [ ] L007 Project folder, package.json, ES modules — date: ___ conf: _/5
- [ ] L008 Secrets, .env, .gitignore — date: ___ conf: _/5

Phase C — Git & GitHub
- [x] L009 Git: init, status, add, commit — date: 2026-08-17 conf: 3/5
- [x] L010 GitHub: remote, push, README — date: 2026-08-17 conf: 2/5
- [x] L011 Branches, merges, pull requests — date: 2026-08-17 conf: 2/5
- [x] L012 Issues, milestones, labels + Review 1 — date: 2026-08-17 conf: 3/5

  **M1 complete** — repo: https://github.com/DylanP-12/ai-reliability-lab
   Evidence: issues #2, #3, #4 (closed) 

Phase D — JavaScript foundations
- [ ] L013 Modern JS: data and destructuring — date: ___ conf: _/5
- [ ] L014 Functions, purity, modules, scope — date: ___ conf: _/5
- [ ] L015 Data formats: JSON, JSONL, CSV — date: ___ conf: _/5
- [ ] L016 Async JS, fetch, HTTP — date: ___ conf: _/5
- [ ] L017 Errors and unit testing — date: ___ conf: _/5

Phase E — Repository scaffold
- [x ] L018 Scaffold the real repository — date: ___ conf: _/5
- [ ] L019 Architecture rules as code — date: ___ conf: _/5

Phase F — Deterministic utilities
- [ ] L020 core/ids.js — date: ___ conf: _/5
- [ ] L021 core/seededRandom.js — date: ___ conf: _/5
- [ ] L022 core/cost.js + Review 2 — date: ___ conf: _/5

Phase G — LLM client
- [ ] L023 Anatomy of an LLM API call — date: ___ conf: _/5
- [ ] L024 llmClient.js part 1 — date: ___ conf: _/5
- [ ] L025 llmClient.js part 2 — date: ___ conf: _/5
- [ ] L026 First real API call — date: ___ conf: _/5

Phase H — Scenario CSV
- [ ] L027 Parsing scenarios.csv — date: ___ conf: _/5
- [ ] L028 Validating scenarios — date: ___ conf: _/5
- [ ] L029 Round-trips and the sample dataset — date: ___ conf: _/5

Phase I — Conversation runner
- [ ] L030 Conversation history on paper — date: ___ conf: _/5
- [ ] L031 Build runConversation.js — date: ___ conf: _/5
- [ ] L032 History-isolation tests + Review 3 — date: ___ conf: _/5

Phase J — Batch collection
- [ ] L033 collect.js part 1 — date: ___ conf: _/5
- [ ] L034 collect.js part 2 — date: ___ conf: _/5
- [ ] L035 collect.js part 3 — date: ___ conf: _/5
- [ ] L036 Kill it and resume it + Review 4 — date: ___ conf: _/5

Phase K — Smoke run
- [ ] L037 The smoke run — date: ___ conf: _/5

Phase L — Blinded scoring
- [ ] L038 Rubrics — date: ___ conf: _/5
- [ ] L039 buildJudgePacket.js — date: ___ conf: _/5
- [ ] L040 parseJudge.js — date: ___ conf: _/5
- [ ] L041 cli/score.js — date: ___ conf: _/5
- [ ] L042 Mock → real judge + Review 5 — date: ___ conf: _/5

Phase M — App data
- [ ] L043 prepare-app-data part 1 — date: ___ conf: _/5
- [ ] L044 prepare-app-data part 2 + Review 6 — date: ___ conf: _/5

Phase N — React foundations
- [ ] L045 Components, JSX, props — date: ___ conf: _/5
- [ ] L046 State, events, lists — date: ___ conf: _/5
- [ ] L047 Forms and lifting state — date: ___ conf: _/5
- [ ] L048 useEffect + async data + Review 7 — date: ___ conf: _/5

Phase O — Shell & data layer
- [ ] L049 App shell — date: ___ conf: _/5
- [ ] L050 dataStore.js — date: ___ conf: _/5

Phase P — Screens
- [ ] L051 Transcripts I — date: ___ conf: _/5
- [ ] L052 Transcripts II + Review 8 — date: ___ conf: _/5
- [ ] L053 Scenarios screen — date: ___ conf: _/5
- [ ] L054 Scoring screen — date: ___ conf: _/5
- [ ] L055 Results I — date: ___ conf: _/5
- [ ] L056 Results II — date: ___ conf: _/5
- [ ] L057 Run screen — date: ___ conf: _/5
- [ ] L058 Export + Review 9 — date: ___ conf: _/5

Phase Q — Completion
- [ ] L059 Acceptance-test sweep — date: ___ conf: _/5
- [ ] L060 Security review + CI — date: ___ conf: _/5
- [ ] L061 Build, deploy, release — date: ___ conf: _/5
- [ ] L062 Docs, defense + Review 10 — date: ___ conf: _/5

## Milestones

- [ ] M1 Project + GitHub repo created — evidence: ___
- [ ] M2 Shared utilities tested — evidence: ___
- [ ] M3 First safe API smoke test — evidence: ___
- [ ] M4 Scenario parser working — evidence: ___
- [ ] M5 Conversation runner working — evidence: ___
- [ ] M6 Collection CLI resumable — evidence: ___
- [ ] M7 Scoring pipeline working — evidence: ___
- [ ] M8 App data prepared — evidence: ___
- [ ] M9 Transcript browser working — evidence: ___
- [ ] M10 All screens working — evidence: ___
- [ ] M11 Acceptance tests passing — evidence: ___
- [ ] M12 Deployed and documented — evidence: ___


# PROGRESS — AI Reliability Lab

## End-of-lesson records

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

## Lessons checklist

Phase A
[x] L001  [x] L002  [x] L003  [x] L004  [x] L005

Phase B
[x] L006  [x] L007  [x] L008

Phase C
[x] L009  [x] L010  [x] L011  [x] L012

Phase D
[x] L013  [x] L014  [x] L015  [x] L016  [x] L017

Phase E
[x] L018 (2026-08-22)  [x] L019

Phase F
[x] L020  [x] L021  [x] L022 (2026-08-27) - Milestone Review 2 passed

Phase G - Q
All remaining lessons L023-L062: [ ] not started
## Milestones

[x] M1 Project + GitHub repo created - evidence: PR #1, Milestone Review 1 passed at L012
[x] M2 Shared utilities tested - evidence: PR #13, Milestone Review 2 passed at L022, 25/25 tests passing
[ ] M3 through M12 - not started