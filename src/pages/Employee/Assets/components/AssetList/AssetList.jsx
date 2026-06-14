import './AssetList.css'

function AssetList({ assets, onReturn, onDelete }) {
  const getStatusClass = (status) => {
    if (status === 'Assigned') return 'status-assigned'
    if (status === 'Returned') return 'status-returned'
    return 'status-available'
  }

  const getConditionClass = (condition) => {
    if (condition === 'Excellent') return 'condition-excellent'
    if (condition === 'Good') return 'condition-good'
    return 'condition-fair'
  }

  return (
    <div className="asset-list-container">
      <table className="asset-table">
        <thead>
          <tr>
            <th>Asset ID</th>
            <th>Asset Name</th>
            <th>Asset Type</th>
            <th>Employee Name</th>
            <th>Employee ID</th>
            <th>Serial Number</th>
            <th>Assigned Date</th>
            <th>Status</th>
            <th>Condition</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td>{asset.id}</td>
              <td>{asset.assetName}</td>
              <td>{asset.assetType}</td>
              <td>{asset.employeeName}</td>
              <td>{asset.employeeId}</td>
              <td>{asset.serialNumber}</td>
              <td>{asset.assignedDate}</td>
              <td>
                <span className={`status-badge ${getStatusClass(asset.status)}`}>
                  {asset.status}
                </span>
              </td>
              <td>
                <span className={`condition-badge ${getConditionClass(asset.condition)}`}>
                  {asset.condition}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  {asset.status === 'Assigned' && (
                    <button
                      className="btn-action btn-return"
                      onClick={() => onReturn(asset.id)}
                      title="Return Asset"
                    >
                      ↩️
                    </button>
                  )}
                  <button
                    className="btn-action btn-delete"
                    onClick={() => onDelete(asset.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AssetList

