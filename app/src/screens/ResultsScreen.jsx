// L055-L056: Results screen. Each panel makes one claim and says which:
//   trend by turn (L055 curve), average per scenario x model (heatmap),
//   consistency across repetitions (spread), how far to trust the judge (agreement).
import { useEffect, useState } from 'react';
import { dataStore } from '../lib/dataStore.js';
import { DegradationChart } from '../components/DegradationChart.jsx';
import { Heatmap } from '../components/Heatmap.jsx';
import { SpreadBars } from '../components/SpreadBars.jsx';
import { AgreementPanel } from '../components/AgreementPanel.jsx';

export function ResultsScreen() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      dataStore.getResults(),
      dataStore.getScores(),
      dataStore.getScenarios(),
      dataStore.getModels(),
      dataStore.getCalibration(),
    ])
      .then(([degradation, scores, scenarios, models, calibration]) =>
        setData({ degradation, scores, scenarios, models, calibration }))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">Could not load results: {error}</p>;
  if (!data) return <p>Loading…</p>;

  // Sort by id so each model keeps the same color every time.
  const curveModels = [...data.degradation.models].sort((a, b) => a.model_id.localeCompare(b.model_id));
  const anyPoints = curveModels.some((m) => m.points.length > 0);

  return (
    <section className="results">
      <h2>Results</h2>
      <p className="results__intro">
        Four views of the same scores, each answering one question: does the pass rate change with turn
        position, where does it hold or break, how consistent are the repetitions, and how far can the
        judge be trusted.
      </p>

      <section className="results__panel" aria-labelledby="curve-title">
        <h3 id="curve-title">Trend by scored turn</h3>
        <p className="chart__key">
          Each point is one model at one checkpoint turn, pooled across its conversations and repetitions.
          A point pools every scenario with a checkpoint at that turn, so a change between turns can come
          from which scenarios are scored there, not only from turn position. The heatmap separates scenarios.
        </p>
        {anyPoints
          ? <DegradationChart models={curveModels} />
          : <p className="chart__notice">No results yet. Run collect and score, then prepare-app-data.</p>}
      </section>

      <section className="results__panel" aria-labelledby="heatmap-title">
        <h3 id="heatmap-title">Average by scenario and model</h3>
        <Heatmap scores={data.scores} scenarios={data.scenarios} models={data.models} />
      </section>
      
      <section className="results__panel" aria-labelledby="spread-title">
        <h3 id="spread-title">Consistency across repetitions</h3>
        <SpreadBars scores={data.scores} models={data.models} />
      </section>
      
      <section className="results__panel" aria-labelledby="agreement-title">
        <h3 id="agreement-title">How far to trust the judge</h3>
        <AgreementPanel calibration={data.calibration} scores={data.scores} />
      </section>
    </section>
  );
}