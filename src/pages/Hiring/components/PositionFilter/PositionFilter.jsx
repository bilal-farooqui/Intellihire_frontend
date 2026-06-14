import './PositionFilter.css'

function PositionFilter({ positions, selectedPosition, onPositionChange }) {
  return (
    <div className="position-filter">
      <label className="filter-label">Filter by Position:</label>
      <select
        className="position-select"
        value={selectedPosition}
        onChange={(e) => onPositionChange(e.target.value)}
      >
        {positions.map((position) => (
          <option key={position} value={position}>
            {position}
          </option>
        ))}
      </select>
    </div>
  )
}

export default PositionFilter

