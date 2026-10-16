// cli/writeManifest.js
// Builds manifest.json: a small, safe-to-share summary of a run.
// It holds counts and hashes only, never response text.
import { readFile, open } from 'node:fs/promises';
import { sha256 } from '../core/runConversation.js';

// Hash a file's exact bytes. readFile with no encoding returns raw bytes,
// so nothing is converted before hashing.
export async function hashFile(path) {
  const bytes = await readFile(path);
  return sha256(bytes);
}

// Build the manifest object. Pure: it reads no files and writes no files.
export function buildManifest({ config, models, datasetHash, counts, startedAt, finishedAt, codeVersion = null }) {
  // Fail closed if the config is missing a field the manifest needs.
  const REQUIRED = ['run_id', 'dataset_version', 'seed', 'repetitions', 'concurrency'];
  const missing = REQUIRED.filter(key => config[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Manifest: config is missing ${missing.join(', ')}`);
  }

  return {
    run_id: config.run_id,
    dataset_version: config.dataset_version,
    dataset_hash: datasetHash,
    seed: config.seed,
    models: models.map(m => m.model_id),
    repetitions: config.repetitions,
    concurrency: config.concurrency,
    unit_count: counts.unit_count,
    complete_count: counts.complete_count,
    failed_count: counts.failed_count,
    started_at: startedAt,
    finished_at: finishedAt,
    config_snapshot: config,
    code_version: codeVersion,
  };
}


// Write the manifest whole: 'w' replaces any old version (unlike responses,
// which are opened with 'a' to append). sync() is fsync: wait until the
// bytes are on disk before reporting success.
export async function writeManifest(path, manifest) {
  const text = JSON.stringify(manifest, null, 2) + '\n';
  const handle = await open(path, 'w');
  try {
    await handle.writeFile(text, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  return manifest;
}


// Count units by their current status, reading the responses file back.
// For each unit_id, 'complete' wins: a failed-then-retried unit counts as complete.
export async function tallyResponses(path) {
  let text = '';
  try {
    text = await readFile(path, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // no file yet = nothing done yet; any other error is real
  }

  const complete = new Set();
  const failed = new Set();
  let line_count = 0;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    line_count++;
    const record = JSON.parse(line); // a corrupt line throws: fail loudly, never guess
    if (record.status === 'complete') complete.add(record.unit_id);
    else if (record.status === 'failed') failed.add(record.unit_id);
  }
  for (const id of complete) failed.delete(id); // complete wins

  return { line_count, complete_count: complete.size, failed_count: failed.size };
}