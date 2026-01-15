// frontend/src/pages/ProjectDetail.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = getCurrentUser();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [potentialManagers, setPotentialManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [assignData, setAssignData] = useState({
    emp_id: "",
    role_in_project: "",
    start_date: "",
    end_date: "",
    allocation_percent: ""
  });
  const [editData, setEditData] = useState({
    project_name: "",
    project_code: "",
    description: "",
    client_name: "",
    client_contact: "",
    start_date: "",
    end_date: "",
    budget: "",
    actual_cost: "",
    status: "",
    priority: "",
    manager_id: "",
    technologies: "",
    remarks: ""
  });

  const canAssign = ['HR', 'SkipManager', 'Manager'].includes(currentUser?.role);
  const canEdit = ['HR', 'SkipManager', 'Manager'].includes(currentUser?.role);

    const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProject(data.data);
        setMembers(data.data.members || []);
      } else {
        const error = await response.json();
        alert(error.message || 'Error fetching project details');
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      alert('Error fetching project details');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchEmployees = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/projects/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  const fetchPotentialManagers = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/projects/potential-managers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPotentialManagers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching potential managers:', error);
    }
  }, []);
  
  useEffect(() => {
  fetchProjectDetails();
  if (canAssign) {
    fetchEmployees();
    fetchPotentialManagers();
  }
}, [id, canAssign, fetchProjectDetails, fetchEmployees, fetchPotentialManagers]);


  const handleEditProject = () => {
    setEditData({
      project_name: project.project_name || "",
      project_code: project.project_code || "",
      description: project.description || "",
      client_name: project.client_name || "",
      client_contact: project.client_contact || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      budget: project.budget || "",
      actual_cost: project.actual_cost || "",
      status: project.status || "Planned",
      priority: project.priority || "Medium",
      manager_id: project.project_head_id || "",
      technologies: project.technologies || "",
      remarks: project.remarks || ""
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_name: editData.project_name,
          project_code: editData.project_code || null,
          description: editData.description || null,
          client_name: editData.client_name || null,
          client_contact: editData.client_contact || null,
          start_date: editData.start_date || null,
          end_date: editData.end_date || null,
          budget: editData.budget ? parseFloat(editData.budget) : null,
          actual_cost: editData.actual_cost ? parseFloat(editData.actual_cost) : null,
          status: editData.status,
          priority: editData.priority,
          manager_id: editData.manager_id || null,
          technologies: editData.technologies || null,
          remarks: editData.remarks || null
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Project updated successfully');
        setShowEditModal(false);
        fetchProjectDetails();
      } else {
        alert(result.message || 'Error updating project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    }
  };

  const handleAssignEmployee = () => {
    setAssignData({
      emp_id: "",
      role_in_project: "",
      start_date: project?.start_date || "",
      end_date: project?.end_date || "",
      allocation_percent: ""
    });
    setShowAssignModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/projects/assign-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: parseInt(id),
          emp_id: parseInt(assignData.emp_id),
          role_in_project: assignData.role_in_project || null,
          start_date: assignData.start_date || null,
          end_date: assignData.end_date || null,
          allocation_percent: assignData.allocation_percent ? parseFloat(assignData.allocation_percent) : null
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Employee assigned successfully');
        setShowAssignModal(false);
        fetchProjectDetails();
      } else {
        alert(result.message || 'Error assigning employee');
      }
    } catch (error) {
      console.error('Error assigning employee:', error);
      alert('Error assigning employee');
    }
  };

  const handleRemoveMember = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this employee from the project?')) {
      return;
    }
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/projects/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Employee removed successfully');
        fetchProjectDetails();
      } else {
        alert(result.message || 'Error removing employee');
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      alert('Error removing employee');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Planned': return 'bg-secondary';
      case 'Ongoing': return 'bg-primary';
      case 'Completed': return 'bg-success';
      case 'On Hold': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High': return 'bg-danger';
      case 'Medium': return 'bg-warning text-dark';
      case 'Low': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container-fluid px-4">
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate("/projects")}
          >
            ← Back to Projects
          </button>
          <span className="navbar-brand mb-0 h1 fw-bold">
            <span className="text-primary">Project</span> Details
          </span>
          <div style={{ width: "120px" }}></div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-5">
        {/* Project Information Card */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h4 className="fw-bold text-dark mb-1">{project.project_name}</h4>
                <p className="text-muted mb-0">
                  {project.project_code ? `Project Code: ${project.project_code} | ` : ''}
                  Project ID: {project.project_id}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <span className={`badge ${getStatusBadgeClass(project.status)} fs-6`}>
                  {project.status}
                </span>
                {project.priority && (
                  <span className={`badge ${getPriorityBadgeClass(project.priority)} fs-6`}>
                    {project.priority} Priority
                  </span>
                )}
                {canEdit && (
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleEditProject}
                  >
                    Edit Project
                  </button>
                )}
              </div>
            </div>

            {project.description && (
              <div className="mb-4">
                <label className="text-muted small mb-1">Description</label>
                <p className="mb-0">{project.description}</p>
              </div>
            )}

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="text-muted small mb-1">Project Head</label>
                <p className="fw-semibold mb-0">{project.project_head_name || 'Not Assigned'}</p>
              </div>
              
              {project.client_name && (
                <div className="col-md-6 mb-3">
                  <label className="text-muted small mb-1">Client Name</label>
                  <p className="fw-semibold mb-0">{project.client_name}</p>
                </div>
              )}
              
              {project.client_contact && (
                <div className="col-md-6 mb-3">
                  <label className="text-muted small mb-1">Client Contact</label>
                  <p className="fw-semibold mb-0">{project.client_contact}</p>
                </div>
              )}
              
              <div className="col-md-3 mb-3">
                <label className="text-muted small mb-1">Start Date</label>
                <p className="fw-semibold mb-0">{formatDate(project.start_date)}</p>
              </div>
              
              <div className="col-md-3 mb-3">
                <label className="text-muted small mb-1">End Date</label>
                <p className="fw-semibold mb-0">{formatDate(project.end_date)}</p>
              </div>
              
              {project.budget && (
                <div className="col-md-3 mb-3">
                  <label className="text-muted small mb-1">Budget</label>
                  <p className="fw-semibold mb-0">{formatCurrency(project.budget)}</p>
                </div>
              )}
              
              {project.actual_cost && (
                <div className="col-md-3 mb-3">
                  <label className="text-muted small mb-1">Actual Cost</label>
                  <p className="fw-semibold mb-0">{formatCurrency(project.actual_cost)}</p>
                </div>
              )}
              
              {project.technologies && (
                <div className="col-md-12 mb-3">
                  <label className="text-muted small mb-1">Technologies</label>
                  <p className="mb-0">{project.technologies}</p>
                </div>
              )}
              
              {project.remarks && (
                <div className="col-md-12 mb-3">
                  <label className="text-muted small mb-1">Remarks</label>
                  <p className="mb-0">{project.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Members Card */}
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold text-dark mb-0">Team Members</h5>
                <p className="text-muted mb-0 small">
                  Total: {members.length} members
                </p>
              </div>
              {canAssign && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleAssignEmployee}
                >
                  + Add Member
                </button>
              )}
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="fw-semibold">Employee Name</th>
                    <th className="fw-semibold">Designation</th>
                    <th className="fw-semibold">Role in Project</th>
                    <th className="fw-semibold">Allocation %</th>
                    <th className="fw-semibold">Duration</th>
                    {canAssign && <th className="text-center fw-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.length > 0 ? (
                    members.map((member) => (
                      <tr key={member.assignment_id}>
                        <td className="fw-semibold">{member.employee_name}</td>
                        <td>{member.designation || '-'}</td>
                        <td>{member.role_in_project || '-'}</td>
                        <td>{member.allocation_percent ? `${member.allocation_percent}%` : '-'}</td>
                        <td className="small">
                          {formatDate(member.start_date)} - {formatDate(member.end_date)}
                        </td>
                        {canAssign && (
                          <td className="text-center">
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleRemoveMember(member.assignment_id)}
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canAssign ? "6" : "5"} className="text-center text-muted py-5">
                        No team members assigned yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
            style={{ zIndex: 1040, opacity: 0.5 }}
            onClick={() => setShowEditModal(false)}
          />
          
          <div 
            className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1050, width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Edit Project Details</h5>
                
                <form onSubmit={handleSubmitEdit}>
                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <label className="form-label fw-semibold">Project Name *</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={editData.project_name}
                        onChange={(e) => setEditData({...editData, project_name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Project Code</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={editData.project_code}
                        onChange={(e) => setEditData({...editData, project_code: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea 
                        className="form-control"
                        rows="3"
                        value={editData.description}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Client Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={editData.client_name}
                        onChange={(e) => setEditData({...editData, client_name: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Client Contact</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={editData.client_contact}
                        onChange={(e) => setEditData({...editData, client_contact: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Status *</label>
                      <select 
                        className="form-select"
                        value={editData.status}
                        onChange={(e) => setEditData({...editData, status: e.target.value})}
                        required
                      >
                        <option value="Planned">Planned</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Priority</label>
                      <select 
                        className="form-select"
                        value={editData.priority}
                        onChange={(e) => setEditData({...editData, priority: e.target.value})}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Project Head</label>
                      <select 
                        className="form-select"
                        value={editData.manager_id}
                        onChange={(e) => setEditData({...editData, manager_id: e.target.value})}
                      >
                        <option value="">-- Select --</option>
                        {potentialManagers.map(manager => (
                          <option key={manager.user_id} value={manager.user_id}>
                            {manager.user_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label className="form-label fw-semibold">Start Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={editData.start_date}
                        onChange={(e) => setEditData({...editData, start_date: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label className="form-label fw-semibold">End Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={editData.end_date}
                        onChange={(e) => setEditData({...editData, end_date: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label className="form-label fw-semibold">Budget (₹)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={editData.budget}
                        onChange={(e) => setEditData({...editData, budget: e.target.value})}
                        step="0.01"
                      />
                    </div>
                    
                    <div className="col-md-3 mb-3">
                      <label className="form-label fw-semibold">Actual Cost (₹)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={editData.actual_cost}
                        onChange={(e) => setEditData({...editData, actual_cost: e.target.value})}
                        step="0.01"
                      />
                    </div>
                    
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-semibold">Technologies</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={editData.technologies}
                        onChange={(e) => setEditData({...editData, technologies: e.target.value})}
                        placeholder="e.g., React, Node.js, PostgreSQL"
                      />
                    </div>
                    
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-semibold">Remarks</label>
                      <textarea 
                        className="form-control"
                        rows="2"
                        value={editData.remarks}
                        onChange={(e) => setEditData({...editData, remarks: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2 mt-3">
                    <button 
                      type="button" 
                      className="btn btn-secondary flex-fill"
                      onClick={() => setShowEditModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary flex-fill"
                    >
                      Update Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Employee Modal */}
      {showAssignModal && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
            style={{ zIndex: 1040, opacity: 0.5 }}
            onClick={() => setShowAssignModal(false)}
          />
          
          <div 
            className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1050, width: "90%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Assign Employee to Project</h5>
                
                <form onSubmit={handleSubmitAssignment}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Select Employee *</label>
                    <select 
                      className="form-select"
                      value={assignData.emp_id}
                      onChange={(e) => setAssignData({...assignData, emp_id: e.target.value})}
                      required
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.emp_id} value={emp.emp_id}>
                          {emp.employee_name} - {emp.designation || 'N/A'} ({emp.department_name || 'No Dept'})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Role in Project</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={assignData.role_in_project}
                      onChange={(e) => setAssignData({...assignData, role_in_project: e.target.value})}
                      placeholder="e.g., Developer, Tester, Lead"
                    />
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Start Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={assignData.start_date}
                        onChange={(e) => setAssignData({...assignData, start_date: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">End Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={assignData.end_date}
                        onChange={(e) => setAssignData({...assignData, end_date: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Allocation Percentage</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={assignData.allocation_percent}
                      onChange={(e) => setAssignData({...assignData, allocation_percent: e.target.value})}
                      placeholder="e.g., 100"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <small className="text-muted">Enter percentage of time allocated to this project (0-100)</small>
                  </div>
                  
                  <div className="d-flex gap-2 mt-4">
                    <button 
                      type="button" 
                      className="btn btn-secondary flex-fill"
                      onClick={() => setShowAssignModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary flex-fill"
                    >
                      Assign Employee
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProjectDetail;