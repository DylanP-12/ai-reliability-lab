import { useEffect, useState } from 'react'
import { dataStore } from '../lib/dataStore'
import SearchBox from '../components/SearchBox'
import { Grid } from '../components/Grid'
import { RepetitionList } from '../components/RepetitionList'
import { TranscriptView } from '../components/TranscriptView'
export function TranscriptsScreen() {
  const [data, setData] = useState(null)   // { units, groups } once loaded
  const [error, setError] = useState(null)
  const [searchText, setSearchText] = useState('')

  // L052 selection: which cell was clicked, then which repetition was picked.
  const [selectedCell, setSelectedCell] = useState(null)      // { conversation_id, model_id }
  const [selectedUnitId, setSelectedUnitId] = useState(null)  // a unit_id, or null
  const [transcript, setTranscript] = useState(null)            // the loaded conversation
  const [transcriptError, setTranscriptError] = useState(null)  // its load error, if any
  // Load both small files through the store. Never a transcript.
  useEffect(() => {
    let cancelled = false
    Promise.all([dataStore.getIndex(), dataStore.getScores()])
      .then(([units, scores]) => {
        if (!cancelled) setData({ units, groups: scores.groups })
      })
      .catch(err => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [])

    // L052: load ONE transcript, only when a repetition is picked.
  // Race-safe: a superseded request can never write state.
  useEffect(() => {
    setTranscript(null)          // clear now: show "loading", never the old transcript
    setTranscriptError(null)
    if (!selectedUnitId) return
    let cancelled = false
    dataStore.getConversation(selectedUnitId)
      .then(data => { if (!cancelled) setTranscript(data) })
      .catch(err => { if (!cancelled) setTranscriptError(err.message) })
    return () => { cancelled = true }
  }, [selectedUnitId])

  // A new cell means a new repetition list, so the old pick is cleared.
  function handleSelectCell(cell) {
    setSelectedCell(cell)
    setSelectedUnitId(null)
  }

  // The three states from L048, plus a real empty state.
  if (error) {
    return <Shell><p role="alert">Could not load data: {error.message}</p></Shell>
  }
  if (!data) {
    return <Shell><p>Loading…</p></Shell>
  }
  if (data.units.length === 0) {
    return <Shell><p>No units yet. Run collect.js to generate some.</p></Shell>
  }

  // Search removes whole scenario rows, never individual units.
  const q = searchText.toLowerCase()
  const visibleUnits = data.units.filter(
    u => u.conversation_id.toLowerCase().includes(q)
  )

  return (
    <Shell>
      <Legend />
      <SearchBox value={searchText} onChange={setSearchText} />
      {visibleUnits.length === 0
        ? <p>No scenarios match "{searchText}".</p>
        : <Grid
            units={visibleUnits}
            groups={data.groups}
            selectedCell={selectedCell}
            onSelectCell={handleSelectCell}
          />}

          {selectedCell && (
        <RepetitionList
          cell={selectedCell}
          units={data.units}
          selectedUnitId={selectedUnitId}
          onSelectUnit={setSelectedUnitId}
        />
      )}

        {selectedUnitId && (
        <div className="transcript-panel">
          {transcriptError
            ? <p role="alert">Could not load transcript: {transcriptError}</p>
            : !transcript
              ? <p>Loading transcript…</p>
              :   <TranscriptView transcript={transcript} />}
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }) {
  return <section><h2>Transcripts</h2>{children}</section>
}

function Legend() {
  const items = [
    ['var(--color-pass)', 'Held: judged, boundary held every time'],
    ['var(--color-fail)', 'Crossed: judged, boundary crossed at least once'],
    ['transparent', 'Not scored: collected, not yet judged'],
    ['var(--color-unknown)', 'No data: failed, unparseable, or not run (not a result)'],
  ]
  return (
    <div className="legend">
      {items.map(([color, text]) => (
        <span key={text}>
          <span
            className="swatch"
            style={{ background: color, border: '1px dashed var(--color-muted)' }}
          />
          {text}
        </span>
      ))}
    </div>
  )
}