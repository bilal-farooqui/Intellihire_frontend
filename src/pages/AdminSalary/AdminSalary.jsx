import { useEffect, useState, useCallback } from 'react'
import { getPayrollPreview, processPayroll } from '../../api'
import toast from 'react-hot-toast'
import '../adminShell/AdminShell.css'

function draftKey(employeeId, field) {
  return `${employeeId}::${field}`
}

/** Mongo / JSON can return salary-like fields as number, string, or { $numberDecimal } */
function normalizeMoney(val) {
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

function normalizePayrollRowFromApi(row) {
  return {
    ...row,
    base_salary: normalizeMoney(row.base_salary),
    daily_deduction_rate: normalizeMoney(row.daily_deduction_rate),
    bonus: normalizeMoney(row.bonus),
    penalty_deduction: normalizeMoney(row.penalty_deduction),
    final_salary: normalizeMoney(row.final_salary),
    unapproved_absences: Math.max(0, Math.floor(Number(row.unapproved_absences) || 0)),
    late_days: Math.max(0, Math.floor(Number(row.late_days) || 0)),
  }
}

/** Match backend preview: (absences × daily) + (late × daily × 0.25) */
function computePenalty(unapprovedAbsences, lateDays, dailyRate) {
  const ua = Math.max(0, Math.floor(Number(unapprovedAbsences) || 0))
  const late = Math.max(0, Math.floor(Number(lateDays) || 0))
  const daily = Math.max(0, Number(dailyRate) || 0)
  return Math.round((ua * daily + late * daily * 0.25) * 100) / 100
}

function recalcPayrollRow(r) {
  const base = Math.max(0, Number(r.base_salary) || 0)
  const daily = Math.max(0, Number(r.daily_deduction_rate) || 0)
  const ua = Math.max(0, Math.floor(Number(r.unapproved_absences) || 0))
  const late = Math.max(0, Math.floor(Number(r.late_days) || 0))
  const bonus = Math.max(0, Number(r.bonus) || 0)
  const penalty = computePenalty(ua, late, daily)
  const finalSalary = Math.max(0, Math.round((base - penalty + bonus) * 100) / 100)
  return {
    ...r,
    base_salary: base,
    daily_deduction_rate: daily,
    unapproved_absences: ua,
    late_days: late,
    bonus,
    penalty_deduction: penalty,
    final_salary: finalSalary,
  }
}

function trimNumberDisplay(n) {
  if (!Number.isFinite(n)) return ''
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n))
  return String(n)
}

/** Text inputs + drafts so users can clear the field and type (no stuck leading 0). */
function PayrollEditableNumber({
  employeeId,
  field,
  row,
  intOnly,
  wide,
  drafts,
  setDrafts,
  onCommit,
}) {
  const key = draftKey(employeeId, field)
  const draft = drafts[key]

  let displayValue
  if (draft !== undefined) {
    displayValue = draft
  } else if (intOnly) {
    displayValue = String(Math.max(0, Math.floor(Number(row[field]) || 0)))
  } else {
    const n = normalizeMoney(row[field])
    displayValue = n === 0 ? '' : trimNumberDisplay(n)
  }

  return (
    <input
      type="text"
      inputMode={intOnly ? 'numeric' : 'decimal'}
      className={wide ? 'payroll-input-wide' : undefined}
      autoComplete="off"
      value={displayValue}
      style={{
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid #1e293b',
        color: '#f1f5f9',
        borderRadius: '8px',
        padding: '6px 10px',
        fontSize: '13px',
        width: wide ? '100px' : '70px',
        textAlign: 'center',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 1px #10b981'; }}
      onBlur={(e) => {
        e.target.style.borderColor = '#1e293b';
        e.target.style.boxShadow = 'none';
        const raw = drafts[key]
        onCommit(employeeId, field, raw !== undefined ? raw : displayValue, intOnly)
        setDrafts((d) => {
          const next = { ...d }
          delete next[key]
          return next
        })
      }}
      onChange={(e) => {
        let t = e.target.value
        if (intOnly) {
          t = t.replace(/\D/g, '')
        } else {
          t = t.replace(/[^0-9.]/g, '')
          const parts = t.split('.')
          if (parts.length > 2) t = `${parts[0]}.${parts.slice(1).join('')}`
        }
        setDrafts((d) => ({ ...d, [key]: t }))
      }}
    />
  )
}

function AdminSalary() {
  const [rows, setRows] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState(null)

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const monthOptions = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]

  const commitField = useCallback((employeeId, field, text, intOnly) => {
    const t = String(text ?? '').trim()
    let v = 0
    if (t !== '' && t !== '.') {
      if (intOnly) v = Math.max(0, Math.floor(parseFloat(t) || 0))
      else v = Math.max(0, parseFloat(t) || 0)
    }
    setRows((prev) =>
      prev.map((r) => {
        if (r.employee_id !== employeeId) return r
        return recalcPayrollRow({ ...r, [field]: v })
      })
    )
  }, [])

  const loadData = async (m, y) => {
    try {
      setLoading(true)
      setError('')
      setDrafts({})
      const res = await getPayrollPreview(m, y)
      const list = (res.data || []).map(normalizePayrollRowFromApi)
      setRows(
        list.map((row) =>
          String(row.status) === 'Processed' ? row : recalcPayrollRow(row)
        )
      )
    } catch (e) {
      console.error(e)
      setError('Failed to load payroll preview.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(month, year)
  }, [])

  const handleProcess = async (row) => {
    setProcessingId(row.employee_id)
    try {
      const updated = recalcPayrollRow(row)
      const payload = {
        employee_id: updated.employee_id,
        month: updated.month,
        year: updated.year,
        base_salary: updated.base_salary,
        unapproved_absences: updated.unapproved_absences,
        late_days: updated.late_days || 0,
        daily_deduction_rate: updated.daily_deduction_rate,
        penalty_deduction: updated.penalty_deduction,
        bonus: updated.bonus,
        final_salary: updated.final_salary,
      }
      await processPayroll(payload)
      await loadData(month, year)
      toast.success(
        String(row.status) === 'Processed' ? 'Payroll updated.' : 'Payroll saved.'
      )
    } catch (err) {
      console.error('Error processing payroll', err)
      toast.error('Failed to save payroll')
    } finally {
      setProcessingId(null)
    }
  }

  const totalPayroll = rows.reduce((sum, r) => sum + (Number(r.final_salary) || 0), 0)

  const handleExportCSV = () => {
    if (!rows.length) return
    const headers = [
      'Employee ID',
      'Name',
      'Base Salary',
      'Absences',
      'Late Days',
      'Daily Rate',
      'Penalty',
      'Bonus',
      'Final Salary',
      'Status',
    ]
    const csvRows = rows.map((r) => [
      r.employee_id,
      r.full_name || '',
      r.base_salary,
      r.unapproved_absences || 0,
      r.late_days || 0,
      r.daily_deduction_rate ?? 0,
      r.penalty_deduction || 0,
      r.bonus || 0,
      r.final_salary || 0,
      r.status || 'Pending',
    ])

    const csvContent = [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Payroll_${month}_${year}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="admin-shell-page">
      <h1 className="admin-shell-title">Payroll Processing</h1>
      <p className="admin-shell-sub">
        Edit base salary, absences, late days, daily rate, and bonus for any row (including after Processed). Penalty
        and final salary recalculate when you leave a field. Use Save to write changes to the database.
      </p>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-shell-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
          <button onClick={handleExportCSV} className="admin-btn-primary" style={{ background: '#10b981' }}>
            Export to CSV
          </button>
        </div>
        <div className="admin-toolbar" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="admin-field" style={{ flex: '1 1 200px' }}>
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
          <div className="admin-field" style={{ flex: '1 1 200px' }}>
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
          <div className="admin-field" style={{ flex: '1 1 200px' }}>
            <label>Total Final Payroll (This Month)</label>
            <input readOnly value={`Rs ${totalPayroll.toLocaleString()}`} style={{ fontWeight: 'bold' }} />
          </div>
        </div>

        {loading ? (
          <p className="admin-empty">Loading Payroll Data…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Base salary</th>
                  <th>Absences</th>
                  <th>Late days</th>
                  <th>Daily Rs</th>
                  <th>Penalty</th>
                  <th>Bonus</th>
                  <th>Final salary</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employee_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '14px' }}>{r.full_name || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{r.employee_id}</div>
                    </td>
                    <td>
                      <PayrollEditableNumber
                        employeeId={r.employee_id}
                        field="base_salary"
                        row={r}
                        intOnly={false}
                        wide
                        drafts={drafts}
                        setDrafts={setDrafts}
                        onCommit={commitField}
                      />
                    </td>
                    <td>
                      <PayrollEditableNumber
                        employeeId={r.employee_id}
                        field="unapproved_absences"
                        row={r}
                        intOnly
                        drafts={drafts}
                        setDrafts={setDrafts}
                        onCommit={commitField}
                      />
                    </td>
                    <td>
                      <PayrollEditableNumber
                        employeeId={r.employee_id}
                        field="late_days"
                        row={r}
                        intOnly
                        drafts={drafts}
                        setDrafts={setDrafts}
                        onCommit={commitField}
                      />
                    </td>
                    <td>
                      <PayrollEditableNumber
                        employeeId={r.employee_id}
                        field="daily_deduction_rate"
                        row={r}
                        intOnly={false}
                        wide
                        drafts={drafts}
                        setDrafts={setDrafts}
                        onCommit={commitField}
                      />
                    </td>
                    <td style={{ color: '#ff9b9b', fontWeight: 600 }}>
                      -Rs {Number(r.penalty_deduction || 0).toLocaleString()}
                    </td>
                    <td>
                      <PayrollEditableNumber
                        employeeId={r.employee_id}
                        field="bonus"
                        row={r}
                        intOnly={false}
                        wide
                        drafts={drafts}
                        setDrafts={setDrafts}
                        onCommit={commitField}
                      />
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#b8f5d9' }}>
                      Rs {Number(r.final_salary).toLocaleString()}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: r.status === 'Processed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: r.status === 'Processed' ? '#10b981' : '#f59e0b',
                        border: `1px solid ${r.status === 'Processed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                      }}>{r.status || 'Pending'}</span>
                    </td>
                    <td>
                      <button
                        className="primary-btn"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleProcess(r)}
                        disabled={processingId === r.employee_id}
                      >
                        {processingId === r.employee_id
                          ? 'Wait...'
                          : String(r.status) === 'Processed'
                            ? 'Update'
                            : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="admin-empty">No records found.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSalary
