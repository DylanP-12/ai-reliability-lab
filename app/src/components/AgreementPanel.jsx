// L056: how far to trust the judge: the instrument's own error bar, on the same screen as its results.
// Honesty rules (see docs/decisions.md):
//   counts, never a bare percentage: "7 of 7" shows how small the check was, "100%" hides it
//   coverage: how many checkpoints were checked vs how many this screen counts
//   the limitations travel with the number, not only in a separate doc
//   no calibration yet: say so in plain words; the panel never disappears
import './results.css';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function AgreementPanel({ calibration, scores }) {
  const counted = scores.groups.reduce(
    (total, g) => total + g.checkpoints.reduce((sum, c) => sum + c.denominator, 0),
    0,
  );

  if (calibration.status === 'none') {
    return (
      <div className="agreement agreement--none">
        <p className="agreement__headline">No calibration yet.</p>
        <p>
          No person has checked the judge's scores against their own. Every number on this screen is the
          AI judge's verdict, unverified. This screen counts {plural(counted, 'checkpoint')}.
        </p>
      </div>
    );
  }

  const c = calibration;
  const d = c.disagreements;
  const expert = c.status === 'expert';

  return (
    <div className="agreement">
      <p className={`agreement__badge${expert ? ' is-expert' : ''}`}>
        {expert ? 'Expert calibration' : 'Practice check, not a calibration'}
      </p>
      <p className="agreement__headline">
        Human and judge agreed on {c.checkpoints_agreed} of {plural(c.checkpoints_compared, 'checkpoint')}{' '}
        ({c.criteria_agreed} of {c.criteria_compared} criterion scores).
      </p>
      <dl className="agreement__facts">
        <dt>Checked</dt>
        <dd>{c.as_of}, by {c.rater}, against {c.rubric_version}</dd>
        <dt>Coverage</dt>
        <dd>
          {plural(c.checkpoints_compared, 'checkpoint')} checked; this screen counts {counted}.
          Anything scored after {c.as_of} was not part of the check.
        </dd>
        <dt>Excluded</dt>
        <dd>{c.excluded}</dd>
        <dt>Disagreements</dt>
        <dd>{d.rubric_ambiguity} rubric ambiguity, {d.judge_error} judge error, {d.hard_case} hard case</dd>
      </dl>
      <p className="agreement__subhead">Read this before trusting the number:</p>
      <ul className="agreement__limits">
        {c.limitations.map((line) => <li key={line}>{line}</li>)}
      </ul>
      <p className="chart__key">The AI judge is preliminary scoring, not ground truth.</p>
    </div>
  );
}