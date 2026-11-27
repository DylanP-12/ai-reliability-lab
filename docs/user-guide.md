# User guide

How to read the AI Reliability Lab app. Written for researchers; no code
needed. Live site: https://dylanp-12.github.io/ai-reliability-lab/

Before reading any screen, read `docs/limitations.md`. The live site shows a
small sample dataset (10 units: 9 collected through the API, 1 by hand) that
exists to demonstrate the instrument. It does not support any conclusion about
which model is safer or more reliable.

## The basic idea

A scripted conversation is sent to several AI models. Some turns are
**unscored**: ordinary conversation that builds context and distance. Others
are **scored checkpoints**, which a separate AI judge grades against a rubric.
The judge sees only the checkpoint turn and never learns which model wrote it.
Everything the models said is frozen in files that are never edited; this app
only reads them.

The app has five screens: Transcripts, Scenarios, Scoring, Results and Run.

## Transcripts

The grid has one row per scenario and one column per model. Only scenarios
that have collected units appear, so on the live site C001 and C003 are absent:
the sample run never reached them.

Each cell is in one of four states. The legend above the grid repeats this.

| State | Meaning | Is it a result? |
|---|---|---|
| **Held** | Judged; the boundary held every time | Yes |
| **Crossed** | Judged; the boundary was crossed at least once | Yes |
| **Not scored** | Collected, not yet judged | No |
| **No data** | Failed, unparseable, or not run; the reason is shown | No |

Only Held and Crossed are results. "Not scored" and "No data" are absences of
measurement and are deliberately not coloured as failures.

A scored cell reads, for example, "1/1 checkpoints held, from 1 conversation."
Both numbers matter: a cell that held every time from one conversation is one
observation, not a finding.

Units collected by hand in a consumer app carry a **MANUAL** badge (see
"Manual units" below).

Use the search box to filter by conversation ID. **Browse one** opens a single
transcript; **Compare two** shows two side by side. Scored checkpoint turns are
highlighted in the transcript.

## Scenarios

**Current dataset** lists every scenario with its category, number of turns
and number of scored checkpoints. Click a row to expand the full script.

**Import a CSV** (marked "local · unsaved") checks a scenario file in your
browser. You can choose a file or paste the text; the app validates it and
lists every problem, and checks categories against the dataset's declared list.
Nothing is uploaded, and nothing here changes the app's published data.

## Scoring

Two modes, chosen at the top of the screen:

- **Stored results (frozen research data):** pick a conversation to see how
  each checkpoint was judged: the rubric criteria, each judge's verdict, the
  weighted score, and the judge's raw output. A judgment that could not be
  parsed is shown with its raw output and marked unparseable; it is never
  replaced by a default score.
- **Live demo (not part of the study):** judging run in the browser for
  demonstration. It never enters the study.

## Results

Four views of the same scores, each answering one question. A note at the top
says how many manual units are left out: manual units appear in Transcripts,
badged, but are kept out of these comparison views, because their collection
conditions were not controlled.

- **Trend by scored turn:** pass rate (0 to 1) at each checkpoint position, one
  line per model. A solid dot and line means n of 5 or more; a hollow dot or
  dashed line means n below 5 (thin evidence). Dot size grows with n up to
  n = 30. Dots are nudged sideways so overlapping models stay visible. There is
  no smoothing, and the y axis always runs the full 0 to 1.
  **Read the caption.** Each point pools every scenario with a checkpoint at
  that turn, so a change between turns can come from which scenarios are scored
  there, not only from how deep in the conversation the turn is. The heatmap
  separates scenarios.
- **Heatmap:** where it holds or breaks, per scenario and model, with the value
  printed in each cell. "No data" cells sit outside the colour scale.
- **Spread:** how consistent the repetitions are, not just the average. Two
  models with the same average can behave very differently. Where only one
  repetition exists, the row reads "single observation" and no range is drawn.
- **How far to trust the judge:** compares the AI judge's verdicts with a blind
  human rater's. On the live site it reads **"No calibration yet."** That is
  accurate: no person has checked the judge's scores, so every number on the
  screen is the AI judge's verdict, unverified. Calibration data is kept
  private to each installation and is never published.

Every chart has a "show as a table" option and can be used with the keyboard
alone.

### Export the research package

At the bottom of Results, **Download research package** saves one JSON file
that lets a reader check and re-derive the results. The screen lists the
contents before you click.

- **Included:** the run manifest (run id, dataset hash, seed, models, counts),
  the scenarios without private notes, the rubric, every unit's turns with
  response text exactly as recorded, every judge result including unparseable
  ones, the aggregates with their denominators, and a README stating the
  combining rules and limitations.
- **Never included:** API keys, private evaluation notes, run configuration,
  or the raw frozen files (ask the author for those separately).

## Manual units

Some responses were collected by a person typing into a product's consumer
app, because those models have no public API. The consumer app may use a
hidden system prompt, memory and sampling settings that cannot be controlled,
so these units are badged **MANUAL** in Transcripts and left out of the Results
comparison views. Their cost and timing show as unknown, not zero.

## Run: live demo

Runs one short scripted conversation in your browser, for demonstration only.

- **Read the warning before entering a key.** The demo API key is saved in
  this browser's localStorage, where any script running on the page (a
  compromised library, a browser extension) can read it, and it stays until
  you click **Clear key**. Use a separate demo key with a low spending limit
  set on OpenRouter. Never paste the key used for the real study.
- **Limits:** 1 scenario, 1 model, 1 repetition, at most 12 turns and 300
  tokens per reply, with an estimated cost under $0.05. Pick a scenario and a
  model, save a demo key, then press **Run demo**.
- **Demo output is ephemeral and not part of the study.** Nothing is saved, and
  it disappears on refresh.
- Whether the browser can call the API directly is recorded in
  `docs/cors-verdict.md`.