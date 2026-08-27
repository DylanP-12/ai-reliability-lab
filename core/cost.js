export function estimateTurnCostUSD(usage, model) {
  if (usage.prompt_tokens === undefined || usage.completion_tokens === undefined) {
    throw new Error('usage is missing prompt_tokens or completion_tokens');
  }

  const reasoningTokens = usage.reasoning_tokens ?? 0;
  // ASSUMPTION (verify in L023/L026): reasoning_tokens is reported separately
  // from completion_tokens by the provider, not already included in it.
  // Handoff §9: reasoning tokens bill as output.
  const totalOutputTokens = usage.completion_tokens + reasoningTokens;

  const inputCost = (usage.prompt_tokens / 1_000_000) * model.price_in_per_m;
  const outputCost = (totalOutputTokens / 1_000_000) * model.price_out_per_m;

  return inputCost + outputCost;
}

export function estimateConversationCostUSD(record, models) {
  const model = models.find(m => m.model_id === record.model_id);

  if (!model) {
    throw new Error(`Unknown model_id: ${record.model_id}`);
  }

  return record.turns.reduce((total, turn) => {
    return total + estimateTurnCostUSD(turn.usage, model);
  }, 0);
}