# CORS verdict: OpenRouter direct browser calls

- Date tested: 2026-11-11
- Origin: http://localhost:5173 (Vite dev)
- Endpoint: POST https://openrouter.ai/api/v1/chat/completions
- Model: openai/gpt-4o-mini, max_tokens 5
- Key: separate demo key (credit limit, 30-day expiration)
- Result: WORKS
- Evidence: browser console printed "status 200 OK"; no CORS error
- Consequence: Run screen calls the API directly; no serverless proxy needed
- Re-test when: deploying to a new origin (L065)
## Correction (2026-11-11, same day)
The minimal test above sent only Authorization + Content-Type. The real llmClient request
also sends X-OpenRouter-Metadata, which triggers a preflight. That request is BLOCKED:
"Request header field x-openrouter-metadata is not allowed by Access-Control-Allow-Headers
in preflight response."
Verdict: direct browser calls work only WITHOUT the X-OpenRouter-Metadata header.
Lesson: test the exact request the app sends, not a simplified one.