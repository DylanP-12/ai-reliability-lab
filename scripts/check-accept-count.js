// scripts/check-accept-count.js
// Gate: the acceptance matrix must still hold at least MIN tests, all passing.
// Catches a test being deleted, or renamed out of the ACCEPT/ prefix (L063 open item 9).
// Lives in scripts/, not core/, so node:child_process is allowed here.
import { spawnSync } from 'node:child_process';

const MIN = 52;

const run = spawnSync(
  process.execPath,
  ['--test', '--test-name-pattern=ACCEPT/', '--test-reporter=tap'],
  { encoding: 'utf8' }
);

const out = run.stdout ?? '';

// Count the promise itself: result lines whose test NAME starts with ACCEPT/.
// Do not trust "# pass N": the runner also counts each file with no matching
// tests as a passing entry (82 = 51 ACCEPT tests + 31 such files).
const passed = (out.match(/^\s*ok \d+ - ACCEPT\//gm) ?? []).length;
const failed = (out.match(/^\s*not ok \d+ - ACCEPT\//gm) ?? []).length;

// Fail closed: if there is no summary at all, the run did not finish normally.
if (!/^# fail \d+$/m.test(out)) {
  console.error('Could not read the test summary. Output tail:\n' + out.slice(-2000));
  process.exit(1);
}
// run.status also catches a file that crashed before its tests ran.
if (failed > 0 || run.status !== 0) {
  console.error(`Acceptance run failed: ${failed} ACCEPT test(s) failing, exit status ${run.status}.`);
  process.exit(1);
}
if (passed < MIN) {
  console.error(`Acceptance matrix shrank: ${passed} passing ACCEPT tests, expected at least ${MIN}.`);
  process.exit(1);
}
console.log(`Acceptance count OK: ${passed} passing ACCEPT tests (minimum ${MIN}).`);