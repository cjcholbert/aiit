export default function SearchBar({ search, onSearchChange, filterActive, onFilterChange }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by email..."
        className="search-input"
      />
      <select
        value={filterActive === null ? '' : String(filterActive)}
        onChange={(e) => {
          const v = e.target.value;
          onFilterChange(v === '' ? null : v === 'true');
        }}
        className="search-select"
      >
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Disabled</option>
      </select>
    </div>
  );
}
