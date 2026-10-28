// cli/prepare-app-data.js: frozen data to app-sized chunks (L043)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseScenarios } from '../core/parseScenarios.js';

export function unitFile(unitId) {
  return `conversations/${unitId.replaceAll(':', '_')}.json`;
}

export function readJsonl(path) {
  const text = readFileSync(path, 'utf8');
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));
}

export function latestPerUnit(records) {
  const byUnit = new Map();
  for (const record of records) {
    byUnit.set(record.unit_id, record);
  }
  return [...byUnit.values()];
}

export function toConversation(unit) {
  return {
    unit_id: unit.unit_id,
    turns: unit.turns.map((turn) => ({
      turn_index: turn.turn_index,
      prompt_text: turn.prompt_text,
      response_text: turn.response_text,
      is_checkpoint: turn.is_checkpoint,
    })),
  };
}

export function toIndexEntry(unit) {
  const entry = {
    unit_id: unit.unit_id,
    file: unitFile(unit.unit_id),
    conversation_id: unit.conversation_id,
    model_id: unit.model_id,
    category: unit.category,
    repetition: unit.repetition,
    reasoning_enabled: unit.reasoning_enabled,
    status: unit.status,
    turn_count: unit.turns.length,
    checkpoint_turns: unit.turns
      .filter((turn) => turn.is_checkpoint)
      .map((turn) => turn.turn_index),
  };
  if (unit.status === 'failed') {
    entry.failure = {
      classification: unit.error?.classification ?? 'unknown',
      turn_index: unit.error?.turn_index ?? null,
    };
  }
  return entry;
}

export function toModelDisplay(model) {
  return {
    model_id: model.model_id,
    label: model.label,
    reasoning_enabled: model.reasoning_enabled,
    family: model.family,
    weights: model.weights,
  };
}

export function toScenarioDisplay(scenario) {
  return {
    conversation_id: scenario.conversation_id,
    category: scenario.category,
    turn_count: scenario.turn_count,
    checkpoints: scenario.checkpoints,
    turns: scenario.turns.map((turn) => ({
      turn_index: turn.turn_index,
      prompt_text: turn.prompt_text,
    })),
  };
}

export function prepareAppData({
  responsesPath = 'data/responses.smoke.jsonl',
  modelsPath = 'config/models.json',
  scenariosPath = 'data/scenarios.csv',
  metaPath = 'data/scenarios.meta.json',
  outDir = 'app/public/data',
} = {}) {
  const units = latestPerUnit(readJsonl(responsesPath));

  mkdirSync(`${outDir}/conversations`, { recursive: true });
  for (const unit of units) {
    writeFileSync(
      `${outDir}/${unitFile(unit.unit_id)}`,
      JSON.stringify(toConversation(unit), null, 2),
      'utf8',
    );
  }

  const index = units.map(toIndexEntry);
  writeFileSync(`${outDir}/index.json`, JSON.stringify(index, null, 2), 'utf8');

  const models = JSON.parse(readFileSync(modelsPath, 'utf8')).map(toModelDisplay);
  writeFileSync(`${outDir}/models.json`, JSON.stringify(models, null, 2), 'utf8');

  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const scenarios = parseScenarios(readFileSync(scenariosPath, 'utf8'), {
    allowedCategories: meta.categories,
  }).map(toScenarioDisplay);
  writeFileSync(`${outDir}/scenarios.json`, JSON.stringify(scenarios, null, 2), 'utf8');

  return { units: units.length, index: index.length, models: models.length, scenarios: scenarios.length };
}

// Run only when started directly with `node cli/prepare-app-data.js`, not when imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = prepareAppData();
  console.log(`wrote ${r.units} conversation files to app/public/data/conversations`);
  console.log(`wrote index.json with ${r.index} entries`);
  console.log(`wrote models.json with ${r.models} entries`);
  console.log(`wrote scenarios.json with ${r.scenarios} scenarios`);
}