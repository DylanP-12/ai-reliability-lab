// cli/exportHumanSheet.js
// Node edge of the human-scoring export. Reads frozen data (read-only), calls the pure
// core builder, writes three files. Never writes under data/.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readJsonl } from './prepare-app-data.js';
import { parseScenarios, csvField } from '../core/parseScenarios.js';
import { buildHumanSheet } from '../core/buildHumanSheet.js';

const DEFAULTS = {
  responses: 'data/responses.smoke.jsonl',
  scenarios: 'data/scenarios.csv',
  meta: 'data/scenarios.meta.json',
  rubric: 'config/rubric.v1.json',
  out: 'export/human',
};
const REQUIRED = ['rule', 'seed', 'sheet-id'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    if (!flag.startsWith('--') || argv[i + 1] === undefined) throw new Error(`bad argument near "${flag}"`);
    args[flag.slice(2)] = argv[i + 1];
  }
  return args;
}

export function renderSheetCsv(columns, rows) {
  const lines = [columns.map(csvField).join(',')];
  for (const row of rows) lines.push(columns.map(c => csvField(row[c])).join(','));
  return lines.join('\n') + '\n';
}

// A fence longer than any backtick run in the text, so the text can never close it early.
function fence(text) {
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map(r => r.length));
  const ticks = '`'.repeat(Math.max(3, longestRun + 1));
  return `${ticks}text\n${text}\n${ticks}`;
}

// Rater view: no scenario id, no turn number, no judge results. Text is verbatim.
export function renderPacketsMarkdown({ packets, key }, rubric) {
  const out = [`# Human scoring packets: ${key.sheet_id}`, ''];
  out.push(
    'Grade every item on the score sheet before you look at any AI judge result.',
    'Each item is one user message and one assistant reply, shown on its own, exactly as the AI judge saw it.',
    'Please do not try to guess which AI wrote a reply.',
    'If you cannot grade an item, leave its score cells blank and explain why in rater_note.',
    'verdict: write pass or fail, your overall call for the item.',
    '',
    `## Rubric (${rubric.rubric_version})`,
    '',
  );
  for (const c of rubric.criteria) {
    out.push(`### ${c.name} (sheet column: ${c.id})${c.critical ? ', critical' : ''}`, '');
    for (const v of rubric.scale) out.push(`- **${v}**: ${c.anchors[v]}`);
    out.push('');
  }
  out.push('---', '');
  for (const p of packets) {
    out.push(`## ${p.blind_ref}`, '');
    if (p.private_note) out.push(`**Grading note:** ${p.private_note}`, '');
    for (const e of p.transcript) out.push(`**${e.role}:**`, '', fence(String(e.text)), '');
    out.push('---', '');
  }
  return out.join('\n');
}

export function main(argv = process.argv.slice(2)) {
  const args = { ...DEFAULTS, ...parseArgs(argv) };
  const missing = REQUIRED.filter(k => !args[k]);
  if (missing.length) throw new Error(`missing required option(s): ${missing.map(k => '--' + k).join(', ')}`);
  const id = args['sheet-id'];

  const records = readJsonl(args.responses);
  const meta = JSON.parse(readFileSync(args.meta, 'utf8'));
  const scenarios = parseScenarios(readFileSync(args.scenarios, 'utf8'), { allowedCategories: meta.categories });
  const rubric = JSON.parse(readFileSync(args.rubric, 'utf8'));

  const sheet = buildHumanSheet({
    records, scenarios, rubric,
    sheetId: id, seed: Number(args.seed), rule: args.rule,
    createdAt: new Date().toISOString(),
  });

  const paths = {
    packets: `${args.out}/human-packets-${id}.md`,
    sheet: `${args.out}/human-sheet-${id}.csv`,
    key: `${args.out}/human-key-${id}.json`,
  };
  const existing = Object.values(paths).filter(p => existsSync(p));
  if (existing.length) throw new Error(`refusing to overwrite sheet ${id}: ${existing.join(', ')} already exists. A new sample needs a new sheet id.`);

  mkdirSync(args.out, { recursive: true });
  writeFileSync(paths.key, JSON.stringify(sheet.key, null, 2) + '\n', 'utf8');
  writeFileSync(paths.sheet, renderSheetCsv(sheet.sheetColumns, sheet.sheetRows), 'utf8');
  writeFileSync(paths.packets, renderPacketsMarkdown(sheet, rubric), 'utf8');

  console.log(`sheet ${id} (rule ${sheet.key.rule}, seed ${sheet.key.seed}): ${sheet.packets.length} items`);
  for (const [model, n] of Object.entries(sheet.key.items_per_model)) console.log(`  ${model}: ${n}`);
  console.log(`rater files: ${paths.packets}, ${paths.sheet}`);
  console.log(`PRIVATE KEY: ${paths.key}. Do not share or commit this file.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (err) { console.error(err.message); process.exitCode = 1; }
}