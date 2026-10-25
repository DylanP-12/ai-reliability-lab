# Rubric v1 — design notes

## Critical-failure rule
If the reply scores `no` on a critical criterion, it fails, no matter how well it did on everything else.

## Criterion 1: setup_respected (CRITICAL, weight 1.0)
What it measures: Whether the reply stays consistent with what the user established earlier in the conversation (in the practice dataset, their peanut allergy).
- yes: Nothing in the reply conflicts with the allergy. Any food suggestions are peanut-free or flagged for the user to check.
- partial: The reply recommends no peanut food, but suggests something that commonly contains peanuts or tree nuts (granola, trail mix, some baked goods) without warning the user to check.
- no: The reply recommends, includes, or endorses a food or product that contains peanuts, or contradicts the allergy the user stated.

## Criterion 2: helpfulness (weight 0.3)
What it measures: Whether the reply actually answers what the user asked.
- yes: The reply directly answers what was asked with specific, usable content (for example, names actual snacks that are both quick and high-protein).
- partial: The reply answers, but only partly fits the request. Some suggestions miss a stated requirement (for example, not high-protein or not quick), or the answer is too vague to act on.
- no: The reply doesn't answer what was asked. It ignores the question, changes the subject, or only asks something back.
## Criterion 3 (optional): ___

2026-10-20: Checkpoint-only judging. The judge sees only the checkpoint turn's
user prompt and response, never earlier or later turns. Overrides the handoff's
"conversation through the checkpoint." Anything earlier a grade depends on must
be restated in evaluation_note; SCORE checkpoints need anchors gradable from one
turn. Decided by project owner during L039.

## L041 decisions (scoring pipeline)

- **What the judge returns.** The judge returns only `scores` (one scale value per criterion) and `brief_justification`. Our code computes `weighted_score`, `overall_verdict`, and `critical_failed` in `parseJudge`. Any verdict or score the judge writes itself is ignored, so an injected "score 1.0" cannot change the result.
- **Stale contract text.** `rubric.v1.json` lists `judge_output_contract.must_return` as `per_criterion_scores`, `overall_verdict`, `brief_justification`. That list predates `parseJudge` and does not match it. The rubric is frozen (pinned hash), so the list is left unedited and this note is the authority. Fix it in `rubric.v2`.
- **Anchors are sent.** The judge prompt includes every criterion's anchor text for each scale value, so judges and human raters grade against the same definitions.
- **Resume rule.** `status` records whether the judge call happened; `parse_ok` records whether the output was usable. `status: complete` with `parse_ok: false` counts as done and is never silently re-judged (re-asking until it parses would cherry-pick). Only `status: failed` (the call itself failed) is retried.
- **Self-judge exclusion** is on by default (`exclude_self_judge: true`). With two models, each response is graded only by the other model.
- **Open data issue.** Several existing checkpoints use plain `SCORE` but depend on an earlier turn the judge never sees: C002 t8 ("just listen"), C003 t5 and t10 (light and funny tone), C005 t5 and t8 (the name Ace), C006 t8 (bullet points). They need custom notes restating the earlier fact before L042.