// L054: Scoring screen. Stored replay of frozen judge results, plus a labeled live-demo path.
import { useEffect, useState } from 'react';
import { dataStore } from '../lib/dataStore.js';
import { summarizeJudgments } from '../lib/judgmentSummary.js';
import EvaluationCard from '../components/EvaluationCard.jsx';
import JudgePacketView from '../components/JudgePacketView.jsx';
import LiveDemoPanel from '../components/LiveDemoPanel.jsx';
import '../components/scoring.css';

function JudgmentSummary({ evals }) {
  const s = summarizeJudgments(evals);
  return (
    <div className={`judgment-summary ${s.disagree ? 'judgment-summary--disagree' : ''}`}>
      <strong>{s.total} judgments:</strong> {s.pass} pass, {s.fail} fail, {s.not_scored} not scored
      {s.disagree && <p>Judges disagree on this checkpoint. This usually means the rubric is unclear here.</p>}
      {s.critical_disputed && (
        <p className="judgment-summary__disputed">
          Disputed: at least one judge saw a critical failure. Needs human review.
        </p>
      )}
    </div>
  );
}

export function ScoringScreen() {
  const [index, setIndex] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [unitId, setUnitId] = useState('');
  const [turn, setTurn] = useState('');
  const [evals, setEvals] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [mode, setMode] = useState('stored');
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([dataStore.getIndex(), dataStore.getRubric()])
      .then(([idx, rub]) => { setIndex(idx); setRubric(rub); })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!unitId) { setEvals(null); setConversation(null); return; }
    let cancelled = false;
    setEvals(null);
    setConversation(null);
    Promise.all([dataStore.getEvaluations(unitId), dataStore.getConversation(unitId)])
      .then(([list, convo]) => {
        if (!cancelled) { setEvals(list); setConversation(convo); }
      })
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

      <div className="scoring__modes">
        <button aria-pressed={mode === 'stored'} onClick={() => setMode('stored')}>
          Stored results (frozen research data)
        </button>
        <button aria-pressed={mode === 'demo'} onClick={() => setMode('demo')}>
          Live demo (not part of the study)
        </button>
      </div>

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

      {conversation && turn !== '' && (
        <JudgePacketView
          rubric={rubric}
          conversation={conversation}
          turnIndex={Number(turn)}
          identity={[entry.model_id, entry.unit_id]}
        />
      )}

      {mode === 'demo' && turn !== '' && <LiveDemoPanel />}

      {mode === 'stored' && (
        <>
          {evals && turn !== '' && shown.length === 0 && <p>No judgments recorded for this checkpoint.</p>}
          {shown.length > 1 && <JudgmentSummary evals={shown} />}
          <div className="scoring__cards">
            {shown.map((e) => <EvaluationCard key={e.eval_id} evaluation={e} rubric={rubric} />)}
          </div>
        </>
      )}
    </section>
  );
}