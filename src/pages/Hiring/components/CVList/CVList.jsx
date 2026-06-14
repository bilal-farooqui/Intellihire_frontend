import './CVList.css'

function CVList({ cvs, onViewCV, onDeleteCV }) {
  const getStatusClass = (status) => {
    if (status === 'Unviewed' || status === 'Pending') return 'status-unviewed'
    if (status === 'Shortlisted') return 'status-shortlisted'
    if (status === 'Rejected') return 'status-rejected'
    return 'status-viewed'
  }

  return (
    <div className="cv-list-container">
      <table className="cv-table">
        <thead>
          <tr>
            <th>CV ID</th>
            <th>Applicant Name</th>
            <th>Email</th>
            <th>Position Applied</th>
            <th>Uploaded Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cvs.length === 0 ? (
            <tr>
              <td colSpan="7" className="no-data">
                No CVs found for the selected position
              </td>
            </tr>
          ) : (
            cvs.map((cv) => (
              <tr key={cv.id}>
                <td>{cv.id}</td>
                <td>{cv.applicantName}</td>
                <td>{cv.email}</td>
                <td>{cv.position}</td>
                <td>{cv.uploadedDate}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(cv.status)}`}>
                    {cv.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-action btn-view"
                      onClick={() => onViewCV(cv)}
                      title="View CV"
                    >
                      👁️
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => onDeleteCV(cv.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default CVList

