import './DocumentList.css'

function DocumentList({ documents, onDownload, onDelete }) {
  const getStatusClass = (status) => {
    return status === 'Active' ? 'status-active' : 'status-expired'
  }

  return (
    <div className="document-list-container">
      <table className="document-table">
        <thead>
          <tr>
            <th>Document ID</th>
            <th>Employee Name</th>
            <th>Employee ID</th>
            <th>Document Type</th>
            <th>File Name</th>
            <th>Upload Date</th>
            <th>Status</th>
            <th>Size</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>{document.id}</td>
              <td>{document.employeeName}</td>
              <td>{document.employeeId}</td>
              <td>{document.documentType}</td>
              <td className="file-name">{document.fileName}</td>
              <td>{document.uploadDate}</td>
              <td>
                <span className={`status-badge ${getStatusClass(document.status)}`}>
                  {document.status}
                </span>
              </td>
              <td>{document.size}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-download"
                    onClick={() => onDownload(document)}
                    title="Download"
                  >
                    ⬇️
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => onDelete(document.id)}
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

export default DocumentList

