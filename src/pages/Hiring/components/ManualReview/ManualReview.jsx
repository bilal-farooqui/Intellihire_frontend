import './ManualReview.css'

function ManualReview({ cv, cvs = [], onSelectCV, onBack, onNext, onPrevious, totalCVs, currentIndex, onShortlist, onReject }) {
  if (!cv) {
    return (
      <div className="manual-review">
        <button className="btn-back" onClick={onBack}>← Back to List</button>
        <div className="no-cv-selected">No CV selected</div>
      </div>
    )
  }

  return (
    <div className="manual-review">
      <div className="review-header">
        <button className="btn-back" onClick={onBack}>← Back to List</button>
        <div className="review-tools">
          <div className="cv-picker">
            <label className="picker-label" htmlFor="manual-cv-picker">Select CV:</label>
            <select
              id="manual-cv-picker"
              className="manual-cv-select"
              value={cv.id}
              onChange={(e) => onSelectCV?.(e.target.value)}
            >
              {cvs.map((item, idx) => (
                <option key={item.id} value={item.id}>
                  {idx + 1}. {item.applicantName || 'Unnamed applicant'}
                </option>
              ))}
            </select>
          </div>
          <div className="cv-counter">
            CV {currentIndex} of {totalCVs}
          </div>
        </div>
      </div>

      <div className="cv-details-card">
        <div className="cv-header">
          <div className="applicant-primary">
            <h2 className="applicant-name">{cv.applicantName}</h2>
            <div className="status-container">
              <p className="applicant-email">{cv.email}</p>
              <span className={`status-pill ${String(cv.status || '').toLowerCase()}`}>
                {cv.status || '—'}
              </span>
            </div>
          </div>
          <div className="cv-meta">
            <span className="meta-item">
              <strong>Position:</strong> {cv.position}
            </span>
            <span className="meta-item">
              <strong>Uploaded:</strong> {cv.uploadedDate}
            </span>
          </div>
        </div>

        {!cv.fileName && (
          <div className="cv-missing-file-banner" role="status">
            No CV file was uploaded for this applicant.
          </div>
        )}

        <div className="cv-actions">
          {cv.fileName && (
            <button
              className="btn-download"
              type="button"
              onClick={() => {
                const a = document.createElement('a')
                a.href = cv.fileName
                a.target = '_blank'
                a.rel = 'noopener noreferrer'
                a.click()
              }}
            >
              View / Download CV
            </button>
          )}
          <button className="btn-shortlist" type="button" onClick={onShortlist}>
            Shortlist
          </button>
          <button className="btn-reject" type="button" onClick={onReject}>
            Reject
          </button>
        </div>
      </div>

      <div className="navigation-buttons">
        <button 
          className="btn-nav btn-prev"
          onClick={onPrevious}
          disabled={currentIndex === 1}
        >
          ← Previous
        </button>
        <button 
          className="btn-nav btn-next"
          onClick={onNext}
          disabled={currentIndex === totalCVs}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default ManualReview

