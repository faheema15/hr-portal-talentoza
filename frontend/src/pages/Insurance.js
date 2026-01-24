import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Insurance() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNewEntry = id === "new";
  const INITIAL_PHOTO = "/default_profile.jpg";

  const [formData, setFormData] = useState({
    photo: INITIAL_PHOTO,
    empId: "",
    empName: "",
    designation: "",
    department: "",
    departmentId: "",
    reportingManagerName: "",
    contact1: "",
    contact2: "",
    mailId1: "",
    mailId2: "",
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

        const response = await fetch(`${API_BASE_URL}/api/insurance/${empIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch insurance details');
        }

        const data = await response.json();
        const insuranceInfo = data.data;
        
        const transformedData = {
          photo: insuranceInfo.photo 
          ? (insuranceInfo.photo.startsWith('http') ? insuranceInfo.photo : `${API_BASE_URL}${insuranceInfo.photo}`)
          : "/default_profile.jpg",
          empId: insuranceInfo.empId || "",
          empName: insuranceInfo.empName || "",
          designation: insuranceInfo.designation || "",
          department: insuranceInfo.department || "",
          departmentId: insuranceInfo.departmentId || "",
          reportingManagerName: insuranceInfo.reportingManagerName || "Not Assigned",
          contact1: insuranceInfo.contact1 || "",
          contact2: insuranceInfo.contact2 || "",
          mailId1: insuranceInfo.mailId1 || "",
          mailId2: insuranceInfo.mailId2 || "",
          insuranceProvider: insuranceInfo.insuranceProvider || "",
          policyNumber: insuranceInfo.policyNumber || "",
          policyType: insuranceInfo.policyType || "",
          coverageAmount: insuranceInfo.coverageAmount || "",
          premiumAmount: insuranceInfo.premiumAmount || "",
          policyStartDate: formatDateForInput(insuranceInfo.policyStartDate) || "",
          policyEndDate: formatDateForInput(insuranceInfo.policyEndDate) || "",
          policyStatus: insuranceInfo.policyStatus || "Active",
          nomineeDetails: insuranceInfo.nomineeDetails || "",
          nomineeRelation: insuranceInfo.nomineeRelation || "",
          nomineeContactNumber: insuranceInfo.nomineeContactNumber || "",
          dependentsCount: insuranceInfo.dependentsCount || "",
          dependentDetails: insuranceInfo.dependentDetails || "",
          claimHistory: insuranceInfo.claimHistory || "",
          remarks: insuranceInfo.remarks || ""
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
        ? `${API_BASE_URL}/api/insurance`
        : `${API_BASE_URL}/api/insurance/${id}`;
      
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
          navigate("/insurance");
        }
      } else {
        alert(result.message || "Error saving insurance details!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving insurance details!");
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

  // Loading state
  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading insurance details...</p>
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
              <span className="text-primary">Insurance</span> Management
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
                  onClick={() => navigate("/insurance")}
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
              
              {/* PHOTO SECTION - VIEW ONLY */}
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

              {/* Basic Information Section */}
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
                    value={formData.empName}
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
              </div>

              {/* Insurance Policy Details - EDITABLE */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Insurance Policy Details</h5>
                  {isHR ? (
                    <small className="text-success">
                      <i className="bi bi-pencil me-1"></i>
                      You can edit these fields
                    </small>
                  ) : (
                    <small className="text-muted">View only</small>
                  )}
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
                    disabled={!isHR}
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
                    disabled={!isHR}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Policy Type</label>
                  <select 
                    className="form-select"
                    name="policyType"
                    value={formData.policyType}
                    onChange={handleChange}
                    disabled={!isHR}
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
                      disabled={!isHR}
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
                      disabled={!isHR}
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
                    disabled={!isHR}
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
                    disabled={!isHR}
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
                    disabled={!isHR}
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
                    disabled={!isHR}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nominee Relation</label>
                  <select 
                    className="form-select"
                    name="nomineeRelation"
                    value={formData.nomineeRelation}
                    onChange={handleChange}
                    disabled={!isHR}
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
                    disabled={!isHR}
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
                    disabled={!isHR}
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
                    disabled={!isHR}
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
                    disabled={!isHR}
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
                    disabled={!isHR}
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