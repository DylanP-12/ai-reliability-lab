// cli/appendRecord.js  (Node-only, lives in cli, never core)
import { openSync, writeSync, fsyncSync, closeSync, existsSync, readFileSync } from 'node:fs';
export function appendRecord(path, record) {
  // Step 1: build the WHOLE line first
  const line = JSON.stringify(record) + '\n';

  // Step 2: open in append mode
  const fd = openSync(path, 'a');

  try {
    // Step 3: one single write of the whole line
    writeSync(fd, line);

    // Step 4: force it onto the physical disk
    fsyncSync(fd);
  } finally {
    // Step 5: always close, even if the write threw
    closeSync(fd);
  }
}

export function loadCompleteUnitIds(path) {
  const done = new Set();

  if (!existsSync(path)) return done;

  const text = readFileSync(path, 'utf8');

const lines = text.split('\n').filter(line => line.trim());
  for (const line of lines) {
const rec = JSON.parse(line);
if (rec.status === 'complete') done.add(rec.unit_id);  }

  return done;
}