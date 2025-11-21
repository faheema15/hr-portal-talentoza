// frontend/src/pages/Departments.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

function Departments() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [departments, setDepartments] = useState([]);
  const [potentialHeads, setPotentialHeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    dept_name: "",
    head_id: ""
  });

  // Check access
  const hasAccess = ['HR', 'SkipManager'].includes(currentUser?.role);

  useEffect(() => {
    if (!hasAccess) {
      navigate('/');
      return;
    }
    fetchDepartments();
    fetchPotentialHeads();
  }, [hasAccess, navigate]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPotentialHeads = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/departments/potential-heads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPotentialHeads(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching potential heads:', error);
    }
  };

  const handleAddNew = () => {
    setEditingDept(null);
    setFormData({ dept_name: "", head_id: "" });
    setShowModal(true);
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      dept_name: dept.dept_name,
      head_id: dept.head_id || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Department deleted successfully');
        fetchDepartments();
      } else {
        alert(result.message || 'Error deleting department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error deleting department');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token');
      const url = editingDept 
        ? `${API_BASE_URL}/api/departments/${editingDept.dept_id}`
        : `${API_BASE_URL}/api/departments `;
      
      const response = await fetch(url, {
        method: editingDept ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dept_name: formData.dept_name,
          head_id: formData.head_id || null
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(editingDept ? 'Department updated successfully' : 'Department created successfully');
        setShowModal(false);
        fetchDepartments();
      } else {
        alert(result.message || 'Error saving department');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Error saving department');
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.dept_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.head_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <span className="text-primary">Departments</span> Management
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
                <h4 className="fw-bold text-dark mb-0">All Departments</h4>
                <p className="text-muted mb-0 small">
                  Total: {departments.length} departments
                </p>
              </div>
              <div className="col-md-6">
                <div className="d-flex gap-2">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search departments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {currentUser?.role === 'HR' && (
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
                      <th className="fw-semibold">Dept ID</th>
                      <th className="fw-semibold">Department Name</th>
                      <th className="fw-semibold">Department Head</th>
                      <th className="text-center fw-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.length > 0 ? (
                      filteredDepartments.map((dept) => (
                        <tr key={dept.dept_id}>
                          <td className="text-muted">{dept.dept_id}</td>
                          <td className="fw-semibold text-primary">{dept.dept_name}</td>
                          <td>{dept.head_name || 'Not Assigned'}</td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => handleEdit(dept)}
                              >
                                Edit
                              </button>
                              {currentUser?.role === 'HR' && (
                                <button 
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDelete(dept.dept_id)}
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
                          No departments found
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
            style={{ zIndex: 1050, width: "90%", maxWidth: "500px" }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">
                  {editingDept ? 'Edit Department' : 'Add New Department'}
                </h5>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Department Name *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={formData.dept_name}
                      onChange={(e) => setFormData({...formData, dept_name: e.target.value})}
                      required
                      placeholder="Enter department name"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Department Head</label>
                    <select 
                      className="form-select"
                      value={formData.head_id}
                      onChange={(e) => setFormData({...formData, head_id: e.target.value})}
                    >
                      <option value="">-- Select Department Head --</option>
                      {potentialHeads.map(user => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.user_name} ({user.role})
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Optional: Select a manager or HR to lead this department</small>
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
                      {editingDept ? 'Update' : 'Create'}
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

export default Departments;