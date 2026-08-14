Core:
- llmClient.js
- seededRandom.js
- ids.js
- runConversation.js
- buildJudgePacket.js
- parseJudge.js
- parseScenarios.js
- cost.js

CLI:
- collect.js
- score.js
- prepare-app-data.js

App:
- dataStore.js
- Scenarios screen
- Run screen
- Transcripts screen
- Scoring screen
- Results screen

Other:
- /config/ files
- /data/ files
- OpenRouter API


## Component diagram (arrows = imports/depends on)

collect.js → seededRandom.js
collect.js → ids.js
collect.js → runConversation.js
collect.js → cost.js
runConversation.js → llmClient.js

score.js → buildJudgePacket.js
score.js → parseJudge.js
score.js → llmClient.js

Scoring screen → buildJudgePacket.js
Scoring screen → parseJudge.js
Scoring screen → llmClient.js
prepare-app-data.js → parseScenarios.js
Scenarios screen → parseScenarios.js
Run screen → runConversation.js

(chokepoints: star llmClient.js and dataStore.js)


## Data-flow diagram (arrows = data moves to)

run.config.json → collect.js
run.config.json → score.js
models.json → collect.js
models.json → score.js

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


## Dependency direction rule

cli and app may depend on core. core may never depend on cli, app, or node only apis.


## Chokepoint sentences

"Only llmClient.js touches the network."
"Only dataStore.js reads app data."

evaluation_note — private research metadata — never in worker messages, never in derived/app data.

prompts — research input — no flow restriction, but protected from tampering via manifest hash.

responses.jsonl / evaluations.jsonl — frozen research data — immutable once written; only prepare-app-data.js reads them; never read directly by the app/screens.

app/public/data/* — derived data — no evaluation_note, no pricing/API keys, no secrets.

Secret — API key — never in repo, exported data, or logs
Private research metadata — evaluation_note — never in worker messages, never in derived/app data
Research input — scenario prompts — free to flow anywhere; protected from tampering via manifest hash
Frozen research data — responses.jsonl / evaluations.jsonl — immutable once written; only prepare-app-data.js reads them; never read directly by the app
Derived data — app/public/data/* — no evaluation_note, no pricing/API keys, no secrets
Non-study demo output — Run screen live results — never written to frozen files or derived data; must be visibly labeled as not-frozen

Cell colour ← Branch 2 (evaluations.jsonl, via scores.json)
Transcript text ← Branch 1 only (responses.jsonl, via conversations/<unit_id>.json)