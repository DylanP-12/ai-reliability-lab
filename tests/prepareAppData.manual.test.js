import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectionOf, mergeUnitSources, tagGroups, readJsonlIfPresent, latestPerUnit, buildScores,
} from '../cli/prepare-app-data.js';

const apiUnit = (id, model = 'm-api') => ({
  unit_id: id, conversation_id: 'C001', model_id: model, status: 'complete',
  turns: [{ turn_index: 1, is_checkpoint: true, upstream_provider: 'SomeProvider' }],
});
const manualUnit = (id, model = 'meta-ai', conv = 'C004') => ({
  unit_id: id, conversation_id: conv, model_id: model, status: 'complete', upstream_provider: 'manual',
  turns: [{ turn_index: 1, is_checkpoint: true, upstream_provider: 'manual' }],
});

test('collectionOf: api, manual, and a failed API unit with null providers is still api', () => {
  assert.equal(collectionOf(apiUnit('a1')), 'api');
  assert.equal(collectionOf(manualUnit('m1')), 'manual');
  const failed = { unit_id: 'f1', status: 'failed', turns: [{ turn_index: 1, upstream_provider: null }] };
  assert.equal(collectionOf(failed), 'api');
});

test('collectionOf: a record mixing manual and API turns throws', () => {
  const mixed = manualUnit('x1');
  mixed.turns.push({ turn_index: 2, upstream_provider: 'SomeProvider' });
  assert.throws(() => collectionOf(mixed), /mixes manual and API/);
});

test('absent manual file: merged units equal the API units exactly, all api', () => {
  const api = [apiUnit('a1'), apiUnit('a2')];
  const merged = mergeUnitSources(api, []);
  assert.deepEqual(merged, latestPerUnit(api));
  assert.ok(merged.every((u) => collectionOf(u) === 'api'));
});

test('a manual record in the API file, or an API record in the manual file, throws', () => {
  assert.throws(() => mergeUnitSources([manualUnit('m1')], []), /manual record found in the API/);
  assert.throws(() => mergeUnitSources([], [apiUnit('a1')]), /API record found in the manual/);
});

test('the same unit_id in both files throws', () => {
  const clash = manualUnit('same');
  assert.throws(() => mergeUnitSources([apiUnit('same')], [clash]), /appears in both/);
});

test('tagGroups: each group carries the collection of its units', () => {
  const units = [apiUnit('a1'), manualUnit('m1')];
  const groups = tagGroups(buildScores(units, []).groups, units);
  const byModel = Object.fromEntries(groups.map((g) => [g.model_id, g.collection]));
  assert.deepEqual(byModel, { 'm-api': 'api', 'meta-ai': 'manual' });
});

test('tagGroups: a group mixing api and manual units throws', () => {
  const units = [apiUnit('a1'), manualUnit('m1', 'm-api', 'C001')];
  assert.throws(() => tagGroups(buildScores(units, []).groups, units), /mixes api and manual/);
});

test('readJsonlIfPresent: a missing file is an empty list, not an error', () => {
  assert.deepEqual(readJsonlIfPresent('data/__does_not_exist__.jsonl'), []);
});