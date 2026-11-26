// tests/validateAppData.test.js: the validator must pass good data and catch each planted problem (L044)
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareAppData } from '../cli/prepare-app-data.js';
import { validateAppData } from '../cli/validateAppData.js';
import { buildFixture, fixturePaths } from './helpers/appDataFixture.js';

// One fake input set for every test in this file. Never the real data/ (L064).
const SRC = buildFixture();
const PATHS = fixturePaths(SRC);
const FROZEN = PATHS.responsesPath;
const FROZEN_MANUAL = PATHS.manualResponsesPath;
after(() => rmSync(SRC, { recursive: true, force: true }));

function makeGoodData() {
  const dir = mkdtempSync(join(tmpdir(), 'appdata-'));
  prepareAppData({ ...PATHS, outDir: dir });
  return dir;
}

function readJson(dir, file) {
  return JSON.parse(readFileSync(join(dir, file), 'utf8'));
}

function writeJson(dir, file, value) {
  writeFileSync(join(dir, file), JSON.stringify(value, null, 2), 'utf8');
}

test('good data: the validator reports no problems', () => {
  const dir = makeGoodData();
  try {
    assert.deepEqual(validateAppData(dir, { frozenResponsesPath: FROZEN, frozenManualResponsesPath: FROZEN_MANUAL }), []);  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('orphan: an index entry with no transcript file is caught', () => {
  const dir = makeGoodData();
  try {
    const index = readJson(dir, 'index.json');
    index.push({ ...index[0], unit_id: 'ghost:unit', file: 'conversations/ghost_unit.json' });
    writeJson(dir, 'index.json', index);
    const problems = validateAppData(dir, { frozenResponsesPath: FROZEN });
    assert.ok(problems.some((p) => p.includes('ghost:unit')), problems.join('\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ACCEPT/integrity: no secrets: a planted API key in any data file is caught', () => {
  const dir = makeGoodData();
  try {
    const fakeKey = 'sk-or-v1-' + 'a'.repeat(40);
    const models = readJson(dir, 'models.json');
    models[0].label = `leaked ${fakeKey}`;
    writeJson(dir, 'models.json', models);
    const problems = validateAppData(dir, { frozenResponsesPath: FROZEN });
    assert.ok(problems.some((p) => p.includes('secret') && p.includes('models.json')), problems.join('\n'));
    assert.ok(problems.every((p) => !p.includes(fakeKey)), 'the problem message must not repeat the secret');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ACCEPT/integrity: no private notes: an evaluation_note in scenarios.json is caught', () => {
  const dir = makeGoodData();
  try {
    const scenarios = readJson(dir, 'scenarios.json');
    scenarios[0].turns[0].evaluation_note = 'hidden grading note';
    writeJson(dir, 'scenarios.json', scenarios);
    const problems = validateAppData(dir, { frozenResponsesPath: FROZEN });
    assert.ok(problems.some((p) => p.includes('evaluation_note')), problems.join('\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('byte-identity: a response_text that differs from the frozen file is caught', () => {
  const dir = makeGoodData();
  try {
    const index = readJson(dir, 'index.json');
    const file = index[0].file;
    const convo = readJson(dir, file);
    const turn = convo.turns.find((t) => typeof t.response_text === 'string' && t.response_text.length > 0);
    turn.response_text = turn.response_text.slice(0, -1);
    writeJson(dir, file, convo);
    const problems = validateAppData(dir, { frozenResponsesPath: FROZEN });
    assert.ok(
      problems.some((p) => p.includes('byte-identity') && p.includes(convo.unit_id)),
      problems.join('\n'),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('denominator: a rate without its denominator is caught', () => {
  const dir = makeGoodData();
  try {
    const scores = readJson(dir, 'scores.json');
    delete scores.groups[0].checkpoints[0].denominator;
    writeJson(dir, 'scores.json', scores);
    const problems = validateAppData(dir, { frozenResponsesPath: FROZEN });
    assert.ok(problems.some((p) => p.includes('denominator missing')), problems.join('\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('zero-fill: a failed unit that still counts in the scores is caught', () => {
  const dir = makeGoodData();
  try {
    const index = readJson(dir, 'index.json');
    index[0].status = 'failed';
    index[0].failure = { classification: 'rate_limit', turn_index: 3 };
    writeJson(dir, 'index.json', index);
    const problems = validateAppData(dir, { frozenResponsesPath: FROZEN });
    assert.ok(
      problems.some((p) => p.includes('zero-fill') && p.includes(index[0].unit_id)),
      problems.join('\n'),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('degradation: a point whose rate does not match its counts is caught', () => {
  const dir = makeGoodData();
  try {
    const degradation = readJson(dir, 'results/degradation.json');
    const point = degradation.models[0].points[0];
    const realRate = point.rate;
    // Plant a rate that is guaranteed to differ from the real one,
    // whatever the fixture's counts happen to be.
    point.rate = realRate > 0.5 ? 0.1 : 0.9;
    assert.notEqual(point.rate, realRate, 'the planted rate must actually change something');
    writeJson(dir, 'results/degradation.json', degradation);
    const problems = validateAppData(dir, { frozenResponsesPath: FROZEN });
    assert.ok(problems.some((p) => p.includes('rate wrong: degradation')), problems.join('\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});