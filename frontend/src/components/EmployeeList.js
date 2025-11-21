import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

function EmployeeList({ section }) {
  const navigate = useNavigate();
  const current_user = getCurrentUser();

  // Use the section prop passed from RouteHandler
  const current_section = section || 'employee-details';
  
  // Debug logging
  console.log('EmployeeList - Section prop:', section);
  console.log('EmployeeList - Current section:', current_section);
  console.log('EmployeeList - Current user:', current_user);
  console.log('EmployeeList - User role:', current_user?.role);
  
  // Get section title
  const get_section_title = () => {
    const titles = {
      'employee-details': 'Employee Details',
      'joining-details': 'Joining Details',
      'bank-details': 'Bank Details',
      'bgv': 'BGV',
      'project': 'Project', 
      'leave': 'Leave',
      'attendance': 'Attendance',
      'salary': 'Salary',
      'insurance': 'Insurance'
    };
    return titles[current_section] || 'Employee';
  };
  
  const [employees, set_employees] = useState([]);
  const [search_term, set_search_term] = useState("");
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState(null);

  // Fetch employees from backend
  const fetch_employees = async () => {
    try {
      set_loading(true);
      set_error(null);
      
      // Get the token from sessionStorage
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        set_error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/employee-details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        set_error('Session expired. Please login again.');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      if (!response.ok) {
        const error_data = await response.json().catch(() => ({}));
        throw new Error(error_data.message || `Server returned ${response.status}`);
      }
      
      const response_data = await response.json();
      console.log('Received response:', response_data);
      
      // Handle the response format: { success: true, count: X, data: [...] }
      let data = response_data;
      
      // If the response has a 'data' property, use that
      if (response_data.data && Array.isArray(response_data.data)) {
        data = response_data.data;
      } else if (!Array.isArray(response_data)) {
        // If it's not an array and doesn't have a data property, it's invalid
        console.error('Invalid response format:', response_data);
        throw new Error('Invalid data format received from server');
      }
      
      // Transform data to match the expected format
      const transformed_data = data.map(emp => ({
        id: emp.emp_id || emp.id || 'N/A',
        name: emp.display_name || emp.full_name || emp.user_name || 'N/A',
        email: emp.email1 || emp.user_email || 'N/A',
        department: emp.department_name || emp.department || 'Not Assigned',
        designation: emp.designation || 'N/A'
      }));
      
      console.log('Transformed data:', transformed_data);
      
      set_employees(transformed_data);
      set_error(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      set_error(err.message || 'Failed to load employees. Please try again.');
      set_employees([]);
    } finally {
      set_loading(false);
    }
  };

  // Fetch employees on component mount
  useEffect(() => {
    fetch_employees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered_employees = employees.filter(emp => 
    emp.id.toString().toLowerCase().includes(search_term.toLowerCase()) ||
    emp.name.toLowerCase().includes(search_term.toLowerCase()) ||
    emp.email.toLowerCase().includes(search_term.toLowerCase())
  );

  const handle_view_details = (emp_id) => {
    navigate(`/${current_section}/${emp_id}`);
  };

  const handle_add_new = () => {
    navigate(`/${current_section}/new`);
  };

  // Check if Add New button should be shown
  const should_show_add_button = () => {
    console.log('Checking if Add button should show:');
    console.log('  - User role:', current_user?.role);
    console.log('  - Is HR?', current_user?.role === 'HR');
    console.log('  - Current section:', current_section);
    console.log('  - Is employee-details?', current_section === 'employee-details');
    
    return current_user?.role === 'HR' && current_section === 'employee-details';
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container-fluid px-4">
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate("/")}
          >
            ← Back to Dashboard
          </button>
          <span className="navbar-brand mb-0 h1 fw-bold">
            <span className="text-primary">{get_section_title()}</span> List
          </span>
          <div style={{ width: "120px" }}></div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            
            {/* Search and Add Button */}
            <div className="row mb-4 align-items-center">
              <div className="col-md-6 mb-3 mb-md-0">
                <h4 className="fw-bold text-dark mb-0">All Employees</h4>
                <p className="text-muted mb-0 small">
                  {loading ? 'Loading...' : `Total: ${employees.length} employees`}
                </p>
              </div>
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search by ID, Name or Email..."
                    value={search_term}
                    onChange={(e) => set_search_term(e.target.value)}
                  />
                  {should_show_add_button() && (
                    <button 
                      className="btn btn-primary text-nowrap"
                      onClick={handle_add_new}
                    >
                      + Add New
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div className="flex-grow-1">
                  <strong>Error:</strong> {error}
                </div>
                <button 
                  className="btn btn-sm btn-outline-danger ms-3"
                  onClick={fetch_employees}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-3">Loading employees...</p>
              </div>
            )}

            {/* Table */}
            {!loading && !error && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-semibold" style={{ width: "15%" }}>Employee ID</th>
                      <th className="fw-semibold" style={{ width: "25%" }}>Name</th>
                      <th className="fw-semibold" style={{ width: "25%" }}>Email</th>
                      <th className="fw-semibold" style={{ width: "20%" }}>Department</th>
                      <th className="text-center fw-semibold" style={{ width: "15%" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered_employees.length > 0 ? (
                      filtered_employees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="fw-semibold text-primary">{employee.id}</td>
                          <td>{employee.name}</td>
                          <td className="text-muted small">{employee.email}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {employee.department}
                            </span>
                          </td>
                          <td className="text-center">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handle_view_details(employee.id)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-5">
                          <div className="mb-2">
                            <i className="bi bi-search fs-1"></i>
                          </div>
                          {search_term 
                            ? `No employees found matching "${search_term}"`
                            : 'No employees found. Click "Add New" to create the first employee.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && filtered_employees.length > 0 && (
              <div className="row mt-4">
                <div className="col-12 d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Showing {filtered_employees.length} of {employees.length} employees
                  </div>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className="page-item disabled">
                        <span className="page-link">Previous</span>
                      </li>
                      <li className="page-item active">
                        <span className="page-link">1</span>
                      </li>
                      <li className="page-item disabled">
                        <span className="page-link">Next</span>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeList;