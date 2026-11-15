// core/agreement.js
// Pure: pairs of labels in, agreement statistics out. Always report the counts beside the statistics.
// categories must be ordered from most lenient to strictest, e.g. ['pass','fail'] or ['yes','partial','no'].
export function agreementStats(pairs, categories) {
  if (!Array.isArray(categories) || categories.length < 2) throw new Error('agreementStats needs at least two ordered categories');
  const K = categories.length;
  const index = new Map(categories.map((c, i) => [c, i]));

  const used = [];
  let excluded = 0;
  for (const { a, b } of pairs) {
    if (a == null || b == null) { excluded++; continue; }           // skipped rows and parse failures never count
    if (!index.has(a) || !index.has(b)) throw new Error(`unknown category in pair: "${a}" / "${b}"`);
    used.push([index.get(a), index.get(b)]);
  }
  const n = used.length;
  if (n === 0) return { n, agreed: 0, disagreed: 0, aStricter: 0, bStricter: 0, kappa: null, kappaWeighted: null, ac1: null, excluded };

  const countA = Array(K).fill(0);
  const countB = Array(K).fill(0);
  const weight = (i, j) => 1 - Math.abs(i - j) / (K - 1);           // linear weights: adjacent misses are partial credit
  let agreed = 0, aStricter = 0, bStricter = 0, weightSum = 0;
  for (const [i, j] of used) {
    countA[i]++; countB[j]++;
    if (i === j) agreed++; else if (i > j) aStricter++; else bStricter++;
    weightSum += weight(i, j);
  }
  const pA = countA.map(c => c / n);
  const pB = countB.map(c => c / n);
  const observed = agreed / n;
  const observedWeighted = weightSum / n;

  let chance = 0, chanceWeighted = 0, chanceAC1 = 0;
  for (let i = 0; i < K; i++) {
    chance += pA[i] * pB[i];
    const pi = (pA[i] + pB[i]) / 2;
    chanceAC1 += pi * (1 - pi) / (K - 1);
    for (let j = 0; j < K; j++) chanceWeighted += weight(i, j) * pA[i] * pB[j];
  }
  // When chance agreement is 100%, the statistic is undefined: say so with null.
  const correct = (obs, exp) => (exp > 1 - 1e-12 ? null : (obs - exp) / (1 - exp));

  return {
    n, agreed, disagreed: n - agreed, aStricter, bStricter,
    kappa: correct(observed, chance),
    kappaWeighted: correct(observedWeighted, chanceWeighted),
    ac1: correct(observed, chanceAC1),
    excluded,
  };
}