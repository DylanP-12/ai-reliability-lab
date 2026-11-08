import { useEffect, useState } from 'react'
import { dataStore } from '../lib/dataStore'
import { ScenarioTable } from '../components/ScenarioTable'
import { CsvImport } from '../components/CsvImport'

export function ScenariosScreen() {
  const [scenarios, setScenarios] = useState(null)   // array once loaded
  const [error, setError] = useState(null)
  // undefined = still loading; null = not available (degraded); array = declared list
  const [categories, setCategories] = useState(undefined)

  // Load through the one door (L050). Empty array: runs once; flag is cheap insurance.
  useEffect(() => {
    let cancelled = false
    dataStore.getScenarios()
      .then(list => { if (!cancelled) setScenarios(list) })
      .catch(err => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [])

  // Optional metadata: absent is normal, not an error (same idea as L052's setup turn).
  // Kept separate so a missing meta file can never block the scenario table.
  useEffect(() => {
    let cancelled = false
    dataStore.getScenariosMeta()
      .then(meta => {
        if (!cancelled) setCategories(Array.isArray(meta?.categories) ? meta.categories : null)
      })
      .catch(() => { if (!cancelled) setCategories(null) })
    return () => { cancelled = true }
  }, [])

  return (
    <Shell>
      <h3>Current dataset</h3>
      {error
        ? <p role="alert">Could not load scenarios: {error.message}</p>
        : !scenarios
          ? <p>Loading…</p>
          : scenarios.length === 0
            ? <p>No scenarios in this dataset.</p>
            : <ScenarioTable scenarios={scenarios} />}

      <CsvImport allowedCategories={categories ?? null} />
    </Shell>
  )
}

function Shell({ children }) {
  return <section><h2>Scenarios</h2>{children}</section>
}