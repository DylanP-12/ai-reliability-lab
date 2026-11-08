import { OutcomeCell } from './OutcomeCell'

// units        = unit list from index.json
// groups       = the "groups" array from scores.json
// selectedCell = { conversation_id, model_id } of the clicked cell, or null
// onSelectCell = called with { conversation_id, model_id } when a cell is clicked
export function Grid({ units, groups, selectedCell = null, onSelectCell = () => {} }) {
  // Derive the axes from the data. Never hardcode them.
  const scenarios = [...new Set(units.map(u => u.conversation_id))].sort()
  const models    = [...new Set(units.map(u => u.model_id))].sort()

  // One lookup table: "C006:qwen3-32b" -> that pair's score group.
  const groupByKey = new Map(
    groups.map(g => [`${g.conversation_id}:${g.model_id}`, g])
  )

  return (
    <div className="grid-wrap">
      <table className="grid">
        <caption>Outcome for each scenario and model</caption>
        <thead>
          <tr>
            <th scope="col">Scenario</th>
            {models.map(m => <th scope="col" key={m}>{m}</th>)}
          </tr>
        </thead>
        <tbody>
          {scenarios.map(c => (
            <tr key={c}>
              <th scope="row">{c}</th>
              {models.map(m => {
                const key = `${c}:${m}`
                const unitsForPair = units.filter(
                  u => u.conversation_id === c && u.model_id === m
                )
                const isSelected =
                  selectedCell?.conversation_id === c && selectedCell?.model_id === m
                return (
                  <td key={key}>
                    <OutcomeCell
                      group={groupByKey.get(key)}
                      unitsForPair={unitsForPair}
                      label={`${c}, ${m}`}
                      isSelected={isSelected}
                      onSelect={() => onSelectCell({ conversation_id: c, model_id: m })}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}