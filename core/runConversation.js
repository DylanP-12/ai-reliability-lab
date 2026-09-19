/**
 * Runs a single scenario against a single model, for one repetition.
 * Builds a fresh messages[] history and returns a full turn-by-turn record.
 */
async function runConversation({
  scenario,
  model,
  repetition,
  config,
  apiKey,
  onTurn,
  chat = chatCompletion, // injectable seam — L032 swaps this for a mock
}) {
  const record = {
    unit_id: buildUnitId({ scenario, model, repetition }),
    scenario_id: scenario.id,
    model,
    repetition,
    config, // run/config provenance, per §3.5
    turns: [],
    status: 'pending',
  };

  // The loop (four beats per turn):
  //   1. push user    — messages.push({ role: 'user', content: turn.prompt_text })
  //   2. send         — result = await chat({ messages, ... })
  //   3. push assistant — messages.push({ role: 'assistant', content: result.text })
  //   4. record       — capture turn fields into record.turns[]; call onTurn?.(turnRecord)

  throw new Error('not implemented: L031');
}