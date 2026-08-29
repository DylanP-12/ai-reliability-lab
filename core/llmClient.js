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
  return (async () => {
    // Phase 1: build
    const { url, options } = buildRequest({
      or_model, messages, provider_pin, reasoning_enabled, temperature, max_tokens, apiKey,
    });

    // Phase 2: send + measure
    const request_ts = new Date().toISOString();
    const t0 = Date.now();
    const res = await transport(url, options);
    const latency_ms = Date.now() - t0;
    const response_ts = new Date().toISOString();

    if (!res.ok) {
      const err = new Error(`chatCompletion request failed with status ${res.status}`);
      err.status = res.status;
      throw err; // not full errors yet: L025
    }

    // Phase 3: extract
    const raw = await res.json();
    const choice = raw.choices?.[0];

    const selectedEndpoint = raw.openrouter_metadata?.endpoints?.available?.find(e => e.selected);

    return {
      text: choice?.message?.content ?? null,
      reasoning_text: choice?.message?.reasoning ?? null,
      usage: raw.usage,
      upstream_provider: selectedEndpoint?.provider ?? null,
      model_fingerprint: raw.system_fingerprint ?? null,
      finish_reason: choice?.finish_reason ?? null,
      latency_ms,
      attempts: 1, // not full retry count yet: L025
      request_ts,
      response_ts,
      raw,
    };
  })();
}