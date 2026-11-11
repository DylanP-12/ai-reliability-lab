// L056: pure summaries for the Results screen, computed from scores.json.
// No DOM, no React, so Node can test it (same idea as scales.js).
// Counting rule matches scores.json: only pass and fail enter a rate.
// Split and no-valid-judgment results are counted and shown, never folded in.

// One heatmap cell: this scenario x model pair, pooled over checkpoints and repetitions.
export function pooledCell(group) {
  if (!group) return { kind: 'not-run' };
  const sum = (key) => group.checkpoints.reduce((total, c) => total + c[key], 0);
  const pass = sum('pass');
  const n = sum('denominator');
  const cell = {
    pass,
    n,
    split: sum('split'),
    noValid: sum('no_valid_judgment'),
    conversations: group.units_scored,
    failedUnits: group.units_failed,
  };
  // n = 0 is "no result", never a rate of 0.
  return n === 0 ? { kind: 'no-result', ...cell } : { kind: 'rate', rate: pass / n, ...cell };
}

// One rate per repetition (one conversation), across that conversation's checkpoints.
export function repetitionRates(group) {
  const rates = [];
  let excluded = 0;
  for (const unit of group.units) {
    const outcomes = unit.checkpoints.map((c) => c.outcome);
    const pass = outcomes.filter((o) => o === 'pass').length;
    const fail = outcomes.filter((o) => o === 'fail').length;
    if (pass + fail === 0) excluded += 1; // failed collection or no valid verdict: counted, not rated
    else rates.push(pass / (pass + fail));
  }
  return { rates, excluded };
}

// Spread across repetitions: min to max. No bar for one observation.
export function spreadFor(group) {
  const { rates, excluded } = repetitionRates(group);
  if (rates.length === 0) return { kind: 'no-result', n: 0, excluded };
  const base = { point: pooledCell(group).rate, n: rates.length, excluded };
  if (rates.length === 1) return { kind: 'single', ...base };
  return { kind: 'range', min: Math.min(...rates), max: Math.max(...rates), ...base };
}

// Sequential single-hue ramp: light blue (rate 0) to dark blue (rate 1).
const RAMP_LIGHT = [219, 234, 254]; // #dbeafe
const RAMP_DARK = [30, 58, 138];    // #1e3a8a
const BLACK = [0, 0, 0];
const WHITE = [255, 255, 255];

// WCAG relative luminance and contrast ratio.
function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const css = (rgb) => `rgb(${rgb.join(', ')})`;

// Fill and text color for a measured rate. Fails closed: no-data must be handled
// BEFORE calling this, so undefined/null/NaN throw instead of quietly becoming a pale cell.
export function cellColors(rate) {
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error(`cellColors: rate must be a number from 0 to 1, got ${rate}`);
  }
  const fill = RAMP_LIGHT.map((light, i) => Math.round(light + (RAMP_DARK[i] - light) * rate));
  const onBlack = contrastRatio(BLACK, fill);
  const onWhite = contrastRatio(WHITE, fill);
  const text = onBlack >= onWhite ? BLACK : WHITE;
  return { fill: css(fill), text: css(text), contrast: Math.max(onBlack, onWhite) };
}