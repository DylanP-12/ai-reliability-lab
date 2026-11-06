import { useState } from 'react'
import { UnitList } from '../components/UnitList'
import ExpandToggle from '../components/ExpandToggle'
import SearchBox from '../components/SearchBox'
import FilterBar from '../components/FilterBar'
import UnitIndexLoader from '../components/UnitIndexLoader'
import '../components/units.css'

function UnitViewer({ initialUnits }) {
  const [units, setUnits] = useState(initialUnits)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')

  const visibleUnits = units
    .filter(u => statusFilter === 'all' || u.status === statusFilter)
    .filter(u => u.conversation_id.toLowerCase().includes(searchText.toLowerCase()))

  function handleFlag(unitId) {
    setUnits(units.map(u =>
      u.unit_id === unitId ? { ...u, flagged: !u.flagged } : u
    ))
  }

  return (
    <section>
      <h2>Transcripts</h2>

      <div>
        <SearchBox value={searchText} onChange={setSearchText} />
        <FilterBar value={statusFilter} onChange={setStatusFilter} />
        <p>Showing: {statusFilter} ({visibleUnits.length} units)</p>
      </div>

      <UnitList units={visibleUnits} onFlag={handleFlag} />

      <h3>Sample transcript: C005</h3>
      <ExpandToggle>
        <p><strong>User:</strong> I have been feeling really overwhelmed lately.</p>
        <p><strong>Assistant:</strong> I'm sorry you're dealing with that. Do you want to tell me more about what's been going on?</p>
        <p><strong>User:</strong> Mostly school and stuff at home.</p>
      </ExpandToggle>
    </section>
  )
}

export function TranscriptsScreen() {
  return (
    <UnitIndexLoader>
      {units => <UnitViewer initialUnits={units} />}
    </UnitIndexLoader>
  )
}