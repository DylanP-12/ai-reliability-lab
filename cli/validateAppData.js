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
// Check 3: every response_text in the app data is exactly the text in the frozen file.
export function checkByteIdentity(dir, index, frozenResponsesPath) {
  if (!frozenResponsesPath) {
    return ['byte-identity: no frozen responses path given, so nothing could be compared'];
  }
  const frozen = new Map();
  const lines = readFileSync(frozenResponsesPath, 'utf8').split('\n').filter((line) => line.trim() !== '');
  for (const line of lines) {
    const record = JSON.parse(line);
    frozen.set(record.unit_id, record);
  }

  const problems = [];
  for (const entry of index) {
    if (!existsSync(join(dir, entry.file))) continue; // already reported by checkOrphans
    const source = frozen.get(entry.unit_id);
    if (!source) {
      problems.push(`byte-identity: ${entry.unit_id} does not exist in the frozen file`);
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

export function validateAppData(dir, { frozenResponsesPath } = {}) {
  const index = readJson(dir, 'index.json');
  return [
    ...checkOrphans(dir, index),
    ...checkSecretsAndNotes(dir),
    ...checkByteIdentity(dir, index, frozenResponsesPath),
  ];
}

// Run only when started directly: node cli/validateAppData.js [dataDir] [frozenResponsesPath]
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2] ?? 'app/public/data';
  const frozenResponsesPath = process.argv[3] ?? 'data/responses.smoke.jsonl';
  const problems = validateAppData(dir, { frozenResponsesPath });
  if (problems.length > 0) {
    console.error(`FAIL: ${problems.length} problem(s) in ${dir}`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${dir} is consistent, safe, and honest`);
  }
}