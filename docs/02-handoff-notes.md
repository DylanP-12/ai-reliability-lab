# L002 — Handoff Notes

## 1. Repo layout

- **`/core/`** — logic that works in any kitchen (Node AND browser). Zero
  Node-only imports (`fs`, `path`, `process`). This is what lets the same
  code run server-side and in the browser's Run screen.
- **`/cli/`** — Node-only equipment. Batch runners: `collect.js`, `score.js`,
  `prepare-app-data.js`.
- **`/config/`** — the roster + settings drawer: `models.json`,
  `rubric.v1.json`, `run.config.json`.
- **`/data/`** — the frozen file cabinet: input dataset (`scenarios.csv`) plus
  FROZEN output (`responses.jsonl`, `evaluations.jsonl`) plus
  `manifest.json` (provenance record).
- **`/app/`** — Vite + React dining room. `public/data/` is a *derived*,
  browser-sized copy — never the frozen originals from `/data/`.
- **`/tests/`** — the health inspector.

## 2. Data schemas

| File | Role | Key rule |
|---|---|---|
| `scenarios.csv` | Input order tickets, one row per turn | `evaluation_note` (judge-only sticky note) never reaches the worker model |
| Parsed scenario (in memory) | Prepped ticket, checkpoints pre-marked | `checkpoints` = only turn_index values where `evaluation_note` is non-blank |
| `models.json` | Roster of cooks (models) | Field names binding; most values (price, exact slug) are examples — verify against OpenRouter |
| `run.config.json` | Today's shift instructions | Mostly per-run values; some (e.g. `concurrency: 1`) are documented defaults |
| `responses.jsonl` (FROZEN) | Completed conversation + full receipt, one record per whole conversation | `evaluation_note` never present; `reasoning_text` stored but never sent back out in messages |
| `evaluations.jsonl` (FROZEN) | Judge's scorecard, one per checkpoint × judge × repetition | `worker_model_id` stored for analysis, never sent to the judge's prompt |
| `rubric.v1.json` | Grading criteria | Immutable — a change means a new file + new `rubric_version`, never an edit in place |

## 3. Invariants table

| # | Invariant | Failure it prevents | Module that enforces it | Test that proves it |
|---|---|---|---|---|
| 1 | `responses.jsonl` / `evaluations.jsonl` append-only, immutable once complete | Silent rewriting of history | `collect.js`, `score.js` (append-only) | "Re-running `collect.js` on a complete file adds zero records" |
| 2 | `/core/` has zero Node-only imports | Server code silently breaking in browser | every file under `/core/` | build-time / manual review |
| 3 | Every app data read goes through `dataStore.js` | Scattered fetch logic breaking when backend changes | `app/src/lib/dataStore.js` | enforced by the contract / code review |
| 4 | Every network call goes through `llmClient.js` | Inconsistent retry/provenance logic | `core/llmClient.js` | Retry on 429/5xx/timeout/network; never on 400/401/403/404/context-overflow |
| 5 | Judges never see model identity | Judge bias from knowing which model produced a response | `core/buildJudgePacket.js` | "No judge packet contains a model name, provider name, or `model_id`" |
| 6 | Worker models never see `evaluation_note` | Worker response influenced by knowing it will be scored | `core/runConversation.js` | "`evaluation_note` never appears in any worker-model message array" |
| 7 | Rubrics/scenarios are versioned files, never edited in place | Losing the audit trail of what scoring rules produced which scores | file-naming convention (`rubric.v1.json` → `.v2.json`) | "A rubric change requires a new `rubric_version`" |
| 8 | Every record carries enough provenance to reconstruct the exact request | Inability to audit or reproduce a result later | `responses.jsonl` / `evaluations.jsonl` schema fields (seed, dispatch_index, request_ts, etc.) | implicit — check all provenance fields are present per record |

## 4. Three questions

1. **Clarification** — What exactly counts as a "checkpoint" vs a regular
   turn? (§3.2/§3.1 — checkpoints are turn_index values where
   `evaluation_note` is non-blank; every other turn is just a normal
   plant/drift turn with no scoring attached.)
2. **Current-verification** — Are the example model prices/slugs in
   `models.json` (§3.3) still accurate today? The handoff itself flags these
   as needing a check against OpenRouter before build time, not as facts to
   trust as-is.
3. **Design decision** — Why store `reasoning_text` at all if the invariant
   says it can never be reused in outgoing messages? (Likely answer: it's
   valuable *research data* on its own — studying how a model reasoned its
   way into breaking a constraint — even though it must never leak back into
   a live conversation.)