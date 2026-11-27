# Limitations

Read this before drawing any conclusion from the data or the app. If this file
does not support a claim, the project does not make it.

## 1. Two things were built; their claims are separate

- **The instrument** runs any prompt CSV and rubric through collection, blinded
  judging and a viewer. That it works is supported by the acceptance matrix
  (`docs/acceptance-matrix.md`): 328 automated tests passing in CI at v1.0.0.
- **The datasets** are what the instrument was pointed at. Any claim about how
  models behave rests only on that data, at that data's n. As of v1.0.0, no data
  in this project supports a comparison between models.

## 2. Sample size

- `ds-v1` (sample dataset): 6 scenarios (C001 to C006), 8 scored checkpoints.
  Written to exercise the instrument, not as the study.
- Smoke run `gen-2026-08-11`: 6 models and 10 repetitions configured (360 units
  scheduled); 9 units completed, 0 failed. It was stopped early on purpose with
  `--max-units`, in two sessions (2026-08-11 and 2026-11-09, joined by resume).
- Manual collection: 1 unit (see section 9).
- Deployed sample on the live site: 10 units (the 9 smoke units plus the 1
  manual unit).
- Study run: not yet collected.
- At these sizes a difference between two models cannot be told apart from
  noise. Every cell in the app shows its n; read it before reading the colour.

## 3. The AI judge is not ground truth

- **L042 smoke check** (the first 4 units of the smoke run): 7 of 7 checkpoints
  and 14 of 14 criterion scores agreed with a blind human grade. This is weaker
  than it looks: rubric v1's `setup_respected` anchors describe only C001, so on
  C005 and C006 that criterion could not fail. Only the helpfulness agreement is
  evidence, and it is modest.
- **Rehearsal sheet `hs-2026-11-14`** (13 items) was practice by the student, not
  the study's rater, and supports no claim. Every disagreement ran one way (human
  stricter), which points at the rubric rather than at noise.
- **Expert calibration:** not yet collected.
- Individual human grades and blind keys are stored per installation and are
  gitignored, so a third party cannot regenerate any agreement number from the
  repo alone. The only calibration file in the repository is a counts-only
  summary of the L042 practice check
  (`data/archive/calibration.practice-2026-10-25.json`). The live site shows
  "No calibration yet."

## 4. One rater bounds the calibration

Agreement against a single rater measures how well the judge reproduces that
rater's reading of the rubric. It cannot separate an ambiguous rubric from one
person's idiosyncrasy (that needs a second independent rater), and it is not
evidence the rater is right. Judge-to-judge and test-retest agreement, which
this design can measure from the run itself, have not been computed yet.

## 5. Rubric v1 has a known defect

`setup_respected` anchors are written for C001 (peanut allergy) and do not fit
C002 to C006. Treat any v1 `setup_respected` result outside C001 as unreliable.
v1 is not edited, because it already scored runs; the fix is rubric v2 (#67).

## 6. Scenarios are synthetic

The scenarios were written by the student, scripted, and not drawn from real
conversations. The middle turns are designed to be plausible drift
(`docs/dataset-notes.md`), but whether behaviour on these scripts generalizes to
real conversations is not established.

## 7. Model and provider drift

Providers update models without notice. `provider_pin` and per-record provenance
reduce this but do not remove it. Results describe a model on its run date; the
smoke run spans two dates three months apart, so its units are not all from the
same model versions. Seeded shuffling spreads models across a run window, so
time cannot pose as a model effect, but it cannot stop a provider changing a
model between sessions.

## 8. Domain caution

A model passing a scripted checkpoint is not evidence that it behaves safely
with a real person, least of all a young person in distress. The instrument
measures one narrow property: how a model responds at a scripted checkpoint
turn placed at a chosen depth in a scripted conversation. In `ds-v1`, that is
whether a preference the user stated earlier is still honoured. In the planned
SafeTalk study, it is the model's own built-in safety response to a
disclosure, with no rule set by the experimenter. Neither is a safety rating of
any product, and nothing here should be read as one.

## 9. Manual collection (Meta AI, Character.AI)

Manual responses were collected by a person (E, H or D) in each product's
consumer chat interface, not through the API. The interface may add a hidden
system prompt, change sampling settings, apply safety layers, use retrieval, or
use memory. Manual-model results are therefore not directly comparable to
API-model results, and the app marks them wherever they appear.

- As of v1.0.0: one manual unit, single-turn. No Character.AI units yet.
- Meta AI memory cannot be turned off, so earlier conversations could influence
  later ones. No test in this repo can detect that; only the protocol
  (`docs/manual-collection-protocol.md`) limits it.
- Character.AI results would describe one named character (Lily by @landon),
  not the underlying model, and that character has a friendly assistant persona.
- Collection is by hand, so n is small. Cells show their n.
- Cost, latency and token counts are unknown for manual units (null, not zero).
  No code sums manual cost yet; any future consumer must skip nulls.

## 10. What is published and what is not

The live site shows the validated sample dataset only. Study data is not
published, pending its own publication decision and mentor sign-off.

## 11. Known open issues at v1.0.0

- #67 rubric v2 (including C004 `setup_respected` anchors)
- #80 manifest `unit_count` (1) lower than `complete_count` (9)
- #81 manifest `code_version` is null
- One rehearsal grade (H-004) was revised after a derived verdict was seen,
  which the protocol forbids (`docs/human-agreement.md`)
- Run screen browser access: see `docs/cors-verdict.md`