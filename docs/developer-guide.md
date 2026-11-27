# Developer guide

How to set up, run and extend the pipeline. For what the system is and why it
is shaped this way, read `ARCHITECTURE.md` first; this guide does not repeat it.

## Requirements

- Node.js 24 LTS (`node --version`)
- Git
- An OpenRouter API key, only for real (paid) runs. Everything below can be
  run first with `--mock`, which makes no network calls.

## Setup

```powershell
git clone https://github.com/DylanP-12/ai-reliability-lab.git
cd ai-reliability-lab
npm install
cd app
npm install
cd ..
Copy-Item .env.example .env
```

Put your key in `.env` as `OPENROUTER_API_KEY=...`. `.env` is gitignored: never
commit it, paste it, or include it in a screenshot. Key handling and rotation
are in `SECURITY.md`.

## The pipeline, in order

Run from the repository root. Each step reads the previous step's files and
never edits them.

| Step | Command | Reads | Writes |
|---|---|---|---|
| 1. Validate scenarios | `node cli/validate-scenarios.js` | `data/scenarios.csv` | nothing |
| 2. Collect | `node cli/collect.js` | scenarios, `config/` | `data/responses*.jsonl` (append-only), manifest |
| 3. Score | `node cli/score.js` | responses, rubric | `data/evaluations*.jsonl` (append-only) |
| 4. Prepare app data | `node cli/prepare-app-data.js` | frozen files | `app/public/data/` (derived) |
| 5. Validate app data | `node cli/validateAppData.js` | `app/public/data/` | nothing |
| 6. View | `cd app; npm run dev` | `app/public/data/` | nothing |

### Collect and score flags

| Flag | Script | Effect |
|---|---|---|
| `--mock` | collect, score | Fake transport: no network, no cost. Always run this first. |
| `--go` | collect, score | Required for real, paid calls. Without it no paid call is made. |
| `--max-units N` | collect | Stop after N units (smoke runs). |
| `--models a,b` | collect | Only these `model_id`s; unknown IDs fail closed. |
| `--responses PATH` | score | Which responses file to score. |

Unknown flags are rejected rather than ignored.

- **Resume:** re-run the same command. Completed unit IDs are read from the
  frozen file and skipped, so nothing is collected or paid for twice.
- **Spend cap:** `spend_cap_usd` in the run config. Collection estimates the
  next unit and stops cleanly before exceeding it.
- **Config changes start a new run.** Changing models, seed, repetitions or the
  dataset mid-run under the same `run_id` breaks schedule reproducibility (see
  `docs/reproducibility.md`). Use a new `run_id`.

### Viewing and building the app

```powershell
cd app
npm run dev       # local development server
npm run build     # production build into app/dist
npm run preview   # serve the production build locally
npm run lint
```

Deployment to GitHub Pages runs from CI on `main`; see `docs/deployment.md`.

## Extending

- **Add or change scenarios:** create a new dataset version; never edit a
  dataset that has been run. Every checkpoint needs a `SCORE` note, and the
  judge sees only the checkpoint turn, so anything the grade depends on must be
  stated in that note. Run step 1 until it passes. Rationale goes in
  `docs/dataset-notes.md`.
- **Add a model:** add an entry to `config/models.json` with `model_id`,
  `or_model`, `provider_pin`, prices and `can_judge`. Verify the model string,
  provider pin and pricing on OpenRouter on the day, and record the dates in
  `pin_verified` and `pricing_verified`. Never copy them from an old example.
- **Change the rubric:** write a new versioned file (`config/rubric.v2.json`).
  Never edit a rubric that has scored a run.

## Rules the code enforces

Details and reasons are in `ARCHITECTURE.md`. The short version:

- `/core/` has no Node-only imports, so it runs in Node and the browser.
  `scripts/check-core-purity.js` enforces this on every `npm test`.
- Every LLM call goes through `core/llmClient.js`; retries live only there.
- Every app data read goes through `app/src/lib/dataStore.js`.
- `responses*.jsonl` and `evaluations*.jsonl` are append-only. Corrections go
  in derived files.
- Judge packets are blinded and contain only the checkpoint turn.

## Tests

```powershell
npm test                   # purity check + full node:test suite
npm run acceptance         # acceptance tests only (names tagged ACCEPT)
npm run acceptance:count   # checks every acceptance row has a test
```

The acceptance matrix and the test that protects each row are in
`docs/acceptance-matrix.md`. CI runs tests and the app build on every pull
request; both are required checks before merging to `main`.

## Human scoring and manual collection

Optional calibration and hand collection tools. Follow the protocol documents
exactly; their outputs are gitignored and stay on your machine.

| Task | Script | Protocol |
|---|---|---|
| Export a blind rating sheet | `node cli/exportHumanSheet.js` | `docs/human-scoring-protocol.md` |
| Import human scores | `node cli/importHumanScores.js` | `docs/human-scoring-protocol.md` |
| Ingest a hand-collected transcript | `node cli/ingestManual.js` | `docs/manual-collection-protocol.md` |

## Helper scripts

`scripts/` holds checks and inspection tools used during development:
`verify-export.js` (export byte-identity), `verifyExactlyOnce.js` (no duplicate
units), `showFailures.js`, `inspectSmoke.js` and `readUnit.js` (reading frozen
data).

## Further reading

- `ARCHITECTURE.md`: components, data flow, dependency rules
- `docs/decisions.md`: every design decision and its reason
- `docs/limitations.md` and `docs/reproducibility.md`
- `SECURITY.md` and `docs/security-review.md`