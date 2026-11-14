// core/buildHumanSheet.js
// Pure: records in, rater artifacts out. No fs, no Date.now, no Math.random.
// Rater-facing output (packets, sheet) is built from named safe fields only.
// Model identity lives only in the private key.
import { buildJudgePacket } from './buildJudgePacket.js';
import { shuffle } from './seededRandom.js';

export const SHEET_RULES = ['study-r01', 'rehearsal-all'];

// Later lines win, matching prepare-app-data's latestPerUnit.
function latestPerUnit(records) {
  const byUnit = new Map();
  for (const r of records) byUnit.set(r.unit_id, r);
  return [...byUnit.values()];
}

// Plain < comparison: the same order on every machine, unlike localeCompare.
function byUnitThenTurn(a, b) {
  if (a.record.unit_id !== b.record.unit_id) return a.record.unit_id < b.record.unit_id ? -1 : 1;
  return a.turn_index - b.turn_index;
}

function countByModel(items) {
  const counts = {};
  for (const { record } of items) counts[record.model_id] = (counts[record.model_id] ?? 0) + 1;
  return counts;
}

export function buildHumanSheet({ records, scenarios, rubric, sheetId, seed, rule, createdAt }) {
  if (!SHEET_RULES.includes(rule)) throw new Error(`unknown sampling rule "${rule}"`);
  if (!Number.isInteger(seed)) throw new Error(`seed must be an integer, got ${typeof seed} ${JSON.stringify(seed)}`);
  if (!/^hs-\d{4}-\d{2}-\d{2}$/.test(sheetId)) throw new Error(`sheet id must look like hs-YYYY-MM-DD, got "${sheetId}"`);
  if (!createdAt) throw new Error('createdAt is required');

  // 1. Select per the pre-registered rule.
  let units = latestPerUnit(records).filter(r => r.status === 'complete');
  if (rule === 'study-r01') units = units.filter(r => r.repetition === 1);

  const items = [];
  for (const record of units) {
    const scenario = scenarios.find(s => s.conversation_id === record.conversation_id);
    if (!scenario) throw new Error(`no scenario found for ${record.conversation_id}`);
    for (const turn of record.turns) {
      if (!turn.is_checkpoint) continue;
      if (!scenario.checkpoints.includes(turn.turn_index)) {
        throw new Error(`${record.conversation_id} turn ${turn.turn_index} is a checkpoint in the record but not in the scenario`);
      }
      const note = scenario.turns.find(t => t.turn_index === turn.turn_index).evaluation_note;
      items.push({ record, turn_index: turn.turn_index, evaluation_note: note });
    }
  }
  if (items.length === 0) throw new Error(`rule ${rule} selected no items`);
  if (items.length > 999) throw new Error(`rule ${rule} selected ${items.length} items; blind refs stop at H-999`);

  // 2. Balance: the study rule refuses a lopsided sample.
  const perModel = countByModel(items);
  if (rule === 'study-r01' && new Set(Object.values(perModel)).size !== 1) {
    throw new Error(`rule study-r01 is unbalanced, refusing to build: ${JSON.stringify(perModel)}`);
  }

  // 3. A fixed order first (independent of file order), then the seeded shuffle.
const shuffled = shuffle([...items].sort(byUnitThenTurn), seed);
  // 4. Blind refs are assigned AFTER the shuffle.
  const sheetColumns = ['blind_ref', ...rubric.criteria.map(c => c.id), 'verdict', 'rater_note'];
  const packets = [];
  const sheetRows = [];
  const keyItems = {};
  shuffled.forEach((item, i) => {
    const blind_ref = `H-${String(i + 1).padStart(3, '0')}`;
    const p = buildJudgePacket({
      rubric, conversationRecord: item.record, turn_index: item.turn_index, evaluation_note: item.evaluation_note,
    });
    if (p.transcript.length !== 2) throw new Error(`${blind_ref}: checkpoint turn not found in record`);
    packets.push({ blind_ref, grade_turn_index: p.grade_turn_index, private_note: p.private_note, transcript: p.transcript });
    sheetRows.push(Object.fromEntries(sheetColumns.map(c => [c, c === 'blind_ref' ? blind_ref : ''])));
    keyItems[blind_ref] = { unit_id: item.record.unit_id, turn_index: item.turn_index };
  });

  const versions = [...new Set(shuffled.map(x => x.record.dataset_version ?? null))];
  if (versions.length !== 1) throw new Error(`selected records mix dataset versions: ${versions.join(', ')}`);

  return {
    packets,
    sheetColumns,
    sheetRows,
    key: {
      sheet_id: sheetId, rule, created_at: createdAt, seed,
      rubric_version: rubric.rubric_version, dataset_version: versions[0],
      items_per_model: perModel, items: keyItems,
    },
  };
}