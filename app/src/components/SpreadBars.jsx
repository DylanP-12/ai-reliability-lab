// L056: spread across repetitions, one row per scenario x model pair that was run.
// Honesty rules (see docs/decisions.md):
//   bar = lowest to highest single conversation; no standard-deviation bars at single-digit n
//   one conversation: hollow dot, no bar, and the words "single observation"
//   dashed bar when fewer than SPARSE_N conversations, the same cutoff as the curve
//   no valid result: no marks at all, only the words
import { spreadFor } from '../lib/resultsMath.js';
import { linearScale } from '../lib/scales.js';
import { SPARSE_N } from './DegradationChart.jsx';
import './results.css';

const W = 800;
const LABEL_X = 230;
const PLOT_L = 250;
const PLOT_R = 560;
const TEXT_X = 580;
const TOP = 34;
const ROW_H = 36;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const fmt = (rate) => rate.toFixed(2);

// One sentence per row, used for both the tooltip and the screen reader.
function describeSpread(where, s) {
  const skipped = s.excluded > 0 ? `; not counted: ${plural(s.excluded, 'conversation')} with no valid result` : '';
  if (s.kind === 'no-result') return `${where}: no valid result${skipped}`;
  if (s.kind === 'single') return `${where}: single observation, rate ${fmt(s.point)}, no spread to show${skipped}`;
  const thin = s.n < SPARSE_N ? `, thin evidence (under ${SPARSE_N} conversations)` : '';
  return `${where}: pooled rate ${fmt(s.point)}; single conversations ranged from ${fmt(s.min)} to ${fmt(s.max)}, ` +
    `across ${plural(s.n, 'conversation')}${thin}${skipped}`;
}

// The short text at the right end of each row.
function rowText(s) {
  if (s.kind === 'no-result') return 'no valid result';
  if (s.kind === 'single') return `${fmt(s.point)}, single observation`;
  return `${fmt(s.point)} (${fmt(s.min)} to ${fmt(s.max)}), n=${s.n}`;
}

export function SpreadBars({ scores, models }) {
  const labelOf = new Map(models.map((m) => [m.model_id, m.label]));
  const rows = [...scores.groups]
    .sort((a, b) => a.conversation_id.localeCompare(b.conversation_id) || a.model_id.localeCompare(b.model_id))
    .map((g) => ({
      key: `${g.conversation_id}|${g.model_id}`,
      where: `${g.conversation_id}, ${labelOf.get(g.model_id) ?? g.model_id}`,
      s: spreadFor(g),
    }));

  if (rows.length === 0) return <p className="chart__notice">No scored pairs yet.</p>;

  const x = linearScale({ domain: [0, 1], range: [PLOT_L, PLOT_R] });
  const H = TOP + rows.length * ROW_H + 8;
  const withRange = rows.filter((r) => r.s.kind === 'range').length;
  const summary = `Spread across repetitions for ${rows.length} scenario and model pairs. ` +
    `${withRange} of ${rows.length} have two or more conversations to compare.`;

  return (
    <div className="spread">
      <p className="chart__key">
        One row per scenario and model that was run. The dot is the pooled pass rate, the same number as the
        heatmap. The bar runs from the lowest to the highest single conversation, so a long bar means the
        model was inconsistent even when its average looks good. One conversation gets a hollow dot and no
        bar: there is nothing to compare. Dashed bar: fewer than {SPARSE_N} conversations.
      </p>

      <div className="spread__scroll">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }} role="group" aria-label={summary}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line className="spread__grid" x1={x(t)} x2={x(t)} y1={TOP - 6} y2={H - 8} />
              <text className="spread__tick" x={x(t)} y={TOP - 12} textAnchor="middle">{fmt(t)}</text>
            </g>
          ))}

          {rows.map(({ key, where, s }, i) => {
            const cy = TOP + i * ROW_H + ROW_H / 2;
            const label = describeSpread(where, s);
            return (
              <g key={key} className="spread__row" tabIndex={0} role="img" aria-label={label}>
                <title>{label}</title>
                <rect className="spread__hit" x={0} y={cy - ROW_H / 2} width={W} height={ROW_H} />
                <text className="spread__label" x={LABEL_X} y={cy} textAnchor="end" dominantBaseline="middle">
                  {where}
                </text>
                {s.kind === 'range' && (
                  <>
                    <line className="spread__bar" x1={x(s.min)} x2={x(s.max)} y1={cy} y2={cy}
                      strokeDasharray={s.n < SPARSE_N ? '5 4' : undefined} />
                    <line className="spread__bar" x1={x(s.min)} x2={x(s.min)} y1={cy - 7} y2={cy + 7} />
                    <line className="spread__bar" x1={x(s.max)} x2={x(s.max)} y1={cy - 7} y2={cy + 7} />
                  </>
                )}
                {s.kind !== 'no-result' && (
                  <circle className={`spread__dot${s.kind === 'single' ? ' is-hollow' : ''}`}
                    cx={x(s.point)} cy={cy} r={5} />
                )}
                <text className={`spread__value${s.kind === 'range' ? '' : ' is-muted'}`} x={TEXT_X} y={cy}
                  dominantBaseline="middle">
                  {rowText(s)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <details className="chart__details">
        <summary>Show the spread as a table</summary>
        <div className="chart__table-wrap">
          <table className="chart__table">
            <caption>Pass rate per scenario and model: pooled, and the lowest and highest single conversation</caption>
            <thead>
              <tr>
                <th scope="col">Pair</th>
                <th scope="col">Pooled</th>
                <th scope="col">Lowest</th>
                <th scope="col">Highest</th>
                <th scope="col">Conversations counted</th>
                <th scope="col">Not counted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, where, s }) => (
                <tr key={key} className={s.n < SPARSE_N ? 'is-thin' : undefined}>
                  <th scope="row">{where}</th>
                  <td>{s.kind === 'no-result' ? '–' : fmt(s.point)}</td>
                  <td>{s.kind === 'range' ? fmt(s.min) : '–'}</td>
                  <td>{s.kind === 'range' ? fmt(s.max) : '–'}</td>
                  <td>{s.n}</td>
                  <td>{s.excluded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}