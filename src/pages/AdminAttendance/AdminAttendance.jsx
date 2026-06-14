import { useEffect, useState } from 'react'
import { getAllEmployees, getAttendanceAll, upsertAttendance, getAllWFHRequests, updateWFHStatus } from '../../api'
import './AdminAttendance.css'

/** Mongo / JSON sometimes returns salary as number, string, or { $numberDecimal: "..." } */
function normalizeSalary(val) {
  if (val == null) return 0
  if (typeof val === 'number' && Number.isFinite(val)) return val
  if (typeof val === 'string') {
    const n = parseFloat(val.replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  if (typeof val === 'object' && val !== null && '$numberDecimal' in val) {
    const n = parseFloat(String(val.$numberDecimal))
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(val)
  return Number.isFinite(n) ? n : 0
}

function AdminAttendance() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [viewMode, setViewMode] = useState('monthly') // 'monthly' | 'daily' | 'wfh'
  const [dailyLogs, setDailyLogs] = useState([])
  const [wfhRequests, setWfhRequests] = useState([])

  const monthOptions = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]

  const loadData = async (m, y, mode = viewMode) => {
    try {
      setLoading(true)
      setError('')
      
      if (mode === 'monthly') {
        const [empRes, attRes] = await Promise.all([
          getAllEmployees(),
          getAttendanceAll(m, y)
        ])
        const employees = empRes.data || []
        const atts = attRes.data || []

        const attMap = {}
        atts.forEach((a) => {
          attMap[a.employee_id] = a
        })

        const merged = employees
          .filter((e) => String(e.role || '').toLowerCase() !== 'applicant')
          .map((e) => {
          const key = e.employee_code
          const att = attMap[key] || {}
          const monthlySalary = normalizeSalary(e.salary)
          const dailyBase =
            monthlySalary > 0 ? Number((monthlySalary / 22).toFixed(0)) : 0
          const absent = att.absent_days ?? 0
          const approved = att.approved_leaves ?? 0
          const daily = att.daily_deduction ?? dailyBase
          const unapprovedAbsence = att.unapproved_absence ?? Math.max(0, absent - approved)
          const totalDed = att.total_deduction ?? unapprovedAbsence * daily
          return {
            employee_code: key,
            full_name: e.full_name,
            salary: monthlySalary,
            absent_days: absent,
            approved_leaves: approved,
            daily_deduction: daily,
            unapproved_absence: unapprovedAbsence,
            total_deduction: totalDed
          }
        })

        setRows(merged)
      } else if (mode === 'daily') {
        const { getDailyAttendanceLogs } = await import('../../api')
        const [logsRes, empRes] = await Promise.all([
          getDailyAttendanceLogs(m, y),
          getAllEmployees()
        ])
        const logs = logsRes.data || []
        const employees = empRes.data || []
        const empMap = {}
        employees.forEach(e => empMap[e.employee_code] = e.full_name)

        const detailedLogs = logs.map(l => ({
          ...l,
          full_name: empMap[l.employee_id] || 'Unknown'
        }))
        setDailyLogs(detailedLogs)
      } else if (mode === 'wfh') {
        const [wfhRes, empRes] = await Promise.all([
            getAllWFHRequests(),
            getAllEmployees()
        ])
        const reqs = wfhRes.data || []
        const employees = empRes.data || []
        const empMap = {}
        employees.forEach(e => empMap[e.employee_code] = e.full_name)

        const detailedReqs = reqs.map(r => ({
          ...r,
          full_name: empMap[r.employee_id] || 'Unknown'
        }))
        setWfhRequests(detailedReqs)
      }
    } catch (err) {
      console.error('Error loading data', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(month, year)
  }, [])

  const handleChange = (code, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.employee_code !== code) return r
        const updated = { ...r, [field]: value }
        // Recalculate unapproved_absence when absent_days changes
        // approved_leaves comes from leaves database automatically
        if (field === 'absent_days') {
          const absent = Number(updated.absent_days || 0)
          const approved = Number(updated.approved_leaves || 0)
          updated.unapproved_absence = Math.max(0, absent - approved)
        }
        return updated
      })
    )
  }

  const handleSave = async (row) => {
    setSavingId(row.employee_code)
    try {
      const payload = {
        employee_id: row.employee_code,
        month,
        year,
        absent_days: Number(row.absent_days) || 0,
        // approved_leaves will be auto-calculated from leaves database in backend
        approved_leaves: 0, // Will be overridden by backend
        daily_deduction: Number(row.daily_deduction) || 0
      }
      await upsertAttendance(payload)
      await loadData(month, year)
    } catch (err) {
      console.error('Error saving attendance', err)
      setError('Failed to save attendance')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="admin-attendance-page">
      <h1 className="page-title">Attendance & Unpaid Leave Settings</h1>

      <div className="attendance-section">
        <div className="section-header">
          <div className="header-left">
             <h2 className="section-heading">{viewMode === 'monthly' ? 'Monthly Attendance' : viewMode === 'daily' ? 'Daily Detailed Logs' : 'WFH Requests'}</h2>
             <div className="view-mode-tabs">
                <button 
                  className={`tab-btn ${viewMode === 'monthly' ? 'active' : ''}`}
                  onClick={() => { setViewMode('monthly'); loadData(month, year, 'monthly'); }}
                >
                  Monthly Summary
                </button>
                <button 
                  className={`tab-btn ${viewMode === 'daily' ? 'active' : ''}`}
                  onClick={() => { setViewMode('daily'); loadData(month, year, 'daily'); }}
                >
                  Daily Detailed Logs
                </button>
                <button 
                  className={`tab-btn ${viewMode === 'wfh' ? 'active' : ''}`}
                  onClick={() => { setViewMode('wfh'); loadData(month, year, 'wfh'); }}
                >
                  WFH Requests
                </button>
             </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label>Month</label>
              <select
                value={month}
                onChange={(e) => {
                  const m = Number(e.target.value)
                  setMonth(m)
                  loadData(m, year)
                }}
              >
                {monthOptions.map((name, idx) => (
                   <option key={idx + 1} value={idx + 1}>
                     {name}
                   </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => {
                  const y = Number(e.target.value)
                  setYear(y)
                  loadData(month, y)
                }}
                min="2000"
              />
            </div>
          </div>
        </div>

        {loading && <div className="leaves-info">Loading...</div>}
        {error && !loading && <div className="leaves-error">{error}</div>}

        <div className="attendance-table-wrapper">
          {viewMode === 'monthly' ? (
             <table className="attendance-table attendance-table-monthly">
               <thead>
                 <tr>
                    <th title="Employee code">ID</th>
                    <th>Name</th>
                    <th title="Monthly base salary" className="numeric-col">Salary (mo.)</th>
                    <th title="Absent days this month" className="center-col">Absent</th>
                    <th title="Approved leave days from leave records" className="center-col">Aprv. leaves</th>
                    <th title="Per-day deduction (defaults from salary ÷ 22)" className="center-col">Daily Rs</th>
                    <th title="Absent days minus approved leaves" className="center-col">Unappr.</th>
                    <th title="Estimated total deduction" className="numeric-col">Est. deduct.</th>
                    <th className="center-col">Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {rows.length === 0 && !loading ? (
                    <tr>
                      <td colSpan="9" className="no-data">No employees or attendance data found.</td>
                    </tr>
                 ) : (
                    rows.map((row) => {
                      const absent = Number(row.absent_days || 0)
                      const approved = Number(row.approved_leaves || 0)
                      const unapprovedAbsence = row.unapproved_absence != null 
                        ? Number(row.unapproved_absence) 
                        : Math.max(0, absent - approved)
                      const daily = Number(row.daily_deduction || 0)
                      const ded = unapprovedAbsence * daily
                      return (
                        <tr key={row.employee_code}>
                          <td>{row.employee_code}</td>
                          <td>{row.full_name}</td>
                          <td className="td-salary numeric-col">Rs {normalizeSalary(row.salary).toLocaleString()}</td>
                          <td className="center-col">
                            <input
                              type="number"
                              value={row.absent_days}
                              min="0"
                              style={{ textAlign: 'center' }}
                              onChange={(e) => handleChange(row.employee_code, 'absent_days', e.target.value)}
                            />
                          </td>
                          <td className="center-col">
                            <strong>{approved}</strong>
                            <br/><span className="auto-badge">Auto from Leaves</span>
                          </td>
                          <td className="center-col">
                            <input
                              type="number"
                              value={row.daily_deduction}
                              min="0"
                              style={{ textAlign: 'center' }}
                              onChange={(e) => handleChange(row.employee_code, 'daily_deduction', e.target.value)}
                            />
                          </td>
                          <td className="center-col"><strong>{unapprovedAbsence}</strong></td>
                          <td className="numeric-col">Rs {ded.toLocaleString()}</td>
                          <td className="center-col">
                            <button
                              className="primary-btn"
                              type="button"
                              onClick={() => handleSave(row)}
                              disabled={savingId === row.employee_code}
                            >
                              {savingId === row.employee_code ? 'Saving...' : 'Save'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                 )}
               </tbody>
             </table>
          ) : viewMode === 'daily' ? (
             <table className="attendance-table">
               <thead>
                 <tr>
                    <th>Date</th>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Time-In</th>
                    <th>Time-Out</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                    <th>IP Address</th>
                 </tr>
               </thead>
               <tbody>
                 {dailyLogs.length === 0 && !loading ? (
                    <tr>
                      <td colSpan="8" className="no-data">No daily logs found for this period.</td>
                    </tr>
                 ) : (
                    dailyLogs.map((log) => {
                      const dateStr = new Date(log.date).toLocaleDateString()
                      const timeIn = new Date(log.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      const timeOut = log.time_out 
                        ? new Date(log.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : '—'
                      
                      return (
                        <tr key={log._id}>
                          <td>{dateStr}</td>
                          <td>{log.employee_id}</td>
                          <td>{log.full_name}</td>
                          <td>{timeIn}</td>
                          <td>{timeOut}</td>
                          <td>{log.total_hours || 0} hrs</td>
                          <td>
                             <span className={`status-badge ${log.status?.toLowerCase()}`}>
                                {log.status || 'Present'}
                             </span>
                          </td>
                          <td style={{ fontStyle: 'italic', color: '#666' }}>{log.ip_address}</td>
                        </tr>
                      )
                    })
                 )}
               </tbody>
             </table>
          ) : (
             <div className="wfh-requests-view">
               <table className="attendance-table">
                 <thead>
                   <tr>
                      <th>Date</th>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {wfhRequests.length === 0 && !loading ? (
                      <tr>
                        <td colSpan="6" className="no-data">No WFH requests found.</td>
                      </tr>
                   ) : (
                      wfhRequests.map((req) => (
                        <tr key={req._id}>
                          <td>{new Date(req.date).toLocaleDateString()}</td>
                          <td>{req.employee_id}</td>
                          <td>{req.full_name}</td>
                          <td>{req.reason}</td>
                          <td>
                             <span className={`status-badge ${(req.status || 'unknown').toLowerCase()}`}>
                                {req.status || 'Pending'}
                             </span>
                          </td>
                          <td>
                            {req.status === 'Pending' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="primary-btn" 
                                  style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                                  onClick={async () => {
                                    try {
                                      await updateWFHStatus(req._id, 'Approved', 'Approved by HR');
                                      loadData(month, year, 'wfh');
                                    } catch(e) { alert('Error approving'); }
                                  }}
                                >Approve</button>
                                <button 
                                  className="btn-cancel-profile" 
                                  style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                                  onClick={async () => {
                                    const c = prompt('Rejection reason:');
                                    if(c === null) return;
                                    try {
                                      await updateWFHStatus(req._id, 'Rejected', c || 'Rejected by HR');
                                      loadData(month, year, 'wfh');
                                    } catch(e) { alert('Error rejecting'); }
                                  }}
                                >Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                   )}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default AdminAttendance


