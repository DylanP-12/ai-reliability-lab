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
    getIndex:        () => loadJson('index.json'),
    getScenarios:    () => loadJson('scenarios.json'),
    getScenariosMeta: () => loadJson('scenarios.meta.json'),
    getModels:       () => loadJson('models.json'),
    getScores:       () => loadJson('scores.json'),
    getResults:      () => loadJson('results/degradation.json'),
     getConversation: async (unitId) => {
    
        const index = await loadJson('index.json');
      const entry = index.find(u => u.unit_id === unitId);
      if (!entry) throw new Error(`Unknown unit: ${unitId}`);
      return loadJson(entry.file);
    },
    clearCache:      () => cache.clear(),
  };
}

export const dataStore = createDataStore();