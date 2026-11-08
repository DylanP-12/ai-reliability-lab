// RepetitionList.jsx
// Lists every repetition behind one grid cell. Picks none by default:
// the reader chooses, so the app never hand-picks an example.
export function RepetitionList({ cell, units, selectedUnitId, onSelectUnit }) {
  const reps = units
    .filter(u => u.conversation_id === cell.conversation_id && u.model_id === cell.model_id)
    .sort((a, b) => a.repetition - b.repetition)

  const heading = `${cell.conversation_id} / ${cell.model_id}`

  if (reps.length === 0) {
    return (
      <div className="rep-list">
        <h3>{heading}</h3>
        <p>Not run: no conversations exist for this pair.</p>
      </div>
    )
  }

  return (
    <div className="rep-list">
      <h3>{heading}</h3>
      <p>
        {reps.length} conversation{reps.length === 1 ? '' : 's'}. Pick one to read it.
      </p>
      <ul>
        {reps.map(u => {
          const isSelected = u.unit_id === selectedUnitId
          return (
            <li key={u.unit_id}>
              <button
                type="button"
                className={isSelected ? 'rep rep-selected' : 'rep'}
                aria-pressed={isSelected}
                onClick={() => onSelectUnit(u.unit_id)}
              >
                r{String(u.repetition).padStart(2, '0')} · {u.status} · {u.turn_count} turns
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}