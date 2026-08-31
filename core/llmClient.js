export class LlmError extends Error {
  constructor(message, classification, { status = null, retryable = false, raw = null } = {}) {
    super(message);
    this.name = 'LlmError';
    this.classification = classification;
    this.status = status;
    this.retryable = retryable;
    this.raw = raw;                       // body text if we had one — evidence survives
  }
}

// Detect context/token-length overflow generously — providers phrase this differently.
function looksLikeContextOverflow(bodyText) {
  if (!bodyText) return false;
  const text = bodyText.toLowerCase();
  return (
    text.includes('context length') ||
    text.includes('context_length') ||
    text.includes('maximum context') ||
    text.includes('too many tokens') ||
    text.includes('token limit')
  );
}

export function classify(status, bodyText = null) {
  if (status === 429) {
    return { classification: 'rate_limit', retryable: true };
  }
  if (status >= 500 && status < 600) {
    return { classification: 'server_error', retryable: true };
  }
  if (status === 401 || status === 403) {
    return { classification: 'auth', retryable: false };
  }
  if (status === 400) {
    if (looksLikeContextOverflow(bodyText)) {
      return { classification: 'context_overflow', retryable: false };
    }
    return { classification: 'bad_request', retryable: false };
  }
  if (status === 404) {
    return { classification: 'bad_request', retryable: false };
  }
  return { classification: 'unknown', retryable: false };
}

export function backoffDelay(attempt, base = 500) {
  const exp = base * 2 ** (attempt - 1);   // 1→base, 2→2×base, 3→4×base...
  return exp * (0.5 + Math.random());       // jitter: 0.5x–1.5x of the exponential value
}



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

export async function chatCompletion({
  or_model, messages, provider_pin, reasoning_enabled,
  temperature, max_tokens, timeout_ms, max_attempts = 1, apiKey,
  transport = fetch,
  backoffBase = 500,
  sleepFn = (ms) => new Promise(resolve => setTimeout(resolve, ms)),
}) {
  // Phase 1: build — identical on every attempt, so it happens once, outside the loop
  const { url, options } = buildRequest({
    or_model, messages, provider_pin, reasoning_enabled, temperature, max_tokens, apiKey,
  });

  for (let attempt = 1; attempt <= max_attempts; attempt++) {
    const controller = new AbortController();
    const timer = timeout_ms ? setTimeout(() => controller.abort(), timeout_ms) : null;
    let error = null;

    try {
      // Phase 2: send + measure
      const request_ts = new Date().toISOString();
      const t0 = Date.now();
      const res = await transport(url, { ...options, signal: controller.signal });
      const latency_ms = Date.now() - t0;
      const response_ts = new Date().toISOString();

      if (!res.ok) {
        let raw = null;
        try { raw = await res.json(); } catch { /* body wasn't JSON — leave raw null */ }
        const bodyText = raw ? JSON.stringify(raw) : null;
        const { classification, retryable } = classify(res.status, bodyText);
        error = new LlmError(
          `chatCompletion request failed with status ${res.status} (${classification})`,
          classification,
          { status: res.status, retryable, raw }
        );
      } else {
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
          attempts: attempt,
          request_ts,
          response_ts,
          raw,
        };
      }
    } catch (transportErr) {
      if (transportErr.name === 'AbortError') {
        error = new LlmError('chatCompletion request timed out', 'timeout', { retryable: true, raw: null });
      } else {
        error = new LlmError(transportErr.message || 'network error', 'network', { retryable: true, raw: null });
      }
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (error.retryable && attempt < max_attempts) {
      await sleepFn(backoffDelay(attempt, backoffBase));
      continue;
    }

    error.attempts = attempt;
    throw error;
  }
}