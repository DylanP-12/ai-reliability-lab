// L054: summarize all judgments of ONE checkpoint for display.
// Not-scored judgments never count as pass or fail, and no average is produced.
export function summarizeJudgments(evals) {
  const scored = evals.filter((e) => e.status !== 'failed' && e.parse_ok === true);
  const pass = scored.filter((e) => e.overall_verdict === 'pass').length;
  const fail = scored.filter((e) => e.overall_verdict === 'fail').length;
  return {
    total: evals.length,
    pass,
    fail,
    not_scored: evals.length - scored.length,
    disagree: pass > 0 && fail > 0,
    critical_disputed: pass > 0 && scored.some((e) => e.critical_failed === true),
  };
}