// tests/manifest.test.js — tests for cli/writeManifest.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildManifest, writeManifest } from '../cli/writeManifest.js';

const config = { run_id: 'r', dataset_version: 'v', seed: 1, repetitions: 1, concurrency: 1 };

test('writeManifest writes whole: a second write replaces the first', async () => {
  // Setup: a fresh temp folder, so the test never touches real files
  const dir = await mkdtemp(join(tmpdir(), 'manifest-'));
  const path = join(dir, 'manifest.json');
  const make = complete_count => buildManifest({
    config, models: [{ model_id: 'a' }], datasetHash: 'sha256:x',
    counts: { unit_count: 2, complete_count, failed_count: 0 },
    startedAt: 's', finishedAt: 'f',
  });

  // Action: write twice
  await writeManifest(path, make(1));
  await writeManifest(path, make(2));

  // Assertion: one valid JSON object, holding the second write's count
  const saved = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(saved.complete_count, 2);
});

test('buildManifest fails closed when config is missing a required field', () => {
  // Setup: a config with one required field removed
  const { seed, ...configWithoutSeed } = config;

  // Action + Assertion: building the manifest must throw, naming the missing field
  assert.throws(
    () => buildManifest({
      config: configWithoutSeed,
      models: [{ model_id: 'a' }], datasetHash: 'sha256:x',
      counts: { unit_count: 2, complete_count: 1, failed_count: 0 },
      startedAt: 's', finishedAt: 'f',
    }),
    /seed/
  );
});