import { Link } from 'react-router-dom'
import './ApplicantSidebar.css'

function ApplicantSidebar({ activeMenu }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">HR System</h2>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-menu">
            <li>
              <Link
                to="/applicant/profile"
                className={activeMenu === 'Profile' ? 'active' : ''}
              >
                My Profile
              </Link>
            </li>
            <li>
              <Link
                to="/applicant/openings"
                className={activeMenu === 'Openings' ? 'active' : ''}
              >
                Openings
              </Link>
            </li>
            <li>
              <Link
                to="/applicant/applications"
                className={activeMenu === 'Applications' ? 'active' : ''}
              >
                My Applications
              </Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-illustration">
          <div className="illustration-placeholder">📄</div>
        </div>
      </div>
    </aside>
  )
}

export default ApplicantSidebar

