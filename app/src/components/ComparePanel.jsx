// ComparePanel.jsx
// Side-by-side: one scenario, two conversations, aligned on turn_index.
// Both sides load through the same race-safe hook as the main viewer.
import { useState } from 'react'
import { useTranscript } from '../lib/useTranscript'
import './transcript.css'

function unitLabel(u) {
  return `${u.model_id} · r${String(u.repetition).padStart(2, '0')} · ${u.status}`
}

export function ComparePanel({ units }) {
  const scenarioIds = [...new Set(units.map(u => u.conversation_id))].sort()
  const [scenarioId, setScenarioId] = useState('')
  const [leftId, setLeftId] = useState('')
  const [rightId, setRightId] = useState('')

  // Hooks must run on every render in the same order, so always call both.
  const left = useTranscript(leftId || null)
  const right = useTranscript(rightId || null)

  const options = units
    .filter(u => u.conversation_id === scenarioId)
    .sort((a, b) => a.model_id.localeCompare(b.model_id) || a.repetition - b.repetition)
  const modelCount = new Set(options.map(u => u.model_id)).size

  function pickScenario(id) {
    setScenarioId(id)
    setLeftId('')
    setRightId('')
  }

  const unitSelect = (label, value, setValue) => (
    <label>
      {label}{' '}
      <select value={value} onChange={e => setValue(e.target.value)} disabled={!scenarioId}>
        <option value="">Choose…</option>
        {options.map(u => <option key={u.unit_id} value={u.unit_id}>{unitLabel(u)}</option>)}
      </select>
    </label>
  )

  return (
    <div className="compare">
      <div className="compare-controls">
        <label>
          Scenario{' '}
          <select value={scenarioId} onChange={e => pickScenario(e.target.value)}>
            <option value="">Choose…</option>
            {scenarioIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        {unitSelect('Left', leftId, setLeftId)}
        {unitSelect('Right', rightId, setRightId)}
      </div>

      {scenarioId && modelCount === 1 && (
        <p className="compare-note">
          Only one model ran {scenarioId} in this dataset, so you can compare its repetitions.
        </p>
      )}

      {leftId && rightId && (
        <CompareBody
          left={left}
          right={right}
          leftUnit={units.find(u => u.unit_id === leftId)}
          rightUnit={units.find(u => u.unit_id === rightId)}
        />
      )}
    </div>
  )
}

// What a side should show instead of turns, or null when it is ready.
function sideProblem(side) {
  if (side.error) return `could not load (${side.error})`
  if (!side.transcript) return 'loading…'
  if (side.mismatch) return `mismatch (loaded ${side.transcript.unit_id})`
  return null
}

function CompareBody({ left, right, leftUnit, rightUnit }) {
  const lp = sideProblem(left)
  const rp = sideProblem(right)
  if (lp || rp) {
    return <p role="status">Left: {lp ?? 'ready'} · Right: {rp ?? 'ready'}</p>
  }

  // Join on turn_index, never array position.
  const byIndex = t => new Map(t.turns.map(turn => [turn.turn_index, turn]))
  const L = byIndex(left.transcript)
  const R = byIndex(right.transcript)
  const indexes = [...new Set([...L.keys(), ...R.keys()])].sort((a, b) => a - b)

  const gap = (i, unit) => (
    <em className="compare-gap">
      No turn {i} in this conversation
      {unit.status !== 'complete' ? ` (status: ${unit.status}; it stopped early)` : ''}
    </em>
  )
  const reply = text => (text ? text : <em>(nothing recorded)</em>)

  return (
    <div className="compare-wrap">
      <table className="compare-table">
        <thead>
          <tr>
            <th scope="col" className="col-turn">Turn</th>
            <th scope="col">User (same script for both)</th>
            <th scope="col">Left: {unitLabel(leftUnit)}</th>
            <th scope="col">Right: {unitLabel(rightUnit)}</th>
          </tr>
        </thead>
        <tbody>
          {indexes.map(i => {
            const l = L.get(i)
            const r = R.get(i)
            const scored = l?.is_checkpoint || r?.is_checkpoint
            const promptsDiffer = l && r && l.prompt_text !== r.prompt_text
            return (
              <tr key={i} className={scored ? 'compare-row-checkpoint' : undefined}>
                <th scope="row">
                  {i} {scored && <span className="badge badge-checkpoint">Scored</span>}
                </th>
                <td>
                  {promptsDiffer
                    ? <span role="alert">Prompts differ at this turn: check the join.</span>
                    : (l ?? r).prompt_text}
                </td>
                <td>{l ? reply(l.response_text) : gap(i, leftUnit)}</td>
                <td>{r ? reply(r.response_text) : gap(i, rightUnit)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}