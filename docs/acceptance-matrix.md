# Acceptance matrix

Status key: AUTO (file › test name) · MANUAL (evidence + date) · GAP

Every automated acceptance test has a name starting with `ACCEPT/<section>:`.
Run only these: `npm run acceptance`. Run everything: `npm test`.
Count check: `npm run acceptance | Select-String "ACCEPT/[a-z]+:" | Measure-Object` must equal the number of test names in the AUTO rows below (46 at the start of L063).
Node also lists each file that has no acceptance tests as one line, so the summary total is higher than this count.

## Part 1: Handoff §11/§12 promises

| Section | Promise | Protects | Status |
|---|---|---|---|
| Conversation | Turn N sends exact prior contents in order | runConversation | AUTO · runConversation.test.js › §11-1 exact composition |
| Conversation | No cross-model contamination | runConversation | AUTO · runConversation.test.js › §11-2 |
| Conversation | No cross-repetition contamination | runConversation | AUTO · runConversation.test.js › §11-3 |
| Conversation | Single-turn needs no special case | runConversation | AUTO · runConversation.test.js › §11-4 |
| Conversation | reasoning_text never in outgoing messages | runConversation | AUTO · runConversation.test.js › §11-5 |
| Conversation | evaluation_note never in worker messages | runConversation | AUTO · runConversation.test.js › §11-6 |
| Dataset | Duplicate conversation_id+turn_index rejected | parseScenarios | AUTO · parseScenarios.test.js › BAD_DUPLICATE_TURN |
| Dataset | turn_index gaps rejected | parseScenarios | AUTO · parseScenarios.test.js › BAD_GAP; BAD_GAP_START |
| Dataset | Multiline/comma prompt_text round-trips | parseScenarios | AUTO · parseScenarios.test.js › round-trip: object -> csv -> object |
| Dataset | Blank note → no checkpoint; SCORE → checkpoint | parseScenarios | AUTO · parseScenarios.test.js › GOOD_TWO_SCENARIOS (C001: blank turns 1 and 3 are not checkpoints; SCORE turn 2 is) |
| Run | shuffle(units, seed) deterministic across machines | seededRandom | AUTO · seededRandom.test.js › golden value for seed 20260811; deterministic for the same seed |
| Run | Re-run on complete file adds zero records | collect | AUTO · collect.resume.test.js › re-run on a complete file adds zero records |
| Run | Resume completes exactly the missing units | collect | AUTO · collect.resume.test.js › resume completes exactly the missing units |
| Run | Spend cap halts cleanly | collect | AUTO · collect.safety.test.js › cap halts; cap fails closed |
| Run | Permanent failure doesn't stop later units | collect | AUTO · collect.safety.test.js › failure isolation |
| Scoring | No judge packet contains model/provider identity | buildJudgePacket | AUTO · buildJudgePacket.test.js › no judge packet contains model or provider identity |
| Scoring | Judge packet contains only the checkpoint turn | buildJudgePacket | AUTO · buildJudgePacket.test.js › a judge packet contains only the checkpoint turn |
| Scoring | Self-judging excluded when configured | expandEvalUnits | AUTO · expandEvalUnits.test.js › self-judge excluded when flag is on |
| Scoring | Unparseable judge output kept, parse_ok:false | score | AUTO · score.test.js › preservation: garbage judge output is kept |
| Scoring | score.js never writes responses.jsonl | score | AUTO · score.test.js › read-only proof; write-target proof |
| Scoring | Rubric change requires new rubric_version | rubric | AUTO · rubricFrozen.test.js › FROZEN: rubric.v1 criteria match the pinned hash |
| Export | Exported IDs match source exactly | export | AUTO · exportPackage.test.js › Exported IDs match source exactly |
| Export | Exported response text byte-identical | export | AUTO · exportPackage.test.js › Export response text byte-identical |
| Integrity | No evaluation_note in any derived output | prepare-app-data, validator, export | AUTO · prepareAppData.test.js › no private notes; validateAppData.test.js › no private notes; exportPackage.test.js › no private evaluation_note |
| Integrity | No secret-shaped strings in derived output | prepare-app-data, validator, export | AUTO · prepareAppData.test.js › no secrets; validateAppData.test.js › no secrets; exportPackage.test.js › no secret anywhere |
| Integrity | All timestamps ISO-8601 UTC | all records | GAP (Chunk 2) |
| Integrity | Failed/missing units carry reason end to end, never zero-filled | runner → prep | GAP (Chunk 2) |
| Integrity | All consumers pick the same latest record per unit | 3 copies (open problem 5) | GAP (Chunk 2) |
| Manual | CORS verdict | Run screen | MANUAL · evidence: ______ (date ______) |
| Manual | Human–judge agreement | judge | MANUAL · evidence: ______ (date ______) |
| Manual | Deployed app loads real data | deploy | MANUAL · pending L065 |

## Part 2: Added by this project (Phase R)

These are not handoff §11 tests. They apply the same rules to the two data paths added in Phase R.

| Section | Promise | Protects | Status |
|---|---|---|---|
| Calibration | No model identity in human packets or sheet | buildHumanSheet | AUTO · buildHumanSheet.test.js › human packets contain no … identity; score sheet … contain no identity |
| Calibration | Blind-ref order uncorrelated with model | buildHumanSheet | AUTO · buildHumanSheet.test.js › aggregate blinding; same seed gives the same sheet |
| Calibration | Human sheet import is order-independent (key join) | parseHumanSheet | AUTO · parseHumanSheet.test.js › sorted sheet: same rows in a different order |
| Calibration | Blank human score skipped with reason, never zero-filled | parseHumanSheet | AUTO · parseHumanSheet.test.js › blank row: skipped with a reason, never a zero |
| Calibration | Import never writes evaluations.jsonl | importHumanScores | AUTO · importHumanScores.test.js › read-only proof: frozen files are byte-identical |
| Manual collection | Manual record shape identical to runner output; provenance null not zero | buildManualRecord | AUTO · buildManualRecord.test.js › schema drift guard; unmeasured fields are null |
| Manual collection | Manual response text byte-identical through ingest | buildManualRecord, ingestManual | AUTO · buildManualRecord.test.js › response text survives byte-identical; ingestManual.test.js › response text goes through a real file unchanged |
| Manual collection | Ingest never writes responses.jsonl | ingestManual | AUTO · ingestManual.test.js › read-only proof: a frozen responses file is byte-identical |
| Manual collection | App works unchanged when human/manual files are absent | prepare-app-data + screens | AUTO · absentPhaseR.test.js › absent Phase R files |