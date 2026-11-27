# Deployment

**Host:** GitHub Pages, deployed by GitHub Actions.
**URL:** https://dylanp-12.github.io/ai-reliability-lab/
**Status:** set up in L065 (2026-11-26). See "Verification" for live checks.

## How a deploy happens

Every push to `main` runs `.github/workflows/ci.yml`:

1. `test`: core purity, the full suite, and the acceptance-count gate.
2. `build`: `npm ci` and `npm run build` in `app/`, producing `app/dist/`.
   This job also runs on pull requests, so a broken build fails the PR.
3. `deploy`: uploads `app/dist/` to GitHub Pages. Only from `main`, and only
   if `test` and `build` passed. Only this job has Pages permissions.

Branch protection requires a green PR to reach `main`, so nothing deploys
without review and CI. To redeploy without a code change, run the workflow
by hand from the Actions tab (workflow_dispatch).

One-time setup: repo Settings, Pages, Source = **GitHub Actions**.

## Build and preview locally

    cd app
    npm run build      # writes app/dist/ (gitignored)
    npm run preview    # http://localhost:4173/ai-reliability-lab/

Always test the build with `preview`, not just `npm run dev`. Users get
`dist/`, and anything that only worked because of the dev server breaks here.

## Base path

GitHub Pages serves this project from a subdirectory, so
`app/vite.config.js` sets `base: '/ai-reliability-lab/'`.

- **JS/CSS:** Vite rewrites asset paths from `base`.
- **Data:** `app/src/lib/dataStore.js` builds its path from
  `import.meta.env.BASE_URL`. It used to hardcode `/data`, which 404s under
  a subdirectory.

Verified 2026-11-26: with the old hardcoded `/data`, a subdirectory build
loaded the app shell but `index.json` returned 404. After the fix, every
data file returned 200/304. If the app moves to a root-domain host, set
`base: '/'`.

## Data policy

`app/public/data/` is committed (since L065) so the deployed site has it.
It contains the **sample dataset only** (C001 to C006, 10 units: 9 API and
1 manual), not data from the real study.

Before committing it (2026-11-26):

- `node cli/validateAppData.js app/public/data` passed: consistent, no
  secrets, no private notes, byte-identical to the frozen files.
- The one manual (Meta AI) unit was read in full: no personal or account
  details.
- `calibration.json` and `results/agreement.json` hold counts only (the
  calibration allowlist test proves this): no blind refs, no rater identity.

CI cannot run the validator on this data, because the byte-identity check
needs the gitignored frozen files. So: **re-run the validator locally
before every commit that changes `app/public/data/`.**

Never committed or deployed: `export/` (human-scoring key files),
`manual/*.txt` (raw manual transcripts), `data/*.jsonl` (frozen run files).

**Before publishing data from the real study:** decide again. That data is
the sensitive set and is headed for ISEF and a journal paper. Options:
keep the public site on the sample dataset, publish API units only, or
publish after the paper. Get mentor sign-off first.

## Run screen in production

The Run screen calls OpenRouter from the browser (CORS verdict:
`docs/cors-verdict.md`). On a public URL, anyone can enter a key, so the
localStorage warning and the demo limits (1 scenario, 1 model,
1 repetition, 12 turns, 300 tokens per reply, estimate under $0.05) are the
security controls. Demo output is ephemeral and never part of the study.

## Caching

JS and CSS filenames are content-hashed, so a new build gets new names and
browsers never serve stale code. Data files under `data/` keep the same
names, so a browser or host cache can serve an old copy after the data is
regenerated. Confirm with a hard refresh (Ctrl+Shift+R), then fix it
properly (cache headers or a cache-busting query) rather than asking users
to hard-refresh.

## Verification

- 2026-11-26: production build and preview, all five screens OK.
- 2026-11-26: subdirectory build via `vite.config.js` base, grid loads.
- Live URL on another device, all five screens, `data/index.json` 200:
  (fill in after the first deploy).