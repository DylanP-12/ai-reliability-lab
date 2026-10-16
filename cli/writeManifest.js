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