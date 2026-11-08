import { useEffect, useState } from 'react'
import { dataStore } from './dataStore'

// Loads one transcript, race-safe. Returns { transcript, error, mismatch }.
// Clears immediately on change; a superseded response can never write state.
export function useTranscript(unitId) {
  const [transcript, setTranscript] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setTranscript(null)
    setError(null)
    if (!unitId) return
    let cancelled = false
    dataStore.getConversation(unitId)
      .then(d => { if (!cancelled) setTranscript(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [unitId])

  const mismatch = transcript !== null && transcript.unit_id !== unitId
  return { transcript, error, mismatch }
}