export function buildRequest({
  or_model, messages, provider_pin, reasoning_enabled,
  temperature, max_tokens, apiKey,
}) {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-OpenRouter-Metadata': 'enabled',
  };

  const body = {
    model: or_model,
    messages,
    temperature,
    max_tokens,
    provider: { only: [provider_pin], allow_fallbacks: false },
  };

  if (reasoning_enabled) {
    body.reasoning = { enabled: true };
  }

  return { url, options: { method: 'POST', headers, body: JSON.stringify(body) } };
}

export function chatCompletion({
  or_model, messages, provider_pin, reasoning_enabled,
  temperature, max_tokens, timeout_ms, max_attempts, apiKey,
  transport = fetch,
}) {
  throw new Error('not implemented: L024 step 3');
}