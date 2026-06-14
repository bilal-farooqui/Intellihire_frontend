import '../adminShell/AdminShell.css'

const ROLES = [
  {
    title: 'Administrator',
    body: 'Uses the admin sidebar: employees, hiring pipeline, leave approvals, job postings, attendance, and tools. Access this app with the Administrator option on the login screen (demo flow).'
  },
  {
    title: 'Employee',
    body: 'Sees the employee dashboard: profile, attendance-linked salary estimate, and leave requests. Created when HR adds a record and the person completes signup with CNIC and employee code.'
  },
  {
    title: 'Applicant',
    body: 'Browses published openings and submits applications with CV upload. Distinct from enrolled employees; managed under Applicant login.'
  }
]

function AdminRoles() {
  return (
    <div className="admin-shell-page">
      <h1 className="admin-shell-title">Roles</h1>
      <p className="admin-shell-sub">
        How each persona uses this HR system. Role enforcement on the API can be expanded in a
        future iteration.
      </p>

      <div className="admin-shell-card">
        {ROLES.map((r) => (
          <div key={r.title} className="admin-role-card">
            <h4>{r.title}</h4>
            <p>{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminRoles
