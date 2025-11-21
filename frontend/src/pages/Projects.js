// frontend/src/pages/Projects.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

function Projects() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [potentialManagers, setPotentialManagers] = useState([]);
  const [formData, setFormData] = useState({
    project_name: "",
    start_date: "",
    end_date: "",
    status: "Planned",
    manager_id: ""
  });

  // Access control checks
  const hasAccess = ['HR', 'SkipManager', 'Manager', 'Employee'].includes(currentUser?.role);
  const canCreate = ['HR', 'SkipManager'].includes(currentUser?.role);
  const canEdit = ['HR', 'SkipManager', 'Manager'].includes(currentUser?.role);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPotentialManagers = async () => {
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
  };

  useEffect(() => {
    if (!hasAccess) {
      navigate('/');
      return;
    }
    fetchProjects();
    if (canCreate) {
      fetchPotentialManagers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddNew = () => {
    setEditingProject(null);
    setFormData({
      project_name: "",
      start_date: "",
      end_date: "",
      status: "Planned",
      manager_id: ""
    });
    setShowModal(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      project_name: project.project_name,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      status: project.status,
      manager_id: project.project_head_id || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also remove all employee assignments.')) {
      return;
    }
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Project deleted successfully');
        fetchProjects();
      } else {
        alert(result.message || 'Error deleting project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token');
      const url = editingProject 
        ? `${API_BASE_URL}/api/projects/${editingProject.project_id}`
        : `${API_BASE_URL}/api/projects`;
      
      const response = await fetch(url, {
        method: editingProject ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_name: formData.project_name,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          status: formData.status,
          manager_id: formData.manager_id || null
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(editingProject ? 'Project updated successfully' : 'Project created successfully');
        setShowModal(false);
        fetchProjects();
      } else {
        alert(result.message || 'Error saving project');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project');
    }
  };

  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
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

  const filteredProjects = projects.filter(project =>
    project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.project_head_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <span className="text-primary">Projects</span> Management
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
                <h4 className="fw-bold text-dark mb-0">All Projects</h4>
                <p className="text-muted mb-0 small">
                  Total: {projects.length} projects
                </p>
              </div>
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {canCreate && (
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
                      <th className="fw-semibold">Project ID</th>
                      <th className="fw-semibold">Project Name</th>
                      <th className="fw-semibold">Project Head</th>
                      <th className="fw-semibold">Status</th>
                      <th className="text-center fw-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => (
                        <tr key={project.project_id}>
                          <td className="text-muted">{project.project_id}</td>
                          <td className="fw-semibold text-primary">{project.project_name}</td>
                          <td>{project.project_head_name || 'Not Assigned'}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-info"
                                onClick={() => handleViewProject(project.project_id)}
                              >
                                View
                              </button>
                              {canEdit && (
                                <button 
                                  className="btn btn-outline-primary"
                                  onClick={() => handleEdit(project)}
                                >
                                  Edit
                                </button>
                              )}
                              {currentUser?.role === 'HR' && (
                                <button 
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDelete(project.project_id)}
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
                        <td colSpan="5" className="text-center text-muted py-5">
                          No projects found
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

      {/* Modal */}
      {showModal && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
            style={{ zIndex: 1040, opacity: 0.5 }}
            onClick={() => setShowModal(false)}
          />
          
          <div 
            className="position-fixed top-50 start-50 translate-middle"
            style={{ zIndex: 1050, width: "90%", maxWidth: "600px" }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h5>
                
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-semibold">Project Name *</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={formData.project_name}
                        onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                        required
                        placeholder="Enter project name"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Start Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">End Date</label>
                      <input 
                        type="date" 
                        className="form-control"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Status *</label>
                      <select 
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        required
                      >
                        <option value="Planned">Planned</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Project Head</label>
                      <select 
                        className="form-select"
                        value={formData.manager_id}
                        onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                      >
                        <option value="">-- Select Project Head --</option>
                        {potentialManagers.map(manager => (
                          <option key={manager.user_id} value={manager.user_id}>
                            {manager.user_name} ({manager.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2 mt-3">
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
                      {editingProject ? 'Update' : 'Create'}
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

export default Projects;