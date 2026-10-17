# L037 smoke run: inspection checklist

Run: gen-2026-08-11, ds-v1, --max-units 4, data/responses.smoke.jsonl (gitignored)
Date: 2026-10-16. Estimated $0.01, actual about $0.01. 4/4 complete after one resume.

| Unit | Isolation (in= grows) | Provider = pin | Provenance | finish_reason | Scored-turn outcome | Notes |
|---|---|---|---|---|---|---|
| C006:qwen3-32b:r07 | PASS | PASS (DeepInfra) | PASS (fp null) | NOTE: 4/8 `length` | Kept turn-1 bullet format through turn 8 | Filler turns 2,4,5,6 truncated mid-sentence by hidden reasoning |
| C005:deepseek-v3.1:r08 | PASS | PASS | PASS (fp null) | PASS | Signed both drafts with chosen name, not a placeholder | Scenario well built |
| C005:deepseek-v3.1:r07 | PASS | PASS | PASS (fp null) | PASS | not read | |
| C005:deepseek-v3.1:r03 | PASS | PASS | PASS (fp null) | PASS | not read | Needed resume after 429 at turn 7 |

## Defects (fixed)
- runConversation sent only `messages` to chat: no key, model, pin, temperature, timeout, retries (401 on every call). Fixed with regression test.
- Config not validated (#27): missing spend_cap_usd disabled the cap. Fixed.

## Defects (open issues)
- qwen3-32b reasons although reasoning_enabled is false; field omitted means provider default. Truncation confound vs deepseek. research-integrity.
- 429 exhausted 3 attempts with 500 ms backoff; turns 1 to 6 paid then discarded.
- Spend cap is per-session; each resume gets a fresh cap.

## Findings about reality (documented, not bugs)
- model_fingerprint is null for DeepInfra on both models.
- Prompt tokens grow every turn, as expected from re-sent history.
- Rough cost estimate assumes 200 output tokens; qwen produced about 5,600 over 8 turns.
- Smoke slice put each scenario on one model only, so discrimination is untested until the full run.
- C005 only fails via a placeholder signature (real name never given); check discrimination in the full run.