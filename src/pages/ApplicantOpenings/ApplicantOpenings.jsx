import { useEffect, useState } from 'react'
import { getAllJobs, getJobRecommendations, applyForJob, applyForJobJson, getApplicationsByCandidate, getMyProfile, BACKEND_URL } from '../../api'
import { Sparkles, MapPin, DollarSign, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import './ApplicantOpenings.css'

function ApplicantOpenings({ onApply, userInfo }) {
  const [openings, setOpenings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAiSorting, setIsAiSorting] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  const [profile, setProfile] = useState(null)

  const fetchJobs = async (useAi = false) => {
    try {
      if (useAi) setIsAiSorting(true)
      else setLoading(true)
      
      setError('')
      const [jobsRes, appsRes] = await Promise.all([
        useAi ? getJobRecommendations() : getAllJobs(),
        userInfo?.email ? getApplicationsByCandidate(userInfo.email) : Promise.resolve({ data: [] })
      ])

      const jobs = jobsRes.data || []
      const apps = appsRes.data || []
      
      // Store IDs of jobs already applied for
      const appIds = new Set(apps.map(app => app.job_id))
      setAppliedJobIds(appIds)

      // Filter out already applied jobs
      setOpenings(jobs.filter(job => !appIds.has(job._id)))
    } catch (err) {
      console.error('Error loading jobs', err)
      setError('Failed to load openings')
    } finally {
      setLoading(false)
      setIsAiSorting(false)
    }
  }

  useEffect(() => {
    fetchJobs(false) // Initial load is static
    
    // Fetch profile to get pre-existing CV
    const loadProfile = async () => {
      try {
        const res = await getMyProfile()
        setProfile(res.data || null)
      } catch (err) {
        console.error('Error loading profile in openings page', err)
      }
    }
    loadProfile()
  }, [userInfo])

  const handleAiSort = () => {
    fetchJobs(true)
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOpening, setSelectedOpening] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cvFile: null
  })

  const openApplyModal = (opening) => {
    setSelectedOpening(opening)
    setFormData((prev) => ({
      ...prev,
      name: prev.name || userInfo?.name || '',
      email: prev.email || userInfo?.email || ''
    }))
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedOpening(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      cvFile: null
    })
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedOpening) return

    try {
      setSubmitting(true)
      setSubmitError('')

      const normalizedEmail = String(formData.email || userInfo?.email || '')
        .trim()
        .toLowerCase()

      let resUrl = ''

      if (!formData.cvFile) {
        if (profile?.cv_url) {
          // Use already pre-attached CV from onboarding
          const payload = {
            job_id: selectedOpening._id,
            candidate_name: formData.name,
            candidate_email: normalizedEmail,
            cv_url: profile.cv_url
          }
          await applyForJobJson(payload)
          resUrl = profile.cv_url
        } else {
          setSubmitError('Please upload your CV (PDF)')
          setSubmitting(false)
          return
        }
      } else {
        // Upload new CV file
        const payload = new FormData()
        payload.append('job_id', selectedOpening._id)
        payload.append('candidate_name', formData.name)
        payload.append('candidate_email', normalizedEmail)
        payload.append('file', formData.cvFile)

        const res = await applyForJob(payload)
        resUrl = res?.data?.cv_url || ''
      }

      if (onApply) {
        onApply({
          openingId: selectedOpening._id,
          title: selectedOpening.title,
          department: '',
          status: 'Submitted',
          appliedDate: new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          applicantName: formData.name,
          email: normalizedEmail,
          phone: formData.phone,
          resumeLink: resUrl ? `${BACKEND_URL}${resUrl}` : ''
        })
      }

      toast.success('Application submitted')
      // Immediately remove from list locally
      setOpenings(prev => prev.filter(job => job._id !== selectedOpening._id))
      setAppliedJobIds(prev => new Set([...prev, selectedOpening._id]))
      closeModal()
    } catch (err) {
      console.error('Error submitting application', err)
      setSubmitError('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="applicant-openings-page">
      <h1 className="page-title">Available Openings</h1>

      <div className="openings-section">
        <div className="section-header">
          <h2 className="section-heading">Open Positions</h2>
          <div className="openings-stats">
            <button 
              className={`ai-sort-btn ${isAiSorting ? 'sorting' : ''}`}
              onClick={handleAiSort}
              disabled={isAiSorting}
            >
              <Sparkles size={16} />
              {isAiSorting ? 'AI is Sorting...' : 'AI Smart Sort'}
            </button>
            <span className="stat-item">
              Total Openings: <strong>{openings.length}</strong>
            </span>
          </div>
        </div>

        {loading && <div className="no-openings">Loading openings...</div>}
        {error && !loading && <div className="no-openings">{error}</div>}

        <div className="openings-list">
          {!loading && !error && openings.map((opening) => (
            <div key={opening._id} className="opening-card">
              {opening.match_score > 0 && (
                <div className="ai-match-badge">
                  <Sparkles size={14} />
                  <span>{opening.match_score}% AI Match</span>
                </div>
              )}
              
              <div className="opening-header">
                <div className="opening-title-section">
                  <h3 className="opening-title">{opening.title}</h3>
                  <div className="opening-meta">
                    <span className="meta-item badge-location"><MapPin size={14} /> {opening.location}</span>
                    <span className="meta-item badge-salary"><DollarSign size={14} /> {opening.salary_range || 'Not Disclosed'}</span>
                  </div>
                </div>
              </div>

              <div className="opening-description">
                {opening.description}
              </div>

              {opening.match_reasoning && opening.match_score > 0 && (
                <div className="ai-reasoning-box">
                  <strong>AI Insight:</strong> {opening.match_reasoning}
                </div>
              )}

              <div className="opening-footer">
                <div className="posted-date">
                  <Calendar size={14} />
                  <span>
                    {opening.created_at
                      ? new Date(opening.created_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short'
                        })
                      : '-'}
                  </span>
                </div>
                <button
                  className="apply-btn"
                  onClick={() => openApplyModal(opening)}
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && openings.length === 0 && (
          <div className="no-openings">
            <p>No openings available at the moment.</p>
          </div>
        )}
      </div>

      {isModalOpen && selectedOpening && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Apply for {selectedOpening.title}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cvFile">
                    {profile?.cv_url ? "Resume / CV (PDF - Optional)" : "Resume / CV (PDF - Required)"}
                  </label>
                  <input
                    id="cvFile"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handleChange('cvFile', e.target.files[0] || null)}
                    required={!profile?.cv_url}
                  />
                  {profile?.cv_url && (
                    <span className="cv-attached-help" style={{ fontSize: '11px', color: '#43f4b1', marginTop: '4px', display: 'block' }}>
                      ✓ Pre-attached onboarding CV will be used. Choose a new file to change/overwrite it.
                    </span>
                  )}
                </div>
              </div>
              {submitError && <div className="no-openings">{submitError}</div>}
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicantOpenings

