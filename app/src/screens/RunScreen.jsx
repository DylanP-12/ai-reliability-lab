// app/src/screens/RunScreen.jsx
import { useEffect, useState } from 'react';
import { runConversation } from '../../../core/runConversation.js';
import { dataStore } from '../lib/dataStore.js';
import { getKey, setKey, clearKey, keyInfo } from '../lib/keyStore.js';
import { checkDemoRun, DEMO_CONFIG, DEMO_LIMITS } from '../lib/demoRun.js';
import { DEMO_MODELS } from '../lib/demoModels.js';
import { TurnBubble } from '../components/TurnBubble.jsx';
import './run.css';

const redact = (msg, key) => (key ? String(msg ?? '').split(key).join('[redacted]') : String(msg ?? ''));

export function RunScreen() {
  const models = DEMO_MODELS;
  const [scenarios, setScenarios] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [scenarioId, setScenarioId] = useState('');
  const [modelId, setModelId] = useState('');
  const [keyDraft, setKeyDraft] = useState('');
  const [keyState, setKeyState] = useState(keyInfo());
  const [keyError, setKeyError] = useState(null);
  const [turns, setTurns] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let alive = true;
    dataStore.getScenarios()
      .then((s) => { if (alive) setScenarios(s); })
      .catch((err) => { if (alive) setLoadError(err.message); });
    return () => { alive = false; };
  }, []);

  const scenario = scenarios.find((s) => s.conversation_id === scenarioId);
  const model = models.find((m) => m.model_id === modelId);
  const check = checkDemoRun({ scenario, model, models });
  const canRun = check.ok && keyState.present && !running;

  function saveKey() {
    setKeyError(null);
    try { setKey(keyDraft); setKeyState(keyInfo()); }
    catch (err) { setKeyError(err.message); }   // generic by design
    finally { setKeyDraft(''); }                // value leaves component state immediately
  }

  function removeKey() { clearKey(); setKeyState(keyInfo()); }

  async function run() {
    const apiKey = getKey();
    let done = 0;                               // local counter: the turns state here is stale
    setTurns([]); setOutcome(null); setRunning(true);
    try {
      const record = await runConversation({
        scenario, model, repetition: 1, config: DEMO_CONFIG, apiKey,
        onTurn: (t) => { done += 1; setTurns((prev) => [...prev, t]); }, // functional update: each turn renders
      });
      setOutcome({ status: record.status,
        error: record.error ? { ...record.error, message: redact(record.error.message, apiKey) } : null });
    } catch (err) {
      setOutcome({ status: 'failed', error: {
        stage: 'run', turn_index: done + 1,
        classification: err.classification ?? err.name ?? 'unknown', message: redact(err.message, apiKey) } });
    } finally { setRunning(false); }
  }

  if (loadError) return <p className="error">Could not load data: {loadError}</p>;

  return (
    <section className="run-screen">
      <h2>Run: live demo</h2>

      <aside className="key-warning">
        <strong>Read before entering a key.</strong> Your key is saved in this browser's localStorage.
        Any script running on this page (a compromised library, a browser extension) can read it,
        and it stays here until you click Clear key. Use a separate demo key with a low spending
        limit set on OpenRouter. Never paste the key you use for the real study.
      </aside>

      <div className="key-row">
        <label>Demo API key{' '}
          <input type="password" autoComplete="off" spellCheck={false}
                 value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
        </label>
        <button onClick={saveKey} disabled={!keyDraft.trim()}>Save key</button>
        <button onClick={removeKey}>Clear key</button>
        <span>{keyState.present ? `Key saved (length ${keyState.length}).` : 'No key saved.'}</span>
        {keyError && <span className="error">{keyError}</span>}
      </div>

      <div className="run-controls">
        <label>Scenario{' '}
          <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)} disabled={running}>
            <option value="">Choose…</option>
            {scenarios.map((s) => <option key={s.conversation_id} value={s.conversation_id}>{s.conversation_id} ({s.turns.length} turns)</option>)}
          </select>
        </label>
        <label>Model{' '}
          <select value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={running}>
            <option value="">Choose…</option>
            {models.map((m) => <option key={m.model_id} value={m.model_id}>{m.label ?? m.model_id}</option>)}
          </select>
        </label>
        <p className="limits">
          Limits: 1 scenario, 1 model, 1 repetition, max {DEMO_LIMITS.maxTurns} turns,
          {' '}{DEMO_LIMITS.maxTokens} tokens per reply, estimate under ${DEMO_LIMITS.maxEstimateUSD}.
        </p>
        {check.estimateUSD !== null && <p>Estimated max cost: ${check.estimateUSD.toFixed(4)}</p>}
        {check.problems.map((p) => <p key={p} className="error">{p}</p>)}
        {!keyState.present && <p className="error">Save a demo key to run.</p>}
        <button onClick={run} disabled={!canRun}>{running ? 'Running…' : 'Run demo'}</button>
      </div>

      <div className="ephemeral-panel" aria-live="polite">
        <p className="ephemeral-label">
          Demo output: ephemeral, not part of the study. Nothing here is saved; it disappears on refresh.
        </p>
        {turns.map((t) => (
          <div key={t.turn_index}>
            <TurnBubble role="user" text={t.prompt_text} />
            <TurnBubble role="assistant" text={t.response_text} />
          </div>
        ))}
        {running && scenario && <p>Waiting for turn {turns.length + 1} of {scenario.turns.length}…</p>}
        {outcome?.status === 'complete' && <p>Complete: {turns.length} turns.</p>}
        {outcome?.status === 'failed' && outcome.error && (
          <div className="failed">
            Failed at {outcome.error.stage}, turn {outcome.error.turn_index}:{' '}
            <strong>{outcome.error.classification}</strong>. {outcome.error.message}
          </div>
        )}
      </div>
    </section>
  );
}