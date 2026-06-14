import { useEffect, useState } from 'react'
import { getAllLeaves, updateLeaveStatus } from '../../api'
import './AdminLeaves.css'

function AdminLeaves() {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      const res = await getAllLeaves()
      setLeaves(res.data || [])
    } catch (err) {
      console.error('Error fetching leaves', err)
      setError('Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaves()
  }, [])

  const handleStatusChange = async (leaveId, newStatus) => {
    const prev = leaves
    setUpdatingId(leaveId)
    // optimistic UI
    setLeaves((current) =>
      current.map((l) => (l._id === leaveId ? { ...l, status: newStatus } : l))
    )
    try {
      await updateLeaveStatus(leaveId, newStatus)
    } catch (err) {
      console.error('Error updating leave status', err)
      setError('Failed to update leave status')
      // rollback
      setLeaves(prev)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="admin-leaves-page">
      <h1 className="admin-shell-title">Leave Requests</h1>

      <div className="leaves-section">
        <div className="section-header">
          <h2 className="section-heading">All Employee Leaves</h2>
          <div className="openings-stats">
            <span className="stat-item">
              Total: <strong>{leaves.length}</strong>
            </span>
          </div>
        </div>

        {loading && <div className="leaves-info">Loading leave requests...</div>}
        {error && !loading && <div className="leaves-error">{error}</div>}

        <div className="leaves-list">
          {!loading &&
            !error &&
            leaves.map((leave) => {
              const statusLabel = leave.status || 'Pending'
              const statusKey = statusLabel.toLowerCase()
              const decisionFinal = statusKey === 'approved' || statusKey === 'rejected'

              return (
              <div key={leave._id} className="leave-row">
                <div className="leave-main">
                  <div className="leave-emp">
                    <span className="leave-emp-id">{leave.employee_id}</span>
                    <span className="leave-type-tag">{leave.leave_type}</span>
                  </div>
                  <div className="leave-dates">
                    {new Date(leave.start_date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}{' '}
                    -{' '}
                    {new Date(leave.end_date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="leave-reason">{leave.reason}</div>
                </div>
                <div className="leave-side">
                  <span className={`leave-status-pill ${statusKey}`}>
                    {statusLabel}
                  </span>
                {!decisionFinal && (
                  <div className="leave-actions">
                    <button
                      type="button"
                      className="btn-approve"
                      disabled={updatingId === leave._id}
                      onClick={() => handleStatusChange(leave._id, 'Approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn-reject"
                      disabled={updatingId === leave._id}
                      onClick={() => handleStatusChange(leave._id, 'Rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
                  {leave.admin_comments && (
                    <div className="leave-comment">Note: {leave.admin_comments}</div>
                  )}
                </div>
              </div>
              )
            })}

          {!loading && !error && leaves.length === 0 && (
            <div className="leaves-info">No leave requests found.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminLeaves


