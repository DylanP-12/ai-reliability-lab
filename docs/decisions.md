# Decision log

Format: date — decision — reasons — alternatives considered.

## 2026-08-17 — License: MIT
Reasons: simple, permissive, standard for learning/research code.
Alternatives: Apache-2.0 (fine, longer), no license (forbids reuse — bad).

## 2026-08-17 — Repository visibility: private
Reasons: ...
Alternatives: ...

## 2026-08-17 — Merge style: merge commits (not squash)
Reasons: honest history for a learning project; simple mental model.

## 2026-08-17 — Repository visibility: private
Reasons: project involves API keys and config (.env, gitignored) — keeping
the repo private is an extra safety margin even though .gitignore already
excludes secrets from history. Can reconsider going public later once
mature.
Alternatives: Public (rejected for now — no benefit yet, adds risk if
.gitignore is ever misconfigured).