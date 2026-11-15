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

## 2026-11-15: rehearsal sheet hs-2026-11-14 (practice grades, NOT calibration)

Sheet: rule rehearsal-all, seed 20261114, 13 items, rubric v1. Unbalanced by construction
(deepseek-v3.1 8 items, five other models 1 each). Rater: the student, practising the
protocol. This is not the study's expert rater, and none of these numbers support a claim.

| AI judge | Compared | Excluded | Verdict agreed | Human stricter / judge stricter | kappa | AC1 |
|---|---|---|---|---|---|---|
| deepseek-v3.1 r1 | 5 | 8 not judged (self-judge) | 3 of 5 | 2 / 0 | 0.00 | 0.41 |
| qwen3-32b r1 | 10 | 3 not judged | 6 of 10 | 4 / 0 | 0.00 | 0.41 |

setup_respected: 1 of 5 and 5 of 10 agreed, human stricter every time (weighted kappa 0.00, 0.00).
helpfulness: 2 of 5 and 3 of 10 agreed (weighted kappa -0.15, 0.02).

**Reading.** Both judges passed every item they saw, so kappa is exactly 0 while AC1 is 0.41:
this is the skew case, not a broken instrument. Every verdict disagreement runs one way
(human stricter), which points to a rubric mismatch rather than random noise.

**Disagreements, categorized:**
- Rubric ambiguity: [refs]. [e.g. name-signing items graded against allergy-only anchors (#39/#67);
  H-004: v1 passes a "partial" on the critical criterion]
- Judge error: [refs, or "none identified"]
- Genuinely hard: [refs, or "none identified"]

**Limits.** One rater, so rubric ambiguity cannot be separated from rater idiosyncrasy; that
needs a second independent rater. n = 5 and 10. The rater revised one grade (H-004) after seeing
a derived verdict, which the protocol forbids. Judge-to-judge agreement, which this design can
fully measure, has not been computed yet.