import { useEffect, useState } from 'react'
import { getAllEmployees } from '../../api'
import '../adminShell/AdminShell.css'

function AdminUsers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await getAllEmployees()
        setRows(res.data || [])
      } catch (e) {
        console.error(e)
        setError('Failed to load users.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  const getAccessBadge = (enrolled) => enrolled
    ? { label: 'Active Login', style: { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' } }
    : { label: 'Pending Signup', style: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' } }

  const getRoleStyle = (role) => {
    if (!role || role === 'Employee') return { background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' }
    if (role.toLowerCase().includes('admin')) return { background: 'rgba(139,92,246,0.08)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.15)' }
    if (role.toLowerCase().includes('applicant')) return { background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)' }
    return { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }
  }

  const badgeStyle = {
    display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
    fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
  }

  return (
    <div className="admin-shell-page">
      <h1 className="admin-shell-title">Portal Users</h1>
      <p className="admin-shell-sub">
        Everyone listed here has an employee record. Those with an email and password have completed signup and can sign in as Employee.
      </p>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-shell-card">
        {loading ? (
          <p className="admin-empty">Loading…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Access Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const enrolled = !!(r.email && String(r.email).trim())
                  const access = getAccessBadge(enrolled)
                  const roleStyle = getRoleStyle(r.role)
                  return (
                    <tr key={r.employee_code || r._id}>
                      <td>
                        <button
                          title="Click to copy"
                          onClick={() => copyToClipboard(r.employee_code, r.employee_code)}
                          style={{
                            background: copiedId === r.employee_code ? 'rgba(16,185,129,0.15)' : 'rgba(15,23,42,0.5)',
                            border: '1px solid #1e293b', borderRadius: '6px',
                            padding: '4px 10px', cursor: 'pointer',
                            fontFamily: 'monospace', fontSize: '12px',
                            color: copiedId === r.employee_code ? '#10b981' : '#94a3b8',
                            letterSpacing: '0.05em', transition: 'all 0.2s',
                          }}
                        >
                          {copiedId === r.employee_code ? '✓ Copied' : (r.employee_code || '—')}
                        </button>
                      </td>
                      <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{r.full_name || '—'}</td>
                      <td style={{ color: '#94a3b8', fontSize: '13px' }}>{r.email || <span style={{ color: '#475569', fontStyle: 'italic' }}>Not registered</span>}</td>
                      <td>
                        <span style={{ ...badgeStyle, ...roleStyle }}>{r.role || 'Employee'}</span>
                      </td>
                      <td>
                        <span style={{ ...badgeStyle, ...access.style }}>{access.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!rows.length && <p className="admin-empty">No employees in the database yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
