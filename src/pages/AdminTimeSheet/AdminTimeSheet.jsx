import { useEffect, useMemo, useState } from 'react'
import { getAllEmployees, getTimeSheets } from '../../api'
import '../adminShell/AdminShell.css'

function weekKeyFromInput(weekVal) {
  return weekVal || 'default'
}

/** ISO week string for <input type="week" /> (YYYY-Www). */
function toISOWeekString(d = new Date()) {
  const date = new Date(d.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  const week =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function AdminTimeSheet() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [week, setWeek] = useState(() => toISOWeekString())
  const [map, setMap] = useState({})

  const fetchTimeSheets = async (w) => {
    try {
      const res = await getTimeSheets(w)
      setMap({ [w]: res.data || {} })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchTimeSheets(week)
  }, [week])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await getAllEmployees()
        setEmployees(res.data || [])
      } catch (e) {
        console.error(e)
        setError('Failed to load employees.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const wk = weekKeyFromInput(week)

  const hoursFor = (code) => {
    const bucket = map[wk] || {}
    return bucket[code] != null ? Number(bucket[code]) : ''
  }

  // Removed setHours because it's now automated

  const totals = useMemo(() => {
    const bucket = map[wk] || {}
    return Object.values(bucket).reduce((a, b) => a + (Number(b) || 0), 0)
  }, [map, wk])

  const handleExportCSV = () => {
    if (!employees.length) return
    const headers = ['Employee ID', 'Name', 'Week', 'Hours Logged']
    const csvRows = employees.map(e => [
      e.employee_code,
      e.full_name || '',
      wk,
      hoursFor(e.employee_code) || 0
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `TimeSheet_${wk}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="admin-shell-page">
      <h1 className="admin-shell-title">Time sheet</h1>
      <p className="admin-shell-sub">
        View total hours per employee per calendar week (ISO week picker). Values are <strong>automatically calculated</strong> directly from their daily Time-In/Time-Out attendance logs!
      </p>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-shell-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
           <button onClick={handleExportCSV} className="admin-btn-primary" style={{ background: '#10b981' }}>
             📥 Export to CSV
           </button>
        </div>
        <div className="admin-toolbar">
          <div className="admin-field">
            <label htmlFor="week-pick">Week</label>
            <input
              id="week-pick"
              type="week"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team hours (this week)</label>
            <input readOnly value={totals ? `${totals} h` : '0 h'} style={{ background: '#0B0F19', color: '#10b981', fontWeight: 'bold', fontSize: '16px', border: '1px solid #1e293b' }} />
          </div>
        </div>

        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Hours logged</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.employee_code}>
                    <td>{e.full_name || '—'}</td>
                    <td>{e.employee_code}</td>
                    <td>
                      <input
                        type="text"
                        readOnly
                        value={hoursFor(e.employee_code) ? `${hoursFor(e.employee_code)} hrs` : '0 hrs'}
                        style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0', fontWeight: '500', cursor: 'default', padding: '6px 12px', borderRadius: '6px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!employees.length && <p className="admin-empty">No employees to show.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminTimeSheet
