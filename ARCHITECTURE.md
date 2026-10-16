# Architecture


## System overview

The AI Reliability Lab tests whether an AI model keeps following a boundary the user set as a conversation grows longer. Each test plants a boundary early in a conversation, drifts through unrelated turns to distract the model, then probes late to see if the boundary still holds. Every model's responses across many repetitions are frozen to a permanent record, then scored by blinded AI judges against a shared rubric, with results browsable in a viewer app.

## Component diagram (arrows = imports/depends on)

collect.js → seededRandom.js
collect.js → ids.js
collect.js → runConversation.js
collect.js → cost.js
runConversation.js → llmClient.js

score.js → buildJudgePacket.js
score.js → parseJudge.js
score.js → llmClient.js

Scoring screen → dataStore.js
Scenarios screen → dataStore.js
prepare-app-data.js → parseScenarios.js
Run screen → runConversation.js

(chokepoints: star llmClient.js and dataStore.js)

## Data-flow diagram (arrows = data moves to)

scenarios.csv → collect.js
models.json → collect.js
run.config.json → collect.js
config/rubrics/* → score.js

collect.js → manifest.json
manifest.json → prepare-app-data.js

scenarios.csv → collect.js → responses.jsonl → score.js → evaluations.jsonl
                                    ↓                            ↓
                              prepare-app-data.js ←───────────────
                                    ↓
                          app/public/data/* → dataStore.js → 5 screens

(dashed) Run screen → runConversation.js → llmClient.js → OpenRouter API → Run screen
    (ephemeral — not frozen, not written to /data/)

dataStore.js → Export → downloaded file (research package)

## Dependency rule

/cli/ and /app/ may depend on /core/; core modules may import other browser-compatible core modules, but /core/ must never depend on /cli/, /app/, or Node-only APIs.

Only llmClient.js touches the network. Only dataStore.js reads app data.

## Chokepoints

Without this chokepoint, each caller — collect.js, score.js, the Run screen — would handle network failures its own way, and a fix made in one place wouldn't reach the others.


dataStore.js is the single module responsible for every read of app data — transcripts, scenarios, and scores — that any screen needs. It centralizes exactly where that data comes from, so that today it can be backed by static JSON files, and later swapped for a real database by changing only dataStore.js, with none of the five screens needing to change at all.


## Invariants

1. responses.jsonl and evaluations.jsonl are append-only and immutable once a run completes. Corrections live in derived files.
2. /core/ imports nothing Node-specific.
3. Every data read in the app goes through dataStore.js.
4. Every network call goes through llmClient.js.
5. Judges never see model identity.
6. Worker models never see evaluation_note.
7. Rubrics and scenarios are versioned files, never edited in place.
8. Every record carries enough provenance to reconstruct the exact request that produced it.

scripts/check-core-purity.js scans every file in /core/ for banned import strings — fs, path, process, os, child_process, and any use of require(. It runs first in npm test, so a violation blocks every check after it. This is a text scan, not a real analysis of the code — it catches direct, static imports of forbidden modules, but it can miss dynamic imports (e.g. a computed string built at runtime) and transitive violations, where a core file imports something that looks clean but itself imports a Node-only module deeper down. It's a tripwire, not a proof of purity.

## manifest.json (defined in L036)

Written whole (not appended) by `cli/collect.js` on every exit from dispatch
(normal end, cap stop, Ctrl-C, error). Holds counts and hashes only, never
response text, so it is safe to commit and share.

| Field | Meaning | Source |
|---|---|---|
| run_id | Which run this describes | config.run_id |
| dataset_version | Human label for the scenario set | config.dataset_version |
| dataset_hash | sha256 of the exact scenarios.csv bytes at run start; mismatch means the scenarios changed | sha256(raw CSV bytes), computed once at load |
| seed | Seed for the dispatch shuffle | config.seed |
| models | model_ids included | models.json |
| repetitions | Repetitions per scenario x model | config.repetitions |
| concurrency | Parallel units | config.concurrency |
| unit_count | Units scheduled | schedule.length |
| complete_count | Distinct unit_ids with a complete record (complete wins over an earlier failure) | tallyResponses(responses file) |
| failed_count | Distinct unit_ids failed with no later complete record | tallyResponses(responses file) |
| started_at | Start of the latest session (known debt: not the first session) | clock at dispatch start |
| finished_at | When this manifest was written | clock in finally |
| config_snapshot | The config that actually ran, verbatim | runConfig |
| code_version | Build that produced the data (optional; currently null) | not yet filled |

Authoritative truth is the set of records keyed by unit_id + status, not the raw
line count: line_count > complete_count is valid after a failed unit is retried.