import { useEffect, useState } from 'react'
import { getProjects, createProject, deleteProject } from '../../api'
import '../adminShell/AdminShell.css'

function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Active')
  const [lead, setLead] = useState('')

  const fetchProjects = async () => {
    try {
      const res = await getProjects()
      setProjects(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const addProject = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const row = {
      name: name.trim(),
      status,
      lead: lead.trim() || 'Unassigned'
    }
    
    try {
      await createProject(row)
      await fetchProjects()
      setName('')
      setLead('')
      setStatus('Active')
    } catch (err) {
      console.error(err)
      alert("Failed to create project")
    }
  }

  const remove = async (id) => {
    try {
      await deleteProject(id)
      await fetchProjects()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="admin-shell-page">
      <h1 className="admin-shell-title">Projects</h1>
      <p className="admin-shell-sub">
        Lightweight project tracker securely backed up to the database. Use it for internal
        HR initiatives.
      </p>

      <div className="admin-shell-card">
        <h2>Add project</h2>
        <form className="admin-toolbar" onSubmit={addProject} style={{ alignItems: 'flex-end' }}>
          <div className="admin-field">
            <label htmlFor="proj-name">Name</label>
            <input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 policy refresh"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="proj-status">Status</label>
            <select id="proj-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Active</option>
              <option>On hold</option>
              <option>Done</option>
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="proj-lead">Lead</label>
            <input
              id="proj-lead"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              placeholder="Owner name"
            />
          </div>
          <button type="submit" className="admin-btn-primary">
            Save project
          </button>
        </form>
      </div>

      <div className="admin-shell-card">
        <h2>Your projects</h2>
        {!projects.length ? (
          <p className="admin-empty">No projects yet. Add one above.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Lead</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.status}</td>
                    <td>{p.lead}</td>
                    <td>{new Date(p.updated_at).toLocaleString()}</td>
                    <td>
                      <button type="button" className="admin-btn-ghost" onClick={() => remove(p._id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProjects
