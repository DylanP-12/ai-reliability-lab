// L054: one judge result. Shows a score ONLY when the judge's answer was parsed.
// Criterion ids, weights, and the critical flag all come from the loaded rubric.

function lowestValue(criterion) {
  const entries = Object.entries(criterion.values);
  return entries.reduce((low, cur) => (cur[1] < low[1] ? cur : low))[0];
}

function NotScored({ title, reason }) {
  return (
    <div className="eval-card__notscored">
      <p><strong>{title}</strong></p>
      <p>Reason: {reason ?? 'unknown'}</p>
      <p>No score is shown, because none exists.</p>
    </div>
  );
}

function Scored({ e, rubric }) {
  const criticalHits = rubric.criteria.filter(
    (c) => c.critical && e.scores[c.id] === lowestValue(c),
  );
  return (
    <>
      <table className="eval-card__table">
        <thead>
          <tr><th>Criterion</th><th>Judge said</th><th>Points</th><th>Weight</th></tr>
        </thead>
        <tbody>
          {rubric.criteria.map((c) => (
            <tr key={c.id}>
              <td>{c.name}{c.critical && <span className="eval-card__tag">critical</span>}</td>
              <td>{e.scores[c.id]}</td>
              <td>{c.values[e.scores[c.id]]}</td>
              <td>{c.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Weighted score: {e.weighted_score.toFixed(2)}</p>
      <p className={`eval-card__verdict eval-card__verdict--${e.overall_verdict}`}>
        Verdict: {e.overall_verdict.toUpperCase()}
      </p>
      {e.critical_failed && criticalHits.map((c) => (
        <p key={c.id} className="eval-card__why">
          FAIL: critical criterion <code>{c.id}</code> scored <code>{e.scores[c.id]}</code>.
          A critical criterion at its lowest value fails the verdict, whatever the weighted score is.
        </p>
      ))}
      {e.critical_failed && criticalHits.length === 0 && (
        <p className="eval-card__why">FAIL: a critical criterion failed, but it is not in the loaded rubric.</p>
      )}
    </>
  );
}

export default function EvaluationCard({ evaluation, rubric }) {
  const e = evaluation;
  return (
    <div className="eval-card">
      <div className="eval-card__head">
        <strong>{e.judge_model_id}</strong> · repetition {e.judge_repetition} · rubric {e.rubric_version}
      </div>
      {e.rubric_version !== rubric.rubric_version && (
        <p className="eval-card__warn">
          This judgment used rubric {e.rubric_version}, but the loaded rubric is {rubric.rubric_version}.
        </p>
      )}
      {e.status === 'failed' ? (
        <NotScored title="Not scored: the judge call failed" reason={e.error_reason} />
      ) : !e.parse_ok ? (
        <NotScored title="Not scored: judge output could not be parsed" reason={e.error_reason} />
      ) : (
        <Scored e={e} rubric={rubric} />
      )}
      <details className="eval-card__raw">
        <summary>Raw judge output</summary>
        <pre>{e.raw_output ?? '(none: the call never returned)'}</pre>
      </details>
    </div>
  );
}