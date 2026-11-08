import { useState } from 'react'
import { parseCsv, parseScenarios } from '@core/parseScenarios.js'
import { ScenarioTable } from './ScenarioTable'

// Pure: text in, result out. Called during render (derive, don't store, L047),
// so the result can never disagree with the text on screen.
function validate(text, allowedCategories) {
  const clean = text.replace(/^\uFEFF/, '')   // strip a BOM (Excel adds one; see debugging practice)
  if (clean.trim() === '') return { status: 'empty' }
  try {
    const scenarios = parseScenarios(clean, { allowedCategories })
    return { status: 'valid', scenarios, clean }
  } catch (err) {
    if (!Array.isArray(err.problems)) {
      // Not a CSV problem: a bug. Say so plainly instead of dressing it up as validation.
      return { status: 'crash', message: err.message }
    }
    const problems = [...err.problems].sort((a, b) => a.row - b.row)
    return { status: 'invalid', problems, clean }
  }
}

export function CsvImport({ allowedCategories }) {
  const [text, setText] = useState('')
  const result = validate(text, allowedCategories)   // derived on every render, never stored

  async function handleFile(e) {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    setText(await file.text())   // reads locally in the browser; nothing is uploaded
    input.value = ''             // so picking the SAME file again still fires onChange
  }

  return (
    <section className="csv-import">
      <h3>Import a CSV <span className="local-tag">local · unsaved</span></h3>
      <p className="local-note">
        Files stay in your browser. Nothing is uploaded, and nothing here changes the
        app’s published data.
      </p>
      <p className="category-mode">
        {allowedCategories
          ? `Categories are checked against the dataset’s declared list: ${allowedCategories.join(', ')}.`
          : 'Declared category list not loaded: categories are only checked for being non-blank and consistent.'}
      </p>

      <label className="file-pick">
        Choose a file: <input type="file" accept=".csv,text/csv" onChange={handleFile} />
      </label>

      <label htmlFor="csv-text">…or paste CSV text:</label>
      <textarea
        id="csv-text"
        rows={10}
        spellCheck={false}
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <ValidationReport result={result} />
    </section>
  )
}

function ValidationReport({ result }) {
  if (result.status === 'empty') {
    return <p className="hint">Paste CSV text or choose a file to validate it.</p>
  }
  if (result.status === 'crash') {
    return <p role="alert">Unexpected error (a bug, not a CSV problem): {result.message}</p>
  }
  if (result.status === 'valid') {
    const checkpoints = result.scenarios.reduce((n, s) => n + s.checkpoints.length, 0)
    return (
      <>
        <p className="valid-summary">
          ✓ Valid: {result.scenarios.length} scenarios, {checkpoints} checkpoints.
        </p>
        <ScenarioTable scenarios={result.scenarios} />
      </>
    )
  }

  // invalid: summary, problem list, and the rows themselves, side by side
  const badRows = new Set(result.problems.map(p => p.row))
  const n = result.problems.length
  return (
    <>
      <p className="invalid-summary" role="alert">
        ✗ {n} problem{n === 1 ? '' : 's'} in {badRows.size} row{badRows.size === 1 ? '' : 's'}.
      </p>
      <div className="table-scroll">
        <table className="problem-table">
          <thead>
            <tr><th scope="col">Row</th><th scope="col">Field</th><th scope="col">Problem</th></tr>
          </thead>
          <tbody>
            {result.problems.map((p, i) => (
              <tr key={i}>
                <td>{p.row}</td>
                <td>{p.field}</td>
                <td>{p.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RowPreview text={result.clean} badRows={badRows} />
    </>
  )
}

// The rows exactly as the validator numbers them: core's parseCsv, row = position + 1.
function RowPreview({ text, badRows }) {
  const rows = parseCsv(text)
  return (
    <div className="table-scroll">
      <table className="row-preview">
        <caption>Rows as the validator sees them (problem rows marked)</caption>
        <tbody>
          {rows.map((cells, i) => {
            const rowNum = i + 1
            return (
              <tr key={rowNum} className={badRows.has(rowNum) ? 'problem-row' : undefined}>
                <th scope="row">{rowNum}</th>
                {cells.map((c, j) => <td key={j}>{c}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}