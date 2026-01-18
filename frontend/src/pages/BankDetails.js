import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function BankDetails() {
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
    dob: "",
    aadharNumber: "",
    panNumber: "",
    passportNumber: "",
    bankName: "",
    branchAddress: "",
    bankAccountNumber: "",
    ifscCode: "",
    panCard: "",           // ADD THIS
    cancelledCheque: "",   // ADD THIS
    bankPassbook: ""       // ADD THIS
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
        const response = await fetch(`${API_BASE_URL}/api/bank-details/${empIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bank details');
        }

        const data = await response.json();
        const bankInfo = data.data;
        
        // All data comes from the backend already combined
        const transformedData = {
          photo: bankInfo.photo 
            ? (bankInfo.photo.startsWith('http') ? bankInfo.photo : `${API_BASE_URL}${bankInfo.photo}`)
            : INITIAL_PHOTO,
          empId: bankInfo.empId || "",
          empName: bankInfo.empName || "",
          dob: formatDateForInput(bankInfo.dob) || "",
          aadharNumber: bankInfo.aadharNumber || "",
          panNumber: bankInfo.panNumber || "",
          passportNumber: bankInfo.passportNumber || "",
          
          // Organizational (prefilled and disabled)
          designation: bankInfo.designation || "",
          department: bankInfo.department || "",
          reportingManagerName: bankInfo.reportingManagerName || "Not Assigned",
          
          // Contact (prefilled and disabled)
          contact1: bankInfo.contact1 || "",
          contact2: bankInfo.contact2 || "",
          mailId1: bankInfo.mailId1 || "",
          mailId2: bankInfo.mailId2 || "",
          
          // From joining_details (prefilled and disabled)
          dateOfJoining: formatDateForInput(bankInfo.dateOfJoining) || "",
          
          // From bank_details (editable by HR)
          bankName: bankInfo.bankName || "",
          branchAddress: bankInfo.branchAddress || "",
          bankAccountNumber: bankInfo.bankAccountNumber || "",
          ifscCode: bankInfo.ifscCode || ""
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
        ? `${API_BASE_URL}/api/bank-details`
        : `${API_BASE_URL}/api/bank-details/${id}`;
      
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
          navigate("/bank-details");
        }
      } else {
        alert(result.message || "Error saving bank details!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving bank details!");
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
        navigate("/bank-details");
      }
    } else {
      navigate("/bank-details");
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
          <p className="text-muted mt-3">Loading bank details...</p>
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
              <span className="text-primary">Bank</span> Details
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
                  onClick={() => navigate("/bank-details")}
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
            <span className="text-primary">Bank</span> Details
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

              {/* Identification Documents Section */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Identification & Compliance</h5>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-control bg-light"
                    value={formData.dob}
                    disabled
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">Aadhar Number</label>
                  <input 
                    type="text" 
                    className="form-control bg-light"
                    value={formData.aadharNumber}
                    disabled
                    placeholder="XXXX-XXXX-XXXX"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">PAN Number</label>
                  <input 
                    type="text" 
                    className="form-control bg-light"
                    value={formData.panNumber}
                    disabled
                    placeholder="ABCDE1234F"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">Passport Number</label>
                  <input 
                    type="text" 
                    className="form-control bg-light"
                    value={formData.passportNumber}
                    disabled
                    placeholder="XXXX-XXXX"
                  />
                </div>
              </div>

              {/* Bank Details Section - EDITABLE */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Banking Information</h5>
                  {isHR ? (
                    <small className="text-success">
                      <i className="bi bi-pencil me-1"></i>
                      You can edit these fields
                    </small>
                  ) : (
                    <small className="text-muted">View only</small>
                  )}
                </div>
                
                <div className="col-12">
                  <label className="form-label fw-semibold">Bank Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="Enter Bank Name"
                    disabled={!isHR}
                  />
                </div>
                
                <div className="col-12">
                  <label className="form-label fw-semibold">Branch and Address</label>
                  <textarea 
                    className="form-control"
                    name="branchAddress"
                    value={formData.branchAddress}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Enter Branch Name and Address"
                    disabled={!isHR}
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Bank Account Number</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    placeholder="Enter Account Number"
                    disabled={!isHR}
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">IFSC Code</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    placeholder="Enter IFSC Code"
                    disabled={!isHR}
                  />
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
                        {isNewEntry ? "Save Bank Details" : "Update Bank Details"}
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

export default BankDetails;