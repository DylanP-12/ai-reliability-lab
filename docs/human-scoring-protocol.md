# Human scoring protocol

Status: pre-registered. Written 2026-11-13, before any code on branch
feature/human-scoring-export.

## Purpose
Calibrate the AI judges against a human rater who grades the same material
under the same blinding. Judge scores remain preliminary scoring, not ground truth.

## What the rater grades
Exactly what a judge grades: one checkpoint turn alone (the user prompt and the
assistant response) against rubric v1. No earlier or later turns are shown. No
private note is shown for SCORE checkpoints. This follows the L039 decision, so
human and judge are compared like with like.

## Sampling rules
Every sheet records which rule produced it. A different sample is a new sheet id
under a new dated rule, never an edit to an existing one.

### Rule A: study-r01 (full-scale data)
Take the latest record per unit_id, keep status "complete", keep repetition 1,
and take every checkpoint turn of every model. The builder counts items per
model. If the counts differ, it refuses to write anything and prints the counts.

### Rule B: rehearsal-all (current smoke data only)
Take the latest record per unit_id, keep status "complete", and take every
checkpoint turn of every unit.
Why a second rule: data/responses.smoke.jsonl has 9 complete units, none at
repetition 1, across 6 models, with 4 units from deepseek-v3.1 and 1 from each
other model. Rule A would select nothing.
Status: pipeline rehearsal, not a calibration sample. It is unbalanced by model,
so agreement computed from it must not be reported as calibration of any model
or of the judges overall.
Honesty note: judge results for this data already existed and were visible in
the Results screen when this protocol was written. Both rules use only unit
coverage (model, scenario, repetition, status), never a score.

## Sheet identity and order
Sheet id format: hs-YYYY-MM-DD. Selected items are shuffled with the seeded
shuffle (numeric seed recorded in the key file), then given blind references
H-001, H-002, and so on. unit_id never appears on rater material because it
contains the model id.

## What the rater receives
- the packets file (blinded transcripts and the rubric)
- the score sheet (blind_ref plus one blank column per rubric criterion,
  a blank verdict, and a rater_note)

## What the rater must not be told or shown
Model names, providers, unit ids, run ids, repetition numbers, how many models
are in the study, any judge score or verdict, and the Results screen. The rater
is asked not to guess which model wrote a response.

## Rater instructions
Grade every item before any judge verdict is revealed. If an item cannot be
graded, leave its scores blank and say why in rater_note. A blank is skipped
with a reason, never counted as zero.

## Files
- human-packets-<sheet_id>.md and human-sheet-<sheet_id>.csv go to the rater
- human-key-<sheet_id>.json stays on the researcher's machine and is gitignored

## Known limitations (decided now)
- Checkpoint-only grading means neither the rater nor the judge sees earlier
  turns, including the setup (for example the stated allergy). Agreement
  measures consistency under the same handicap, not accuracy against the full
  conversation.
- Writing style may reveal the model. This cannot be removed, only recorded.