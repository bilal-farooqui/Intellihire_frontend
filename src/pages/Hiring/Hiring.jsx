import { useEffect, useState } from 'react'
import { getAllJobs, getApplicationsForJob, getAllApplications, BACKEND_URL, updateApplicationStatus, deleteApplication } from '../../api'
import CVList from './components/CVList/CVList'
import PositionFilter from './components/PositionFilter/PositionFilter'
import ManualReview from './components/ManualReview/ManualReview'
import AIFiltering from './components/AIFiltering/AIFiltering'
import HiringAssistant from './components/HiringAssistant/HiringAssistant'
import toast from 'react-hot-toast'
import './Hiring.css'

const HIRING_TOAST_STYLE = {
  background: 'linear-gradient(170deg, rgba(18, 24, 34, 0.96) 0%, rgba(10, 13, 20, 0.98) 100%)',
  color: '#ecf2ff',
  border: '1px solid rgba(67, 244, 177, 0.28)',
  borderRadius: '14px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
  fontWeight: 600,
}

const hiringToastSuccess = (msg) =>
  toast.success(msg, {
    style: HIRING_TOAST_STYLE,
    duration: 3200,
    iconTheme: { primary: '#43f4b1', secondary: '#07130e' },
  })

const hiringToastError = (msg) =>
  toast.error(msg, {
    style: HIRING_TOAST_STYLE,
    duration: 4000,
    iconTheme: { primary: '#ff9b9b', secondary: '#2a0b0b' },
  })

function Hiring() {
  const [selectedPosition, setSelectedPosition] = useState('All Positions')
  const [selectedCV, setSelectedCV] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list', 'manual', 'ai'
  const [cvs, setCVs] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const positions = ['All Positions', ...jobs.map((j) => j.title)]

  const filteredCVs =
    selectedPosition && selectedPosition !== 'All Positions'
      ? cvs.filter((cv) => cv.position === selectedPosition)
      : cvs

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentCVs = filteredCVs.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCVs.length / itemsPerPage)

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const unviewedCount = cvs.filter(cv => cv.status === 'Unviewed').length

  useEffect(() => {
    const loadApplications = async (jobId = null, jobTitle = null) => {
      try {
        let apps = []
        if (jobId) {
          const appsRes = await getApplicationsForJob(jobId)
          apps = appsRes.data || []
        } else {
          const appsRes = await getAllApplications()
          apps = appsRes.data || []
        }

        // Create a job map for title lookups
        const jobsRes = await getAllJobs()
        const jobsData = jobsRes.data || []
        const jobMap = {}
        jobsData.forEach(j => jobMap[j._id] = j.title)

        const mapped = apps.map((app, index) => ({
          id: app._id || `CV${index + 1}`,
          applicantName: app.candidate_name,
          email: app.candidate_email,
          position: jobTitle || jobMap[app.job_id] || 'Unknown Position',
          uploadedDate: app.applied_at
            ? new Date(app.applied_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : '-',
          status: app.status || 'Unviewed',
          fileName: app.cv_url 
            ? (app.cv_url.startsWith('http') ? app.cv_url : `${BACKEND_URL}${app.cv_url.startsWith('/') ? '' : '/'}${app.cv_url}`)
            : '',
          matchScore: app.ai_score ?? null
        }))
        setCVs(mapped)
      } catch (err) {
        console.error('Error loading applications', err)
        setError('Failed to load applications')
      }
    }

    const fetchJobsAndApplications = async () => {
      try {
        setLoading(true)
        setError('')
        const jobsRes = await getAllJobs()
        const jobsData = jobsRes.data || []
        setJobs(jobsData)

        // Load ALL applications by default (All Positions)
        await loadApplications()
      } catch (err) {
        console.error('Error loading jobs/applications', err)
        setError('Failed to load hiring data')
      } finally {
        setLoading(false)
      }
    }

    fetchJobsAndApplications()

    // expose function for use in handlers (hacky but simple for now)
    Hiring._loadApplications = loadApplications
  }, [])

  const handlePositionChange = (position) => {
    setSelectedPosition(position)
    setCurrentPage(1) // Reset to first page
    if (position === 'All Positions') {
      if (Hiring._loadApplications) {
        Hiring._loadApplications()
      }
    } else {
      const job = jobs.find((j) => j.title === position)
      if (job && Hiring._loadApplications) {
        Hiring._loadApplications(job._id, job.title)
      }
    }
  }

  const handleViewCV = (cv) => {
    setSelectedCV(cv)
    setViewMode('manual')
    // Mark as viewed
    setCVs(cvs.map(c => c.id === cv.id ? { ...c, status: 'Viewed' } : c))
  }

  const handleDeleteCV = (cvId, isRejectAction = false) => {
    const confirmMsg = isRejectAction
      ? 'Are you sure you want to reject and delete this application? This cannot be undone.'
      : 'Are you sure you want to delete this CV? This cannot be undone.'

    const wasSelected = selectedCV?.id === cvId

    toast.custom(
      (t) => (
        <div className="hiring-toast-confirm">
          <p className="hiring-toast-confirm-message">{confirmMsg}</p>
          <div className="hiring-toast-confirm-actions">
            <button
              type="button"
              className="hiring-toast-btn hiring-toast-btn-cancel"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="hiring-toast-btn hiring-toast-btn-danger"
              onClick={async () => {
                toast.dismiss(t.id)
                try {
                  await deleteApplication(cvId)
                  setCVs((prev) => prev.filter((cv) => cv.id !== cvId))
                  hiringToastSuccess(
                    isRejectAction ? 'Application rejected and deleted' : 'Application deleted'
                  )
                  if (wasSelected) {
                    setSelectedCV(null)
                    setViewMode('list')
                  }
                } catch (err) {
                  console.error('Error deleting application:', err)
                  hiringToastError('Failed to delete application')
                }
              }}
            >
              {isRejectAction ? 'Reject & delete' : 'Delete'}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: 'top-center' }
    )
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedCV(null)
  }

  const handleUpdateStatus = async (cv, newStatus) => {
    if (!cv?.id) return
    
    // Optimistic UI update
    setCVs(prev =>
      prev.map((c) => (c.id === cv.id ? { ...c, status: newStatus } : c))
    )
    
    // Update selectedCV so ManualReview shows change
    if (selectedCV && selectedCV.id === cv.id) {
      setSelectedCV(prev => ({ ...prev, status: newStatus }))
    }

    try {
      await updateApplicationStatus(cv.id, newStatus)
      hiringToastSuccess(`Application marked as ${newStatus}`)
    } catch (err) {
      console.error('Error updating status', err)
      // Revert if failed
      setCVs(prev =>
        prev.map((c) => (c.id === cv.id ? { ...c, status: cv.status } : c))
      )
      if (selectedCV && selectedCV.id === cv.id) {
        setSelectedCV(prev => ({ ...prev, status: cv.status }))
      }
      setError('Failed to update application status')
      hiringToastError('Failed to update application status')
    }
  }

  const handleReject = () => {
    if (selectedCV) {
      handleDeleteCV(selectedCV.id, true) // Pass true to indicate it's from Reject
    }
  }

  return (
    <div className="hiring-page">
      <h1 className="page-title">Hello Thomas</h1>
      
      <div className="hiring-section">
        <div className="section-header">
          <h2 className="section-heading">Hiring</h2>
          <div className="stats-info">
            <span className="stat-item">
              Total CVs: <strong>{cvs.length}</strong>
            </span>
            <span className="stat-item unviewed">
              Unviewed: <strong>{unviewedCount}</strong>
            </span>
          </div>
        </div>

        {loading && <div className="no-openings">Loading hiring data...</div>}
        {error && !loading && <div className="no-openings">{error}</div>}

        {viewMode === 'list' && (
          <>
            <PositionFilter
              positions={positions}
              selectedPosition={selectedPosition}
              onPositionChange={handlePositionChange}
            />

            <div className="review-options">
              <div className="option-card ai-option" onClick={() => setViewMode('ai')}>
                <div className="option-icon">🤖</div>
                <h3>AI Filtering</h3>
                <p>Use AI to filter CVs that match job descriptions</p>
              </div>
            </div>

            <CVList
              cvs={currentCVs}
              onViewCV={handleViewCV}
              onDeleteCV={handleDeleteCV}
            />

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="page-link"
                >
                  &laquo; Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`page-link ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="page-link"
                >
                  Next &raquo;
                </button>
              </div>
            )}
          </>
        )}

        {viewMode === 'manual' && (
          <ManualReview
            cv={selectedCV}
            cvs={filteredCVs}
            onSelectCV={(cvId) => {
              const picked = filteredCVs.find((c) => c.id === cvId)
              if (!picked) return
              setSelectedCV(picked)
              setCVs(cvs.map(c => c.id === picked.id ? { ...c, status: 'Viewed' } : c))
            }}
            onBack={handleBackToList}
            onNext={() => {
              if (!selectedCV) return
              const currentIndex = filteredCVs.findIndex(c => c.id === selectedCV.id)
              const nextCV = filteredCVs[currentIndex + 1] || filteredCVs[0]
              if (nextCV) {
                setSelectedCV(nextCV)
                setCVs(cvs.map(c => c.id === nextCV.id ? { ...c, status: 'Viewed' } : c))
              }
            }}
            onPrevious={() => {
              if (!selectedCV) return
              const currentIndex = filteredCVs.findIndex(c => c.id === selectedCV.id)
              const prevCV = filteredCVs[currentIndex - 1] || filteredCVs[filteredCVs.length - 1]
              if (prevCV) {
                setSelectedCV(prevCV)
                setCVs(cvs.map(c => c.id === prevCV.id ? { ...c, status: 'Viewed' } : c))
              }
            }}
            totalCVs={filteredCVs.length}
            currentIndex={filteredCVs.findIndex(c => c.id === selectedCV?.id) + 1}
            onShortlist={() => handleUpdateStatus(selectedCV, 'Shortlisted')}
            onReject={handleReject}
          />
        )}

        {viewMode === 'ai' && (
          <AIFiltering
            cvs={filteredCVs}
            selectedPosition={selectedPosition}
            onBack={handleBackToList}
            onViewCV={handleViewCV}
          />
        )}
      </div>

      {/* AI Assistant Floating Button */}
      <HiringAssistant candidates={cvs} />
    </div>
  )
}

export default Hiring

