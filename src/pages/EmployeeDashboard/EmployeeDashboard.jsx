import { useEffect, useState } from 'react'
import { requestLeave, getMyLeaves, getEmployeeAttendance, getEmployee, autoClockIn, requestWFH, getMyWFHRequests, getMyPayroll } from '../../api'
import AttendanceDashboard from './components/AttendanceDashboard/AttendanceDashboard'
import toast from 'react-hot-toast'
import { Calendar, AlertTriangle, RotateCw, User, Mail, FileText, Phone, MapPin, Shield, DollarSign, Clock, HelpCircle, CheckCircle, BadgePercent } from 'lucide-react'
import './EmployeeDashboard.css'

function EmployeeDashboard({ user }) {
  // Logged-in employee data (from backend). We will fetch the full employee record to get authoritative salary.
  const [employeeRecord, setEmployeeRecord] = useState(null)
  const [employeeLoading, setEmployeeLoading] = useState(false)

  // Employee data from database (prefer employeeRecord, fallback to user prop)
  const employeeData = {
    name: employeeRecord?.full_name || user?.name || 'Loading...',
    id: employeeRecord?.employee_code || user?.employee_code || user?.employeeCode || 'EMP001',
    email: employeeRecord?.email || user?.email || '',
    cnic: employeeRecord?.cnic || user?.cnic || '—',
    mobile: employeeRecord?.mobile || user?.mobile || '—',
    // Date of joining from database
    dateOfJoining: employeeRecord?.joined_at 
      ? new Date(employeeRecord.joined_at).toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      : '—',
    // Other fields (can be added to database schema later if needed)
    department: '—', // Not in current schema
    designation: employeeRecord?.role || 'Employee',
    manager: '—' // Not in current schema
  }

  useEffect(() => {
    const loadEmployee = async () => {
      const employeeId = user?.employee_code || user?.employeeCode;
      if (!employeeId) return
      try {
        setEmployeeLoading(true)
        const res = await getEmployee(employeeId)
        const empData = res.data || null
        setEmployeeRecord(empData)
        
        // AUTO CLOCK IN LOGIC
        try {
          const autoRes = await autoClockIn({ employee_id: user.employeeCode })
          if (autoRes.data?.status === 'success') {
            toast.success('Welcome! Your attendance has been automatically marked for today.', { duration: 5000 })
          }
        } catch (e) {
          console.error('Auto clock in check failed', e)
        }
        
      } catch (err) {
        console.error('Error loading employee record', err)
      } finally {
        setEmployeeLoading(false)
      }
    }
    loadEmployee()
  }, [user?.employeeCode])

  // Leave request (employee side)
  const [leaveForm, setLeaveForm] = useState({
    type: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  })

  const [leaveRequests, setLeaveRequests] = useState([])
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [leaveError, setLeaveError] = useState('')

  // Leave quota constants
  const SICK_PER_MONTH = 2
  const CASUAL_PER_MONTH = 2
  const ANNUAL_PER_YEAR = 10

  // Helper: does leave overlap target period?
  const leaveOverlaps = (leave, periodStart, periodEnd) => {
    if (!leave?.startDate || !leave?.endDate) return false
    const normalizeDate = (value) => {
      const text = String(value || '').trim()
      if (!text) return null
      // Parse date-only part in local time to avoid UTC timezone shifts.
      const dateOnly = text.slice(0, 10)
      const parsed = new Date(`${dateOnly}T12:00:00`)
      return isNaN(parsed) ? null : parsed
    }
    const start = normalizeDate(leave.startDate)
    const end = normalizeDate(leave.endDate)
    if (isNaN(start) || isNaN(end)) return false
    return end >= periodStart && start <= periodEnd
  }

  // Derived leave usage (approved leaves only)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const currentYearStart = new Date(now.getFullYear(), 0, 1)
  const currentYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)

  const normalizeStatus = (status) => String(status || '').trim().toLowerCase()
  const approvedLeaves = leaveRequests.filter((l) => normalizeStatus(l.status) === 'approved')

  const normalizeLeaveType = (type) => {
    const raw = String(type || '').trim().toLowerCase()
    if (!raw) return ''
    if (raw.includes('sick')) return 'Sick Leave'
    if (raw.includes('casual')) return 'Casual Leave'
    if (raw.includes('annual')) return 'Annual Leave'
    return raw
  }

  const sickUsed = approvedLeaves
    .filter((l) => normalizeLeaveType(l.type) === 'Sick Leave' && leaveOverlaps(l, currentMonthStart, currentMonthEnd))
    .length

  const casualUsed = approvedLeaves
    .filter((l) => normalizeLeaveType(l.type) === 'Casual Leave' && leaveOverlaps(l, currentMonthStart, currentMonthEnd))
    .length

  const annualUsed = approvedLeaves
    .filter((l) => normalizeLeaveType(l.type) === 'Annual Leave' && leaveOverlaps(l, currentYearStart, currentYearEnd))
    .length

  const sickRemaining = Math.max(0, SICK_PER_MONTH - sickUsed)
  const casualRemaining = Math.max(0, CASUAL_PER_MONTH - casualUsed)
  const annualRemaining = Math.max(0, ANNUAL_PER_YEAR - annualUsed)

  // Dynamic balance tracking for remaining leaves
  const annualAllocation = employeeRecord?.paid_leaves_total ?? 10
  const usedLeaves = employeeRecord?.paid_leaves_used ?? 0
  const remainingLeaves = annualAllocation - usedLeaves

  // Load my leaves from backend
  useEffect(() => {
    const loadLeaves = async () => {
      if (!employeeData.id) return
      try {
        setLeaveLoading(true)
        setLeaveError('')
        const res = await getMyLeaves(employeeData.id)
        const data = res.data || []
        // Map backend fields to UI-friendly format
        const mapped = data.map((item) => ({
          id: item._id,
          type: item.leave_type,
          startDate: item.start_date,
          endDate: item.end_date,
          status: item.status
        }))
        setLeaveRequests(mapped)
      } catch (err) {
        console.error('Error loading leaves', err)
        setLeaveError('Failed to load your leave history')
      } finally {
        setLeaveLoading(false)
      }
    }

    loadLeaves()
  }, [employeeData.id])

  const handleLeaveChange = (field, value) => {
    setLeaveForm({ ...leaveForm, [field]: value })
  }

  const handleLeaveSubmit = async (e) => {
    e.preventDefault()
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) return

    // Calculate requested duration
    const start = new Date(leaveForm.startDate)
    const end = new Date(leaveForm.endDate)
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

    if (duration > remainingLeaves || duration > 10) {
      toast.error(`Auto-Rejected: Requested days (${duration}) exceed your remaining balance (${remainingLeaves}) or global policy cap (10 days).`)
    }

    try {
      setLeaveLoading(true)
      setLeaveError('')

      const payload = {
        employee_id: employeeData.id,
        start_date: new Date(leaveForm.startDate).toISOString(),
        end_date: new Date(leaveForm.endDate).toISOString(),
        reason: leaveForm.reason,
        leave_type: leaveForm.type
      }

      const res = await requestLeave(payload)
      const isAutoRejected = res.data?.status === 'Rejected' || res.data?.auto_rejected

      // Refresh list
      const listRes = await getMyLeaves(employeeData.id)
      const data = listRes.data || []
      const mapped = data.map((item) => ({
        id: item._id,
        type: item.leave_type,
        startDate: item.start_date,
        endDate: item.end_date,
        status: item.status
      }))
      setLeaveRequests(mapped)

      // Reload employee record from backend to update remaining leaves balance reactively
      try {
        const empRes = await getEmployee(employeeData.id)
        if (empRes.data) {
          setEmployeeRecord(empRes.data)
        }
      } catch (empErr) {
        console.error('Error reloading employee details', empErr)
      }

      setLeaveForm({
        type: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: ''
      })

      if (isAutoRejected) {
        toast.error('Leave Auto-Rejected: Requested days exceed the available annual leave balance.', { duration: 6000 })
      } else {
        toast.success('Leave request submitted')
      }
    } catch (err) {
      console.error('Error submitting leave', err)
      setLeaveError('Failed to submit leave request')
    } finally {
      setLeaveLoading(false)
    }
  }

  // WFH Request logic
  const [wfhForm, setWfhForm] = useState({
    date: '',
    reason: ''
  })
  const [wfhRequests, setWfhRequests] = useState([])
  const [wfhLoading, setWfhLoading] = useState(false)
  const [wfhError, setWfhError] = useState('')

  useEffect(() => {
    const loadWfh = async () => {
      if (!employeeData.id) return
      try {
        setWfhLoading(true)
        const res = await getMyWFHRequests(employeeData.id)
        setWfhRequests(res.data || [])
      } catch (err) {
        console.error('Error loading WFH', err)
      } finally {
        setWfhLoading(false)
      }
    }
    loadWfh()
  }, [employeeData.id])

  const handleWfhSubmit = async (e) => {
    e.preventDefault()
    if (!wfhForm.date || !wfhForm.reason) return

    try {
      setWfhLoading(true)
      setWfhError('')

      const payload = {
        employee_id: employeeData.id,
        date: new Date(wfhForm.date).toISOString(),
        reason: wfhForm.reason
      }

      await requestWFH(payload)

      const res = await getMyWFHRequests(employeeData.id)
      setWfhRequests(res.data || [])

      setWfhForm({ date: '', reason: '' })
      toast.success('WFH request submitted')
    } catch (err) {
      console.error('Error submitting WFH', err)
      setWfhError('Failed to submit WFH request')
    } finally {
      setWfhLoading(false)
    }
  }

  // Attendance + salary derived from attendance collection if available

  const [attendanceSummary, setAttendanceSummary] = useState(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')
  const [showAttendanceRaw, setShowAttendanceRaw] = useState(false)
  
  const [processedPayroll, setProcessedPayroll] = useState(null)

  const loadAttendance = async () => {
    if (!employeeData.id) return
    try {
      setAttendanceLoading(true)
      setAttendanceError('')
      const res = await getEmployeeAttendance(employeeData.id, month, year)
      setAttendanceSummary(res.data || null)
    } catch (err) {
      console.error('Error loading attendance summary', err)
      setAttendanceError('Failed to load attendance summary')
      setAttendanceSummary(null)
    } finally {
      setAttendanceLoading(false)
    }
  }

  const loadPayroll = async () => {
    if (!employeeData.id) return
    try {
      const res = await getMyPayroll(employeeData.id, month, year)
      if (res.data && res.data.length > 0) {
        setProcessedPayroll(res.data[0])
      } else {
        setProcessedPayroll(null)
      }
    } catch (e) {
      console.error('Error loading payroll', e)
    }
  }

  useEffect(() => {
    loadAttendance()
    loadPayroll()
  }, [employeeData.id, month, year])

  // Get monthly salary from database (salary is stored as monthly in database)
  // Prefer employeeRecord from database, fallback to user prop only if employeeRecord not loaded yet
  const monthlySalary = employeeRecord?.salary 
    ? Number(employeeRecord.salary) 
    : (employeeLoading ? 0 : (user?.salary ? Number(user.salary) : 0))

  // Attendance-derived values (prefer attendance collection when available)
  const absentDaysFromAttendance = attendanceSummary?.absent_days ?? null
  // approved_leaves is automatically calculated from leaves database (Approved status only)
  const approvedLeavesFromAttendance = attendanceSummary?.approved_leaves ?? 0
  
  // unapproved_absence = absent_days - approved_leaves (from leaves database)
  const unapprovedAbsenceFromAttendance = attendanceSummary?.unapproved_absence ?? null
  
  // Prefer attendance-provided daily deduction, but validate it — fall back to (monthly/22) if unrealistic
  const attendanceDailyRaw = attendanceSummary?.daily_deduction
  const fallbackDaily = monthlySalary > 0 ? monthlySalary / 22 : 0
  const dailySalaryFromAttendance = (() => {
    if (typeof attendanceDailyRaw === 'number' && attendanceDailyRaw > 0) {
      // If attendance-provided daily deduction is more than monthly salary, it's likely incorrect.
      if (attendanceDailyRaw < monthlySalary * 1.2) {
        return attendanceDailyRaw
      }
      // otherwise fall back
      return fallbackDaily
    }
    return fallbackDaily
  })()
  const usedAttendanceDaily = typeof attendanceDailyRaw === 'number' && attendanceDailyRaw > 0 && attendanceDailyRaw < monthlySalary * 1.2

  // Compute unapproved_absence if not available from DB: absent_days - approved_leaves (from leaves database)
  const unapprovedAbsenceComputed =
    absentDaysFromAttendance != null
      ? Math.max(0, absentDaysFromAttendance - approvedLeavesFromAttendance)
      : null

  // final unapproved absence to use (prefer DB's unapproved_absence, else computed, else fallback to leaveRequests count)
  const unapprovedAbsence = unapprovedAbsenceFromAttendance != null 
    ? unapprovedAbsenceFromAttendance 
    : unapprovedAbsenceComputed != null 
      ? unapprovedAbsenceComputed 
      : leaveRequests.filter((day) => normalizeStatus(day.status) !== 'approved').length

  // Prefer server-provided total_deduction if available (based on unapproved_absence)
  const totalDeduction =
    typeof attendanceSummary?.total_deduction === 'number' && attendanceSummary.total_deduction >= 0
      ? attendanceSummary.total_deduction
      : unapprovedAbsence * dailySalaryFromAttendance
  const finalSalary = monthlySalary - totalDeduction

  // PAYROLL OVERRIDES
  const isPayrollProcessed = processedPayroll && processedPayroll.status === 'Processed';
  const displayBaseSalary = isPayrollProcessed ? processedPayroll.base_salary : monthlySalary;
  const displayUnapprovedAbsence = isPayrollProcessed ? processedPayroll.unapproved_absences : unapprovedAbsence;
  const displayDailyDeduction = isPayrollProcessed ? processedPayroll.daily_deduction_rate : dailySalaryFromAttendance;
  const displayTotalDeduction = isPayrollProcessed ? processedPayroll.penalty_deduction : totalDeduction;
  const displayFinalSalary = isPayrollProcessed ? processedPayroll.final_salary : finalSalary;
  const displayBonus = isPayrollProcessed ? processedPayroll.bonus : 0;

  return (
    <div className="employee-dashboard-page">
      <h1 className="page-title">Hello, {employeeData.name}</h1>
      
      {/* Real-time Attendance Dashboard */}
      <AttendanceDashboard employeeCode={employeeData.id} />
      
      <div className="dashboard-section">
        {/* Employee Details Section */}
        <div className="employee-details-section">
          <h2 className="section-heading">Employee Details</h2>
          <div className="detail-card unified-details-card">
            <div className="details-unified-grid">
              <div className="detail-item">
                <User size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{employeeData.name}</span>
                </div>
              </div>
              <div className="detail-item">
                <Shield size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Employee ID</span>
                  <span className="detail-value">{employeeData.id}</span>
                </div>
              </div>
              <div className="detail-item">
                <Mail size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{employeeData.email}</span>
                </div>
              </div>
              <div className="detail-item">
                <FileText size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">CNIC Number</span>
                  <span className="detail-value">{employeeData.cnic}</span>
                </div>
              </div>
              <div className="detail-item">
                <Phone size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Mobile</span>
                  <span className="detail-value">{employeeData.mobile}</span>
                </div>
              </div>
              <div className="detail-item">
                <MapPin size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{employeeData.department}</span>
                </div>
              </div>
              <div className="detail-item">
                <Shield size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Designation</span>
                  <span className="detail-value">{employeeData.designation}</span>
                </div>
              </div>
              <div className="detail-item">
                <Calendar size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Date of Joining</span>
                  <span className="detail-value">{employeeData.dateOfJoining}</span>
                </div>
              </div>
              <div className="detail-item">
                <User size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Manager</span>
                  <span className="detail-value">{employeeData.manager}</span>
                </div>
              </div>
              <div className="detail-item">
                <DollarSign size={18} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Monthly Salary</span>
                  <span className="detail-value">
                    {employeeLoading ? (
                      'Loading...'
                    ) : monthlySalary > 0 ? (
                      `Rs ${monthlySalary.toLocaleString()}`
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="attendance-section">
          <div className="section-header-row">
            <h2 className="section-heading">Attendance Record</h2>
            <div className="attendance-actions">
              <button className="icon-refresh-btn" type="button" onClick={loadAttendance} disabled={attendanceLoading} title="Refresh Attendance">
                <RotateCw size={16} className={attendanceLoading ? 'spinning' : ''} />
                <span>Refresh</span>
              </button>
              {attendanceError && <div className="attendance-error">{attendanceError}</div>}
            </div>
          </div>
          
          <div className="attendance-summary">
            <div className="summary-card">
              <div className="summary-icon-wrapper">
                <Calendar size={24} className="summary-icon-lucide" />
              </div>
              <div className="summary-content">
                  <div className="summary-value">{absentDaysFromAttendance ?? (leaveRequests.length)}</div>
                  <div className="summary-label">Total Absent Days</div>
              </div>
            </div>
            <div className="summary-card warning">
              <div className="summary-icon-wrapper">
                <AlertTriangle size={24} className="summary-icon-lucide" />
              </div>
              <div className="summary-content">
                <div className="summary-value">{unapprovedAbsence}</div>
                <div className="summary-label">Unapproved Absences</div>
              </div>
            </div>
            <div className="summary-card info">
              <div className="summary-icon-wrapper">
                <DollarSign size={24} className="summary-icon-lucide" />
              </div>
              <div className="summary-content">
                <div className="summary-value">Rs {dailySalaryFromAttendance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div className="summary-label">Daily Deduction Rate</div>
              </div>
            </div>
          </div>
          
          <div className="attendance-list-card">
            <h3 className="card-title">Absent Days This Month</h3>
            <div className="attendance-list">
              {leaveRequests.length > 0 ? (
                leaveRequests.map((day) => (
                  <div key={day.id} className={`attendance-item ${(day.status || 'unknown').toLowerCase()}`}>
                    <div className="attendance-date">
                      <div className="date-day">
                        {new Date(day.startDate).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}{' '}
                        -{' '}
                        {new Date(day.endDate).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      <div className={`status-badge ${(day.status || 'unknown').toLowerCase()}`}>
                        {day.status || 'Unknown'}
                      </div>
                    </div>
                    <div className="attendance-reason">{day.type}</div>
                  </div>
                ))
              ) : (
                <div className="no-absence">No absences recorded this month</div>
              )}
            </div>
          </div>
        </div>

        {/* Salary Calculation Section */}
        <div className="salary-section">
          <h2 className="section-heading">
             Salary Statement
             {isPayrollProcessed && <span className="processed-badge">Official Payslip (Processed)</span>}
          </h2>
          <div className="salary-calculation-card">
            <div className="salary-table">
              <div className="salary-table-row">
                <span className="salary-label">Gross Base Salary</span>
                <span className="salary-value">Rs {displayBaseSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="salary-table-row deduction">
                <span className="salary-label">Deductions (Unapproved Absences)</span>
                <span className="salary-value">-Rs {displayTotalDeduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {isPayrollProcessed && displayBonus > 0 && (
                <div className="salary-table-row bonus">
                  <span className="salary-label">Bonus</span>
                  <span className="salary-value">+Rs {displayBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="salary-table-divider"></div>
              <div className="salary-table-row net-total">
                <span className="salary-label">Net Final Salary</span>
                <span className="salary-value">Rs {displayFinalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Container Side-by-Side Grid */}
        <div className="forms-grid">
          {/* Leave Form Section */}
          <div className="leave-section leave-request-section">
            <h2 className="section-heading">Leave Request Form</h2>

            <div className="leave-quota-grid">
              <div className="leave-quota-card sick">
                <div className="quota-header">
                  <span className="quota-title">Sick Leave</span>
                  <span className="quota-allowance">2 / mo</span>
                </div>
                <div className="quota-values">
                  <span className="quota-used">{sickUsed} used</span>
                  <span className="quota-remaining">{sickRemaining} left</span>
                </div>
              </div>

              <div className="leave-quota-card casual">
                <div className="quota-header">
                  <span className="quota-title">Casual Leave</span>
                  <span className="quota-allowance">2 / mo</span>
                </div>
                <div className="quota-values">
                  <span className="quota-used">{casualUsed} used</span>
                  <span className="quota-remaining">{casualRemaining} left</span>
                </div>
              </div>

              <div className="leave-quota-card annual">
                <div className="quota-header">
                  <span className="quota-title">Annual Leave</span>
                  <span className="quota-allowance">10 / yr</span>
                </div>
                <div className="quota-values">
                  <span className="quota-used">{annualUsed} used</span>
                  <span className="quota-remaining">{annualRemaining} left</span>
                </div>
              </div>

              <div className="leave-quota-card remaining-leaves">
                <div className="quota-header">
                  <span className="quota-title">Balance</span>
                  <span className="quota-allowance">Annual Policy</span>
                </div>
                <div className="quota-values">
                  <span className="quota-used">{usedLeaves} used</span>
                  <span className="quota-remaining" style={{ color: remainingLeaves > 0 ? '#10b981' : '#f87171' }}>
                    {remainingLeaves} left
                  </span>
                </div>
              </div>
            </div>

            <form className="leave-form" onSubmit={handleLeaveSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Leave Type</label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => handleLeaveChange('type', e.target.value)}
                  >
                    <option>Casual Leave</option>
                    <option>Sick Leave</option>
                    <option>Annual Leave</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => handleLeaveChange('startDate', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => handleLeaveChange('endDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason</label>
                <textarea
                  rows="3"
                  value={leaveForm.reason}
                  onChange={(e) => handleLeaveChange('reason', e.target.value)}
                  placeholder="State the reason for your leave request"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {leaveLoading ? 'Please wait...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>

            <div className="leave-history">
              <h3 className="leave-history-title">Recent Leave Requests</h3>
              {leaveError && <div className="leave-error-text">{leaveError}</div>}
              <div className="leave-history-list">
                {leaveLoading && leaveRequests.length === 0 && (
                  <div className="leave-item-dates">Loading leave history...</div>
                )}
                {!leaveLoading &&
                  leaveRequests.map((req) => (
                    <div key={req.id} className={`leave-item ${(req.status || 'unknown').toLowerCase()}`}>
                      <div className="leave-item-header">
                        <span className="leave-type">{req.type}</span>
                        <span className={`leave-status-badge ${(req.status || 'unknown').toLowerCase()}`}>
                          {req.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="leave-item-dates">
                        {new Date(req.startDate).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}{' '}
                        -{' '}
                        {new Date(req.endDate).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                {!leaveLoading && leaveRequests.length === 0 && !leaveError && (
                  <div className="leave-item-dates">No leave requests found.</div>
                )}
              </div>
            </div>
          </div>

          {/* WFH Form Section */}
          <div className="leave-section wfh-section">
            <h2 className="section-heading">Work From Home (WFH) Request</h2>
            <p className="wfh-description">Submit a request to clock in remotely outside the office network.</p>

            <form className="leave-form" onSubmit={handleWfhSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Request Date</label>
                  <input
                    type="date"
                    value={wfhForm.date}
                    onChange={(e) => setWfhForm({ ...wfhForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason</label>
                <textarea
                  rows="3"
                  value={wfhForm.reason}
                  onChange={(e) => setWfhForm({ ...wfhForm, reason: e.target.value })}
                  placeholder="Explain why you need remote access"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {wfhLoading ? 'Please wait...' : 'Submit WFH Request'}
                </button>
              </div>
            </form>

            <div className="leave-history">
              <h3 className="leave-history-title">Recent WFH Requests</h3>
              {wfhError && <div className="leave-error-text">{wfhError}</div>}
              <div className="leave-history-list">
                {wfhLoading && wfhRequests.length === 0 && (
                  <div className="leave-item-dates">Loading WFH history...</div>
                )}
                {!wfhLoading &&
                  wfhRequests.map((req) => (
                    <div key={req._id} className={`leave-item ${(req.status || 'unknown').toLowerCase()}`}>
                      <div className="leave-item-header">
                        <span className="leave-type">Work From Home</span>
                        <span className={`leave-status-badge ${(req.status || 'unknown').toLowerCase()}`}>
                          {req.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="leave-item-dates">
                        {new Date(req.date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                      {req.admin_comments && (
                         <div className="admin-notes">
                           <strong>HR Note:</strong> {req.admin_comments}
                         </div>
                      )}
                    </div>
                  ))}
                {!wfhLoading && wfhRequests.length === 0 && !wfhError && (
                  <div className="leave-item-dates">No WFH requests found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard

