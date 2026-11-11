// L056: scenario x model heatmap of the pooled pass rate.
// Honesty rules (see docs/decisions.md):
//   sequential single-hue ramp, light = 0, dark = 1; no red/green
//   no-data (not run, or no valid result) sits OUTSIDE the ramp: amber hatch + dash, never pale blue
//   every cell prints its rate and n, so color is never the only channel
//   it shows the MEAN only; consistency lives in the spread panel
import { pooledCell, cellColors } from '../lib/resultsMath.js';
import { SPARSE_N } from './DegradationChart.jsx';
import './results.css';

const LABEL_W = 80;
const HEAD_H = 48;
const CELL_W = 120;
const CELL_H = 56;

// Long model names go on two lines, split at the space nearest the middle.
function twoLines(label) {
  const spaces = [...label].flatMap((ch, i) => (ch === ' ' ? [i] : []));
  if (label.length <= 14 || spaces.length === 0) return [label];
  const mid = label.length / 2;
  const cut = spaces.reduce((best, i) => (Math.abs(i - mid) < Math.abs(best - mid) ? i : best));
  return [label.slice(0, cut), label.slice(cut + 1)];
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// One sentence per cell, used for both the tooltip and the screen reader.
function describeCell(where, cell) {
  if (cell.kind === 'not-run') return `${where}: not run`;
  const notCounted = [];
  if (cell.split > 0) notCounted.push(`${cell.split} split`);
  if (cell.noValid > 0) notCounted.push(`${cell.noValid} with no valid judgment`);
  if (cell.failedUnits > 0) notCounted.push(plural(cell.failedUnits, 'failed conversation'));
  const extra = notCounted.length > 0 ? `; not counted: ${notCounted.join(', ')}` : '';
  if (cell.kind === 'no-result') {
    return `${where}: no valid result from ${plural(cell.conversations, 'conversation')}${extra}`;
  }
    const thin = cell.n < SPARSE_N ? `, thin evidence (under ${SPARSE_N} checkpoints)` : '';
  return `${where}: pass rate ${cell.rate.toFixed(2)}, ${cell.pass} of ${plural(cell.n, 'checkpoint')} passed, ` +
    `from ${plural(cell.conversations, 'conversation')}${thin}${extra}`;
}

// The small second line inside a cell (and the table text for no-data cells).
function shortText(cell) {
  if (cell.kind === 'not-run') return 'not run';
  if (cell.kind === 'no-result') return 'no valid result';
    return `n=${cell.n}, ${cell.conversations} conv.${cell.n < SPARSE_N ? ', thin' : ''}`;
}

export function Heatmap({ scores, scenarios, models }) {
  const rows = scenarios.map((s) => s.conversation_id);
  const cols = [...models].sort((a, b) => a.model_id.localeCompare(b.model_id));
  const groups = new Map(scores.groups.map((g) => [`${g.conversation_id}|${g.model_id}`, g]));

  // A scored pair whose scenario or model is not listed would vanish silently. Say so instead.
  const rowSet = new Set(rows);
  const colSet = new Set(cols.map((m) => m.model_id));
  const unlisted = scores.groups.filter((g) => !rowSet.has(g.conversation_id) || !colSet.has(g.model_id));

  const grid = rows.map((id) => cols.map((m) => pooledCell(groups.get(`${id}|${m.model_id}`))));
  const withData = grid.flat().filter((cell) => cell.kind === 'rate').length;
  const total = rows.length * cols.length;
  const summary = `Heatmap of pass rate for ${rows.length} scenarios by ${cols.length} models. ` +
    `${withData} of ${total} pairs have a result; ${total - withData} have no data.`;

  const W = LABEL_W + cols.length * CELL_W;
  const H = HEAD_H + rows.length * CELL_H;

  return (
    <div className="heatmap">
      <p className="chart__key">
        Each cell is one scenario and one model: checkpoints passed out of checkpoints counted,
        pooled across all its repetitions. It shows the average only, not consistency;
        the spread panel shows how much the repetitions varied. "Thin" marks fewer than {SPARSE_N} counted
        checkpoints, the same cutoff as the curve's hollow dots.
      </p>
      {unlisted.length > 0 && (
        <p className="chart__notice">
          {unlisted.length} scored pair(s) are missing from scenarios.json or models.json and are not shown.
        </p>
      )}

      <div className="heatmap__scroll">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }} role="group" aria-label={summary}>
          <defs>
            <pattern id="heatmap-nodata" width="8" height="8" patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)">
              <rect width="8" height="8" fill="var(--color-bg)" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-unknown)" strokeWidth="2" strokeOpacity="0.35" />
            </pattern>
          </defs>

          {cols.map((m, c) => {
            const lines = twoLines(m.label);
            const cx = LABEL_W + c * CELL_W + CELL_W / 2;
            return (
              <text key={m.model_id} className="heatmap__head" x={cx} y={lines.length === 1 ? 32 : 22}
                textAnchor="middle">
                {lines.map((line, i) => (
                  <tspan key={line} x={cx} dy={i === 0 ? 0 : 15}>{line}</tspan>
                ))}
              </text>
            );
          })}

          {rows.map((id, r) => (
            <g key={id}>
              <text className="heatmap__row" x={LABEL_W - 12} y={HEAD_H + r * CELL_H + CELL_H / 2}
                textAnchor="end" dominantBaseline="middle">
                {id}
              </text>
              {cols.map((m, c) => {
                const cell = grid[r][c];
                const x = LABEL_W + c * CELL_W;
                const y = HEAD_H + r * CELL_H;
                const label = describeCell(`${id}, ${m.label}`, cell);
                const colors = cell.kind === 'rate' ? cellColors(cell.rate) : null;
                                // Only cells with something to say get a Tab stop. "Not run" is printed in the cell
                // and listed in the table, so nothing is lost; it just stops costing 30 key presses.
                const focusable = cell.kind !== 'not-run';
                return (
                  <g key={m.model_id} className="heatmap__cell" tabIndex={focusable ? 0 : undefined}
                    role="img" aria-label={label}>
                    <title>{label}</title>
                    <rect x={x + 2} y={y + 2} width={CELL_W - 4} height={CELL_H - 4} rx="4"
                      fill={colors ? colors.fill : 'url(#heatmap-nodata)'} />
                    <text className="heatmap__value" x={x + CELL_W / 2} y={y + 25} textAnchor="middle"
                      fill={colors ? colors.text : 'var(--color-unknown)'}>
                      {colors ? cell.rate.toFixed(2) : '—'}
                    </text>
                    <text className="heatmap__n" x={x + CELL_W / 2} y={y + 42} textAnchor="middle"
                      fill={colors ? colors.text : 'var(--color-text)'}>
                      {shortText(cell)}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      <p className="heatmap__legend">
        <span>0.00</span>
        <span className="heatmap__ramp"
          style={{ background: `linear-gradient(to right, ${cellColors(0).fill}, ${cellColors(1).fill})` }} />
        <span>1.00 pass rate</span>
        <span className="heatmap__swatch heatmap__swatch--nodata" />
        <span>no data (not run, or no valid result)</span>
      </p>

      <details className="chart__details">
        <summary>Show the heatmap as a table</summary>
        <div className="chart__table-wrap">
          <table className="chart__table">
            <caption>Pass rate by scenario and model (passed / counted checkpoints)</caption>
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                {cols.map((m) => <th key={m.model_id} scope="col">{m.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((id, r) => (
                <tr key={id}>
                  <th scope="row">{id}</th>
                  {grid[r].map((cell, c) => (
                    <td key={cols[c].model_id}
                      className={cell.kind !== 'rate' ? 'is-nodata' : cell.n < SPARSE_N ? 'is-thin' : undefined}>
                      {cell.kind === 'rate' ? `${cell.rate.toFixed(2)} (${cell.pass}/${cell.n})` : shortText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}