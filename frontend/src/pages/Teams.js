import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

function Teams() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [viewingTeam, setViewingTeam] = useState(null);
  const [formData, setFormData] = useState({
    team_name: "",
    team_head_id: "",
  });
  const [memberFormData, setMemberFormData] = useState({
    emp_id: "",
    role_in_team: "",
    start_date: "",
    end_date: ""
  });

  const [projectFormData, setProjectFormData] = useState({
    project_id: "",
    start_date: "",
    end_date: "",
    role_in_project: ""
  });

  // Check access
  const hasAccess = ['HR', 'manager', 'skip_level_manager'].includes(currentUser?.role);

  useEffect(() => {
    if (!hasAccess) {
      navigate('/');
      return;
    }
    fetchTeams();
    fetchEmployees();
    fetchProjects();
  }, [hasAccess, navigate]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/teams/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/teams/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleView = async (team_id) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/teams/${team_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setViewingTeam(data.data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      alert('Error fetching team details');
    }
  };

  const handleAddNew = () => {
    setEditingTeam(null);
    setFormData({ team_name: "", team_head_id: "", project_id: "" });
    setShowModal(true);
  };

  const handleEdit = (team) => {
  setEditingTeam(team);
  setFormData({
    team_name: team.team_name,
    team_head_id: team.team_head_id || ""
  });
  setShowModal(true);
};

  const handleDelete = async (team_id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/teams/${team_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Team deleted successfully');
        fetchTeams();
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Error deleting team');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token');
      const url = editingTeam 
        ? `${API_BASE_URL}/api/teams/${editingTeam.team_id}`
        : `${API_BASE_URL}/api/teams`;
      
      const response = await fetch(url, {
        method: editingTeam ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_name: formData.team_name,
          team_head_id: formData.team_head_id || null,
        })
      });
      
      if (response.ok) {
        alert(editingTeam ? 'Team updated successfully' : 'Team created successfully');
        setShowModal(false);
        fetchTeams();
      }
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Error saving team');
    }
  };

  const handleAddProjectToTeam = async (e) => {
  e.preventDefault();
  
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(
      `${API_BASE_URL}/api/teams/${viewingTeam.team_id}/projects`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectFormData.project_id,
          start_date: projectFormData.start_date || null,
          end_date: projectFormData.end_date || null,
          role_in_project: projectFormData.role_in_project || null
        })
      }
    );
    
    if (response.ok) {
      alert('Project added to team successfully');
      setShowAddProjectModal(false);
      setProjectFormData({
        project_id: "",
        start_date: "",
        end_date: "",
        role_in_project: ""
      });
      handleView(viewingTeam.team_id);
    } else {
      alert('Error adding project');
    }
  } catch (error) {
    console.error('Error adding project:', error);
    alert('Error adding project');
  }
};

const handleRemoveProjectFromTeam = async (project_id) => {
  if (!window.confirm('Are you sure you want to remove this project from the team?')) return;
  
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(
      `${API_BASE_URL}/api/teams/${viewingTeam.team_id}/projects/${project_id}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (response.ok) {
      alert('Project removed from team successfully');
      handleView(viewingTeam.team_id);
    } else {
      alert('Error removing project');
    }
  } catch (error) {
    console.error('Error removing project:', error);
    alert('Error removing project');
  }
};


  const handleAddMember = () => {
    setMemberFormData({
      emp_id: "",
      role_in_team: "",
      start_date: "",
      end_date: ""
    });
    setShowAddMemberModal(true);
  };

  const handleSubmitMember = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/teams/${viewingTeam.team_id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(memberFormData)
      });
      
      if (response.ok) {
        alert('Team member added successfully');
        setShowAddMemberModal(false);
        handleView(viewingTeam.team_id); // Refresh team details
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Error adding team member');
    }
  };

  const handleRemoveMember = async (emp_id) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/teams/${viewingTeam.team_id}/members/${emp_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Team member removed successfully');
        handleView(viewingTeam.team_id); // Refresh team details
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Error removing team member');
    }
  };

  const filteredTeams = teams.filter(team =>
    team.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.team_head_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasAccess) return null;

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
            <span className="text-primary">Teams</span> Management
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
                <h4 className="fw-bold text-dark mb-0">All Teams</h4>
                <p className="text-muted mb-0 small">
                  Total: {teams.length} teams
                </p>
              </div>
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {['HR', 'skip_level_manager'].includes(currentUser?.role) && (
                    <button 
                      className="btn btn-primary text-nowrap"
                      onClick={handleAddNew}
                    >
                      + Add New
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-semibold">Team ID</th>
                      <th className="fw-semibold">Team Name</th>
                      <th className="fw-semibold">Manager</th>
                      <th className="text-center fw-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.length > 0 ? (
                      filteredTeams.map((team) => (
                        <tr key={team.team_id}>
                          <td className="fw-semibold text-muted">{team.team_id}</td>
                          <td className="fw-semibold text-primary">{team.team_name}</td>
                          <td>
                            {team.team_head_name || 'Not Assigned'}
                            {team.team_head_designation && (
                              <div className="small text-muted">{team.team_head_designation}</div>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-info"
                                onClick={() => handleView(team.team_id)}
                                title="View Details"
                              >
                                View
                              </button>
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => handleEdit(team)}
                                title="Edit Team"
                              >
                                Edit
                              </button>
                              {['HR', 'skip_level_manager'].includes(currentUser?.role) && (
                                <button 
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDelete(team.team_id)}
                                  title="Delete Team"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-5">
                          No teams found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
            style={{ zIndex: 1040, opacity: 0.5 }}
            onClick={() => setShowModal(false)}
          />
          
          <div 
            className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1050, width: "90%", maxWidth: "500px" }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">
                  {editingTeam ? 'Edit Team' : 'Add New Team'}
                </h5>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Team Name *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.team_name}
                      onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Team Manager</label>
                    <select 
                      className="form-select"
                      value={formData.team_head_id}
                      onChange={(e) => setFormData({...formData, team_head_id: e.target.value})}
                    >
                      <option value="">Select Manager</option>
                      {employees.map(emp => (
                        <option key={emp.emp_id} value={emp.emp_id}>
                          {emp.name} {emp.designation ? `- ${emp.designation}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  
                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary flex-fill"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary flex-fill"
                    >
                      {editingTeam ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Modal */}
      {showViewModal && viewingTeam && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
            style={{ zIndex: 1040, opacity: 0.5 }}
            onClick={() => setShowViewModal(false)}
          />
          
          <div 
            className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1050, width: "90%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Team Details</h5>
                <button 
                  className="btn btn-sm btn-light"
                  onClick={() => setShowViewModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="card-body p-4">
                
                {/* Team Info */}
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small text-uppercase fw-semibold">Team ID</label>
                    <div className="fw-bold fs-5 text-primary">#{viewingTeam.team_id}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small text-uppercase fw-semibold">Team Name</label>
                    <div className="fw-bold fs-5">{viewingTeam.team_name}</div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small text-uppercase fw-semibold">Team Manager</label>
                    <div className="fw-semibold">
                      {viewingTeam.team_head_name || 'Not Assigned'}
                      {viewingTeam.team_head_designation && (
                        <div className="small text-muted">{viewingTeam.team_head_designation}</div>
                      )}
                      {viewingTeam.team_head_email && (
                        <div className="small text-muted">{viewingTeam.team_head_email}</div>
                      )}
                      {viewingTeam.team_head_contact && (
                        <div className="small text-muted">📞 {viewingTeam.team_head_contact}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small text-uppercase fw-semibold">Department</label>
                    <div className="fw-semibold">
                      {viewingTeam.department_name ? (
                        <span className="badge bg-light text-dark border px-3 py-2">
                          {viewingTeam.department_name}
                        </span>
                      ) : (
                        'Not Assigned'
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Projects Section */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">
                      📊 Assigned Projects ({viewingTeam.projects?.length || 0})
                    </h6>
                    {['HR', 'skip_level_manager'].includes(currentUser?.role) && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => setShowAddProjectModal(true)}
                      >
                        + Add Project
                      </button>
                    )}
                  </div>
                  
                  {viewingTeam.projects && viewingTeam.projects.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Project Name</th>
                            <th>Code</th>
                            <th>Status</th>
                            <th>Client</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Role</th>
                            {['HR', 'skip_level_manager'].includes(currentUser?.role) && (
                              <th className="text-center">Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {viewingTeam.projects.map((project, idx) => (
                            <tr key={idx}>
                              <td className="fw-semibold">{project.project_name}</td>
                              <td className="small">{project.project_code || 'N/A'}</td>
                              <td>
                                <span className={`badge bg-${
                                  project.project_status === 'Ongoing' ? 'success' :
                                  project.project_status === 'Planned' ? 'info' :
                                  project.project_status === 'Completed' ? 'secondary' : 'warning'
                                }`}>
                                  {project.project_status}
                                </span>
                              </td>
                              <td className="small">{project.client_name || 'N/A'}</td>
                              <td className="small">
                                {project.assignment_start_date 
                                  ? new Date(project.assignment_start_date).toLocaleDateString() 
                                  : 'N/A'}
                              </td>
                              <td className="small">
                                {project.assignment_end_date 
                                  ? new Date(project.assignment_end_date).toLocaleDateString() 
                                  : 'Ongoing'}
                              </td>
                              <td className="small">{project.role_in_project || 'N/A'}</td>
                              {['HR', 'skip_level_manager'].includes(currentUser?.role) && (
                                <td className="text-center">
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveProjectFromTeam(project.project_id)}
                                    title="Remove Project"
                                  >
                                    Remove
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4 border rounded bg-light">
                      <p className="mb-0">No projects assigned yet</p>
                    </div>
                  )}
                </div>

                {/* Team Members */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">
                      Team Members ({viewingTeam.members?.length || 0})
                    </h6>
                    {['HR', 'skip_level_manager'].includes(currentUser?.role) && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={handleAddMember}
                      >
                        + Add Member
                      </button>
                    )}
                  </div>
                  
                  {viewingTeam.members && viewingTeam.members.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Name</th>
                            <th>Designation</th>
                            <th>Department</th>
                            <th>Role in Team</th>
                            <th className="text-center">Status</th>
                            <th>Duration</th>
                            {['HR', 'skip_level_manager'].includes(currentUser?.role) && (
                              <th className="text-center">Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {viewingTeam.members.map((member, idx) => (
                            <tr key={idx}>
                              <td>
                                <div className="fw-semibold">{member.member_name}</div>
                                <div className="small text-muted">{member.member_email}</div>
                                {member.contact1 && (
                                  <div className="small text-muted">📞 {member.contact1}</div>
                                )}
                              </td>
                              <td>{member.designation || 'N/A'}</td>
                              <td>
                                {member.department_name ? (
                                  <span className="badge bg-light text-dark border">
                                    {member.department_name}
                                  </span>
                                ) : 'N/A'}
                              </td>
                              <td>{member.role_in_team || 'N/A'}</td>
                              <td className="text-center">
                                <span className={`badge bg-${member.is_active ? 'success' : 'secondary'}`}>
                                  {member.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="small">
                                {member.start_date ? new Date(member.start_date).toLocaleDateString() : 'N/A'}
                                {member.end_date && ` - ${new Date(member.end_date).toLocaleDateString()}`}
                              </td>
                              {['HR', 'skip_level_manager'].includes(currentUser?.role) && (
                                <td className="text-center">
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveMember(member.emp_id)}
                                    title="Remove Member"
                                  >
                                    Remove
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4 border rounded bg-light">
                      <p className="mb-0">No team members added yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
            style={{ zIndex: 1060, opacity: 0.5 }}
            onClick={() => setShowAddMemberModal(false)}
          />
          
          <div 
            className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1070, width: "90%", maxWidth: "500px" }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Add Team Member</h5>
                
                <form onSubmit={handleSubmitMember}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Employee *</label>
                    <select 
                      className="form-select"
                      value={memberFormData.emp_id}
                      onChange={(e) => setMemberFormData({...memberFormData, emp_id: e.target.value})}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.emp_id} value={emp.emp_id}>
                          {emp.name} - {emp.designation || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Role in Team</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g., Developer, Designer, QA"
                      value={memberFormData.role_in_team}
                      onChange={(e) => setMemberFormData({...memberFormData, role_in_team: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Start Date</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={memberFormData.start_date}
                      onChange={(e) => setMemberFormData({...memberFormData, start_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">End Date (Optional)</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={memberFormData.end_date}
                      onChange={(e) => setMemberFormData({...memberFormData, end_date: e.target.value})}
                    />
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary flex-fill"
                      onClick={() => setShowAddMemberModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary flex-fill"
                    >
                      Add Member
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

    {/* Add Project Modal */}
      {showAddProjectModal && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
            style={{ zIndex: 1060, opacity: 0.5 }}
            onClick={() => setShowAddProjectModal(false)}
          />
          
          <div 
            className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1070, width: "90%", maxWidth: "500px" }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">Assign Project to Team</h5>
                
                <form onSubmit={handleAddProjectToTeam}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Project *</label>
                    <select 
                      className="form-select"
                      value={projectFormData.project_id}
                      onChange={(e) => setProjectFormData({
                        ...projectFormData, 
                        project_id: e.target.value
                      })}
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map(proj => (
                        <option key={proj.project_id} value={proj.project_id}>
                          {proj.project_name} ({proj.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Role in Project</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g., Development Team, Support Team"
                      value={projectFormData.role_in_project}
                      onChange={(e) => setProjectFormData({
                        ...projectFormData, 
                        role_in_project: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assignment Start Date</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={projectFormData.start_date}
                      onChange={(e) => setProjectFormData({
                        ...projectFormData, 
                        start_date: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assignment End Date (Optional)</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={projectFormData.end_date}
                      onChange={(e) => setProjectFormData({
                        ...projectFormData, 
                        end_date: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary flex-fill"
                      onClick={() => setShowAddProjectModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary flex-fill"
                    >
                      Add Project to Team
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

export default Teams;