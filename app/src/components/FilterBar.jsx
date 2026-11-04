function FilterBar({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">All</option>
      <option value="complete">Complete</option>
      <option value="failed">Failed</option>
    </select>
  );
}

export default FilterBar;