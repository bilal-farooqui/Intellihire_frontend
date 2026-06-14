import { useEffect, useState } from 'react'
import { 
  getAllInterviews, 
  scheduleManualInterview, 
  scheduleSequentialInterview,
  getAllJobs,
  getApplicationsForJob
} from '../../api'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Info,
  Check,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import './AdminInterviews.css'

function AdminInterviews() {
  const [interviews, setInterviews] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Job selection state
  const [selectedJob, setSelectedJob] = useState(null)
  const [shortlistedCandidates, setShortlistedCandidates] = useState([])
  const [selectedCandidateEmails, setSelectedCandidateEmails] = useState([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date().getMonth())
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear())

  // Modal / Rescheduling state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [reschedulingInterview, setReschedulingInterview] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  
  const [submitting, setSubmitting] = useState(false)

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError('')
      const [intRes, jobRes] = await Promise.all([
        getAllInterviews(),
        getAllJobs()
      ])
      
      setInterviews(intRes.data || [])
      setJobs(jobRes.data || [])
      
    } catch (err) {
      console.error('Error fetching interview data', err)
      setError('Failed to load scheduling matrix data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  // When a job is clicked/selected
  const handleSelectJob = async (job) => {
    setSelectedJob(job)
    setLoadingCandidates(true)
    try {
      const res = await getApplicationsForJob(job._id)
      const apps = res.data || []
      const shortlisted = apps.filter(app => app.status === 'Shortlisted')
      setShortlistedCandidates(shortlisted)
      setSelectedCandidateEmails([]) // Reset checked candidates
    } catch (err) {
      console.error('Error fetching applications for job', err)
      toast.error('Failed to load candidates for selected position')
    } finally {
      setLoadingCandidates(false)
    }
  }

  // Toggle selection for a candidate checkbox
  const handleToggleCandidate = (email) => {
    if (selectedCandidateEmails.includes(email)) {
      setSelectedCandidateEmails(selectedCandidateEmails.filter(e => e !== email))
    } else {
      setSelectedCandidateEmails([...selectedCandidateEmails, email])
    }
  }

  // Toggle select all candidates
  const handleToggleSelectAll = () => {
    if (selectedCandidateEmails.length === shortlistedCandidates.length) {
      setSelectedCandidateEmails([])
    } else {
      setSelectedCandidateEmails(shortlistedCandidates.map(c => c.candidate_email))
    }
  }

  // Trigger Sequential Automated Scheduling
  const handleTriggerSequential = async (onlySelected = false) => {
    if (!selectedJob) {
      toast.error('Please select a job position first')
      return
    }

    const emailsToSchedule = onlySelected 
      ? selectedCandidateEmails 
      : shortlistedCandidates.map(c => c.candidate_email)

    if (emailsToSchedule.length === 0) {
      toast.error(onlySelected ? 'Please select at least one candidate' : 'No shortlisted candidates available')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        job_id: selectedJob._id,
        applicant_ids: emailsToSchedule
      }
      
      const res = await scheduleSequentialInterview(payload)
      toast.success(res.data?.message || 'Sequential scheduling completed successfully!')
      
      // Clear selections and refresh
      setSelectedCandidateEmails([])
      await fetchInitialData()
      // Reload candidates to see updated status if any
      await handleSelectJob(selectedJob)
    } catch (err) {
      console.error('Error in sequential scheduling', err)
      toast.error('Failed to complete sequential scheduling')
    } finally {
      setSubmitting(false)
    }
  }

  // Open manual Reschedule modal
  const handleOpenReschedule = (interview) => {
    setReschedulingInterview(interview)
    setRescheduleDate('')
    setRescheduleTime('')
    setIsRescheduleOpen(true)
  }

  // Submit manual Reschedule
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault()
    if (!rescheduleDate || !rescheduleTime || !reschedulingInterview) {
      toast.error('Please select both a date and time slot')
      return
    }

    try {
      setSubmitting(true)
      
      // Format time: e.g. "15:00" to "03:00 PM"
      const [hours, minutes] = rescheduleTime.split(':')
      let hoursNum = parseInt(hours)
      const ampm = hoursNum >= 12 ? 'PM' : 'AM'
      hoursNum = hoursNum % 12
      hoursNum = hoursNum ? hoursNum : 12
      const timeSlotStr = `${String(hoursNum).padStart(2, '0')}:${minutes || '00'} ${ampm}`
      
      // Format date with year: e.g. "Monday, June 15, 2026"
      const dateObj = new Date(rescheduleDate)
      const dateFormatted = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })

      const payload = {
        applicant_id: reschedulingInterview.applicant_id,
        job_id: reschedulingInterview.job_id,
        interview_date: dateFormatted,
        time_slot: timeSlotStr
      }

      await scheduleManualInterview(payload)
      toast.success('Interview rescheduled successfully!')
      setIsRescheduleOpen(false)
      fetchInitialData() // Refresh list
    } catch (err) {
      console.error('Error rescheduling interview', err)
      toast.error('Failed to reschedule interview')
    } finally {
      setSubmitting(false)
    }
  }

  // Calendar helper functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11)
      setCurrentCalendarYear(currentCalendarYear - 1)
    } else {
      setCurrentCalendarMonth(currentCalendarMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0)
      setCurrentCalendarYear(currentCalendarYear + 1)
    } else {
      setCurrentCalendarMonth(currentCalendarMonth + 1)
    }
  }

  // Helper to match interviews to calendar day
  const getInterviewsForDay = (year, month, day) => {
    return interviews.filter(item => {
      if (item.status !== 'Scheduled') return false
      
      if (item.interview_timestamp) {
        const d = new Date(item.interview_timestamp)
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
      }
      
      // Fallback parser of string representation
      try {
        if (!item.interview_date) return false
        const parts = item.interview_date.split(',')
        if (parts.length < 2) return false
        const datePart = parts[1].trim() // "June 15"
        const d = new Date(datePart)
        const intYear = parts[2] ? parseInt(parts[2].trim()) : new Date().getFullYear()
        return d.getMonth() === month && d.getDate() === day && intYear === year
      } catch {
        return false
      }
    })
  }

  // Compile calendar tiles
  const daysCount = getDaysInMonth(currentCalendarYear, currentCalendarMonth)
  const firstDayIndex = getFirstDayOfMonth(currentCalendarYear, currentCalendarMonth)
  const calendarTiles = []
  
  // Padding slots
  for (let i = 0; i < firstDayIndex; i++) {
    calendarTiles.push({ isPadding: true, day: '' })
  }
  // Month days
  for (let d = 1; d <= daysCount; d++) {
    calendarTiles.push({ isPadding: false, day: d })
  }

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Filter and sort timeline list for selected day
  const selectedYear = selectedDate.getFullYear()
  const selectedMonth = selectedDate.getMonth()
  const selectedDay = selectedDate.getDate()
  
  const timelineInterviews = getInterviewsForDay(selectedYear, selectedMonth, selectedDay).sort((a, b) => {
    if (a.interview_timestamp && b.interview_timestamp) {
      return new Date(a.interview_timestamp) - new Date(b.interview_timestamp)
    }
    // Fallback: parse times
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0
      const [time, modifier] = timeStr.split(' ')
      let [hours, minutes] = time.split(':')
      hours = parseInt(hours)
      minutes = parseInt(minutes)
      if (modifier === 'PM' && hours < 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    }
    return timeToMinutes(a.time_slot) - timeToMinutes(b.time_slot)
  })

  return (
    <div className="admin-interviews-page">
      <div className="page-header-row">
        <h1 className="page-title">Sequential Interview Management</h1>
      </div>

      {/* 1. JOB-CENTRIC COORDINATOR PANEL */}
      <div className="job-centric-dashboard">
        {/* Left Column: Job Selector Grid */}
        <div className="job-selector-grid-container">
          <h3 className="section-subtitle">
            <Briefcase size={16} className="title-icon" /> Select a Job Position
          </h3>
          <div className="jobs-list-grid">
            {jobs.map((job) => (
              <div 
                key={job._id} 
                className={`job-card-option ${selectedJob?._id === job._id ? 'selected' : ''}`}
                onClick={() => handleSelectJob(job)}
              >
                <div className="job-card-title">{job.title}</div>
                <div className="job-card-meta">{job.location} • {job.salary_range}</div>
              </div>
            ))}
            {jobs.length === 0 && !loading && (
              <div className="no-jobs-placeholder">No active job openings available.</div>
            )}
          </div>
        </div>

        {/* Right Column: Shortlisted Candidates Table */}
        <div className="candidates-table-container">
          <h3 className="section-subtitle">
            <User size={16} className="title-icon" /> Shortlisted Pool Candidates
          </h3>
          
          {!selectedJob ? (
            <div className="select-job-notice">
              <Info size={24} />
              <p>Please select an active position on the left to display its shortlisted candidates.</p>
            </div>
          ) : loadingCandidates ? (
            <div className="candidates-loading">
              <div className="spinner"></div>
              <span>Fetching applicant profiles...</span>
            </div>
          ) : (
            <>
              <div className="table-actions-header">
                <div className="selected-count-badge">
                  {selectedCandidateEmails.length} of {shortlistedCandidates.length} Selected
                </div>
                <div className="automation-actions-row">
                  <button 
                    className="secondary-btn"
                    onClick={() => handleTriggerSequential(true)}
                    disabled={selectedCandidateEmails.length === 0 || submitting}
                  >
                    Schedule Selected
                  </button>
                  <button 
                    className="primary-btn sequential-trigger-btn"
                    onClick={() => handleTriggerSequential(false)}
                    disabled={shortlistedCandidates.length === 0 || submitting}
                  >
                    Schedule All Sequentially
                  </button>
                </div>
              </div>

              <div className="candidates-list-scrollable">
                <table className="candidates-flat-table">
                  <thead>
                    <tr>
                      <th className="checkbox-col">
                        <input 
                          type="checkbox" 
                          checked={shortlistedCandidates.length > 0 && selectedCandidateEmails.length === shortlistedCandidates.length}
                          onChange={handleToggleSelectAll}
                        />
                      </th>
                      <th>Candidate</th>
                      <th>AI Match Score</th>
                      <th>Scheduling Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortlistedCandidates.map((candidate) => {
                      // Check if candidate already has a scheduled interview
                      const scheduledInt = interviews.find(
                        i => i.applicant_id === candidate.candidate_email && i.job_id === selectedJob._id && i.status === 'Scheduled'
                      )
                      const isChecked = selectedCandidateEmails.includes(candidate.candidate_email)
                      
                      return (
                        <tr key={candidate.id} className={isChecked ? 'row-selected' : ''}>
                          <td>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCandidate(candidate.candidate_email)}
                            />
                          </td>
                          <td>
                            <div className="candidate-info-cell">
                              <div className="candidate-name-bold">{candidate.applicantName}</div>
                              <div className="candidate-email-muted">{candidate.candidate_email || candidate.email}</div>
                            </div>
                          </td>
                          <td>
                            <div className="score-pill-container">
                              <span className={`score-badge-flat ${candidate.matchScore >= 80 ? 'high' : candidate.matchScore >= 50 ? 'medium' : 'low'}`}>
                                {candidate.matchScore ?? 'N/A'}%
                              </span>
                            </div>
                          </td>
                          <td>
                            {scheduledInt ? (
                              <span className="status-pill scheduled">
                                {scheduledInt.interview_date} | {scheduledInt.time_slot}
                              </span>
                            ) : (
                              <span className="status-pill awaiting_scheduling">Awaiting Slot</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {shortlistedCandidates.length === 0 && (
                      <tr>
                        <td colSpan="4" className="no-candidates-table">
                          No shortlisted candidates found for this position. Mark applicants as "Shortlisted" in the Hiring module.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. PREMIUM TRANSPARENT GLASS CALENDAR MATRIX */}
      <div className="glass-calendar-section-container">
        <h2 className="calendar-main-title">
          <CalendarIcon size={20} className="title-icon" /> Organization Interview Matrix
        </h2>
        
        <div className="glass-calendar-layout">
          {/* Calendar Box */}
          <div className="calendar-grid-box">
            {/* Header controls */}
            <div className="calendar-header-controls">
              <button className="month-nav-btn" onClick={handlePrevMonth}>
                <ChevronLeft size={18} />
              </button>
              <h3 className="month-title-display">
                {monthsList[currentCalendarMonth]} {currentCalendarYear}
              </h3>
              <button className="month-nav-btn" onClick={handleNextMonth}>
                <ChevronRight size={18} />
              </button>
            </div>
            
            {/* Weekdays */}
            <div className="calendar-weekdays-row">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            
            {/* Day Tiles */}
            <div className="calendar-days-grid">
              {calendarTiles.map((tile, idx) => {
                if (tile.isPadding) {
                  return <div key={`pad-${idx}`} className="calendar-day-tile padding-tile"></div>
                }
                
                const isSelected = selectedDate.getDate() === tile.day && 
                                   selectedDate.getMonth() === currentCalendarMonth && 
                                   selectedDate.getFullYear() === currentCalendarYear
                
                const isToday = new Date().getDate() === tile.day && 
                                new Date().getMonth() === currentCalendarMonth && 
                                new Date().getFullYear() === currentCalendarYear
                                
                const dayInterviews = getInterviewsForDay(currentCalendarYear, currentCalendarMonth, tile.day)
                
                return (
                  <div 
                    key={`day-${tile.day}`} 
                    className={`calendar-day-tile ${isSelected ? 'selected-tile' : ''} ${isToday ? 'today-tile' : ''}`}
                    onClick={() => setSelectedDate(new Date(currentCalendarYear, currentCalendarMonth, tile.day))}
                  >
                    <span className="day-number">{tile.day}</span>
                    {dayInterviews.length > 0 && (
                      <div className="day-status-indicator-dots">
                        {dayInterviews.slice(0, 3).map((_, dotIdx) => (
                          <span key={dotIdx} className="status-dot"></span>
                        ))}
                        {dayInterviews.length > 3 && (
                          <span className="dots-count-indicator">+{dayInterviews.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Timeline Split Pane */}
          <div className="timeline-split-pane">
            <h3 className="timeline-heading">
              <Clock size={16} className="title-icon" /> Timeline • {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            
            <div className="timeline-scroller">
              {timelineInterviews.length > 0 ? (
                <div className="timeline-flow-list">
                  {timelineInterviews.map((item) => (
                    <div key={item._id} className="timeline-item-card">
                      <div className="time-indicator-badge">
                        <Clock size={12} style={{ marginRight: '4px' }} /> {item.time_slot}
                      </div>
                      
                      <div className="timeline-item-body">
                        <div className="candidate-name-main">{item.candidate_name}</div>
                        <div className="candidate-email-sub">{item.candidate_email}</div>
                        <div className="position-title-tag">{item.job_title}</div>
                        
                        {item.meeting_link && (
                          <div className="timeline-meet-link">
                            <a href={item.meeting_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink size={12} style={{ marginRight: '4px' }} /> Join Meeting Room
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="timeline-item-footer">
                        <span className="badge-mode">{item.mode}</span>
                        <button 
                          className="btn-action reschedule"
                          onClick={() => handleOpenReschedule(item)}
                          title="Reschedule Interview"
                        >
                          <Edit3 size={12} /> Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="timeline-empty-notice">
                  <CalendarIcon size={32} />
                  <p>No interviews scheduled for this date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. RESCHEDULE MODAL */}
      {isRescheduleOpen && reschedulingInterview && (
        <div className="scheduling-modal-overlay">
          <div className="scheduling-modal">
            <div className="modal-header">
              <h2>Reschedule Interview</h2>
              <button className="close-modal-btn" onClick={() => setIsRescheduleOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group">
                <label>Candidate</label>
                <div className="read-only-modal-field">{reschedulingInterview.candidate_name} ({reschedulingInterview.candidate_email})</div>
              </div>

              <div className="form-group">
                <label>Position</label>
                <div className="read-only-modal-field">{reschedulingInterview.job_title}</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>New Interview Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Time Slot</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsRescheduleOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Updating Slot...' : 'Update Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInterviews
