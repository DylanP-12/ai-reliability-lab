// OutcomeCell.jsx
// Decides what one grid cell is allowed to claim.
import './grid.css'

// Pure logic: no React here, so it's easy to test.
// group = this pair's entry from scores.json (or undefined)
// unitsForPair = this pair's units from index.json (may be empty)
export function getCellState(group, unitsForPair) {
  // 1. Was it ever run?
  if (unitsForPair.length === 0) {
    return { kind: 'no-data', reason: 'not run' }
  }

  // 2. Has it been graded?
  if (!group) {
    return { kind: 'not-scored', units: unitsForPair.length }
  }

  // Add up every checkpoint in this cell.
  let held = 0, crossed = 0, split = 0, n = 0, unparseable = 0
  for (const cp of group.checkpoints) {
    held += cp.pass
    crossed += cp.fail
    split += cp.split
    n += cp.denominator
    unparseable += cp.judgments_unparseable
  }

  // 3. Did any grade come out valid?
  if (group.units_scored === 0 || n === 0) {
    const reason = group.units_failed > 0 ? 'failed'
                 : unparseable > 0 ? 'unparseable'
                 : 'no valid judgment'
    return { kind: 'no-data', reason }
  }

  // A real result. Choice A: red if it crossed even once.
  return {
    kind: crossed > 0 ? 'crossed' : 'held',
    held, crossed, split, n,
    unitsScored: group.units_scored,          // NEW: how many conversations
    excludedUnits: group.units_failed,
  }
}

// Draws one cell from its state.
// label = what a screen reader announces first, e.g. "C006, qwen3-32b"
export function OutcomeCell({ group, unitsForPair, label, onSelect, isSelected = false }) {  const s = getCellState(group, unitsForPair)

  let main, sub, spoken
  if (s.kind === 'held' || s.kind === 'crossed') {
        main = `${s.held}/${s.n} checkpoints held`
    // NEW: always say how many conversations stand behind the number
    const notes = [`from ${s.unitsScored} conversation${s.unitsScored === 1 ? '' : 's'}`]
    if (s.crossed > 0) notes.push(`${s.crossed} crossed`)
    if (s.split > 0) notes.push(`${s.split} split`)
    if (s.excludedUnits > 0) notes.push(`${s.excludedUnits} failed, excluded`)
    sub = notes.join(' · ')
    spoken = main
  } else if (s.kind === 'not-scored') {
    main = '—'
    sub = `${s.units} unit${s.units === 1 ? '' : 's'}, not scored`
    spoken = 'not scored'
  } else {
    main = 'No data'
    sub = s.reason
    spoken = 'no data'
  }

  return (
    <button
      type="button"
      className={`cell cell-${s.kind}${isSelected ? ' cell-selected' : ''}`}
      aria-label={`${label}: ${spoken}${sub ? ', ' + sub : ''}`}
      aria-pressed={isSelected}
      onClick={onSelect}
    >
      <span className="cell-main">{main}</span>
      {sub && <span className="cell-sub">{sub}</span>}
    </button>
  )
}