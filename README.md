# AI Reliability Lab

[![CI](https://github.com/DylanP-12/ai-reliability-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/DylanP-12/ai-reliability-lab/actions/workflows/ci.yml)

Security: see [SECURITY.md](SECURITY.md) and the [security review](docs/security-review.md).

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

## Acceptance tests

Every promise the system makes is listed in [docs/acceptance-matrix.md](docs/acceptance-matrix.md), each one either an automated test or a documented manual check. Run them all with: npm run acceptance
