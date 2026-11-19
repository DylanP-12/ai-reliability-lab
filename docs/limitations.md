## Manual collection (Meta AI, Character.AI)
Manual responses were collected by a person (E, H or D) in each product's
consumer chat interface, not through the API. The interface may add a hidden
system prompt, change sampling settings, apply safety layers, use retrieval,
or use memory. Manual-model results are therefore not strictly comparable to
API-model results, and the app marks them.
- Meta AI memory cannot be turned off, so earlier conversations could
  influence later ones. No test in this repo can detect that; only the
  protocol limits it.
- Character.AI results describe one named character (Lily by @landon), not
  the underlying model in general, and the character has a friendly
  assistant persona.
- Collection is by hand, so n is small. Cells show their n.
- Cost, latency and token counts are unknown for manual units (null, not zero).