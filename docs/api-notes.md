# OpenRouter API Notes — verified 2026-08-28

## Annotated request

POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer <key>              // from .env, never committed (L008)
Content-Type: application/json
X-OpenRouter-Metadata: enabled           // opt-in; without it, no provider info comes back in the response at all

{
  "model": "deepseek/deepseek-chat-v3.1",   // config/models.json → or_model, for model_id "ds-v31-chat"
  "messages": [
    { "role": "user", "content": "..." },      // scenario turn 1 prompt_text
    { "role": "assistant", "content": "..." }, // OUR stored response from turn 1 (runConversation.js history assembly, L031)
    { "role": "user", "content": "..." }       // scenario turn 2 prompt_text
  ],
  "temperature": 0.7,          // config/run.config.json — same value for every conversation in the run
  "max_tokens": 800,           // config/run.config.json's "max_output_tokens", mapped to the API's field name
  "provider": {
    "only": ["deepinfra"],     // config/models.json → provider_pin (verify exact slug casing on the model's page before L026)
    "allow_fallbacks": false   // required alongside "only" — without this it isn't a real pin
  },
  "reasoning": {
    "enabled": false           // config/models.json → reasoning_enabled for this model
  }
}

## Response provenance mapping

| §3.5 field | Comes from | API / MEASURED / DERIVED |
|---|---|---|
| `response_text` | `choices[0].message.content` | API |
| `finish_reason` | `choices[0].finish_reason` | API |
| `usage.total_tokens` | `usage.total_tokens` | API |
| `upstream_provider` | find entry in `openrouter_metadata.endpoints.available[]` where `selected === true`, take `.provider` (needs `X-OpenRouter-Metadata: enabled` header; verified 2026-08-29) | API | 
| `reasoning_text` | `choices[0].message.reasoning` (present only when `reasoning: {enabled: true}` was sent; verified 2026-08-29) | API |
| `model_fingerprint` | `system_fingerprint` | API |
| `latency_ms` | `response_ts - request_ts`, our own clock | DERIVED |
| `prompt_hash` | we compute it from the prompt text | DERIVED |
| `dispatch_index` | the scheduler's shuffle order (L033) | DERIVED |


## Mock transport design (for L024/L025)

`chatCompletion(request, transport = fetch)` — transport signature matches
`fetch`: `(url, options) => Promise<Response-like>`.

Tests inject a fake transport that returns canned Response-like objects.
No network, no API key, no cost, fully scripted.

**Canned success example:**
{
  "id": "gen-xxxx",
  "choices": [{ "message": { "content": "..." }, "finish_reason": "stop" }],
  "usage": { "prompt_tokens": 50, "completion_tokens": 30, "total_tokens": 80,
             "completion_tokens_details": { "reasoning_tokens": 0 } },
  "system_fingerprint": "fp_xxxx"
}

**Scripted failures L025 will need (from the docs' error list):**
- 429 (rate limit) then success on retry
- 500 × 3 (exhausts retries)
- hang-forever (timeout path)
- network throw (fetch itself rejects, no HTTP response at all)
- 401 (bad/missing key)

**Caveat:** a mock proves *our logic* against *our understanding* of the API.
Only L026's one real call proves the understanding itself was correct.



## Reconciliation — L026 real call (2026-08-31)

Model: deepseek-v3.1 (deepinfra pin). One real call made; every mapped field
checked against the actual response.

- `response_text` — **CONFIRMED**
- `finish_reason` — **CONFIRMED**
- `usage.total_tokens` — **CONFIRMED**
- `upstream_provider` — **CONFIRMED**. Real response returned `"DeepInfra"`
  for the `selected: true` entry — the extraction logic is correct.
- `model_fingerprint` — **CORRECTED — 2026-08-31**. Real response returned
  `system_fingerprint: null`. DeepInfra does not appear to populate this
  field via OpenRouter. Documented as absent-for-this-provider rather than
  assumed-present.
- `usage.reasoning_tokens` — **CORRECTED — 2026-08-31**. Not a flat field as
  originally assumed; the real response nests it under
  `usage.completion_tokens_details.reasoning_tokens`. `llmClient.js`'s
  extraction was updated to normalize this to a flat top-level
  `reasoning_tokens` on the returned `usage` object, falling back to the
  nested path, defaulting to 0 (never `undefined`).

Estimated cost: ~$0.0000085. Actual cost (API-reported): $0.00000391.
Actual usage: 9 prompt tokens, 2 completion tokens. Estimate was correct
order of magnitude but ran high — the tokenizer packed the six-word prompt
more tightly than a naive word count predicted.

- 2026-10-16: model_fingerprint is null from DeepInfra (qwen3-32b, deepseek-v3.1). Documented absent, not a bug.