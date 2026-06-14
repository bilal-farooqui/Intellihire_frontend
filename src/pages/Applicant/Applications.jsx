import './Applications.css'

function Applications({ applications }) {
  return (
    <div className="applicant-applications-page">
      <h1 className="page-title">My Applications</h1>

      <div className="applications-section">
        {applications.length === 0 ? (
          <div className="no-applications">No applications yet. Apply to an opening to get started.</div>
        ) : (
          <div className="applications-list">
            {applications.map((app) => (
              <div key={app.id} className="application-card">
                <div className="application-header">
                  <div>
                    <div className="application-title">{app.title}</div>
                    <div className="application-meta">
                      Applied on {app.dateApplied} • Application ID: {app.id}
                    </div>
                  </div>
                  <span className={`status-pill ${app.status.toLowerCase().replace(' ', '-')}`}>
                    {app.status}
                  </span>
                </div>
                <div className="application-details">
                  <div className="detail-item">
                    <span className="detail-label">Opening ID:</span>
                    <span className="detail-value">{app.openingId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">CV:</span>
                    <span className="detail-value">{app.cvFileName || 'Uploaded'}</span>
                  </div>
                  {app.response && (
                    <div className="response-box">
                      <div className="response-label">Response</div>
                      <div className="response-text">{app.response}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Applications

