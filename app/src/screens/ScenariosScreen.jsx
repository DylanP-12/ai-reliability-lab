import { useEffect, useState } from 'react'
import { dataStore } from '../lib/dataStore'
import { ScenarioTable } from '../components/ScenarioTable'
export function ScenariosScreen() {
  const [scenarios, setScenarios] = useState(null)   // array once loaded
  const [error, setError] = useState(null)

  // Load through the one door (L050). Empty array: runs once; flag is cheap insurance.
  useEffect(() => {
    let cancelled = false
    dataStore.getScenarios()
      .then(list => { if (!cancelled) setScenarios(list) })
      .catch(err => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [])

  // The three states from L048, plus a real empty state.
  if (error) {
    return <Shell><p role="alert">Could not load scenarios: {error.message}</p></Shell>
  }
  if (!scenarios) {
    return <Shell><p>Loading…</p></Shell>
  }
  if (scenarios.length === 0) {
    return <Shell><p>No scenarios in this dataset.</p></Shell>
  }

  return (
    <Shell>
      <ScenarioTable scenarios={scenarios} />
    </Shell>
  )
}

function Shell({ children }) {
  return <section><h2>Scenarios</h2>{children}</section>
}