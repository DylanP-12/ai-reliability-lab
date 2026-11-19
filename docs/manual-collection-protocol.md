# Manual collection protocol

## 1. Purpose
Some models worth measuring have no public API. For those models, a
person runs the scripted conversations by hand in the product's chat
interface. This document replaces the guarantees that
`runConversation.js` enforces in code (isolated history, exact prompts,
verbatim capture) with steps a person follows and can check off.

## 2. Who collects
Collectors: E, H and D. Anyone else who collects is added here by name
before they run a unit.

- Each collector follows the checklist in section 3.
- One collector runs a unit from start to finish. Never hand a
  conversation to the other person partway through.
- Each session-log row records who ran it (E, H or D).
- Collectors do not choose which conversations to keep. Every unit that
  is run is ingested. A unit is never re-run because the answer was
  unwelcome. If a real fault interrupts a unit (UI crash, lost
  connection), note it in the anomalies column and say why it was redone.

## 3. Checklist for every unit
A unit is one scenario, one model, one repetition.

- [ ] Start a brand-new chat for this unit. Never continue an old one.
- [ ] Paste each prompt exactly as it appears in the dataset, in order,
      one at a time. Wait for the full response before the next prompt.
      Never paste two prompts together or skip ahead.
- [ ] Copy each response verbatim: all of it, including formatting and
      trailing spaces. No editing, no tidying, no trimming a preamble.
- [ ] Use no system prompt, custom instructions, or memory or
      personalization features. If one cannot be turned off, record it.
- [ ] Save the responses in `manual/<conversation_id>__<model_id>__<rNN>.txt`,
      using this layout:

      --- RESPONSE 1 ---
      (response text)
      --- RESPONSE 2 ---
      (response text)

- [ ] Add one row to `manual/session-log.csv` before starting the next unit.

## 4. Session log
One row per unit in `manual/session-log.csv`. The file is append-only.

| Column | Why it exists |
|---|---|
| session_id | Groups units collected in one sitting |
| conversation_id | Which scenario was run |
| model_id | Which model, e.g. meta-ai or character-ai |
| repetition | Which repetition, e.g. r01 |
| surface | Which product and entry point, not just the model family |
| collected_at_utc | Models change over time, so each unit is dated |
| collector | E, H or D, so collection can be audited later |
| anomalies | Free text: refusals, crashes, regenerates, popups, anything unusual |

`anomalies` is free text on purpose. It records what a person noticed
that no fixed format could anticipate.

## 5. Editor note
Turn off "trim trailing whitespace on save" for the `manual/` folder.
Otherwise the editor silently changes the response text, and the
byte-identity check passes in tests but fails on real data.

## 6. This study's setup
| model_id | surface | account state |
|---|---|---|
| meta-ai | web | signed in; memory cannot be turned off |
| character-ai | web, character: Lily by @landon ("Your friendly AI assistant") | signed in; memory off |
- Lily has a friendly assistant persona. Results describe Lily on
  Character.AI, not a neutral model or Character.AI in general.
- One surface per model for the whole study. Changing the surface means
  a new model_id.
- Record the date and the app or UI version for each session.
- Any setting that cannot be turned off (memory, personalization, safety
  filters) goes in the anomalies column.
- Meta AI memory cannot be turned off. This is a known confound: earlier
  units could influence later ones across chats, which no test in the
  repo can detect. Every Meta AI row in the session log notes it, and it
  is stated in `docs/limitations.md`.
- Character.AI results describe the named character on that platform,
  not a general model.

## 7. Known limitation
A consumer chat interface may add a hidden system prompt, different
sampling settings, safety layers, retrieval, or memory. Manual results
are therefore not strictly comparable to API results, and no chart may
present them as if they were. This is also stated in `docs/limitations.md`.