import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

function Leave() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNewEntry = id === "new";

  const [formData, setFormData] = useState({
    photo: "https://via.placeholder.com/150/cccccc/666666?text=Upload+Photo",
    empId: "",
    empName: "",
    designation: "",
    departmentId: "",
    departmentName: "",
    reportingManager: "",
    projectName: "",
    typeOfLeave1: "Sick Leave",
    sickLeavesAllocated: "",
    sickLeavesConsumed: "",
    sickLeavesRemaining: "",
    typeOfLeave2: "RH (Restricted Holiday)",
    rhAllocated: "",
    rhConsumed: "",
    rhRemaining: "",
    typeOfLeave3: "Privilege Leave",
    plAllocated: "",
    plConsumed: "",
    plRemaining: "",
    leaveApplyType: "",
    leaveFromDate: "",
    leaveToDate: "",
    reasonForLeave: "",
    approvalManager: "",
    skipLevelManager: "",
    leaveApprovalStatus: "Pending"
  });

  const [originalData, setOriginalData] = useState(formData);
  const [hasChanges, setHasChanges] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(formData.photo);
  const currentUser = getCurrentUser();
  const isEmployee = currentUser?.role === 'employee';
  const isHR = currentUser?.role === 'HR';

  useEffect(() => {
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(originalData));
  }, [formData, originalData]);

  // Auto-calculate remaining leaves
  useEffect(() => {
    const sickRemaining = (parseInt(formData.sickLeavesAllocated) || 0) - (parseInt(formData.sickLeavesConsumed) || 0);
    const rhRemaining = (parseInt(formData.rhAllocated) || 0) - (parseInt(formData.rhConsumed) || 0);
    const plRemaining = (parseInt(formData.plAllocated) || 0) - (parseInt(formData.plConsumed) || 0);

    setFormData(prev => ({
      ...prev,
      sickLeavesRemaining: sickRemaining >= 0 ? sickRemaining.toString() : "0",
      rhRemaining: rhRemaining >= 0 ? rhRemaining.toString() : "0",
      plRemaining: plRemaining >= 0 ? plRemaining.toString() : "0"
    }));
  }, [formData.sickLeavesAllocated, formData.sickLeavesConsumed, formData.rhAllocated, formData.rhConsumed, formData.plAllocated, formData.plConsumed]);

  useEffect(() => {
    if (!isNewEntry) {
      fetch(`${API_BASE_URL}/api/leave/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFormData(data.data);
            setOriginalData(data.data);
            setPhotoPreview(data.data.photo || "https://via.placeholder.com/150/0066cc/ffffff?text=Employee");
          }
        })
        .catch(err => console.error("Error fetching leave details:", err));
    }
  }, [id, isNewEntry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges) {
      alert("No changes to save!");
      return;
    }

    try {
      const url = isNewEntry 
        ? `${API_BASE_URL}/api/leave`
        : `${API_BASE_URL}/api/leave/${id}`;
      
      const method = isNewEntry ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setOriginalData(formData);
        alert(result.message);
        navigate("/leave");
      } else {
        alert(result.message || "Error saving leave details!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving leave details!");
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (confirmCancel) {
        setFormData(originalData);
        setPhotoPreview(originalData.photo);
        navigate("/leave");
      }
    } else {
      navigate("/leave");
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case "Approved": return "success";
      case "Rejected": return "danger";
      case "Pending": return "warning";
      default: return "secondary";
    }
  };

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
            <span className="text-primary">Leave</span> Management
          </span>
          <div style={{ width: "120px" }}></div>
        </div>
      </nav>

      {/* Form Content */}
      <div className="container py-5">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              
              {/* Photo Display Section */}
              <div className="row mb-5">
                <div className="col-12">
                  <h5 className="fw-bold text-primary mb-4">Employee Information</h5>
                </div>
                <div className="col-12 text-center mb-4">
                  <img 
                    src={photoPreview} 
                    alt="Employee" 
                    className="img-thumbnail"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                  />
                  <div className="mt-2">
                    <small className="text-muted">Candidate Passport Size Photograph</small>
                  </div>
                  {hasChanges && (
                    <div className="mt-3">
                      <label className="form-label fw-semibold">Update Photograph</label>
                      <input 
                        type="file" 
                        className="form-control mx-auto"
                        style={{ maxWidth: "400px" }}
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <small className="text-muted d-block mt-1">Upload passport size photo (JPG, PNG)</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Employee Details */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Emp ID</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="empId"
                    value={formData.empId}
                    onChange={handleChange}
                    placeholder="Enter Employee ID"
                    disabled={!isNewEntry}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">EMP Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="empName"
                    value={formData.empName}
                    onChange={handleChange}
                    placeholder="Full Name"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Designation</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Enter Designation"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Department ID</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    placeholder="Enter Department ID"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Department Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleChange}
                    placeholder="Enter Department Name"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Reporting Manager</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="reportingManager"
                    value={formData.reportingManager}
                    onChange={handleChange}
                    placeholder="Enter Reporting Manager"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Project Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="Enter Project Name"
                  />
                </div>
              </div>

              {/* Leave Balance Section */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Leave Balance</h5>
                </div>

                {/* Sick Leave */}
                <div className="col-12">
                  <div className="card bg-light border">
                    <div className="card-body">
                      <h6 className="fw-semibold mb-3">
                        Type of Leave: <span className="text-primary">Sick Leave</span>
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Allocated</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="sickLeavesAllocated"
                            value={formData.sickLeavesAllocated}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Consumed</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="sickLeavesConsumed"
                            value={formData.sickLeavesConsumed}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Remaining</label>
                          <input 
                            type="number" 
                            className="form-control bg-white"
                            name="sickLeavesRemaining"
                            value={formData.sickLeavesRemaining}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RH Allocated */}
                <div className="col-12">
                  <div className="card bg-light border">
                    <div className="card-body">
                      <h6 className="fw-semibold mb-3">
                        Type of Leave: <span className="text-primary">RH (Restricted Holiday)</span>
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Allocated</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="rhAllocated"
                            value={formData.rhAllocated}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Consumed</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="rhConsumed"
                            value={formData.rhConsumed}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Remaining</label>
                          <input 
                            type="number" 
                            className="form-control bg-white"
                            name="rhRemaining"
                            value={formData.rhRemaining}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PL Allocated */}
                <div className="col-12">
                  <div className="card bg-light border">
                    <div className="card-body">
                      <h6 className="fw-semibold mb-3">
                        Type of Leave: <span className="text-primary">PL (Privilege Leave)</span>
                      </h6>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Allocated</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="plAllocated"
                            value={formData.plAllocated}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Consumed</label>
                          <input 
                            type="number" 
                            className="form-control"
                            name="plConsumed"
                            value={formData.plConsumed}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Remaining</label>
                          <input 
                            type="number" 
                            className="form-control bg-white"
                            name="plRemaining"
                            value={formData.plRemaining}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Application Section */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">
                    {isEmployee ? "Apply for Leave" : "Leave Application"}
                  </h5>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Type of Leave</label>
                  <select 
                    className="form-select"
                    name="leaveApplyType"
                    value={formData.leaveApplyType}
                    onChange={handleChange}
                    disabled={isHR}
                  >
                    <option value="">Select Leave Type</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="RH (Restricted Holiday)">RH (Restricted Holiday)</option>
                    <option value="Privilege Leave">Privilege Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Paternity Leave">Paternity Leave</option>
                    <option value="Loss of Pay">Loss of Pay</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">From Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    name="leaveFromDate"
                    value={formData.leaveFromDate}
                    onChange={handleChange}
                    disabled={isHR}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">To Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    name="leaveToDate"
                    value={formData.leaveToDate}
                    onChange={handleChange}
                    disabled={isHR}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Reason for Leave</label>
                  <textarea 
                    className="form-control"
                    name="reasonForLeave"
                    value={formData.reasonForLeave}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter reason for leave"
                    disabled={isHR}
                  />
                </div>
              </div>

              {/* Approval Section */}
              {isHR && (
                <div className="row g-3 mb-4">
                  <div className="col-12 mt-4">
                    <h5 className="fw-bold text-primary mb-3">Approval Information</h5>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Approval Manager</label>
                    <input 
                      type="text" 
                      className="form-control"
                      name="approvalManager"
                      value={formData.approvalManager}
                      onChange={handleChange}
                      placeholder="Enter Approval Manager Name"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Skip Level Manager</label>
                    <input 
                      type="text" 
                      className="form-control"
                      name="skipLevelManager"
                      value={formData.skipLevelManager}
                      onChange={handleChange}
                      placeholder="Enter Skip Level Manager Name"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Leave Approval Status</label>
                    <div className="d-flex gap-3 align-items-center mb-2">
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="leaveApprovalStatus" 
                          id="statusPending"
                          value="Pending"
                          checked={formData.leaveApprovalStatus === "Pending"}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="statusPending">
                          Pending
                        </label>
                      </div>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="leaveApprovalStatus" 
                          id="statusApproved"
                          value="Approved"
                          checked={formData.leaveApprovalStatus === "Approved"}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="statusApproved">
                          Approved
                        </label>
                      </div>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="radio" 
                          name="leaveApprovalStatus" 
                          id="statusRejected"
                          value="Rejected"
                          checked={formData.leaveApprovalStatus === "Rejected"}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="statusRejected">
                          Rejected
                        </label>
                      </div>
                    </div>
                    {formData.leaveApprovalStatus && (
                      <div className="mt-2">
                        <span className={`badge bg-${getStatusBadgeColor(formData.leaveApprovalStatus)} fs-6`}>
                          Current Status: {formData.leaveApprovalStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="row mt-5">
                <div className="col-12">
                  {hasChanges && (
                    <div className="alert alert-warning mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      You have unsaved changes!
                    </div>
                  )}
                  
                  {/* Employee View - Apply Button */}
                  {isEmployee && (
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
                        className="btn btn-success px-4"
                        disabled={!hasChanges}
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        Apply for Leave
                      </button>
                    </div>
                  )}
                  
                  {/* HR View - Approve/Reject Buttons */}
                  {isHR && (
                    <div className="d-flex gap-3 justify-content-end">
                      <button 
                        type="button" 
                        className="btn btn-secondary px-4"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger px-4"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, leaveApprovalStatus: "Rejected" }));
                        }}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Reject Leave
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-success px-4"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, leaveApprovalStatus: "Approved" }));
                        }}
                      >
                        <i className="bi bi-check-circle me-2"></i>
                        Approve Leave
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leave;