import './DocumentFilters.css'

function DocumentFilters({ filters, onFilterChange }) {
  return (
    <div className="document-filters">
      <input
        type="text"
        placeholder="Employee Name"
        className="filter-input"
        value={filters.employeeName}
        onChange={(e) => onFilterChange('employeeName', e.target.value)}
      />
      <select
        className="filter-select"
        value={filters.documentType}
        onChange={(e) => onFilterChange('documentType', e.target.value)}
      >
        <option value="">All Document Types</option>
        <option value="Contract">Contract</option>
        <option value="ID Proof">ID Proof</option>
        <option value="Certificate">Certificate</option>
        <option value="Other">Other</option>
      </select>
      <input
        type="text"
        placeholder="Date Range"
        className="filter-input"
        value={filters.dateRange}
        onChange={(e) => onFilterChange('dateRange', e.target.value)}
      />
      <button className="btn-filter">Apply Filters</button>
    </div>
  )
}

export default DocumentFilters

