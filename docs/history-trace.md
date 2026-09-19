
Rule 1: Correct ordering, nothing extra

Rule statement: At send #N, the array must contain the previous turns' prompts and replies, in order, plus the current turn's prompt — nothing else, nothing reordered.
Where enforced/endangered: Enforced by the four beats (push user → send → push assistant → record) always running in the same order every turn. Endangered by beat-order drift — e.g. swapping send and push-user, so the model answers without seeing the current turn's prompt.

Rule 2: No other model's response ever appears

Rule statement: If multiple models are tested on the same scenario, one model's replies must never appear in another model's outgoing array.
Where enforced/endangered: Enforced by isolation-by-construction — messages is created fresh inside each call to runConversation, and each call handles exactly one model. Endangered by sharing or passing an array between calls instead of declaring it locally.

Rule 3: No other repetition's response ever appears

Rule statement: Same model, same scenario, different repetition — one repetition's replies must never appear in another repetition's array.
Where enforced/endangered: Same mechanism as rule 2 — fresh array per call. Endangered by treating the array as something to "reset between reps" instead of building it new each call (reset-based approaches break under concurrent/async execution).

Rule 4: Single-turn scenarios need no special-casing

Rule statement: A scenario with only one turn must work through the exact same loop as any other scenario, with no if branch for the single-turn case.
Where enforced/endangered: Enforced by the growth law itself — N=1 gives length 1 like any other N, so the same four beats apply unmodified. Endangered by adding special-case logic "just for single-turn scenarios," which usually signals the loop is overcomplicated.


Rule 5: reasoning_text never appears in the outgoing array

Rule statement: The messages array only ever receives result.text when pushing the assistant's turn — reasoning_text is captured in the record but never pushed to the array that gets sent to future turns.

Where enforced/endangered: Enforced at beat 3 (push assistant) — the push must say content: result.text explicitly. Endangered by a refactor that concatenates reasoning and response together "for context," or that pushes the whole result object instead of just .text.


Rule 6: evaluation_note never appears in anything a worker sees

Rule statement: evaluation_note should never be pushed into messages.

Where enforced/endangered: Enforced by beat 1 only pulling turn.prompt_text specifically — the note simply never gets reached for. Endangered by a refactor that pushes the whole turn object (e.g. JSON.stringify(turn)) instead of just the one field.


## Trace: Scenario C001 (placeholder prompts)

P1: "What's your return policy?"
P2: "What if I lost the receipt?"
P3: "Can I get store credit instead?"
R1: "Items can be returned within 30 days with a receipt."
R2: "Without a receipt, we can only offer store credit."
R3: "Yes, store credit is available for that."

send #1: [ {u:P1} ]
Length: 1 (law: 2(1)-1 = 1 ✓)
Recorded after send: prompt_text=P1, response_text=R1

send #2: [ {u:P1}, {a:R1}, {u:P2} ]
Length: 3 (law: 2(2)-1 = 3 ✓)
Recorded after send: prompt_text=P2, response_text=R2

send #3: [ {u:P1}, {a:R1}, {u:P2}, {a:R2}, {u:P3} ]
Length: 5 (law: 2(3)-1 = 5 ✓)
Recorded after send: prompt_text=P3, response_text=R3

### Repetition 2

send #1 (rep 2): [ {u:P1} ]
Why R1 from rep 1 cannot appear here: messages is created fresh inside
runConversation on every call — repetition 2 is a new call, so its array
has no connection to repetition 1's array in memory.