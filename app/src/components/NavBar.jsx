const SCREENS = [
  { id: 'transcripts', label: 'Transcripts' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'results', label: 'Results' },
  { id: 'run', label: 'Run' },
];

export function NavBar({ current, onNavigate }) {
  return (
    <nav>
      {SCREENS.map((s) => (
        <button
          key={s.id}
          onClick={() => onNavigate(s.id)}
          className={s.id === current ? 'active' : ''}
          aria-current={s.id === current ? 'page' : undefined}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}