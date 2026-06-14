import { useEffect, useState } from 'react'
import { createJob, getAllJobs, deleteJob } from '../../api'
import toast from 'react-hot-toast'
import './AdminOpenings.css'

function AdminOpenings() {
  const [openings, setOpenings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: '',
    isActive: true
  })

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await getAllJobs()
        setOpenings(res.data || [])
      } catch (err) {
        console.error('Error loading jobs', err)
        setError('Failed to load job openings')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')

      const payload = {
        title: formData.title,
        description: formData.description || 'Job description',
        requirements: formData.requirements
          ? formData.requirements.split(',').map((r) => r.trim()).filter(Boolean)
          : [],
        location: formData.location || 'Remote',
        salary_range: formData.salaryRange || 'Not Disclosed',
        is_active: formData.isActive
      }

      await createJob(payload)

      // Refresh list
      const res = await getAllJobs()
      setOpenings(res.data || [])

      setFormData({
        title: '',
        description: '',
        requirements: '',
        location: '',
        salaryRange: '',
        isActive: true
      })
      toast.success('Job opening created')
    } catch (err) {
      console.error('Error creating job', err)
      setError('Failed to create job opening')
      toast.error('Failed to create job opening')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (jobId) => {
    toast.custom(
      (t) => (
        <div className="hiring-toast-confirm">
          <p className="hiring-toast-confirm-message">
            Are you sure you want to delete this job opening? This will permanently delete all associated applications and interviews.
          </p>
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
                  setLoading(true)
                  await deleteJob(jobId)
                  toast.success('Job opening deleted successfully')

                  // Refresh list
                  const res = await getAllJobs()
                  setOpenings(res.data || [])
                } catch (err) {
                  console.error('Error deleting job:', err)
                  toast.error('Failed to delete job opening')
                } finally {
                  setLoading(false)
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: 'top-center' }
    )
  }

  return (
    <div className="admin-openings-page">
      <h1 className="admin-shell-title">Manage Openings</h1>

      <div className="openings-grid">
        <div className="form-card">
          <h2 className="section-heading">Add New Opening</h2>
          <form className="opening-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Job Title</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Short description"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Remote"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="requirements">Requirements (comma separated)</label>
                <input
                  id="requirements"
                  type="text"
                  value={formData.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
              <div className="form-group">
                <label htmlFor="salaryRange">Salary Range</label>
                <input
                  id="salaryRange"
                  type="text"
                  value={formData.salaryRange}
                  onChange={(e) => handleChange('salaryRange', e.target.value)}
                  placeholder="Rs 100k - 150k"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn">Add Opening</button>
            </div>
          </form>
        </div>

        <div className="list-card">
          <h2 className="section-heading">Current Openings</h2>
          {loading && <div className="leaves-info">Loading openings...</div>}
          {error && !loading && <div className="leaves-error">{error}</div>}
          <div className="openings-list">
            {!loading && !error && openings.map((opening) => (
              <div key={opening._id} className="opening-row">
                <div className="opening-info">
                  <div className="opening-title">{opening.title}</div>
                  <div className="opening-meta">
                    <span>{opening.location}</span>
                    <span className="dot">•</span>
                    <span>{opening.salary_range}</span>
                  </div>
                </div>
                <div className="opening-status">
                  <span className={`status-badge ${opening.is_active ? 'active' : 'closed'}`}>
                    {opening.is_active ? 'Active' : 'Closed'}
                  </span>
                  <div className="opening-date">
                    Posted:{' '}
                    {opening.created_at
                      ? new Date(opening.created_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '-'}
                  </div>
                  <button
                    onClick={() => handleDelete(opening._id)}
                    className="delete-opening-btn"
                    title="Delete this opening"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!loading && !error && openings.length === 0 && (
              <div className="no-openings">
                <p>No openings yet. Add one above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOpenings
