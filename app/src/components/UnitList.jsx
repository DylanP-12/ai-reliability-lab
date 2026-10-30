import { UnitRow } from './UnitRow'

export function UnitList({ units }) {
  return (
    <ul className="unit-list">
      {units.map((unit) => (
        <UnitRow key={unit.unit_id} unit={unit} />
      ))}
    </ul>
  )
}