// tests/absentPhaseR.test.js: the state every clone is in (L062).
// Phase R files are gitignored, so a reviewer has none of them. The pipeline must still run clean.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareAppData } from '../cli/prepare-app-data.js';
import { validateAppData } from '../cli/validateAppData.js';
import { buildFixture, fixturePaths } from './helpers/appDataFixture.js';

const readJson = (dir, file) => JSON.parse(readFileSync(join(dir, file), 'utf8'));

test('ACCEPT/manual: absent Phase R files: every unit is api, nothing excluded, agreement none, validator clean', () => {
  const dir = mkdtempSync(join(tmpdir(), 'absent-'));
  const missing = 'data/__absent_on_purpose__.jsonl';
  const src = buildFixture();
  const paths = fixturePaths(src);
  try {
    prepareAppData({
      ...paths,
      outDir: dir,
      manualResponsesPath: missing,
      manualEvaluationsPath: missing,
      humanEvaluationsPath: missing,
      calibrationPath: 'data/__absent_on_purpose__.json',
    });
    const index = readJson(dir, 'index.json');
    assert.ok(index.length > 0, 'the API units must still be there');
    assert.ok(index.every((u) => u.collection === 'api'));
    assert.equal(readJson(dir, 'results/degradation.json').excluded_manual.units, 0);
    assert.deepEqual(readJson(dir, 'results/agreement.json'), { status: 'none' });
    assert.deepEqual(readJson(dir, 'calibration.json'), { status: 'none' });
    assert.deepEqual(validateAppData(dir, { frozenResponsesPath: paths.responsesPath }), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(src, { recursive: true, force: true });
  }
});