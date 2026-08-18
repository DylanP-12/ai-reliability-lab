export function mean(numbers) {
  return numbers.reduce((total, current) => total + current, 0) / numbers.length;
}

export function weightedScore(scores, weights) {
  return scores.reduce((sum, s, i) => sum + s * weights[i], 0);
}

export function clamp(x, lo, hi) {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}