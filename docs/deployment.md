# Deployment

**Status (2026-11-26): not deployed.** The production build is verified
locally. Publishing the derived data is on hold pending mentor review
(see Data policy). Nothing in this repo is published to a host yet.

## Build and preview

    cd app
    npm run build      # writes app/dist/ (gitignored)
    npm run preview    # serves dist/ at http://localhost:4173/

Always test the build with `preview`, not just `npm run dev`. Users get
`dist/`, and anything that only worked because of the dev server breaks here.
Verified 2026-11-26: all five screens load from the production build.

## Base path

Hosts that serve the app from a subdirectory (GitHub Pages project sites,
`https://<user>.github.io/ai-reliability-lab/`) need Vite's `base` set to
that subdirectory. Otherwise absolute paths like `/data/index.json` resolve
to the domain root and return 404.

- **JS/CSS:** Vite rewrites asset paths from `base` automatically.
- **Data:** `app/src/lib/dataStore.js` builds its path from
  `import.meta.env.BASE_URL`, so data follows `base` too. It used to be
  hardcoded to `/data`.

Verified 2026-11-26: built and previewed with
`--base=/ai-reliability-lab/`. Before the dataStore fix, `index.json`
returned 404. After it, every data file returned 200/304 from
`/ai-reliability-lab/data/`.

`base` is **not yet set** in `app/vite.config.js`. Set it once the host is
chosen: `/ai-reliability-lab/` for GitHub Pages, `/` for a root-domain host
such as Netlify.

## Data policy (decision pending)

`app/public/data/` is gitignored (`.gitignore`: derived app data). Git
tracks 0 files there, so a deploy built from the repo would contain no
data. The validator passed on the real data on 2026-11-26
(`node cli/validateAppData.js app/public/data`): consistent, no secrets,
no private notes, byte-identical to the frozen files.

What would be published: the full text of every model response, including
one manual (consumer-UI) unit. The repository is public, so committing the
data puts it in history permanently, and any deployed URL serves it to
anyone. Because the results are headed for ISEF and a journal paper, this
decision goes to the mentor first. Options:

1. Commit `app/public/data/` and deploy everything.
2. Deploy API units only (leave the manual unit out).
3. Deploy real data without committing it (build locally, upload `dist/`).
4. Hold publication; tag v1.0.0 later.

Never published under any option: `export/` (the human-scoring key files)
and `manual/*.txt` (raw manual transcripts). Both stay gitignored.

## Run screen in production

The Run screen calls OpenRouter from the browser (CORS verdict:
`docs/cors-verdict.md`). On a public URL, anyone can enter a key, so the
on-screen localStorage warning and the demo limits (1 scenario, 1 model,
1 repetition, 12 turns, 300 tokens per reply, estimate under $0.05) are the
security controls. Demo output is ephemeral and never part of the study.

## Caching

JS and CSS filenames are content-hashed, so a new build gets new names and
browsers never serve stale code. Data files under `data/` keep the same
names, so a browser or host cache can serve an old copy after the data is
regenerated. Confirm with a hard refresh (Ctrl+Shift+R), then fix it
properly with cache headers or a cache-busting query rather than asking
users to hard-refresh.

## Remaining steps (after the mentor decision)

1. Choose the host; set `base` in `app/vite.config.js`.
2. Apply the data policy chosen above.
3. Deploy `dist/` (GitHub Pages: add a deploy job to `.github/workflows/ci.yml`).
4. Open the live URL on another device; click all five screens; confirm
   `data/index.json` returns 200 from the deployed path.
5. Tag `v1.0.0` and publish release notes (what it is, limitations, URL,
   how to reproduce from `manifest.json`: run_id, dataset_version, seed).