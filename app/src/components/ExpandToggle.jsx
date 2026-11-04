import { useState } from 'react';

export default function ExpandToggle({ children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Collapse' : 'Expand'}
      </button>
      {expanded && <div>{children}</div>}
    </div>
  );
}