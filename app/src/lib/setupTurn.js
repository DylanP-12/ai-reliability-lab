// setupTurn.js
// Finds the setup turn a dataset OPTIONALLY declares for a scenario.
// The schema has no setup-turn concept, so absent is normal, not an error:
// return null and the viewer renders nothing extra.
export function getSetupTurn(scenarios, conversationId) {
  const scenario = scenarios.find(s => s.conversation_id === conversationId)
  const value = scenario?.meta?.setup_turn ?? null
  // Only a whole number counts. Anything else is treated as "not declared".
  return Number.isInteger(value) ? value : null
}