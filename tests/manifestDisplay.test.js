import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toManifestDisplay } from '../cli/prepare-app-data.js';

const RAW = {
  run_id: 'gen-2026-08-11', dataset_version: 'ds-v1', dataset_hash: 'sha256:abc',
  seed: 20260811, models: ['m1'], repetitions: 10, unit_count: 2, complete_count: 2,
  failed_count: 0, started_at: '2026-08-11T00:00:00Z', finished_at: '2026-08-11T01:00:00Z',
  config_snapshot: { note: 'sk-or-CANARY' },
};

test('manifest: allowlist drops config_snapshot and anything not named', () => {
  const out = toManifestDisplay({ ...RAW, extra: 'sk-or-CANARY2' });
  assert.equal(JSON.stringify(out).includes('CANARY'), false);
  assert.equal(out.run_id, 'gen-2026-08-11');
});

test('manifest: a missing required field fails closed, naming the field', () => {
  const { dataset_hash, ...rest } = RAW;
  assert.throws(() => toManifestDisplay(rest), /dataset_hash/);
});