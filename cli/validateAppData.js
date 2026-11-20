// cli/validateAppData.js: prove app/public/data is consistent, safe, and honest (L044)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

function readJson(dir, file) {
  return JSON.parse(readFileSync(join(dir, file), 'utf8'));
}

// Check 1: every index entry has its transcript file, and every transcript file is in the index.
export function checkOrphans(dir, index) {
  const problems = [];
  const listed = new Set(index.map((entry) => entry.file));
  for (const entry of index) {
    if (!existsSync(join(dir, entry.file))) {
      problems.push(`orphan index entry: ${entry.unit_id} points at missing ${entry.file}`);
    }
  }
  for (const name of readdirSync(join(dir, 'conversations'))) {
    const file = `conversations/${name}`;
    if (!listed.has(file)) {
      problems.push(`orphan transcript file: ${file} is not listed in index.json`);
    }
  }
  return problems;
}

// List every file under dir, including files in subfolders like conversations/ and results/.
function listFiles(dir, prefix = '') {
  const files = [];
  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...listFiles(dir, rel));
    else files.push(rel);
  }
  return files;
}

const SECRET_PATTERNS = [
  /\bsk-(?:or-v1-|proj-|ant-)?[A-Za-z0-9_]{20,}/,
  /\bBearer\s+[A-Za-z0-9._-]{20,}/,
];

// Check 2: no secret-shaped strings and no private evaluation notes in any file.
export function checkSecretsAndNotes(dir) {
  const problems = [];
  for (const file of listFiles(dir)) {
    const text = readFileSync(join(dir, file), 'utf8');
    if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) {
      problems.push(`secret-shaped string found in ${file} (value not shown)`);
    }
    if (text.includes('"evaluation_note"')) {
      problems.push(`private evaluation_note field found in ${file}`);
    }
  }
  return problems;
}

function readFrozenRecords(path) {
  const frozen = new Map();
  const lines = readFileSync(path, 'utf8').split('\n').filter((line) => line.trim() !== '');
  for (const line of lines) {
    const record = JSON.parse(line);
    frozen.set(record.unit_id, record);
  }
  return frozen;
}

// Check 3: every response_text in the app data is exactly the text in its own frozen file.
// L062: there are now two frozen sources. Each unit is looked up in the file its collection names.
// The manual file is optional (gitignored), but a manual unit with no manual source still fails:
// text with no frozen source is exactly what this check exists to catch.
export function checkByteIdentity(dir, index, frozenResponsesPath, frozenManualResponsesPath) {
  if (!frozenResponsesPath) {
    return ['byte-identity: no frozen responses path given, so nothing could be compared'];
  }
  const sources = {
    api: { records: readFrozenRecords(frozenResponsesPath), name: 'the frozen file' },
    manual: {
      records: frozenManualResponsesPath && existsSync(frozenManualResponsesPath)
        ? readFrozenRecords(frozenManualResponsesPath)
        : new Map(),
      name: 'the manual frozen file',
    },
  };

  const problems = [];
  for (const entry of index) {
    if (!existsSync(join(dir, entry.file))) continue; // already reported by checkOrphans
    const { records, name } = entry.collection === 'manual' ? sources.manual : sources.api;
    const source = records.get(entry.unit_id);
    if (!source) {
      problems.push(`byte-identity: ${entry.unit_id} does not exist in ${name}`);
      continue;
    }
    const convo = readJson(dir, entry.file);
    for (const turn of convo.turns) {
      const original = source.turns.find((t) => t.turn_index === turn.turn_index);
      if (!original || original.response_text !== turn.response_text) {
        problems.push(`byte-identity: ${entry.unit_id} turn ${turn.turn_index} does not match the frozen response_text`);
      }
    }
  }
  return problems;
}

// Check 4: every rate has its denominator, failed units are never scored, and the counts add up.
export function checkScores(dir, index) {
  const problems = [];
  const scores = readJson(dir, 'scores.json');
  const indexById = new Map(index.map((entry) => [entry.unit_id, entry]));

  for (const entry of index) {
    if (entry.status === 'failed' && !entry.failure?.classification) {
      problems.push(`failure reason missing: ${entry.unit_id} is failed but has no reason`);
    }
  }

  for (const g of scores.groups) {
    const where = `${g.conversation_id}/${g.model_id}`;
    if (g.units_scored + g.units_failed !== g.units_total) {
      problems.push(`counts: ${where} units_scored + units_failed does not equal units_total`);
    }
    for (const u of g.units) {
      const entry = indexById.get(u.unit_id);
      if (!entry) {
        problems.push(`counts: ${where} scores ${u.unit_id}, which is not in index.json`);
        continue;
      }
      if (entry.status === 'failed' && u.status !== 'failed') {
        problems.push(`zero-fill: ${u.unit_id} failed in index.json but is still scored in ${where}`);
      }
    }
    for (const c of g.checkpoints) {
      const at = `${where} turn ${c.turn_index}`;
      if (typeof c.denominator !== 'number') {
        problems.push(`denominator missing: ${at}`);
        continue;
      }
      if (c.denominator !== c.pass + c.fail) {
        problems.push(`denominator wrong: ${at} is not pass + fail`);
      }
      if (c.pass + c.fail + c.split + c.no_valid_judgment !== g.units_scored) {
        problems.push(`counts: ${at} outcomes do not add up to units_scored`);
      }
      const expectedRate = c.denominator === 0 ? null : c.pass / c.denominator;
      if (c.rate !== expectedRate) {
        problems.push(`rate wrong: ${at} is not pass / denominator`);
      }
    }
  }

  const degradation = readJson(dir, 'results/degradation.json');
  for (const m of degradation.models) {
    for (const p of m.points) {
      const at = `degradation ${m.model_id} turn ${p.turn_index}`;
      if (typeof p.denominator !== 'number') {
        problems.push(`denominator missing: ${at}`);
        continue;
      }
      if (p.denominator !== p.pass + p.fail) {
        problems.push(`denominator wrong: ${at} is not pass + fail`);
      }
      const expectedRate = p.denominator === 0 ? null : p.pass / p.denominator;
      if (p.rate !== expectedRate) {
        problems.push(`rate wrong: ${at} is not pass / denominator`);
      }
    }
  }
  return problems;
}

// Check 5 (L062): every unit and group carries a valid collection, the two agree,
// and no manual model reaches the comparison chart.
const COLLECTIONS = ['api', 'manual'];

export function checkCollections(dir, index) {
  const problems = [];
  const indexById = new Map(index.map((entry) => [entry.unit_id, entry]));

  for (const entry of index) {
    if (!COLLECTIONS.includes(entry.collection)) {
      problems.push(`collection: ${entry.unit_id} has invalid collection "${entry.collection}" in index.json`);
    }
  }

  const scores = readJson(dir, 'scores.json');
  for (const g of scores.groups) {
    const where = `${g.conversation_id}/${g.model_id}`;
    if (!COLLECTIONS.includes(g.collection)) {
      problems.push(`collection: group ${where} has invalid collection "${g.collection}"`);
    }
    for (const u of g.units) {
      const entry = indexById.get(u.unit_id);
      if (entry && entry.collection !== g.collection) {
        problems.push(`collection: ${u.unit_id} is "${entry.collection}" in index.json but its group ${where} is "${g.collection}"`);
      }
    }
  }

  const manualModels = new Set(scores.groups.filter((g) => g.collection === 'manual').map((g) => g.model_id));
  const degradation = readJson(dir, 'results/degradation.json');
  for (const m of degradation.models) {
    if (manualModels.has(m.model_id)) {
      problems.push(`collection: manual model ${m.model_id} appears in the degradation chart`);
    }
  }
  const manualUnits = index.filter((entry) => entry.collection === 'manual').length;
  if (degradation.excluded_manual?.units !== manualUnits) {
    problems.push(`collection: degradation.json excluded_manual.units is not the ${manualUnits} manual unit(s) in index.json`);
  }
  return problems;
}
// Check 6 (L062): the computed agreement block reconciles with its own counts.
// Every human item is accounted for exactly once: compared, skipped, not judged, or unparseable.
export function checkAgreement(dir) {
  const file = 'results/agreement.json';
  if (!existsSync(join(dir, file))) return [`agreement: ${file} is missing (it must exist, even as { "status": "none" })`];
  const a = readJson(dir, file);
  if (a.status === 'none') return [];
  if (a.status !== 'computed') return [`agreement: unknown status "${a.status}"`];
  const problems = [];
  if (typeof a.rubric_version !== 'string') problems.push('agreement: rubric_version is missing');
  for (const j of a.judges) {
    const v = j.verdict;
    const at = `agreement ${j.judge}`;
    if (v.agreed + v.disagreed !== v.compared) problems.push(`${at}: agreed + disagreed is not compared`);
    if (v.human_stricter + v.judge_stricter !== v.disagreed) problems.push(`${at}: disagreement directions do not add up`);
    if (v.compared + v.skipped + j.not_judged + j.unparseable !== a.human_items) {
      problems.push(`${at}: counts do not reconcile with the ${a.human_items} human items`);
    }
  }
  return problems;
}
export function validateAppData(dir, { frozenResponsesPath, frozenManualResponsesPath } = {}) {
  const index = readJson(dir, 'index.json');
  return [
    ...checkOrphans(dir, index),
    ...checkSecretsAndNotes(dir),
    ...checkByteIdentity(dir, index, frozenResponsesPath, frozenManualResponsesPath),
    ...checkScores(dir, index),
    ...checkCollections(dir, index),
        ...checkAgreement(dir),
  ];
}

// Run only when started directly:
// node cli/validateAppData.js [dataDir] [frozenResponsesPath] [frozenManualResponsesPath]
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2] ?? 'app/public/data';
  const frozenResponsesPath = process.argv[3] ?? 'data/responses.smoke.jsonl';
  const frozenManualResponsesPath = process.argv[4] ?? 'data/responses.manual.jsonl';
  const problems = validateAppData(dir, { frozenResponsesPath, frozenManualResponsesPath });
  if (problems.length > 0) {
    console.error(`FAIL: ${problems.length} problem(s) in ${dir}`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${dir} is consistent, safe, and honest`);
  }
}