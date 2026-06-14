import { useEffect, useState } from 'react'
import { getAllEmployees, getAllLeaves, updateEmployee, getAttendanceAll, addEmployee } from '../../api'
import './Employee.css'

function Employee() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attendance, setAttendance] = useState({}) // employee_code -> unpaid days
  const [editingId, setEditingId] = useState(null) // employee_code being edited
  const [editForm, setEditForm] = useState({}) // form data for editing
  const [savingId, setSavingId] = useState(null) // employee_code being saved
  const [showAddForm, setShowAddForm] = useState(false) // Show add employee form
  const [addForm, setAddForm] = useState({
    employee_code: '',
    cnic: '',
    full_name: '',
    role: 'Employee',
    salary: '',
    mobile: ''
  })
  const [addingEmployee, setAddingEmployee] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        const [empRes, attendanceRes] = await Promise.all([
          getAllEmployees(),
          getAttendanceAll(month, year)
        ])
        const empData = empRes.data || []
        setEmployees(empData)

        // Get unapproved_absence from attendance database
        const attendanceData = attendanceRes.data || []
        const summary = {}
        attendanceData.forEach((att) => {
          if (att.employee_id && att.unapproved_absence != null) {
            summary[att.employee_id] = att.unapproved_absence
          }
        })
        setAttendance(summary)
      } catch (err) {
        console.error('Error fetching employees/attendance', err)
        setError('Failed to load employees')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEdit = (emp) => {
    setEditingId(emp.employee_code)
    setEditForm({
      full_name: emp.full_name || '',
      email: emp.email || '',
      role: emp.role || 'Employee',
      salary: emp.salary || 0,
      employee_code: emp.employee_code || '',
      cnic: emp.cnic || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (employeeCode) => {
    try {
      setSavingId(employeeCode)
      setError('')
      
      const updateData = {
        full_name: editForm.full_name,
        email: editForm.email,
        role: editForm.role,
        salary: Number(editForm.salary) || 0,
        cnic: editForm.cnic
      }
      
      // Validate CNIC if provided
      if (updateData.cnic && (updateData.cnic.length !== 13 || !/^\d+$/.test(updateData.cnic))) {
        setError('CNIC must be exactly 13 digits')
        setSavingId(null)
        return
      }

      await updateEmployee(employeeCode, updateData)
      
      // Refresh employee list and attendance
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      
      const [empRes, attendanceRes] = await Promise.all([
        getAllEmployees(),
        getAttendanceAll(month, year)
      ])
      setEmployees(empRes.data || [])
      
      // Update attendance summary
      const attendanceData = attendanceRes.data || []
      const summary = {}
      attendanceData.forEach((att) => {
        if (att.employee_id && att.unapproved_absence != null) {
          summary[att.employee_id] = att.unapproved_absence
        }
      })
      setAttendance(summary)
      
      setEditingId(null)
      setEditForm({})
    } catch (err) {
      console.error('Error updating employee', err)
      setError(err?.response?.data?.detail || 'Failed to update employee')
    } finally {
      setSavingId(null)
    }
  }

  const handleAddFormChange = (field, value) => {
    setAddForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!addForm.employee_code || !addForm.cnic) {
      setError('Employee Code and CNIC are required')
      return
    }

    // Validate CNIC
    if (addForm.cnic.length !== 13 || !/^\d+$/.test(addForm.cnic)) {
      setError('CNIC must be exactly 13 digits')
      return
    }

    try {
      setAddingEmployee(true)
      setError('')
      
      const payload = {
        employee_code: addForm.employee_code,
        cnic: addForm.cnic,
        full_name: addForm.full_name || null,
        role: addForm.role,
        salary: Number(addForm.salary) || 0,
        mobile: addForm.mobile || null
      }

      await addEmployee(payload)
      
      // Refresh employee list
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      
      const [empRes, attendanceRes] = await Promise.all([
        getAllEmployees(),
        getAttendanceAll(month, year)
      ])
      setEmployees(empRes.data || [])
      
      const attendanceData = attendanceRes.data || []
      const summary = {}
      attendanceData.forEach((att) => {
        if (att.employee_id && att.unapproved_absence != null) {
          summary[att.employee_id] = att.unapproved_absence
        }
      })
      setAttendance(summary)
      
      // Reset form
      setAddForm({
        employee_code: '',
        cnic: '',
        full_name: '',
        role: 'Employee',
        salary: '',
        mobile: ''
      })
      setShowAddForm(false)
    } catch (err) {
      console.error('Error adding employee', err)
      setError(err?.response?.data?.detail || 'Failed to add employee')
    } finally {
      setAddingEmployee(false)
    }
  }

  return (
    <div className="employee-page">
      <h1 className="page-title">Employees</h1>
      
      <div className="employee-section">
        <div className="section-header-row">
          <h2 className="section-heading">Employee Details</h2>
          <button
            className="btn-add-employee"
            onClick={() => {
              setShowAddForm(!showAddForm)
              setError('')
            }}
          >
            {showAddForm ? 'Cancel' : '+ Add Employee'}
          </button>
        </div>

        {loading && <div className="employee-loading">Loading employees...</div>}
        {error && !loading && (
          <div className="employee-error">
            <div className="error-message">{error}</div>
            {(error.includes('CNIC') || error.includes('Email') || error.includes('already') || error.includes('not enrolled')) && (
              <button
                type="button"
                className="try-again-button"
                onClick={() => {
                  setError('')
                  if (editingId) {
                    handleCancelEdit()
                  }
                  if (showAddForm) {
                    setShowAddForm(false)
                  }
                }}
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {showAddForm && (
          <div className="add-employee-form-container">
            <h3 className="form-title">Add New Employee</h3>
            <form className="add-employee-form" onSubmit={handleAddEmployee}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="add_employee_code">Employee Code <span className="required">*</span></label>
                  <input
                    type="text"
                    id="add_employee_code"
                    value={addForm.employee_code}
                    onChange={(e) => handleAddFormChange('employee_code', e.target.value)}
                    placeholder="EMP001"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="add_cnic">CNIC Number <span className="required">*</span></label>
                  <input
                    type="text"
                    id="add_cnic"
                    value={addForm.cnic}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 13) {
                        handleAddFormChange('cnic', value)
                      }
                    }}
                    placeholder="1234567890123"
                    maxLength={13}
                    required
                    className="form-input"
                  />
                  <small>13 digits only</small>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="add_full_name">Full Name (Optional)</label>
                  <input
                    type="text"
                    id="add_full_name"
                    value={addForm.full_name}
                    onChange={(e) => handleAddFormChange('full_name', e.target.value)}
                    placeholder="John Doe"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="add_role">Role</label>
                  <select
                    id="add_role"
                    value={addForm.role}
                    onChange={(e) => handleAddFormChange('role', e.target.value)}
                    className="form-input"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="add_salary">Salary (Optional)</label>
                  <input
                    type="number"
                    id="add_salary"
                    value={addForm.salary}
                    onChange={(e) => handleAddFormChange('salary', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="add_mobile">Mobile (Optional)</label>
                  <input
                    type="text"
                    id="add_mobile"
                    value={addForm.mobile}
                    onChange={(e) => handleAddFormChange('mobile', e.target.value)}
                    placeholder="+92 300 1234567"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={addingEmployee}>
                  {addingEmployee ? 'Adding...' : 'Add Employee'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddForm(false)
                    setAddForm({
                      employee_code: '',
                      cnic: '',
                      full_name: '',
                      role: 'Employee',
                      salary: '',
                      mobile: ''
                    })
                    setError('')
                  }}
                  disabled={addingEmployee}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="employee-cards">
          {!loading && !error && employees.map((emp) => {
            const isEditing = editingId === emp.employee_code
            const isSaving = savingId === emp.employee_code
            
            return (
              <div key={emp._id || emp.employee_code} className="employee-card">
                <div className="employee-card-header">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => handleFormChange('full_name', e.target.value)}
                        className="edit-input"
                        placeholder="Full Name"
                      />
                    ) : (
                      <div className="employee-name">{emp.full_name}</div>
                    )}
                    {isEditing ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => handleFormChange('role', e.target.value)}
                        className="edit-select"
                      >
                        <option value="Employee">Employee</option>
                        <option value="Admin">Admin</option>
                        <option value="HR">HR</option>
                        <option value="Manager">Manager</option>
                      </select>
                    ) : (
                      <div className="employee-designation">{emp.role}</div>
                    )}
                  </div>
                  <div className="employee-id">{emp.employee_code}</div>
                </div>

                <div className="employee-info-grid">
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="edit-input"
                        placeholder="Email"
                      />
                    ) : (
                      <span className="info-value">{emp.email}</span>
                    )}
                  </div>
                  <div className="info-item">
                    <span className="info-label">CNIC Number</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.cnic}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          if (value.length <= 13) {
                            handleFormChange('cnic', value)
                          }
                        }}
                        className="edit-input"
                        placeholder="1234567890123"
                        maxLength={13}
                      />
                    ) : (
                      <span className="info-value">{emp.cnic || '-'}</span>
                    )}
                  </div>
                  <div className="info-item">
                    <span className="info-label">Salary</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.salary}
                        onChange={(e) => handleFormChange('salary', e.target.value)}
                        className="edit-input"
                        placeholder="Salary"
                        min="0"
                      />
                    ) : (
                      <span className="info-value">
                        {emp.salary != null ? `Rs ${emp.salary.toLocaleString()}` : '-'}
                      </span>
                    )}
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date of Joining</span>
                    <span className="info-value">
                      {emp.joined_at
                        ? new Date(emp.joined_at).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '-'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Unpaid Leaves (This Month)</span>
                    <span className="info-value">
                      {attendance[emp.employee_code] || 0}
                    </span>
                  </div>
                </div>

                <div className="employee-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="btn-save"
                        onClick={() => handleSave(emp.employee_code)}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(emp)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Employee

