import { StatusBadge } from './StatusBadge'

export function UnitRow({ unit }) {
  return (
    <li className="unit-row">
      <span>{unit.conversation_id}</span>
      <span>{unit.model_id}</span>
      <StatusBadge status={unit.status} />
      <span>
        {unit.checkpoint_turns.length}{' '}
        {unit.checkpoint_turns.length === 1 ? 'checkpoint' : 'checkpoints'}
      </span>
    </li>
  )
}