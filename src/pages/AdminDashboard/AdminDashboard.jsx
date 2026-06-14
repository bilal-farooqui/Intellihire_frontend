import { useEffect, useState } from 'react'
import {
  getAdminStats,
  resetTodayAttendance,
  updateSettings,
  getMyIp
} from '../../api'
import toast from 'react-hot-toast'
import '../adminShell/AdminShell.css'

const ADMIN_TOAST_STYLE = {
  background: '#111827',
  color: '#f1f5f9',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '12px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
  fontWeight: 600,
}

const adminToastSuccess = (msg) =>
  toast.success(msg, {
    style: ADMIN_TOAST_STYLE,
    duration: 3200,
    iconTheme: { primary: '#10B981', secondary: '#111827' },
  })

const adminToastError = (msg) =>
  toast.error(msg, {
    style: ADMIN_TOAST_STYLE,
    duration: 4000,
    iconTheme: { primary: '#ef4444', secondary: '#111827' },
  })

// Module-level cache to persist data during the app session
let dashboardCache = null

function AdminDashboard() {
  const [stats, setStats] = useState(dashboardCache?.stats || {
    employees: 0,
    jobs: 0,
    applications: 0,
    leaves: 0,
    pendingLeaves: 0
  })
  const [loading, setLoading] = useState(!dashboardCache)
  const [error, setError] = useState('')
  const [allowedIps, setAllowedIps] = useState(dashboardCache?.allowedIps || [])
  const [ipInput, setIpInput] = useState((dashboardCache?.allowedIps || []).join(', '))
  const [ipLoading, setIpLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else if (!dashboardCache) setLoading(true)
      
      setError('')
      const res = await getAdminStats()
      const data = res.data

      const newStats = {
        employees: data.employees || 0,
        jobs: data.jobs || 0,
        applications: data.applications || 0,
        leaves: data.leaves || 0,
        pendingLeaves: data.pendingLeaves || 0
      }
      const newIps = data.allowed_ips || []

      setStats(newStats)
      setAllowedIps(newIps)
      setIpInput(newIps.join(', '))
      
      // Update cache
      dashboardCache = { stats: newStats, allowedIps: newIps }
    } catch (e) {
      console.error(e)
      setError('Could not load dashboard statistics. Please ensure you are logged in as an administrator.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // If no cache, load immediately.
    if (!dashboardCache) {
      load()
    } else {
      // If cache exists, we still sync the ipInput field
      setIpInput(dashboardCache.allowedIps.join(', '))
    }
  }, [])

  const handleSetMyIp = async () => {
    try {
      setIpLoading(true)
      const myIpRes = await getMyIp()
      const myIp = myIpRes.data?.ip
      if (!myIp) throw new Error("Could not detect IP")
      
      const newIps = [myIp]
      await updateSettings({ allowed_ips: newIps })
      setAllowedIps(newIps)
      setIpInput(myIp)
      // Update cache
      if (dashboardCache) dashboardCache.allowedIps = newIps
      adminToastSuccess(`Allowed Office IP updated to: ${myIp}`)
    } catch (err) {
      console.error(err)
      adminToastError('Failed to update IP settings')
    } finally {
      setIpLoading(false)
    }
  }

  const handleManualIpSave = async () => {
    try {
      setIpLoading(true)
      // Split by comma and clean up spaces
      const newIps = ipInput.split(',').map(ip => ip.trim()).filter(ip => ip !== '')
      await updateSettings({ allowed_ips: newIps })
      setAllowedIps(newIps)
      adminToastSuccess('IP Settings saved successfully')
    } catch (err) {
      console.error(err)
      adminToastError('Failed to update IP settings')
    } finally {
      setIpLoading(false)
    }
  }

  const handleResetAttendance = () => {
    toast.custom(
      (t) => (
        <div className="admin-toast-confirm">
          <p className="admin-toast-confirm-message">
            This will delete everyone&apos;s attendance for today so you can test again. This cannot be undone.
          </p>
          <div className="admin-toast-confirm-actions">
            <button
              type="button"
              className="admin-toast-btn admin-toast-btn-cancel"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-toast-btn admin-toast-btn-danger"
              onClick={async () => {
                toast.dismiss(t.id)
                try {
                  const res = await resetTodayAttendance()
                  adminToastSuccess(res.data?.message || 'Attendance reset for today!')
                } catch (err) {
                  console.error(err)
                  adminToastError('Failed to reset attendance')
                }
              }}
            >
              Reset attendance
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: 'top-center' }
    )
  }

  return (
    <div className="admin-shell-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-shell-title">Admin dashboard</h1>
          <p className="admin-shell-sub">
            Overview of your HR workspace. Use the sidebar to manage Employees, Hiring, Leaves, and more.
          </p>
        </div>
        <button 
          onClick={() => load(true)}
          disabled={refreshing || loading}
          className="admin-btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {refreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-shell-card">
        <h2>At a glance</h2>
        {loading ? (
          <p className="admin-empty">Loading statistics…</p>
        ) : (
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <div className="stat-value">{stats.employees}</div>
              <div className="stat-label">Employees in directory</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-value">{stats.jobs}</div>
              <div className="stat-label">Job openings</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-value">{stats.applications}</div>
              <div className="stat-label">Applications received</div>
            </div>
            <div className="admin-stat-card">
              <div className="stat-value">{stats.leaves}</div>
              <div className="stat-label">Total leave records</div>
            </div>
            <div className="admin-stat-card" style={{ borderLeftColor: '#f59e0b' }}>
              <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.pendingLeaves}</div>
              <div className="stat-label">Leaves awaiting decision</div>
            </div>
          </div>
        )}
      </div>

      <div className="admin-shell-card">
        <h3>Attendance Settings</h3>
        <p className="admin-shell-sub" style={{ marginBottom: 12 }}>
          Configure the authorized office network IP. Employees can only clock in from this IP.
        </p>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '16px'
          }}
        >
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: '#94a3b8', fontSize: '14px' }}>Current Allowed IP(s): </strong>
            <span 
              onClick={() => {
                const text = allowedIps.length > 0 ? allowedIps.join(', ') : 'None configured';
                navigator.clipboard.writeText(text);
                toast.success('Copied to clipboard', { style: ADMIN_TOAST_STYLE, iconTheme: { primary: '#10B981', secondary: '#111827' }});
              }}
              title="Click to copy"
              style={{ 
                color: '#10B981', 
                background: 'rgba(16, 185, 129, 0.1)', 
                padding: '4px 12px', 
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '13px',
                cursor: 'pointer',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              {allowedIps.length > 0 ? allowedIps.join(', ') : 'None configured'}
            </span>
          </div>
          <div className="admin-field" style={{ marginBottom: '16px' }}>
            <label>Allowed IPs (comma separated):</label>
            <input 
              type="text" 
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="e.g., 127.0.0.1, 192.168.1.5"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handleManualIpSave} 
              disabled={ipLoading}
              className="admin-btn-primary"
            >
              Save Manual IP
            </button>
            <button 
              onClick={handleSetMyIp} 
              disabled={ipLoading}
              className="admin-btn-ghost"
            >
              Auto-detect My IP
            </button>
          </div>
        </div>
        
        <details style={{ marginTop: '24px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px' }}>
          <summary style={{ cursor: 'pointer', color: '#94a3b8', fontWeight: 600, fontSize: '14px' }}>Advanced Testing Tools</summary>
          <div style={{ marginTop: '16px' }}>
            <div className="admin-shell-sub" style={{ fontSize: '13px', fontStyle: 'italic', color: '#64748b', marginBottom: '16px' }}>
              <strong>Testing Tip:</strong> To test if the block is working, type a fake IP (like 1.1.1.1) and hit 'Save Manual IP'. Then log in as an employee to see the restriction. To fix it, click 'Auto-detect My IP'.
            </div>
            <button 
              onClick={handleResetAttendance} 
              style={{
                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '8px 16px', borderRadius: '6px', 
                border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
              }}
            >
              🗑️ Reset Today's Attendance (Danger)
            </button>
          </div>
        </details>
      </div>
    </div>
  )
}

export default AdminDashboard
