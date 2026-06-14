import { useState } from 'react'
import toast from 'react-hot-toast'
import './AvailableOpenings.css'

function AvailableOpenings({ openings, onApply }) {
  const [selectedOpening, setSelectedOpening] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    portfolio: '',
    cvFileName: ''
  })

  const handleApplyClick = (opening) => {
    setSelectedOpening(opening)
  }

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedOpening) return

    onApply({
      openingId: selectedOpening.id,
      title: selectedOpening.title,
      ...formData
    })

    setFormData({
      fullName: '',
      email: '',
      phone: '',
      experience: '',
      portfolio: '',
      cvFileName: ''
    })
    setSelectedOpening(null)
    toast.success('Application submitted!')
  }

  return (
    <div className="applicant-openings-page">
      <h1 className="page-title">Available Openings</h1>

      <div className="openings-section">
        <div className="openings-list">
          {openings.map((opening) => (
            <div key={opening.id} className="opening-card">
              <div className="opening-header">
                <div className="opening-title">{opening.title}</div>
                <div className="opening-meta">
                  <span>{opening.department}</span>
                  <span className="separator">•</span>
                  <span>{opening.location}</span>
                  <span className="separator">•</span>
                  <span>{opening.type}</span>
                </div>
              </div>
              <div className="opening-footer">
                <span className={`status-badge ${opening.status.toLowerCase()}`}>{opening.status}</span>
                <button className="apply-btn" onClick={() => handleApplyClick(opening)}>
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="apply-form-card">
          <h3 className="card-title">Apply to an Opening</h3>
          {selectedOpening ? (
            <div className="selected-opening">
              <div className="selected-title">{selectedOpening.title}</div>
              <div className="selected-meta">
                {selectedOpening.department} • {selectedOpening.location} • {selectedOpening.type}
              </div>
            </div>
          ) : (
            <div className="selected-opening placeholder">
              Select an opening to apply
            </div>
          )}

          <form className="apply-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="form-group">
              <label>Experience Summary</label>
              <textarea
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                placeholder="Briefly describe your relevant experience"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Portfolio / LinkedIn (optional)</label>
              <input
                type="url"
                value={formData.portfolio}
                onChange={(e) => handleInputChange('portfolio', e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="form-group">
              <label>Upload CV</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleInputChange('cvFileName', e.target.files[0]?.name || '')}
                required
              />
              {formData.cvFileName && (
                <div className="file-name">Selected: {formData.cvFileName}</div>
              )}
            </div>
            <button type="submit" className="submit-btn" disabled={!selectedOpening}>
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AvailableOpenings

