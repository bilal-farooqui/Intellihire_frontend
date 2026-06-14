import './EmployeeTable.css'

function EmployeeTable({ employees, onEdit, onDelete }) {
  return (
    <div className="table-container">
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Mobile No</th>
            <th>Date Of Joining</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.name}</td>
              <td>{employee.email}</td>
              <td>{employee.department}</td>
              <td>{employee.designation}</td>
              <td>{employee.mobile}</td>
              <td>{employee.dateOfJoining}</td>
              <td>
                <div className="action-buttons">
                  <button 
                    className="btn-action btn-edit"
                    onClick={() => onEdit(employee)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-action btn-delete"
                    onClick={() => onDelete(employee.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default EmployeeTable

