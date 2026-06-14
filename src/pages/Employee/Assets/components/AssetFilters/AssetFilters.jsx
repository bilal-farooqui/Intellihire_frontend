import './AssetFilters.css'

function AssetFilters({ filters, onFilterChange }) {
  return (
    <div className="asset-filters">
      <input
        type="text"
        placeholder="Employee Name"
        className="filter-input"
        value={filters.employeeName}
        onChange={(e) => onFilterChange('employeeName', e.target.value)}
      />
      <select
        className="filter-select"
        value={filters.assetType}
        onChange={(e) => onFilterChange('assetType', e.target.value)}
      >
        <option value="">All Asset Types</option>
        <option value="Laptop">Laptop</option>
        <option value="Monitor">Monitor</option>
        <option value="Accessory">Accessory</option>
        <option value="Other">Other</option>
      </select>
      <select
        className="filter-select"
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value)}
      >
        <option value="">All Status</option>
        <option value="Assigned">Assigned</option>
        <option value="Returned">Returned</option>
        <option value="Available">Available</option>
      </select>
      <button className="btn-filter">Apply Filters</button>
    </div>
  )
}

export default AssetFilters

