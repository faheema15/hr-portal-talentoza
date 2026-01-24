import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function EmployeeList({ section }) {
  const navigate = useNavigate();
  const current_user = getCurrentUser();
  const current_section = section || 'employee-details';
  
  const [employees, set_employees] = useState([]);
  const [search_term, set_search_term] = useState("");
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState(null);
  
  // Leave Requests Modal State
  const [show_leave_modal, set_show_leave_modal] = useState(false);
  const [leave_requests, set_leave_requests] = useState([]);
  const [loading_leaves, set_loading_leaves] = useState(false);
  const [filter_status, set_filter_status] = useState('Pending');
  
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

  // Format date for display
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0];
    } catch (e) {
      return "";
    }
  };

  // Fetch all leave requests
  const fetch_leave_requests = async () => {
    try {
      set_loading_leaves(true);
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        alert('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/leave`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }

      const result = await response.json();
      set_leave_requests(result.data || []);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      alert('Failed to load leave requests');
    } finally {
      set_loading_leaves(false);
    }
  };

  // Handle approve/reject from modal
  const handle_approve_reject_modal = async (leaveId, status, empId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/leave/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leaveApprovalStatus: status }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Leave ${status} successfully!`);
        // Refresh leave requests
        fetch_leave_requests();
      } else {
        alert(result.message || "Error updating leave!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error updating leave!");
    }
  };

  // Fetch employees on component mount
  const fetch_employees = async () => {
    try {
      set_loading(true);
      set_error(null);
      
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
      let data = response_data;
      
      if (response_data.data && Array.isArray(response_data.data)) {
        data = response_data.data;
      } else if (!Array.isArray(response_data)) {
        throw new Error('Invalid data format received from server');
      }
      
      const transformed_data = data.map(emp => ({
        id: emp.emp_id || emp.id || 'N/A',
        name: emp.display_name || emp.full_name || emp.user_name || 'N/A',
        email: emp.email1 || emp.user_email || 'N/A',
        department: emp.department_name || emp.department || 'Not Assigned',
        designation: emp.designation || 'N/A'
      }));
      
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

  useEffect(() => {
    fetch_employees();
  }, []);

  const filtered_employees = employees.filter(emp => 
    emp.id.toString().toLowerCase().includes(search_term.toLowerCase()) ||
    emp.name.toLowerCase().includes(search_term.toLowerCase()) ||
    emp.email.toLowerCase().includes(search_term.toLowerCase())
  );

  // Filter leave requests by status
  const filtered_leave_requests = leave_requests.filter(leave => 
    filter_status === 'All' ? true : leave.status === filter_status
  );

  const handle_view_details = (emp_id) => {
    navigate(`/${current_section}/${emp_id}`);
  };

  const handle_add_new = () => {
    navigate(`/${current_section}/new`);
  };

  const should_show_add_button = () => {
    return current_user?.role === 'HR' && current_section === 'employee-details';
  };

  // Check if Leave Requests button should be shown
  const should_show_leave_requests_button = () => {
    return (current_user?.role === 'HR' || 
            current_user?.role === 'Manager' || 
            current_user?.role === 'Skip Manager') && 
           current_section === 'leave';
  };

  const open_leave_requests_modal = () => {
    set_show_leave_modal(true);
    fetch_leave_requests();
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
                  {should_show_leave_requests_button() && (
                    <button 
                      className="btn btn-primary text-nowrap"
                      onClick={open_leave_requests_modal}
                    >
                      <i className="bi bi-clock-history me-2"></i>
                      View all Leave Requests
                    </button>
                  )}
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

      {/* Leave Requests Modal */}
      {show_leave_modal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-clock-history me-2"></i>
                  All Leave Requests
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => set_show_leave_modal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {/* Filter Tabs */}
                <div className="mb-3">
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${filter_status === 'Pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                      onClick={() => set_filter_status('Pending')}
                    >
                      <i className="bi bi-clock me-1"></i>
                      Pending ({leave_requests.filter(l => l.status === 'Pending').length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter_status === 'Approved' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => set_filter_status('Approved')}
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      Approved ({leave_requests.filter(l => l.status === 'Approved').length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter_status === 'Rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => set_filter_status('Rejected')}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Rejected ({leave_requests.filter(l => l.status === 'Rejected').length})
                    </button>
                    <button
                      type="button"
                      className={`btn ${filter_status === 'All' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => set_filter_status('All')}
                    >
                      <i className="bi bi-list me-1"></i>
                      All ({leave_requests.length})
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {loading_leaves && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-3">Loading leave requests...</p>
                  </div>
                )}

                {/* Leave Requests Table */}
                {!loading_leaves && (
                  <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th>Emp ID</th>
                          <th>Employee Name</th>
                          <th>Leave Type</th>
                          <th>From Date</th>
                          <th>To Date</th>
                          <th>Days</th>
                          <th>Applied On</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered_leave_requests.length > 0 ? (
                          filtered_leave_requests.map((leave) => (
                            <tr key={leave.id}>
                              <td className="fw-bold text-primary">{leave.emp_id}</td>
                              <td>{leave.full_name || 'N/A'}</td>
                              <td>
                                <span className="badge bg-info text-dark">
                                  {leave.leave_type}
                                </span>
                              </td>
                              <td>{formatDateForInput(leave.from_date)}</td>
                              <td>{formatDateForInput(leave.to_date)}</td>
                              <td className="fw-semibold">{leave.total_days || 1}</td>
                              <td className="text-muted small">
                                {formatDateForInput(leave.created_at)}
                              </td>
                              <td>
                                <small className="text-muted" title={leave.reason}>
                                  {leave.reason ? (leave.reason.length > 30 ? leave.reason.substring(0, 30) + '...' : leave.reason) : 'N/A'}
                                </small>
                              </td>
                              <td>
                                <span className={`badge bg-${
                                  leave.status === 'Approved' ? 'success' : 
                                  leave.status === 'Pending' ? 'warning' : 
                                  'danger'
                                }`}>
                                  {leave.status}
                                </span>
                              </td>
                              <td className="text-center">
                                {leave.status === 'Pending' && (
                                  <div className="d-flex gap-2 justify-content-center">
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => handle_approve_reject_modal(leave.id, 'Approved', leave.emp_id)}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handle_approve_reject_modal(leave.id, 'Rejected', leave.emp_id)}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                                {leave.status !== 'Pending' && (
                                  <span className="text-muted small">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center text-muted py-5">
                              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                              No {filter_status !== 'All' ? filter_status.toLowerCase() : ''} leave requests found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => set_show_leave_modal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={fetch_leave_requests}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default EmployeeList;