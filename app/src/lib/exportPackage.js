// L058: builds the research package. Pure: no fetch, no storage, no Node imports.
// Rule: copy stored values. Never trim, normalize, re-derive, or reformat them.

export const PACKAGE_FORMAT = 'ai-reliability-lab-export-1';

const INDEX_FIELDS = ['unit_id', 'conversation_id', 'model_id', 'category', 'repetition',
  'reasoning_enabled', 'status', 'turn_count', 'checkpoint_turns', 'failure'];
const TURN_FIELDS = ['turn_index', 'prompt_text', 'response_text', 'is_checkpoint'];
const SCENARIO_FIELDS = ['conversation_id', 'category', 'turn_count', 'checkpoints'];
const SCENARIO_TURN_FIELDS = ['turn_index', 'prompt_text'];
const MANIFEST_REQUIRED = ['run_id', 'dataset_version', 'dataset_hash', 'seed', 'models',
  'repetitions', 'unit_count', 'complete_count', 'failed_count', 'started_at', 'finished_at'];

// Copy only the named fields. A field that is absent stays absent (never null, never 0).
const pick = (obj, fields) =>
  Object.fromEntries(fields.filter((f) => obj[f] !== undefined).map((f) => [f, obj[f]]));

export function buildReadme({ manifest, unitCount, exportedAt, combineRule }) {
  return [
    'AI Reliability Lab: research package',
    `Exported at: ${exportedAt}`,
    `Run: ${manifest.run_id} (dataset ${manifest.dataset_version})`,
    ...(manifest.code_version ? [`Code version that produced the run: ${manifest.code_version}`] : []),
    '',
    'WHAT IS HERE',
    `This package holds ${unitCount} units (conversation x model x repetition) with every turn's text exactly as recorded, every judge result, and the aggregates. The run manifest records ${manifest.unit_count} units (${manifest.complete_count} complete, ${manifest.failed_count} failed).`,
    '',
    'HOW NUMBERS WERE COMBINED',
    combineRule,
    'Failed units are counted, never rated. Failed or unparseable judgments never vote. Every rate ships with its denominator.',
    '',
    'CHECKING THE RUN',
    `The manifest's dataset_hash (${manifest.dataset_hash}) is the hash of the original scenarios.csv file at run time. That file has columns that are not exported (such as evaluation_note), so the hash cannot be recomputed from this package. Compare it with the hash of your own copy of scenarios.csv.`,
    '',
    'LIMITATIONS',
    'Sample sizes are small: read each rate with its denominator. AI judge verdicts are not ground truth.',
    'The raw frozen files (responses.jsonl, evaluations.jsonl) are not included. Ask for them separately if you need them.',
    'Private evaluation notes and API keys are never exported.',
  ].join('\n');
}

export function buildExportPackage({
  manifest, index, conversations, evaluations, scores, scenarios, rubric, exportedAt,
}) {
  if (typeof exportedAt !== 'string') throw new Error('export: exportedAt (ISO string) is required');
  const missing = MANIFEST_REQUIRED.filter((f) => manifest?.[f] === undefined);
  if (missing.length > 0) throw new Error(`export: manifest is missing ${missing.join(', ')}`);
  if (conversations.length !== index.length) {
    throw new Error(`export: index lists ${index.length} units but ${conversations.length} transcripts were given`);
  }

  const convoById = new Map(conversations.map((c) => [c.unit_id, c]));
  const evalsById = new Map(evaluations.map((e) => [e.unit_id, e.evaluations]));

  const units = index.map((entry) => {
    const convo = convoById.get(entry.unit_id);
    const evals = evalsById.get(entry.unit_id);
    if (!convo) throw new Error(`export: no transcript for ${entry.unit_id}`);
    if (!evals) throw new Error(`export: no evaluations for ${entry.unit_id}`);
    return {
      ...pick(entry, INDEX_FIELDS),            // unit_id is copied from the record, never rebuilt
      turns: convo.turns.map((t) => pick(t, TURN_FIELDS)),
      evaluations: evals,
    };
  });

  return {
    format: PACKAGE_FORMAT,
    exported_at: exportedAt,
    manifest,
    readme: buildReadme({ manifest, unitCount: units.length, exportedAt, combineRule: scores.combine_rule }),
    scenarios: scenarios.map((s) => ({
      ...pick(s, SCENARIO_FIELDS),
      turns: s.turns.map((t) => pick(t, SCENARIO_TURN_FIELDS)),
    })),
    rubric,
    scores,
    units,
  };
}