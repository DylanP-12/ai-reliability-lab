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