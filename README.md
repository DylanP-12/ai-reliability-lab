# AI Reliability Lab

[![CI](https://github.com/DylanP-12/ai-reliability-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/DylanP-12/ai-reliability-lab/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/DylanP-12/ai-reliability-lab)](https://github.com/DylanP-12/ai-reliability-lab/releases/tag/v1.0.0)

**Live app:** https://dylanp-12.github.io/ai-reliability-lab/

A research instrument that measures how AI chat models respond at chosen
points in long, scripted conversations. It was built for the SafeTalk study of
how chatbots respond to young people's mental-health disclosures, but what it
measures comes from two files, a scenario CSV and a rubric, so the same
pipeline can study other questions.

## What this does not claim

This release is the **instrument**, not a finding. The live site shows a small
sample dataset (10 units) that demonstrates the pipeline; it cannot tell
models apart, and no study data has been collected yet. The AI judges have not
been calibrated against an expert rater. Nothing here is a safety rating of
any product. Read [`docs/limitations.md`](docs/limitations.md) before drawing
any conclusion.

## How it works

1. A scripted conversation mixes **unscored turns**, which build context and
   distance, with **scored checkpoint turns**.
2. The same script runs against several models and repetitions, each with a
   strictly isolated history, in a seeded random order. Every response is
   frozen to append-only files.
3. A separate pass sends each checkpoint, alone and with the model's identity
   removed, to AI judges, and a static web app shows the results with their
   sample sizes.

![Transcripts grid: one row per scenario, one column per model, each cell held, crossed, not scored, or no data](docs/images/transcripts-grid.png)

## Quickstart

Requires Node.js 24 LTS. No API key is needed to try it in mock mode.

```powershell
git clone https://github.com/DylanP-12/ai-reliability-lab.git
cd ai-reliability-lab
npm install
npm test
cd app
npm install
npm run dev
```

Full setup, the pipeline commands and how to extend the instrument are in the
developer guide.

## Documentation

| If you want to... | Read |
|---|---|
| Understand what the app shows | [User guide](docs/user-guide.md) |
| Run or extend the pipeline | [Developer guide](docs/developer-guide.md) |
| Understand the design | [ARCHITECTURE.md](ARCHITECTURE.md), [decisions](docs/decisions.md) |
| Know what the results cannot support | [Limitations](docs/limitations.md) |
| Re-derive the results | [Reproducibility](docs/reproducibility.md) |
| See how this relates to published work | [Related work](docs/related-work.md) |
| Check what is tested | [Acceptance matrix](docs/acceptance-matrix.md) |
| Report a security problem or handle keys | [SECURITY.md](SECURITY.md) |
| Deploy the app | [Deployment](docs/deployment.md) |

## Status

v1.0.0: the instrument is complete, with 328 automated tests passing in CI,
including every acceptance test. Open work is tracked in
[issues](https://github.com/DylanP-12/ai-reliability-lab/issues), most notably
rubric v2 (#67).

## License

MIT