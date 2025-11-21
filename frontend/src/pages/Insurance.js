import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

function Insurance() {
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
    insuranceProvider: "",
    policyNumber: "",
    policyType: "",
    coverageAmount: "",
    premiumAmount: "",
    policyStartDate: "",
    policyEndDate: "",
    policyStatus: "Active",
    nomineeDetails: "",
    nomineeRelation: "",
    nomineeContactNumber: "",
    dependentsCount: "",
    dependentDetails: "",
    claimHistory: "",
    remarks: ""
    });

  const [originalData, setOriginalData] = useState(formData);
  const [hasChanges, setHasChanges] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(formData.photo);

  useEffect(() => {
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(originalData));
  }, [formData, originalData]);

  useEffect(() => {
    if (!isNewEntry) {
        fetch(`${API_BASE_URL}/api/insurance/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
            setFormData(data.data);
            setOriginalData(data.data);
            setPhotoPreview(data.data.photo || "https://via.placeholder.com/150/0066cc/ffffff?text=Employee");
            }
        })
        .catch(err => console.error("Error fetching insurance details:", err));
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
        ? `${API_BASE_URL}/api/insurance`
        : `${API_BASE_URL}/api/insurance/${id}`;
        
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
        navigate("/insurance");
        } else {
        alert(result.message || "Error saving insurance details!");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error saving insurance details!");
    }
    };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (confirmCancel) {
        setFormData(originalData);
        setPhotoPreview(originalData.photo);
        navigate("/insurance");
      }
    } else {
      navigate("/insurance");
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case "Active": return "success";
      case "Expired": return "danger";
      case "Pending": return "warning";
      case "Cancelled": return "secondary";
      default: return "secondary";
    }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "₹0.00" : `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateRemainingDays = () => {
    if (!formData.policyEndDate) return null;
    const endDate = new Date(formData.policyEndDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const remainingDays = calculateRemainingDays();

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
            <span className="text-primary">Insurance</span> Management
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

              {/* Insurance Policy Details */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Insurance Policy Details</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Insurance Provider</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleChange}
                    placeholder="Enter Insurance Provider Name"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Policy Number</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleChange}
                    placeholder="Enter Policy Number"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Policy Type</label>
                  <select 
                    className="form-select"
                    name="policyType"
                    value={formData.policyType}
                    onChange={handleChange}
                  >
                    <option value="">Select Policy Type</option>
                    <option value="Health Insurance">Health Insurance</option>
                    <option value="Life Insurance">Life Insurance</option>
                    <option value="Accidental Insurance">Accidental Insurance</option>
                    <option value="Group Insurance">Group Insurance</option>
                    <option value="Family Floater">Family Floater</option>
                    <option value="Term Insurance">Term Insurance</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Coverage Amount</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="coverageAmount"
                      value={formData.coverageAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="1000"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Premium Amount (Annual)</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="premiumAmount"
                      value={formData.premiumAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="100"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Policy Status</label>
                  <select 
                    className="form-select"
                    name="policyStatus"
                    value={formData.policyStatus}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <div className="mt-2">
                    <span className={`badge bg-${getStatusBadgeColor(formData.policyStatus)}`}>
                      {formData.policyStatus}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Policy Start Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    name="policyStartDate"
                    value={formData.policyStartDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Policy End Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    name="policyEndDate"
                    value={formData.policyEndDate}
                    onChange={handleChange}
                  />
                  {remainingDays !== null && (
                    <small className={`mt-1 d-block ${remainingDays < 30 ? 'text-danger' : remainingDays < 90 ? 'text-warning' : 'text-success'}`}>
                      {remainingDays > 0 ? `${remainingDays} days remaining` : remainingDays === 0 ? 'Expires today' : 'Policy expired'}
                    </small>
                  )}
                </div>
              </div>

              {/* Policy Summary Cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="card bg-primary text-white">
                    <div className="card-body">
                      <h6 className="mb-1 fw-semibold">Coverage Amount</h6>
                      <h3 className="mb-0 fw-bold">{formatCurrency(formData.coverageAmount)}</h3>
                      <small className="text-white-50">Sum Insured</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-info text-white">
                    <div className="card-body">
                      <h6 className="mb-1 fw-semibold">Annual Premium</h6>
                      <h3 className="mb-0 fw-bold">{formatCurrency(formData.premiumAmount)}</h3>
                      <small className="text-white-50">Yearly Payment</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nominee Details */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Nominee Information</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nominee Details</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="nomineeDetails"
                    value={formData.nomineeDetails}
                    onChange={handleChange}
                    placeholder="Nominee Name"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nominee Relation</label>
                  <select 
                    className="form-select"
                    name="nomineeRelation"
                    value={formData.nomineeRelation}
                    onChange={handleChange}
                  >
                    <option value="">Select Relation</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nominee Contact Number</label>
                  <input 
                    type="tel" 
                    className="form-control"
                    name="nomineeContactNumber"
                    value={formData.nomineeContactNumber}
                    onChange={handleChange}
                    placeholder="Enter Contact Number"
                  />
                </div>
              </div>

              {/* Dependents Information */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Dependents Information</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Number of Dependents Covered</label>
                  <input 
                    type="number" 
                    className="form-control"
                    name="dependentsCount"
                    value={formData.dependentsCount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Dependent Details</label>
                  <textarea 
                    className="form-control"
                    name="dependentDetails"
                    value={formData.dependentDetails}
                    onChange={handleChange}
                    rows="3"
                    placeholder="List all dependents covered under this policy with their relationship (e.g., Spouse: Name, Child: Name)"
                  />
                </div>
              </div>

              {/* Claim History and Remarks */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Additional Information</h5>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Claim History</label>
                  <textarea 
                    className="form-control"
                    name="claimHistory"
                    value={formData.claimHistory}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter claim history details if any"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Remarks</label>
                  <textarea 
                    className="form-control"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Any additional notes or remarks"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                      {isNewEntry ? "Save Insurance Details" : "Update Insurance Details"}
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

export default Insurance;