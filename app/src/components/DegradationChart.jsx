// L055: hand-written SVG degradation curve.
// Honesty rules (see docs/decisions.md):
//   y axis fixed at 0..1, never truncated
//   straight segments only, no smoothing
//   dot size from n against a FIXED reference, so thin data looks thin
//   hollow dot + dashed line where n < SPARSE_N
//   n = 0 points are not drawn (never shown as a rate of 0)
import { linearScale } from '../lib/scales.js';
import './results.css';

export const SPARSE_N = 5;   // below this, a point is thin evidence
export const FULL_N = 30;    // dot reaches full size at this n

const W = 800;
const H = 400;
const PAD = { top: 20, right: 24, bottom: 56, left: 64 };
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];

// Square root because a dot's AREA should grow with n, not its radius.
const radiusFor = (n) => 2 + 8 * Math.sqrt(Math.min(n, FULL_N) / FULL_N);
const colorFor = (i) => `var(--series-${(i % 6) + 1})`;
const measured = (p) => p.rate !== null && p.denominator > 0;

function describe(modelId, p) {
  const leftOut = `${p.split} split, ${p.no_valid_judgment} no valid judgment, ${p.units_failed} failed units`;
  if (!measured(p)) return `${modelId}, turn ${p.turn_index}: no valid result (n=0). Not counted: ${leftOut}`;
  return `${modelId}, turn ${p.turn_index}: ${p.pass} of ${p.denominator} passed, rate ${p.rate.toFixed(2)} (n=${p.denominator}). Not counted: ${leftOut}`;
}

export function DegradationChart({ models }) {
  // Sort each model's points ourselves rather than trusting file order.
  const series = models.map((m) => ({
    ...m,
    points: [...m.points].sort((a, b) => a.turn_index - b.turn_index),
  }));

  const turns = [...new Set(series.flatMap((m) => m.points.map((p) => p.turn_index)))]
    .sort((a, b) => a - b);

  // A curve needs at least one model with 2+ measured points. Otherwise, no lonely dots.
  const canDraw = series.some((m) => m.points.filter(measured).length >= 2);

  return (
    <div className="chart">
      {canDraw ? (
        <ChartSvg series={series} turns={turns} />
      ) : (
        <p className="chart__notice">
          Not enough data to plot a curve: no model has measured results at two or more
          turn positions yet. The numbers that do exist are in the table below.
        </p>
      )}
      <NumbersTable series={series} turns={turns} />
    </div>
  );
}

function ChartSvg({ series, turns }) {
  const minT = turns[0];
  const maxT = turns[turns.length - 1];
  const x = linearScale({ domain: [minT - 0.5, maxT + 0.5], range: [PAD.left, W - PAD.right] });
  // Inverted range on purpose: rate 0 at the bottom, 1 at the top.
  const y = linearScale({ domain: [0, 1], range: [H - PAD.bottom, PAD.top] });

  const step = Math.max(1, Math.ceil((maxT - minT + 1) / 12));
  const xTicks = [];
  for (let t = minT; t <= maxT; t += step) xTicks.push(t);

  // Nudge each model a few pixels sideways so dots in the same spot don't hide each other.
  
const nudge = (i) => (i - (series.length - 1) / 2) * 12;  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
           aria-label="Pass rate by scored-turn position, one line per model">
        {Y_TICKS.map((v) => (
          <g key={`y-${v}`}>
            <line className="chart__grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
            <text className="chart__tick" x={PAD.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle">
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {xTicks.map((t) => (
          <g key={`x-${t}`}>
            <line className="chart__axis" x1={x(t)} x2={x(t)} y1={H - PAD.bottom} y2={H - PAD.bottom + 5} />
            <text className="chart__tick" x={x(t)} y={H - PAD.bottom + 18} textAnchor="middle">{t}</text>
          </g>
        ))}

        <line className="chart__axis" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} />
        <line className="chart__axis" x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} />

        <text className="chart__title" x={(PAD.left + W - PAD.right) / 2} y={H - 12} textAnchor="middle">
          Scored-turn position (turn index of the checkpoint)
        </text>
        <text className="chart__title" textAnchor="middle"
              transform={`translate(18 ${(PAD.top + H - PAD.bottom) / 2}) rotate(-90)`}>
          Pass rate
        </text>

        {series.map((m, i) => {
          const color = colorFor(i);
          const pts = m.points;
          return (
            <g key={m.model_id}>
              {pts.slice(1).map((b, k) => {
                const a = pts[k];
                if (!measured(a) || !measured(b)) return null;   // nothing measured: break the line
                const thin = a.denominator < SPARSE_N || b.denominator < SPARSE_N;
                return (
                  <line key={`seg-${b.turn_index}`}
                    x1={x(a.turn_index) + nudge(i)} y1={y(a.rate)}
                    x2={x(b.turn_index) + nudge(i)} y2={y(b.rate)}
                    style={{ stroke: color }} strokeWidth="2"
                    strokeDasharray={thin ? '6 5' : undefined} />
                );
              })}

              {pts.filter(measured).map((p) => {
                const thin = p.denominator < SPARSE_N;
                const text = describe(m.model_id, p);
                return (
                  <circle key={`pt-${p.turn_index}`}
                    cx={x(p.turn_index) + nudge(i)} cy={y(p.rate)} r={radiusFor(p.denominator)}
                    style={{ stroke: color, fill: thin ? 'var(--color-bg)' : color }}
                    strokeWidth="2" tabIndex={0} aria-label={text}>
                    <title>{text}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>

      <ul className="chart__legend">
        {series.map((m, i) => (
          <li key={m.model_id}>
            <span className="chart__swatch" style={{ borderTopColor: colorFor(i) }} />
            {m.model_id}{' '}
            <span className="chart__muted">
              ({m.units_scored} of {m.units_total} units scored, {m.units_failed} failed)
            </span>
          </li>
        ))}
      </ul>

      <p className="chart__key">
        Solid dot and line: n ≥ {SPARSE_N}. Hollow dot or dashed line: n &lt; {SPARSE_N} (thin evidence).
        Dot size grows with n and reaches full size at n = {FULL_N}. Dots are nudged a few pixels
        sideways so overlapping models stay visible. The y axis runs the full 0 to 1. No smoothing.
      </p>
    </>
  );
}

function NumbersTable({ series, turns }) {
  return (
    <div className="chart__table-wrap">
      <table className="chart__table">
        <caption>
          Numbers behind the chart: rate (n) at each turn. n = pass + fail; split and
          no-valid-judgment results are not counted. "–" means that model has no checkpoint at that turn.
        </caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            {turns.map((t) => <th key={t} scope="col">Turn {t}</th>)}
          </tr>
        </thead>
        <tbody>
          {series.map((m) => (
            <tr key={m.model_id}>
              <th scope="row">{m.model_id}</th>
              {turns.map((t) => {
                const p = m.points.find((q) => q.turn_index === t);
                if (!p) return <td key={t} className="is-empty">–</td>;
                if (!measured(p)) {
                  return <td key={t} className="is-nodata" title={describe(m.model_id, p)}>n=0</td>;
                }
                return (
                  <td key={t} className={p.denominator < SPARSE_N ? 'is-thin' : undefined}
                      title={describe(m.model_id, p)}>
                    {p.rate.toFixed(2)} (n={p.denominator})
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}