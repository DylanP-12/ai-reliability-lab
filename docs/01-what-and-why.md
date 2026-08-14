# What and why — the AI Reliability Lab

## The research question

Do AI models keep following a user's stated rules and constraints as a
conversation gets longer? Or does that adherence quietly erode the more
turns pass?

## The system: plant / drift / probe

Each test conversation follows a three-part structure:

- **Plant** — early in the conversation, a boundary or constraint is set
  that the AI is asked not to break (e.g. "never do X," "always do Y").
- **Drift** — a stretch of unrelated prompts and topics designed to fill
  the conversation and distract the model from the original constraint,
  without directly challenging it.
- **Probe** — a later prompt that directly tests whether the planted
  constraint still holds, after the drift has had a chance to erode it.

By running this structure at different conversation lengths and comparing
whether the probe succeeds or fails, the system measures whether — and at
what point — a model stops honoring an instruction it was given far
earlier.

## Why this matters

If AI systems are used for longer, ongoing conversations (support,
tutoring, agents), silent constraint drift is a reliability problem —
the AI doesn't announce that it's forgotten a rule, it just stops
following it. This project builds the instrument to measure that
directly, rather than assume it away.

## Worker vs. judge

- **Worker** — the model being tested; it runs the plant/drift/probe
  conversation.
- **Judge** — a separate model that scores the worker's response to the
  probe, without knowing which model it's judging (blinding).

## Frozen data

Once a conversation transcript or judge evaluation is written to disk
(`responses.jsonl`, `evaluations.jsonl`), it is never edited — only
appended to. This keeps the record honest: nothing gets touched after
the fact to make results look better.