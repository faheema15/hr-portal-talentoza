import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function JoiningDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNewEmployee = id === "new";
  const INITIAL_PHOTO = "https://via.placeholder.com/150/cccccc/666666?text=Upload+Photo";

  const [formData, setFormData] = useState({
    empId: "",
    fullName: "",
    contact1: "",
    contact2: "",
    email1: "",
    email2: "",
    dateOfJoining: "",
    designation: "",
    department: "",
    reportingManagerName: "",
    project: ""
  });

  const [previousEmployments, setPreviousEmployments] = useState([
    {
      id: 1,
      companyName: "",
      startDate: "",
      endDate: "",
      designation: "",
      offerLetter: "",
      releavingLetter: "",
      paySlips: ""
    }
  ]);

  const [originalData, setOriginalData] = useState(formData);
  const [originalEmployments, setOriginalEmployments] = useState(previousEmployments);
  const [hasChanges, setHasChanges] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(INITIAL_PHOTO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = getCurrentUser();
  const isHR = currentUser?.role === 'HR';

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

  useEffect(() => {
    const dataChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
    const employmentsChanged = JSON.stringify(previousEmployments) !== JSON.stringify(originalEmployments);
    setHasChanges(dataChanged || employmentsChanged);
  }, [formData, originalData, previousEmployments, originalEmployments]);

  useEffect(() => {
    const fetchData = async () => {
      const empIdToFetch = id !== "new" ? id : currentUser?.emp_id;
      
      if (!empIdToFetch || empIdToFetch === "new") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        
        if (!token) {
          setError('Session expired. Please login again.');
          setLoading(false);
          return;
        }

        const joiningRes = await fetch(`${API_BASE_URL}/api/joining-details/${empIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!joiningRes.ok) {
          throw new Error('Failed to fetch joining details');
        }

        const joiningData = await joiningRes.json();
        const data = joiningData.data;
        
        const transformedData = {
          photo: data.photo 
          ? (data.photo.startsWith('http') ? data.photo : `${API_BASE_URL}${data.photo}`)
          : INITIAL_PHOTO,
          empId: data.empId || "",
          fullName: data.fullName || "",
          contact1: data.contact1 || "",
          contact2: data.contact2 || "",
          email1: data.email1 || "",
          email2: data.email2 || "",
          designation: data.designation || "",
          department: data.department || "",
          departmentId: data.departmentId || "",
          reportingManagerId: data.reportingManagerId || "",
          reportingManagerName: data.reportingManagerName || "Not Assigned",
          dateOfJoining: formatDateForInput(data.dateOfJoining) || "",
          project: data.project || ""
        };

        const loadedEmployments = data.previousEmployments || [];
        if (loadedEmployments.length > 0) {
          setPreviousEmployments(loadedEmployments.map((emp, index) => ({
            id: emp.id || index + 1,
            companyName: emp.companyName || "",
            startDate: formatDateForInput(emp.startDate) || "",
            endDate: formatDateForInput(emp.endDate) || "",
            designation: emp.designation || "",
            offerLetter: emp.offerLetter || "",
            releavingLetter: emp.releavingLetter || "",
            paySlips: emp.paySlips || ""
          })));
        }
        
        setFormData(transformedData);
        setOriginalData(transformedData);
        setPhotoPreview(transformedData.photo);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser?.emp_id]);

  const handleViewDocument = (url) => {
    if (url) {
      // Handle both relative and absolute URLs
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}/${url.startsWith('/') ? url.substring(1) : url}`;
      window.open(fullUrl, '_blank');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmploymentChange = (id, field, value) => {
    setPreviousEmployments(prev =>
      prev.map(emp => emp.id === id ? { ...emp, [field]: value } : emp)
    );
  };

  const addEmployment = () => {
    const newId = Math.max(...previousEmployments.map(e => e.id), 0) + 1;
    setPreviousEmployments(prev => [
      ...prev,
      {
        id: newId,
        companyName: "",
        startDate: "",
        endDate: "",
        designation: "",
        offerLetter: "",
        releavingLetter: "",
        paySlips: ""
      }
    ]);
  };

  const removeEmployment = (id) => {
    if (previousEmployments.length === 1) {
      alert("At least one employment entry is required.");
      return;
    }
    setPreviousEmployments(prev => prev.filter(emp => emp.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges) {
      alert("No changes to save!");
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        alert("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      const dataToSend = {
        ...formData,
        previousEmployments: previousEmployments.map(({ id, ...rest }) => rest)
      };

      const url = isNewEmployee 
        ? `${API_BASE_URL}/api/joining-details`
        : `${API_BASE_URL}/api/joining-details/${id}`;
      
      const method = isNewEmployee ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (result.success) {
        setOriginalData(formData);
        setOriginalEmployments(previousEmployments);
        setHasChanges(false);
        alert(result.message);
      } else {
        alert(result.message || "Error saving joining details!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving joining details!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (confirmCancel) {
        setFormData(originalData);
        setPreviousEmployments(originalEmployments);
        setPhotoPreview(originalData.photo);
        navigate("/joining-details");
      }
    } else {
      navigate("/joining-details");
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading joining details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 bg-light">
        <nav className="navbar navbar-dark bg-dark shadow-sm">
          <div className="container-fluid px-4">
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
            <span className="navbar-brand mb-0 h1 fw-bold">
              <span className="text-primary">Joining</span> Details
            </span>
            <div style={{ width: "120px" }}></div>
          </div>
        </nav>
        <div className="container py-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-5 text-center">
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle-fill fs-1 d-block mb-3"></i>
                <h5>Error Loading Data</h5>
                <p>{error}</p>
                <button 
                  className="btn btn-primary mt-3"
                  onClick={() => navigate("/joining-details")}
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container-fluid px-4">
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <span className="navbar-brand mb-0 h1 fw-bold">
            <span className="text-primary">Joining</span> Details
          </span>
          <div style={{ width: "120px" }}></div>
        </div>
      </nav>

      <div className="container py-5">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              
              {/* PHOTO SECTION */}
              <div className="row mb-5">
                <div className="col-12 text-center mb-4">
                  <img 
                    src={photoPreview} 
                    alt="Employee" 
                    className="img-thumbnail rounded-circle"
                    style={{ width: "200px", height: "250px", objectFit: "cover", borderRadius: "20px" }}
                  />
                </div>
              </div>

              {/* BASIC INFO - PREFILLED */}
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <h5 className="fw-bold text-primary mb-4">Basic Information</h5>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Employee ID</label>
                  <input 
                    type="text" 
                    className="form-control bg-light fw-bold"
                    value={formData.empId}
                    disabled 
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Employee Name</label>
                  <input 
                    type="text" 
                    className="form-control bg-light"
                    value={formData.fullName}
                    disabled
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Designation</label>
                  <input 
                    type="text" 
                    className="form-control bg-light"
                    value={formData.designation}
                    disabled
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Department</label>
                  <input 
                    type="text" 
                    className="form-control bg-light"
                    value={formData.department}
                    disabled
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Reporting Manager</label>
                  <input 
                    type="text" 
                    className="form-control bg-light"
                    value={formData.reportingManagerName}
                    disabled
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Primary Contact</label>
                  <input 
                    type="tel" 
                    className="form-control bg-light"
                    value={formData.contact1}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Secondary Contact</label>
                  <input 
                    type="tel" 
                    className="form-control bg-light"
                    value={formData.contact2}
                    disabled
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Primary Email</label>
                  <input 
                    type="email" 
                    className="form-control bg-light"
                    value={formData.email1}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Secondary Email</label>
                  <input 
                    type="email" 
                    className="form-control bg-light"
                    value={formData.email2}
                    disabled
                  />
                </div>
              </div>

              {/* JOINING INFO */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Joining Information</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Date of Joining</label>
                  <input 
                    type="date" 
                    className="form-control"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* PREVIOUS EMPLOYMENT WITH FILE UPLOADS */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-primary mb-0">Previous Employment</h5>
                    <button 
                      type="button" 
                      className="btn btn-outline-primary btn-sm"
                      onClick={addEmployment}
                      disabled={!isHR}
                    >
                      + Add Another Company
                    </button>
                  </div>
                </div>
                
                {previousEmployments.map((employment, index) => (
                  <div key={employment.id} className="col-12">
                    <div className="card mb-3 border">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <label className="form-label fw-semibold text-secondary mb-0">
                            Company {index + 1}
                          </label>
                          {previousEmployments.length > 1 && (
                            <button 
                              type="button" 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeEmployment(employment.id)}
                              disabled={!isHR}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        <div className="row g-3">
                          <div className="col-md-12">
                            <label className="form-label">Company Name</label>
                            <input 
                              type="text" 
                              className="form-control"
                              value={employment.companyName}
                              onChange={(e) => handleEmploymentChange(employment.id, 'companyName', e.target.value)}
                              placeholder="Previous Company Name"
                              disabled={!isHR}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Start Date</label>
                            <input 
                              type="date" 
                              className="form-control"
                              value={employment.startDate}
                              onChange={(e) => handleEmploymentChange(employment.id, 'startDate', e.target.value)}
                              disabled={!isHR}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">End Date</label>
                            <input 
                              type="date" 
                              className="form-control"
                              value={employment.endDate}
                              onChange={(e) => handleEmploymentChange(employment.id, 'endDate', e.target.value)}
                              disabled={!isHR}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Designation</label>
                            <input 
                              type="text" 
                              className="form-control"
                              value={employment.designation}
                              onChange={(e) => handleEmploymentChange(employment.id, 'designation', e.target.value)}
                              placeholder="Designation"
                              disabled={!isHR}
                            />
                          </div>
                          
                          {/* FILE UPLOAD - OFFER LETTER */}
                          <div className="col-md-4">
                            <label className="form-label">Offer Letter</label>
                            <input 
                              type="file"
                              className="form-control"
                              accept=".pdf,.doc,.docx"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  // Validate file size
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert('File size must be less than 5MB');
                                    return;
                                  }
                                  
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('fieldName', 'offer_letter');

                                    const token = sessionStorage.getItem('token');
                                    const response = await fetch(`${API_BASE_URL}/api/upload/document`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${token}`
                                      },
                                      body: formData
                                    });

                                    if (response.ok) {
                                      const result = await response.json();
                                      handleEmploymentChange(employment.id, 'offerLetter', result.data.file_url);
                                    } else {
                                      const errorData = await response.json();
                                      alert(`Error uploading file: ${errorData.message}`);
                                    }
                                  } catch (error) {
                                    console.error('Error uploading file:', error);
                                    alert('Error uploading file. Please try again.');
                                  }
                                }
                              }}
                              disabled={!isHR}
                            />
                            <small className="text-muted">Upload PDF or DOC (Max 5MB)</small>
                            {employment.offerLetter && (
                              <button 
                                type="button"
                                className="btn btn-sm btn-outline-primary mt-2"
                                onClick={() => handleViewDocument(employment.offerLetter)}
                              >
                                <i className="bi bi-eye me-1"></i> View Offer Letter
                              </button>
                            )}
                          </div>
                          
                          {/* FILE UPLOAD - RELIEVING LETTER */}
                          <div className="col-md-4">
                            <label className="form-label">Relieving Letter</label>
                            <input 
                              type="file"
                              className="form-control"
                              accept=".pdf,.doc,.docx"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  // Validate file size
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert('File size must be less than 5MB');
                                    return;
                                  }
                                  
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('fieldName', 'relieving_letter');

                                    const token = sessionStorage.getItem('token');
                                    const response = await fetch(`${API_BASE_URL}/api/upload/document`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${token}`
                                      },
                                      body: formData
                                    });

                                    if (response.ok) {
                                      const result = await response.json();
                                      handleEmploymentChange(employment.id, 'releavingLetter', result.data.file_url);
                                    } else {
                                      const errorData = await response.json();
                                      alert(`Error uploading file: ${errorData.message}`);
                                    }
                                  } catch (error) {
                                    console.error('Error uploading file:', error);
                                    alert('Error uploading file. Please try again.');
                                  }
                                }
                              }}
                              disabled={!isHR}
                            />
                            <small className="text-muted">Upload PDF or DOC (Max 5MB)</small>
                            {employment.releavingLetter && (
                              <button 
                                type="button"
                                className="btn btn-sm btn-outline-primary mt-2"
                                onClick={() => handleViewDocument(employment.releavingLetter)}
                              >
                                <i className="bi bi-eye me-1"></i> View Relieving Letter
                              </button>
                            )}
                          </div>
                          
                          {/* FILE UPLOAD - PAY SLIPS */}
                          <div className="col-md-4">
                            <label className="form-label">Last 3 Months Pay Slips</label>
                            <input 
                              type="file"
                              className="form-control"
                              accept=".pdf,.doc,.docx"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  // Validate file size
                                  if (file.size > 10 * 1024 * 1024) {
                                    alert('File size must be less than 10MB');
                                    return;
                                  }
                                  
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('fieldName', 'pay_slips');

                                    const token = sessionStorage.getItem('token');
                                    const response = await fetch(`${API_BASE_URL}/api/upload/document`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${token}`
                                      },
                                      body: formData
                                    });

                                    if (response.ok) {
                                      const result = await response.json();
                                      handleEmploymentChange(employment.id, 'paySlips', result.data.file_url);
                                    } else {
                                      const errorData = await response.json();
                                      alert(`Error uploading file: ${errorData.message}`);
                                    }
                                  } catch (error) {
                                    console.error('Error uploading file:', error);
                                    alert('Error uploading file. Please try again.');
                                  }
                                }
                              }}
                              disabled={!isHR}
                            />
                            <small className="text-muted">Upload combined PDF (Max 10MB)</small>
                            {employment.paySlips && (
                              <button 
                                type="button"
                                className="btn btn-sm btn-outline-primary mt-2"
                                onClick={() => handleViewDocument(employment.paySlips)}
                              >
                                <i className="bi bi-eye me-1"></i> View Pay Slips
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
  
              {/* ACTION BUTTONS */}
              <div className="row mt-5">
                <div className="col-12">
                  {hasChanges && (
                    <div className="alert alert-warning mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      You have unsaved changes!
                    </div>
                  )}
                  <div className="d-flex gap-3 justify-content-end">
                    <button 
                      type="button" 
                      className="btn btn-secondary px-4"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary px-4"
                      disabled={!hasChanges}
                    >
                      {isNewEmployee ? "Save Joining Details" : "Update Joining Details"}
                    </button>
                  </div>
                </div>
              </div>
            
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoiningDetails;