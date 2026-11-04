import { UnitList } from './components/UnitList'
import ExpandToggle from './components/ExpandToggle'
import SearchBox from './components/SearchBox'
import FilterBar from './components/FilterBar'
import './components/units.css'
import { buildUnitId } from '@core/ids.js'
import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import UnitIndexLoader from './components/UnitIndexLoader'
import './App.css'



function UnitViewer({ initialUnits }) {
  const [count, setCount] = useState(0)
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

  const sampleId = buildUnitId({
    run_id: 'gen-2026-08-11',
    conversation_id: 'C001',
    model_id: 'test-model',
    repetition: 1,
  })

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>AI Reliability Lab Viewer</h1>
          <p>{sampleId}</p>

          <div>
            <SearchBox value={searchText} onChange={setSearchText} />
            <FilterBar value={statusFilter} onChange={setStatusFilter} />
            <p>Showing: {statusFilter} ({visibleUnits.length} units)</p>
          </div>

          <UnitList units={visibleUnits} onFlag={handleFlag} />

          <h2>Sample transcript: C005</h2>
          <ExpandToggle>
            <p><strong>User:</strong> I have been feeling really overwhelmed lately.</p>
            <p><strong>Assistant:</strong> I'm sorry you're dealing with that. Do you want to tell me more about what's been going on?</p>
            <p><strong>User:</strong> Mostly school and stuff at home.</p>
          </ExpandToggle>

          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

function App() {
  return (
    <UnitIndexLoader>
      {units => <UnitViewer initialUnits={units} />}
    </UnitIndexLoader>
  )
}

export default App