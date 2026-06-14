import { useEffect, useState } from 'react'
import { getApplicationsByCandidate, getAllJobs, getApplicantInterview, confirmInterviewSlot, BACKEND_URL } from '../../api'
import { Clock, Calendar, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import '../ApplicantOpenings/ApplicantOpenings.css'
import './ApplicantApplications.css'

function ApplicantApplications({ userInfo }) {
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadApplications = async () => {
      const candidateEmail = String(userInfo?.email || '')
        .trim()
        .toLowerCase()
      if (!candidateEmail) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        
        // Fetch applications, jobs, and interviews in parallel
        const [appsRes, jobsRes, interviewsRes] = await Promise.all([
          getApplicationsByCandidate(candidateEmail),
          getAllJobs(),
          getApplicantInterview(candidateEmail)
        ])

        const appsData = appsRes.data || []
        const jobsData = jobsRes.data || []
        const interviewsData = interviewsRes.data || []

        // Create a map of job_id -> job details
        const jobsMap = {}
        jobsData.forEach(job => {
          jobsMap[job._id] = job
        })

        // Map applications with job details
        const mappedApplications = appsData.map(app => {
          const job = jobsMap[app.job_id] || {}
          return {
            id: app._id,
            jobId: app.job_id,
            title: job.title || 'Position Not Found',
            department: job.location || 'N/A',
            status: app.status || 'Pending',
            appliedDate: app.applied_at 
              ? new Date(app.applied_at).toLocaleDateString('en-US', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })
              : 'N/A',
            applicantName: app.candidate_name || 'N/A',
            email: app.candidate_email || userInfo.email,
            cvUrl: app.cv_url 
              ? (app.cv_url.startsWith('http') ? app.cv_url : `${BACKEND_URL}${app.cv_url}`)
              : null,
            response: app.status === 'Shortlisted' 
              ? 'Congratulations! Your application has been shortlisted. We will contact you soon.'
              : app.status === 'Rejected'
              ? 'Thank you for your interest. Unfortunately, we are not proceeding with your application at this time.'
              : 'Pending review by HR'
          }
        })

        setApplications(mappedApplications)
        setJobs(jobsData)
        setInterviews(interviewsData)
      } catch (err) {
        console.error('Error loading applications', err)
        setError('Failed to load your applications. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [userInfo?.email])

  const handleConfirmSlot = async (interviewId, slot) => {
    try {
      const payload = {
        interview_id: interviewId,
        chosen_slot: slot
      }
      const res = await confirmInterviewSlot(payload)
      toast.success('Interview slot confirmed!')
      
      // Update local state reactively
      setInterviews(prev => prev.map(item => {
        if (item._id === interviewId) {
          return {
            ...item,
            status: 'Scheduled',
            interview_date: res.data?.interview_date,
            time_slot: res.data?.time_slot,
            suggested_slots: []
          }
        }
        return item
      }))
    } catch (err) {
      console.error('Error confirming slot', err)
      toast.error('Failed to confirm slot. Please try again.')
    }
  }

  return (
    <div className="applicant-openings-page">
      <h1 className="page-title">My Applications</h1>

      <div className="openings-section">
        <div className="section-header">
          <h2 className="section-heading">Submitted Applications</h2>
          <div className="openings-stats">
            <span className="stat-item">
              Total: <strong>{applications.length}</strong>
            </span>
          </div>
        </div>

        {loading && (
          <div className="no-openings">Loading your applications...</div>
        )}

        {error && !loading && (
          <div className="no-openings">{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="openings-list">
              {applications.map((app) => {
                const appInterview = interviews.find(i => i.job_id === app.jobId)
                return (
                  <div key={app.id} className="opening-card">
                    <div className="opening-header">
                      <div className="opening-title-section">
                        <h3 className="opening-title">{app.title}</h3>
                        <div className="opening-meta">
                          <span className="meta-item badge-location"><MapPin size={14} /> {app.department}</span>
                          <span className="meta-item badge-date"><Calendar size={14} /> Applied: {app.appliedDate}</span>
                        </div>
                      </div>
                      <div className="application-status">
                        <span className={`status-badge ${app.status.toLowerCase()}`}>{app.status}</span>
                      </div>
                    </div>

                    <div className="application-details">
                      <div className="detail-item">
                        <span className="detail-label">Applicant:</span>
                        <span className="detail-value">{app.applicantName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{app.email}</span>
                      </div>
                      {app.cvUrl && (
                        <div className="detail-item">
                          <span className="detail-label">CV:</span>
                          <span className="detail-value">
                            <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="cv-link">
                              View CV
                            </a>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={`application-response ${app.status.toLowerCase()}`}>
                      <div className="response-label">HR Response</div>
                      <div className={`response-text ${app.status.toLowerCase()}`}>{app.response}</div>
                    </div>

                    {/* Inline Interview Widget (Read-Only Alert Widget) */}
                    {appInterview && (
                      <div className="applicant-interview-widget animate-in">
                        {appInterview.status === 'Scheduled' ? (
                          <div className="interview-status-card scheduled read-only">
                            <div className="widget-header">
                              <div className="success-icon-container">
                                <Calendar size={20} />
                              </div>
                              <div className="widget-title-group">
                                <h3>Your Interview is Confirmed!</h3>
                                <p>You have been assigned a sequential, non-overlapping slot by the automated scheduling engine.</p>
                              </div>
                            </div>
                            <div className="confirmed-details">
                              <div className="detail-item">
                                <span className="label">Date</span>
                                <span className="value">{appInterview.interview_date}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Time</span>
                                <span className="value">{appInterview.time_slot}</span>
                              </div>
                            </div>
                            <div className="widget-footer-disclaimer">
                              <p className="disclaimer-text" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                                To request a change of schedule, please contact HR Operations directly.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="interview-status-card awaiting read-only">
                            <div className="widget-header">
                              <div className="alert-icon-container">
                                <Clock size={20} />
                              </div>
                              <div className="widget-title-group">
                                <h3>Interview Processing</h3>
                                <p>Your interview scheduling is being processed. The automated engine will assign your sequential slot shortly.</p>
                              </div>
                            </div>
                            <div className="widget-footer-disclaimer">
                              <p className="disclaimer-text" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                                To request a change of schedule, please contact HR Operations directly.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {applications.length === 0 && (
              <div className="no-openings">
                <p>No applications submitted yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ApplicantApplications

