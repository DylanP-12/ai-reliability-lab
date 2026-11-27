// All app data reads go through this module (L050). basePath is where the
// derived data lives relative to the site. In production that depends on
// Vite's `base` (L065): '/' gives '/data', '/ai-reliability-lab/' gives
// '/ai-reliability-lab/data'. import.meta.env only exists under Vite, so the
// ?. and ?? keep this module importable from node:test.
const BASE_URL = import.meta.env?.BASE_URL ?? '/';

export function createDataStore({ fetchFn = fetch, basePath = '/data' } = {}) {
  const cache = new Map();

  async function loadJson(path) {
    if (cache.has(path)) return cache.get(path);
    const promise = fetchFn(`${basePath}/${path}`).then(res => {
      if (!res.ok) throw new Error(`Failed to load ${path}: HTTP ${res.status}`);
      return res.json();
    });
    cache.set(path, promise);
    return promise;
  }

  return {
    getIndex:         () => loadJson('index.json'),
    getScenarios:     () => loadJson('scenarios.json'),
    getScenariosMeta: () => loadJson('scenarios.meta.json'),
    getModels:        () => loadJson('models.json'),
    getScores:        () => loadJson('scores.json'),
    getResults:       () => loadJson('results/degradation.json'),
    getCalibration:   () => loadJson('calibration.json'),
    getAgreement:     () => loadJson('results/agreement.json'),
    getRubric:        () => loadJson('rubric.json'),
    getManifest:      () => loadJson('manifest.json'),
    getConversation:  async (unitId) => {
      const index = await loadJson('index.json');
      const entry = index.find(u => u.unit_id === unitId);
      if (!entry) throw new Error(`Unknown unit: ${unitId}`);
      return loadJson(entry.file);
    },
    getEvaluations:   async (unitId) => {
      const index = await loadJson('index.json');
      const entry = index.find(u => u.unit_id === unitId);
      if (!entry) throw new Error(`Unknown unit: ${unitId}`);
      return loadJson(entry.eval_file);
    },
    clearCache:       () => cache.clear(),
  };
}

// BASE_URL always ends in '/', so this gives '/data' or '/ai-reliability-lab/data'.
export const dataStore = createDataStore({ basePath: `${BASE_URL}data` });