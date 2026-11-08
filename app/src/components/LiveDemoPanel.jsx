// L054: live demo path. Labeled and partitioned now; the real judge call arrives in L057.
import { useState } from 'react';

// Placeholder stub: throws, so "not built yet" can never look like a real result.
async function runLiveJudge() {
  throw new Error('not implemented: L057 (browser API key handling)');
}

export default function LiveDemoPanel() {
  const [message, setMessage] = useState(null);

  async function handleClick() {
    try {
      await runLiveJudge();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="demo">
      <p className="demo__label">DEMO ONLY: not part of the study</p>
      <p>A live re-judge calls the judge right now, in your browser. Its result is never saved
        and never counted in any score or chart.</p>
      <button onClick={handleClick}>Re-judge this checkpoint</button>
      {message && <p className="demo__msg">{message}</p>}
    </div>
  );
}