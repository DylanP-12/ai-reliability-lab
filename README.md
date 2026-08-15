# AI Reliability Lab

## What this is
A study of whether AI models reliably maintain a user-stated constraint across single and long, drifting conversations.

## Status
Under construction, built lesson by lesson.

## Planned architecture

| Folder | Purpose |
|---|---|
| /core | shared logic, runs in Node and browser |
| /cli | batch runners (Node-only work) |
| /config | model registry, rubric, run config |
| /data | versioned inputs + frozen outputs |
| /app | Vite + React viewer |
| /tests | unit + acceptance tests |

## Out of scope
- Not testing jailbreaks or adversarial prompting — this measures ordinary drift, not attacks
- Not evaluating any specific commercial product's built-in safety systems
- Not a clinical or legal safety certification

## License
MIT
