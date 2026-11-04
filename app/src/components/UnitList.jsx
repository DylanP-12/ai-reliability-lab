import { UnitRow } from './UnitRow'

export function UnitList({ units, onFlag }) {
  return (
    <ul className="unit-list">
      {units.map((unit) => (
        <UnitRow key={unit.unit_id} unit={unit} onFlag={onFlag} />
      ))}
    </ul>
  )
}