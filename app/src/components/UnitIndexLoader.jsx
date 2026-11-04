import { useState, useEffect } from 'react';

function UnitIndexLoader({ children }) {
  const [units, setUnits] = useState(null);   // null = haven't loaded yet
  const [error, setError] = useState(null);   // null = no error

  useEffect(() => {
  let cancelled = false;

fetch('/data/index.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => { if (!cancelled) setUnits(data); })
    .catch(err => { if (!cancelled) setError(err.message); });

  return () => { cancelled = true; };
}, []);
  if (error) return <div className="error">Couldn't load data: {error}</div>;
if (units === null) return <div className="loading">Loading…</div>;
if (units.length === 0) return <div className="empty">No units found.</div>;
return children(units);
}

export default UnitIndexLoader;