import { useEffect, useState } from 'react'
import { dataStore } from '../lib/dataStore'
import { useTranscript } from '../lib/useTranscript'
import { getSetupTurn } from '../lib/setupTurn'
import SearchBox from '../components/SearchBox'
import { Grid } from '../components/Grid'
import { RepetitionList } from '../components/RepetitionList'
import { TranscriptView } from '../components/TranscriptView'
import { ComparePanel } from '../components/ComparePanel'

export function TranscriptsScreen() {
  const [data, setData] = useState(null)   // { units, groups, scenarios } once loaded
  const [error, setError] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [mode, setMode] = useState('browse') // 'browse' | 'compare'

  // L052 selection: which cell was clicked, then which repetition was picked.
  const [selectedCell, setSelectedCell] = useState(null)      // { conversation_id, model_id }
  const [selectedUnitId, setSelectedUnitId] = useState(null)  // a unit_id, or null

  // One transcript, race-safe (see useTranscript).
  const { transcript, error: transcriptError, mismatch } = useTranscript(selectedUnitId)

  // Load the small catalog files through the store. Never a transcript.
  useEffect(() => {
    let cancelled = false
    Promise.all([dataStore.getIndex(), dataStore.getScores(), dataStore.getScenarios()])
      .then(([units, scores, scenarios]) => {
        if (!cancelled) setData({ units, groups: scores.groups, scenarios })
      })
      .catch(err => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [])

  // A new cell means a new repetition list, so the old pick is cleared.
  function handleSelectCell(cell) {
    setMode('browse')
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

      <div className="mode-toggle" role="group" aria-label="View mode">
        <button
          type="button"
          className={mode === 'browse' ? 'rep rep-selected' : 'rep'}
          aria-pressed={mode === 'browse'}
          onClick={() => setMode('browse')}
        >
          Browse one
        </button>
        <button
          type="button"
          className={mode === 'compare' ? 'rep rep-selected' : 'rep'}
          aria-pressed={mode === 'compare'}
          onClick={() => setMode('compare')}
        >
          Compare two
        </button>
      </div>

      {mode === 'compare'
        ? <ComparePanel units={data.units} />
        : (
          <>
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
                <h3>Transcript: {selectedUnitId}</h3>
                {transcriptError
                  ? <p role="alert">Could not load transcript: {transcriptError}</p>
                  : !transcript
                    ? <p>Loading transcript…</p>
                    : mismatch
                      ? <p role="alert">Mismatch: loaded {transcript.unit_id}, but {selectedUnitId} is selected.</p>
                      : <TranscriptView
                          transcript={transcript}
                          setupTurn={getSetupTurn(data.scenarios, selectedCell.conversation_id)}
                        />}
              </div>
            )}
          </>
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