import './Sidebar.css'

function Sidebar({ activeMenu, setActiveMenu, showSubmenu, setShowSubmenu, unviewedCVsCount = 0 }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">HR System</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-menu">
            <li>
              <a 
                href="#" 
                className={activeMenu === 'Dashboard' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveMenu('Dashboard'); }}
              >
                Dashboard
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeMenu === 'Salary' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveMenu('Salary'); }}
              >
                Salary
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeMenu === 'Employee' ? 'active' : ''}
                onClick={(e) => { 
                  e.preventDefault(); 
                  setActiveMenu('Employee'); 
                }}
              >
                Employees
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeMenu === 'Hiring' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveMenu('Hiring'); }}
              >
                Hiring
                {unviewedCVsCount > 0 && (
                  <span className="nav-badge">{unviewedCVsCount}</span>
                )}
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeMenu === 'Interviews' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveMenu('Interviews'); }}
              >
                Interviews
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeMenu === 'Leaves' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveMenu('Leaves'); }}
              >
                Leaves
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeMenu === 'Admin Openings' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveMenu('Admin Openings'); }}
              >
                Job Openings
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeMenu === 'Attendance' ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setActiveMenu('Attendance'); }}
              >
                Attendance
              </a>
            </li>

            <li>
               <a 
                 href="#" 
                 className={activeMenu === 'Roles' ? 'active' : ''}
                 onClick={(e) => { e.preventDefault(); setActiveMenu('Roles'); }}
               >
                 Persona Roles
               </a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-illustration">
          <div className="illustration-placeholder">
            👤
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

