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