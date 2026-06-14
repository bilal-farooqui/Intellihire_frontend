import { useState } from 'react'
import toast from 'react-hot-toast'
import './EmployeeOpenings.css'

function EmployeeOpenings() {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', 'Technology', 'Marketing', 'Sales', 'HR', 'Finance']

  const openings = [
    {
      id: 'OP001',
      title: 'Senior Software Engineer',
      department: 'Technology',
      location: 'Remote',
      type: 'Full-time',
      postedDate: '15 Nov, 2024',
      applicants: 25,
      status: 'Active'
    },
    {
      id: 'OP002',
      title: 'Product Manager',
      department: 'Product',
      location: 'New York, NY',
      type: 'Full-time',
      postedDate: '14 Nov, 2024',
      applicants: 18,
      status: 'Active'
    },
    {
      id: 'OP003',
      title: 'UX Designer',
      department: 'Design',
      location: 'San Francisco, CA',
      type: 'Full-time',
      postedDate: '13 Nov, 2024',
      applicants: 32,
      status: 'Active'
    },
    {
      id: 'OP004',
      title: 'Marketing Specialist',
      department: 'Marketing',
      location: 'Chicago, IL',
      type: 'Full-time',
      postedDate: '12 Nov, 2024',
      applicants: 15,
      status: 'Active'
    },
    {
      id: 'OP005',
      title: 'Data Analyst',
      department: 'Technology',
      location: 'Remote',
      type: 'Full-time',
      postedDate: '11 Nov, 2024',
      applicants: 28,
      status: 'Active'
    },
    {
      id: 'OP006',
      title: 'Sales Representative',
      department: 'Sales',
      location: 'Boston, MA',
      type: 'Full-time',
      postedDate: '10 Nov, 2024',
      applicants: 12,
      status: 'Active'
    }
  ]

  const filteredOpenings = selectedCategory === 'All'
    ? openings
    : openings.filter(opening => opening.department === selectedCategory)

  const handleApply = (openingId) => {
    toast.success(`Application for opening ${openingId} - to be implemented`)
  }

  return (
    <div className="employee-openings-page">
      <h1 className="page-title">Job Openings</h1>
      
      <div className="openings-section">
        <div className="section-header">
          <h2 className="section-heading">Available Positions</h2>
          <div className="openings-stats">
            <span className="stat-item">
              Total Openings: <strong>{filteredOpenings.length}</strong>
            </span>
          </div>
        </div>

        <div className="category-filter">
          <div className="filter-label">Filter by Department:</div>
          <div className="filter-buttons">
            {categories.map((category) => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="openings-list">
          {filteredOpenings.map((opening) => (
            <div key={opening.id} className="opening-card">
              <div className="opening-header">
                <div className="opening-title-section">
                  <h3 className="opening-title">{opening.title}</h3>
                  <div className="opening-meta">
                    <span className="opening-department">{opening.department}</span>
                    <span className="opening-separator">•</span>
                    <span className="opening-location">{opening.location}</span>
                    <span className="opening-separator">•</span>
                    <span className="opening-type">{opening.type}</span>
                  </div>
                </div>
                <div className="opening-status">
                  <span className={`status-badge ${opening.status.toLowerCase()}`}>
                    {opening.status}
                  </span>
                </div>
              </div>

              <div className="opening-details">
                <div className="detail-item">
                  <span className="detail-label">Posted:</span>
                  <span className="detail-value">{opening.postedDate}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Applicants:</span>
                  <span className="detail-value">{opening.applicants}</span>
                </div>
              </div>

              <div className="opening-actions">
                <button
                  className="view-details-btn"
                  onClick={() => toast(`View details for ${opening.title} - to be implemented`)}
                >
                  View Details
                </button>
                <button
                  className="apply-btn"
                  onClick={() => handleApply(opening.id)}
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredOpenings.length === 0 && (
          <div className="no-openings">
            <p>No openings found in this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeOpenings

