# Reproducibility

What someone needs to re-derive this project's results, and which parts can be
re-derived exactly. The pipeline commands are in `docs/developer-guide.md`;
this file records the inputs and rules they need.

## What reproduces and what does not

The models are stochastic (temperature 0.7), so identical inputs will not
produce identical responses. What reproduces is everything around them.

| Reproduces exactly | Does not reproduce |
|---|---|
| The schedule: same seed and dataset hash give the same units in the same dispatch order (mulberry32 + Fisher-Yates, `core/seededRandom.js`) | Response text |
| The method: pinned models, rubric version, blinded judge packets | Judge verdicts (judges are models too) |
| The analysis: `prepare-app-data` on the same frozen files gives the same derived data | Model behaviour after a provider update |
| The human sample: the same sheet seed gives the same items in the same order | Human grades |

## Code

- Release `v1.0.0`, commit `e82f949`.
- The manifest's `code_version` is null (#81), so the commit must be recorded by
  hand until that is fixed.
- Node 24 LTS. `npm test` must pass (328 tests at v1.0.0) before any run.

## Dataset

- `dataset_version`: `ds-v1` (`data/scenarios.csv`, `data/scenarios.meta.json`)
- `dataset_hash`: `sha256:8abae1c46b61e93938e40ce0dda9948355cbcffb137a5c31922f7467d26ee6bf`
- 6 scenarios, 8 scored checkpoints. Scenario rationale: `docs/dataset-notes.md`.

## Collection run `gen-2026-08-11`

From `data/manifest.smoke.json`:

| Setting | Value |
|---|---|
| seed | 20260811 |
| repetitions | 10 (stopped early with `--max-units`) |
| temperature | 0.7 |
| max_output_tokens | 800 |
| system_prompt | null |
| concurrency | 1 |
| spacing_ms | 1000 |
| request_timeout_ms | 120000 |
| max_attempts | 3 |
| spend_cap_usd | 5 |
| complete / failed | 9 / 0 |

**This run changed configuration between sessions.** The first session
(2026-08-11) could only include `deepseek-v3.1` and `qwen3-32b`; the other four
models were added and pinned on 2026-11-08, and the run was resumed under the
same `run_id` on 2026-11-09. The manifest records only the final six-model
configuration. Resume was correct (deterministic unit IDs, no duplicates), but
the August dispatch order cannot be regenerated from this manifest, because the
shuffle depends on the full unit list. Rule for future runs: a configuration
change starts a new `run_id`.

## Models

All from `config/models.json`, called through OpenRouter, reasoning disabled.

| model_id | OpenRouter model | provider_pin | pin verified | judge |
|---|---|---|---|---|
| deepseek-v3.1 | deepseek/deepseek-chat-v3.1 | deepinfra | 2026-08-28 | yes |
| qwen3-32b | qwen/qwen3-32b | deepinfra | 2026-08-28 | yes |
| gemini-3.8-flash | google/gemini-3.8-flash | google-vertex | 2026-11-08 | no |
| claude-haiku-5.5 | anthropic/claude-haiku-5.5 | anthropic | 2026-11-08 | no |
| gpt-5.4-mini | openai/gpt-5.4-mini | openai | 2026-11-08 | no |
| mistral-medium-3.5 | mistralai/mistral-medium-3-5 | mistral | 2026-11-08 | no |

Pins and prices drift. Re-verify both before any new run, and record the date.

## Scoring

- Scoring run `score-smoke-01`, rubric `v1` (`config/rubric.v1.json`).
- Judge repetitions: 1. Self-judging excluded.
- Judges: `deepseek-v3.1` and `qwen3-32b` (the models with `can_judge: true`).
- Judges see only the checkpoint turn, blinded (`core/buildJudgePacket.js`).

## Exclusion and aggregation rules

Implemented in `cli/prepare-app-data.js`:

- A **failed unit** is excluded from scoring and listed by ID with its failure
  classification. It is never zero-filled.
- A **failed or unparseable judgment** (`parse_ok: false`) is excluded from the
  outcome and the score, and counted separately. Its raw output stays in
  `evaluations.jsonl`.
- A checkpoint's **outcome** is the majority of `overall_verdict` across its
  scored judgments; a tie is recorded as `split`.
- A checkpoint's **score** is the mean `weighted_score` across its scored
  judgments, or null if there are none.

With 1 judge repetition, both rules act on a single judgment. They matter once
repetitions increase.

## Human scoring

- Sheet `hs-2026-11-14`, rule `rehearsal-all`, seed 20261114, 13 items,
  rubric v1. The seed and rule regenerate the same sample in the same order.
- This sheet is a rehearsal, not calibration (`docs/human-agreement.md`).
- Human scores and the blind key are not distributed. They are gitignored and
  stored per installation.

## Manual collection

- 1 unit, collected under `docs/manual-collection-protocol.md`.
- Raw manual transcripts and the session log stay in `data/manual/` and are not
  in the repository.
- A manual unit cannot be reproduced by re-running anything: the consumer
  interface's hidden settings are unknown (see `docs/limitations.md`, section 9).

## Data availability

- The derived app data for this run is public: `app/public/data/`, served on the
  live site.
- The frozen files in `data/` are not in the repository. Re-deriving the
  analysis from them requires a copy from the author; study data is held pending
  its publication decision (`docs/limitations.md`, section 10).