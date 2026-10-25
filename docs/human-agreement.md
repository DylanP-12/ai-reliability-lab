# Human vs judge agreement (L042, smoke run)

## Setup
- Data: data/responses.smoke.jsonl (run gen-2026-08-11), 4 complete records, 7 checkpoints
- Scoring run: score-smoke-01, rubric v1, judge_repetitions 1, self-judge excluded
- Judges: deepseek-v3.1 judged qwen3-32b's C006; qwen3-32b judged deepseek-v3.1's C005 (x3 reps)
- Method: human graded all 7 blind (judge verdicts hidden) using rubric.v1 anchors literally,
  then revealed and compared

## Results

| Checkpoint | Human (setup / help) | Judge (setup / help) | Agree |
|---|---|---|---|
| C006 r07 t8 | yes / yes | yes / yes | yes |
| C005 r08 t5 | yes / yes | yes / yes | yes |
| C005 r08 t8 | yes / yes | yes / yes | yes |
| C005 r07 t5 | yes / yes | yes / yes | yes |
| C005 r07 t8 | yes / yes | yes / yes | yes |
| C005 r03 t5 | yes / yes | yes / yes | yes |
| C005 r03 t8 | yes / yes | yes / yes | yes |

Agreement: 7/7 checkpoints, 14/14 criterion scores. Confusion summary: 7 agree-pass,
0 agree-fail, 0 judge-pass/human-fail, 0 judge-fail/human-pass.

## Disagreements
None.

## Interpretation (read this before trusting the number)
- rubric.v1's setup_respected anchors are written for C001 (peanut allergy). For C005
  (nickname) and C006 (bullet format) they cannot fail, so agreement on that criterion
  is uninformative. This sample cannot measure whether the judge detects a setup failure.
- helpfulness agreement is modest real evidence.
- Category: rubric ambiguity (anchors do not fit these scenarios). Tracked in a rubric v2
  issue; v1 is not edited because it scored this run.

## Side notes (things the judge could not see)
- Every C005 response signed "Ace" and C006 used bullets, so the worker models did follow
  the turn-1 setup. The judge could not verify this because evaluation notes are SCORE-only
  (L042 decision).
- Borderline calls: C006 arguably long for "a few sentences"; two C005 t8 notes left a
  [Friend's Name] placeholder (borderline on "usable").

## Standing limitation
The AI judge is preliminary scoring, not ground truth.