import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function BGV() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNewEntry = id === "new";
  const INITIAL_PHOTO = "https://via.placeholder.com/150/cccccc/666666?text=Upload+Photo";

  const [formData, setFormData] = useState({
    photo: INITIAL_PHOTO,
    empId: "",
    empName: "",
    designation: "",
    department: "",
    reportingManagerName: "",
    contact1: "",
    contact2: "",
    mailId1: "",
    mailId2: "",
    dateOfJoining: "",
    bgvStatus: "",
    reasonForReject: ""
  });

  const [originalData, setOriginalData] = useState(formData);
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
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(originalData));
  }, [formData, originalData]);

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

        // Single API call that fetches everything
        const response = await fetch(`${API_BASE_URL}/api/bgv/${empIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch BGV details');
        }

        const data = await response.json();
        const bgvInfo = data.data;
        
        // All data comes from the backend already combined
        const transformedData = {
          // From employee_details (prefilled and disabled)
          photo: bgvInfo.photo || INITIAL_PHOTO,
          empId: bgvInfo.empId || "",
          empName: bgvInfo.empName || "",
          
          // Organizational (prefilled and disabled)
          designation: bgvInfo.designation || "",
          department: bgvInfo.department || "",
          reportingManagerName: bgvInfo.reportingManagerName || "Not Assigned",
          
          // Contact (prefilled and disabled)
          contact1: bgvInfo.contact1 || "",
          contact2: bgvInfo.contact2 || "",
          mailId1: bgvInfo.mailId1 || "",
          mailId2: bgvInfo.mailId2 || "",
          
          // From joining_details (prefilled and disabled)
          dateOfJoining: formatDateForInput(bgvInfo.dateOfJoining) || "",
          
          // From BGV table (editable by HR)
          bgvStatus: bgvInfo.bgvStatus || "",
          reasonForReject: bgvInfo.reasonForReject || ""
        };
        
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      const url = isNewEntry 
        ? `${API_BASE_URL}/api/bgv`
        : `${API_BASE_URL}/api/bgv/${id}`;
      
      const method = isNewEntry ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setOriginalData(formData);
        setHasChanges(false);
        alert(result.message);
        
        if (isHR) {
          navigate("/bgv");
        }
      } else {
        alert(result.message || "Error saving BGV details!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving BGV details!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (confirmCancel) {
        setFormData(originalData);
        setPhotoPreview(originalData.photo);
        navigate("/bgv");
      }
    } else {
      navigate("/bgv");
    }
  };

  const getBgvStatusColor = (status) => {
    switch(status) {
      case "Green": return "success";
      case "Yellow": return "warning";
      case "Red": return "danger";
      default: return "secondary";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading BGV details...</p>
        </div>
      </div>
    );
  }

  // Error state
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
              <span className="text-primary">BGV</span> Details
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
                  onClick={() => navigate("/bgv")}
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
      {/* Header */}
      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container-fluid px-4">
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <span className="navbar-brand mb-0 h1 fw-bold">
            <span className="text-primary">BGV</span> Details
          </span>
          <div style={{ width: "120px" }}></div>
        </div>
      </nav>

      {/* Form Content */}
      <div className="container py-5">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              
              {/* PHOTO SECTION - VIEW ONLY (from employee_details) */}
              <div className="row mb-5">
                <div className="col-12 text-center mb-4">
                  <img 
                    src={photoPreview} 
                    alt="Employee" 
                    className="img-thumbnail rounded-circle border border-3 border-primary"
                    style={{ 
                      width: "150px", 
                      height: "150px", 
                      objectFit: "cover",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                  />
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <h5 className="fw-bold text-primary mb-4">Basic Information</h5>
                </div>
                
                {/* Employee ID and Name */}
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
                    value={formData.empName}
                    disabled
                  />
                </div>

                {/* Designation, Department, Reporting Manager */}
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

                {/* Contact Numbers */}
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

                {/* Emails */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Primary Email</label>
                  <input 
                    type="email" 
                    className="form-control bg-light"
                    value={formData.mailId1}
                    disabled
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Secondary Email</label>
                  <input 
                    type="email" 
                    className="form-control bg-light"
                    value={formData.mailId2}
                    disabled
                  />
                </div>

                {/* Date of Joining */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Date of Joining</label>
                  <input 
                    type="date" 
                    className="form-control bg-light"
                    value={formData.dateOfJoining}
                    disabled
                  />
                </div>
              </div>

              {/* BGV Section - EDITABLE */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Background Verification (BGV)</h5>
                  {isHR ? (
                    <small className="text-success">
                      <i className="bi bi-pencil me-1"></i>
                      You can edit these fields
                    </small>
                  ) : (
                    <small className="text-muted">View only</small>
                  )}
                </div>
                
                <div className="col-md-12">
                  <label className="form-label fw-semibold">BGV Status</label>
                  <div className="d-flex gap-3 align-items-center">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="bgvStatus" 
                        id="bgvYellow"
                        value="Yellow"
                        checked={formData.bgvStatus === "Yellow"}
                        onChange={handleChange}
                        disabled={!isHR}
                      />
                      <label className="form-check-label" htmlFor="bgvYellow">
                        <span className="badge bg-warning text-dark">Yellow</span>
                      </label>
                    </div>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="bgvStatus" 
                        id="bgvGreen"
                        value="Green"
                        checked={formData.bgvStatus === "Green"}
                        onChange={handleChange}
                        disabled={!isHR}
                      />
                      <label className="form-check-label" htmlFor="bgvGreen">
                        <span className="badge bg-success">Green</span>
                      </label>
                    </div>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="bgvStatus" 
                        id="bgvRed"
                        value="Red"
                        checked={formData.bgvStatus === "Red"}
                        onChange={handleChange}
                        disabled={!isHR}
                      />
                      <label className="form-check-label" htmlFor="bgvRed">
                        <span className="badge bg-danger">Red</span>
                      </label>
                    </div>
                  </div>
                  {formData.bgvStatus && (
                    <div className="mt-2">
                      <span className={`badge bg-${getBgvStatusColor(formData.bgvStatus)} fs-6`}>
                        Current Status: {formData.bgvStatus}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="col-12">
                  <label className="form-label fw-semibold">Reason for BGV Reject</label>
                  <textarea 
                    className="form-control"
                    name="reasonForReject"
                    value={formData.reasonForReject}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter reason if BGV is rejected or marked as Yellow/Red"
                    disabled={!isHR}
                  />
                  <small className="text-muted">Only fill this field if BGV status is Yellow or Red</small>
                </div>
              </div>

              {/* Action Buttons - Only for HR */}
              {isHR && (
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
                        {isNewEntry ? "Save BGV Details" : "Update BGV Details"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BGV;