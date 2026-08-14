The researcher (me, running collection/scoring from the terminal)
The reader/analyst (browsing transcripts/results in the app -entire team)
The demo visitor (trying a small live run in the browser -Henry/Elijah)
The future developer (me, in one month, maintaining the repo)

## Use cases

1. The researcher can run a collection batch from the terminal.
2. The researcher can resume an interrupted collection run without losing completed data.
3. The researcher can score checkpoints against the rubric from the terminal.
4. The reader/analyst can browse a transcript in the app.
5. The reader/analyst can compare two models on the same scenario side by side.
6. The reader/analyst can view results in the app.
7. The researcher can import and export the scenarios CSV.
8. The demo visitor can run a small live demo in the browser.
9. The researcher can export the research package.
## Users
FR-01: collect.js resumes by reading responses.jsonl, building a set of completed unit_ids, and skipping any unit already in that set. [§5.2]  Priority: Must  Verify: integration test (re-run after interruption adds 0 duplicate records)

## Functional
NFR-01: shuffle(units, config.seed) produces the same ordering every time, on any machine, given the same seed. [§11, §12.2]  Priority: Must  Verify: unit test (run shuffle() twice with the same seed, assert identical output order)

FR-02: collect.js tracks cumulative spend (usage × per-model pricing) after every conversation and halts cleanly once spend_cap_usd is reached. [§5.3]  Priority: Must  Verify: measurement (run a live batch, confirm actual spend never exceeds spend_cap_usd)

FR-03: collect.js catches SIGINT, finishes the in-flight conversation, flushes it to responses.jsonl, and exits with code 0. [§5.5]  Priority: Should  Verify: integration test (send SIGINT mid-run, confirm process exits cleanly and last conversation is fully written, not truncated)

FR-04: the Scenarios screen validates an imported CSV live, flagging duplicate turn_index, gaps, blank prompts, and missing checkpoints. [§8]  Priority: Must  Verify: unit test (feed known-bad CSVs, confirm each error type is caught)

FR-05: score.js excludes a judge from scoring a checkpoint when the judge's model_id matches the worker model_id, if exclude_self_judge is enabled in config. [§6]  Priority: Should  Verify: unit test (same model as judge and worker, config on → 0 evaluations produced for that pairing)

FR-06: score.js resumes by eval_id (skipping already-scored checkpoints) and never writes to responses.jsonl. [§6]  Priority: Must  Verify: integration test (re-run score.js after interruption — no duplicate eval_ids, responses.jsonl file unchanged)

FR-07: prepare-app-data.js splits the full conversation data into one small file per conversation, so the website only loads a transcript when someone actually opens it. [§7] Priority: Must Verify: unit test (run on sample data, confirm index.json has no full response text, confirm per-unit files exist separately).

FR-08: models.json in the prepared app data contains labels only — no pricing or API keys. [§7] Priority: Must Verify: unit test (assert output object excludes pricing/apiKey fields).

FR-09: The Run screen's demo results are ephemeral and clearly labeled as not part of the frozen dataset. [§8] Priority: Must Verify: manual inspection (run the live demo, confirm an on-screen label distinguishes it from real collected data).

FR-10: The Transcripts screen, on clicking a grid cell, shows the full conversation with the plant turn and the violating response highlighted. [§8] Priority: Must Verify: manual inspection (click a cell, confirm plant turn and violating response are visually distinguished from the rest).

FR-11: the Scoring screen lets a user select a rubric and judge, then replays stored evaluations or runs live judge calls on a demo subset, showing raw judge output on demand. [§8]  Priority: Must  Verify: manual inspection

FR-12: the Results screen renders precomputed aggregates — degradation curve, constraint-honor heatmap, baseline vs. deepest condition, repetition spread, judge disagreement, human–judge agreement — and never computes them in the browser. [§7, §8]  Priority: Must  Verify: manual inspection / unit test (aggregates are read, not recomputed)


NFR-02: responses.jsonl and evaluations.jsonl are append-only and immutable once a run completes. [§12.1] Priority: Must Verify: integration test (hash the file after a run, run collect.js/score.js again, confirm the original bytes are unchanged and only new lines were appended).

NFR-03: /core/ imports nothing Node-specific. [§12.2] Priority: Must Verify: unit test (static check/lint scanning /core/ source files for banned imports like fs, path, process).

NFR-04: no judge packet contains a model name, provider name, or model_id. [§11]  Priority: Must  Verify: unit test

NFR-05: API keys never appear in the repo, in exported data, or in logs. [§4]  Priority: Must  Verify: manual inspection / grep audit

NFR-06: index.json stays within a ~1–5 MB target at startup, measured before release; full responses.jsonl is never loaded in the browser. [§7]  Priority: Must  Verify: measurement

NFR-07: every record carries enough fields (model, params, prompt, timestamp) to reconstruct the exact request that produced it. [§12.8]  Priority: Must  Verify: manual inspection

NFR-08: collect.js and score.js can both be interrupted and resumed at any point without losing completed work or producing duplicate records. [§5.2, §6]  Priority: Must  Verify: integration test
