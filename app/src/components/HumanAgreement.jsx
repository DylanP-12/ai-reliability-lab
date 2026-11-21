// L062: human/judge agreement computed from the study's human grades (results/agreement.json).
// Counts with denominators, direction, rubric version, and the hedge on screen, not in a doc.
// status 'none' renders nothing, so the L056 empty state stays the only message.
export function HumanAgreement({ agreement }) {
  if (!agreement || agreement.status !== 'computed') return null

  return (
    <div className="agreement-computed">
      <p className="chart__key">
        Computed from blind human grades of the same checkpoints the judges saw, under {agreement.rubric_version}.
        Agreement is not accuracy: the human grader is not ground truth either.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Judge</th>
            <th scope="col">Agreed</th>
            <th scope="col">Human stricter</th>
            <th scope="col">Judge stricter</th>
            <th scope="col">Not compared</th>
          </tr>
        </thead>
        <tbody>
          {agreement.judges.map((j) => {
            const v = j.verdict
            const notCompared = v.skipped + j.not_judged + j.unparseable
            return (
              <tr key={j.judge}>
                <th scope="row">{j.judge}</th>
                <td>{v.agreed} of {v.compared}</td>
                <td>{v.human_stricter}</td>
                <td>{v.judge_stricter}</td>
                <td>{notCompared} of {agreement.human_items}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="chart__notice">
        Human review of {agreement.human_items} checkpoints. Small calibration sample: indicative, not conclusive.
        Measured under one rubric version on one dataset, so it does not transfer to others.
      </p>
    </div>
  )
}