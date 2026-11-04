import { useState } from 'react'
import { StatusBadge } from './StatusBadge'

export function UnitRow({ unit, onFlag }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <li className="unit-row">
      <span>{unit.conversation_id}</span>
      <span>{unit.model_id}</span>
      <StatusBadge status={unit.status} />
      <span>
        {unit.checkpoint_turns.length}{' '}
        {unit.checkpoint_turns.length === 1 ? 'checkpoint' : 'checkpoints'}
      </span>
      <button onClick={() => onFlag(unit.unit_id)}>
        {unit.flagged ? 'Unflag' : 'Flag'}
      </button>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Hide ID' : 'Show ID'}
      </button>
      {expanded && <span>{unit.unit_id}</span>}
    </li>
  )
}