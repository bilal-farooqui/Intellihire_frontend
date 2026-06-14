import './SearchFilters.css'

function SearchFilters({ searchFilters, onInputChange, onFilterClick, onAddEmployee }) {
  return (
    <div className="search-filters">
      <div className="filter-inputs">
        <input
          type="text"
          placeholder="Employee Name"
          className="filter-input"
          value={searchFilters.name}
          onChange={(e) => onInputChange('name', e.target.value)}
        />
        <input
          type="text"
          placeholder="Employee ID"
          className="filter-input"
          value={searchFilters.id}
          onChange={(e) => onInputChange('id', e.target.value)}
        />
        <input
          type="text"
          placeholder="Employee Designation"
          className="filter-input"
          value={searchFilters.designation}
          onChange={(e) => onInputChange('designation', e.target.value)}
        />
      </div>
      <div className="filter-actions">
        <button className="btn-filter" onClick={onFilterClick}>Filters</button>
        <button className="btn-add" onClick={onAddEmployee}>Add Employee</button>
      </div>
    </div>
  )
}

export default SearchFilters

