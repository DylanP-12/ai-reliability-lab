import { useState } from 'react'
import { NavBar } from './components/NavBar'
import { TranscriptsScreen } from './screens/TranscriptsScreen'
import { ScenariosScreen } from './screens/ScenariosScreen'
import { ScoringScreen } from './screens/ScoringScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { RunScreen } from './screens/RunScreen'

function App() {
  const [screen, setScreen] = useState('transcripts')

  return (
    <div className="app">
      <header>
        <h1>AI Reliability Lab</h1>
        <NavBar current={screen} onNavigate={setScreen} />
      </header>
      <main className="app-main">
        {screen === 'transcripts' && <TranscriptsScreen />}
        {screen === 'scenarios' && <ScenariosScreen />}
        {screen === 'scoring' && <ScoringScreen />}
        {screen === 'results' && <ResultsScreen />}
        {screen === 'run' && <RunScreen />}
      </main>
    </div>
  )
}

export default App