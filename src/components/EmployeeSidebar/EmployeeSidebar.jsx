import './EmployeeSidebar.css'

function EmployeeSidebar({ activeMenu, setActiveMenu }) {
  return (
    <aside className="employee-sidebar">
      <div className="employee-sidebar__inner">
        <div className="employee-sidebar__header">
          <h2 className="employee-sidebar__logo">HR System</h2>
        </div>

        <nav className="employee-sidebar__nav">
          <ul className="employee-sidebar__menu">
            <li>
              <a
                href="#"
                className={activeMenu === 'Dashboard' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveMenu('Dashboard')
                }}
              >
                Dashboard
              </a>
            </li>
          </ul>
        </nav>

        <div className="employee-sidebar__illustration">
          <div className="employee-sidebar__illustration-placeholder" aria-hidden>
            👤
          </div>
        </div>
      </div>
    </aside>
  )
}

export default EmployeeSidebar
