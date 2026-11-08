// L054: Scoring screen. Stored replay of frozen judge results.
import { useEffect, useState } from 'react';
import { dataStore } from '../lib/dataStore.js';
import EvaluationCard from '../components/EvaluationCard.jsx';
import '../components/scoring.css';

export function ScoringScreen() {
  const [index, setIndex] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [unitId, setUnitId] = useState('');
  const [turn, setTurn] = useState('');
  const [evals, setEvals] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([dataStore.getIndex(), dataStore.getRubric()])
      .then(([idx, rub]) => { setIndex(idx); setRubric(rub); })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!unitId) { setEvals(null); return; }
    let cancelled = false;
    setEvals(null);
    dataStore.getEvaluations(unitId)
      .then((list) => { if (!cancelled) setEvals(list); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [unitId]);

  if (error) return <p className="error">Could not load scoring data: {error}</p>;
  if (!index || !rubric) return <p>Loading…</p>;

  const entry = index.find((u) => u.unit_id === unitId);
  const shown = evals && turn !== '' ? evals.filter((e) => e.turn_index === Number(turn)) : [];

  return (
    <section className="scoring">
      <h2>Scoring</h2>
      <p className="scoring__mode">Stored results: frozen research data</p>

      <div className="scoring__pickers">
        <label>
          Conversation:{' '}
          <select value={unitId} onChange={(ev) => { setUnitId(ev.target.value); setTurn(''); }}>
            <option value="">Choose…</option>
            {index.map((u) => (
              <option key={u.unit_id} value={u.unit_id}>
                {u.conversation_id} · {u.model_id} · rep {u.repetition}
                {u.status === 'failed' ? ' (failed run)' : ''}
              </option>
            ))}
          </select>
        </label>
        {entry && (
          <label>
            Checkpoint:{' '}
            <select value={turn} onChange={(ev) => setTurn(ev.target.value)}>
              <option value="">Choose…</option>
              {entry.checkpoint_turns.map((t) => (
                <option key={t} value={t}>turn {t}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {unitId && turn !== '' && evals === null && <p>Loading judgments…</p>}
      {evals && turn !== '' && shown.length === 0 && <p>No judgments recorded for this checkpoint.</p>}

      <div className="scoring__cards">
        {shown.map((e) => <EvaluationCard key={e.eval_id} evaluation={e} rubric={rubric} />)}
      </div>
    </section>
  );
}