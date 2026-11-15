// core/agreementReport.js
// Pure: human evals + AI evals in, one agreement block per AI judge out.
// Never pools judges into one statistic, and every exclusion carries a reason.
import { agreementStats } from './agreement.js';

const VERDICTS = ['pass', 'fail'];   // lenient -> strict

export function buildAgreementReport({ humanEvals, aiEvals, rubric }) {
  // Order the scale from lenient to strict using the rubric's own value scores (yes 1 > partial 0.5 > no 0).
  const values = rubric.criteria[0].values;
  const scale = [...rubric.scale].sort((x, y) => values[y] - values[x]);

  const latest = new Map();                                    // a retried eval: the last record wins
  for (const e of aiEvals) if (e.status === 'complete') latest.set(e.eval_id, e);

  const byJudge = new Map();                                   // "qwen3-32b r1" -> Map("unit#turn" -> eval)
  for (const e of latest.values()) {
    const judge = `${e.judge_model_id} r${e.judge_repetition}`;
    if (!byJudge.has(judge)) byJudge.set(judge, new Map());
    byJudge.get(judge).set(`${e.unit_id}#${e.turn_index}`, e);
  }

  return [...byJudge.keys()].sort().map(judge => {
    const items = byJudge.get(judge);
    const excluded = { not_judged: 0, unparseable: 0 };
    const verdictPairs = [];
    const criterionPairs = Object.fromEntries(rubric.criteria.map(c => [c.id, []]));
    for (const h of humanEvals) {
      const e = items.get(`${h.unit_id}#${h.turn_index}`);
      if (!e) { excluded.not_judged++; continue; }
      if (!e.parse_ok) { excluded.unparseable++; continue; }
      verdictPairs.push({ a: h.overall_verdict, b: e.overall_verdict });
      for (const c of rubric.criteria) criterionPairs[c.id].push({ a: h.scores[c.id], b: e.scores[c.id] });
    }
    return {
      judge, excluded,
      verdict: agreementStats(verdictPairs, VERDICTS),
      criteria: Object.fromEntries(Object.entries(criterionPairs).map(([id, p]) => [id, agreementStats(p, scale)])),
    };
  });
}