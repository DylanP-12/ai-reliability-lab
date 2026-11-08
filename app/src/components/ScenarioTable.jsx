import { useState } from 'react'
import './scenarios.css'
import './transcript.css'  
// Works for both shapes: scenario-level `checkpoints` (scenarios.json)
// or a per-turn `is_checkpoint` flag (parser output).
function isCheckpoint(scenario, turn) {
  return turn.is_checkpoint === true ||
    (scenario.checkpoints ?? []).includes(turn.turn_index)
}

export function ScenarioTable({ scenarios }) {
  // Which rows are expanded, keyed by conversation_id (L046 toggle pattern).
  const [openIds, setOpenIds] = useState(() => new Set())

  function toggle(id) {
    setOpenIds(prev => {
      const next = new Set(prev)           // never mutate state in place
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="table-scroll">
      <table className="scenario-table">
        <thead>
          <tr>
            <th scope="col">Conversation</th>
            <th scope="col">Category</th>
            <th scope="col">Turns</th>
            <th scope="col">Checkpoints</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map(s => (
            <ScenarioRows
              key={s.conversation_id}
              scenario={s}
              isOpen={openIds.has(s.conversation_id)}
              onToggle={() => toggle(s.conversation_id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScenarioRows({ scenario, isOpen, onToggle }) {
  const checkpointCount = scenario.turns.filter(t => isCheckpoint(scenario, t)).length

  return (
    <>
      <tr>
        <td>
          <button type="button" className="row-toggle" aria-expanded={isOpen} onClick={onToggle}>
            {isOpen ? '▾' : '▸'} {scenario.conversation_id}
          </button>
        </td>
        <td>{scenario.category}</td>
        <td>{scenario.turns.length}</td>
        <td>{checkpointCount}</td>
      </tr>
      {isOpen && (
        <tr className="turns-row">
          <td colSpan={4}>
            <ol className="turn-list">
              {scenario.turns.map(t => {
                const scored = isCheckpoint(scenario, t)
                return (
                  <li key={t.turn_index} className={scored ? 'turn turn-checkpoint' : 'turn'}>
                    <span className="turn-index">Turn {t.turn_index}</span>
                    {scored && <span className="badge badge-checkpoint">Scored</span>}
                                      <span className="turn-prompt">{t.prompt_text}</span>
                    {t.evaluation_note?.trim() && <span className="turn-note">Note: {t.evaluation_note}</span>}
                  </li>
                )
              })}
            </ol>
          </td>
        </tr>
      )}
    </>
  )
}