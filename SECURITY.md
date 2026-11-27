# Security policy

## How API keys are handled

- **Command line (`cli/collect.js`, `cli/score.js`):** the OpenRouter key lives in `.env`
  at the repository root. `.env` is gitignored and has never been committed (verified
  across full history in `docs/security-review.md`). Keys are never logged, never written
  to any data file, and never included in an export.
- **Browser app (Run screen):** a key entered there is saved in the browser's
  `localStorage`. Any script on the page, including a compromised library or a browser
  extension, can read it, and it stays until you click **Clear key**. This is for demos
  only: use a separate key with a low credit limit, never the key used for real study runs.
- **CI:** GitHub Actions runs with **no key**. No test makes a network call, and no secret
  is stored in the repository's GitHub settings.

## Other sensitive files

These are not credentials, but they are handled like them:

- `export/human/human-key-*.json` maps blind references to unit IDs, which contain model
  names. If committed, it would break the blinding of every human score.
- `manual/*.txt` are raw, unredacted model transcripts.
- `data/*.jsonl` are the frozen study responses and evaluations.

All three are gitignored. Do not paste their contents into issues, pull requests, or
commit messages.

## Rotating a key

Do this on a schedule, and **immediately** if a key may have been exposed.

1. On openrouter.ai, open **API Keys** and create a new key. Give it a dated name and a
   credit limit.
2. Replace the old value in `.env` (no quotes, no spaces). Save and close the file.
3. Confirm the new key works without spending anything: OpenRouter's key-info endpoint
   (`GET https://openrouter.ai/api/v1/key`) returns its limit and usage without calling a
   model.
4. **Delete the old key** on OpenRouter. Until it is deleted, any copy of it still works.

Last tested: 2026-11-26.

## If a key is exposed

The order matters:

1. **Revoke the key first** on OpenRouter. This makes every copy worthless at once.
   Rewriting Git history cannot reach copies that were already cloned or scraped.
2. Create a new key (steps above).
3. If the key was committed, decide whether to rewrite history (`git filter-repo`) or
   recreate the repository from a clean copy. Both are only clean-up after step 1.
4. Record what happened in an issue: what was exposed, when, how, and what was done.
   Do not include the key itself.

## Reporting a problem

Please do **not** open a public issue for a security problem. Use **Security >
Report a vulnerability** on this repository's GitHub page to report it privately, or
contact the maintainer through GitHub.