// L055: Results screen, part 1: the degradation curve. L056 adds heatmap, spread, agreement.
import { useEffect, useState } from 'react';
import { dataStore } from '../lib/dataStore.js';
import { DegradationChart } from '../components/DegradationChart.jsx';

export function ResultsScreen() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    dataStore.getResults()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">Could not load results: {error}</p>;
  if (!data) return <p>Loading…</p>;

  // Sort by id so each model keeps the same color every time.
  const models = [...data.models].sort((a, b) => a.model_id.localeCompare(b.model_id));
  const anyPoints = models.some((m) => m.points.length > 0);

  return (
    <section className="results">
      <h2>Results</h2>
      <p className="results__intro">
        Does a model's pass rate change as the scored turn sits further into the conversation?
        Each point is one model at one checkpoint turn, pooled across its conversations and repetitions.
      </p>
      {anyPoints
        ? <DegradationChart models={models} />
        : <p className="chart__notice">No results yet. Run collect and score, then prepare-app-data.</p>}
    </section>
  );
}