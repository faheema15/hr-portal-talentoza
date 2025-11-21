import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Salary() {
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
    departmentId: "",
    reportingManagerName: "",
    contact1: "",
    contact2: "",
    mailId1: "",
    mailId2: "",
    dateOfJoining: "",
    basicSalary: "",
    hra: "",
    conveyanceAllowance: "",
    medicalAllowance: "",
    specialAllowance: "",
    otherAllowances: "",
    grossSalary: "",
    providentFund: "",
    professionalTax: "",
    incomeTax: "",
    totalDeductions: "",
    netSalary: "",
    paymentMode: "Bank Transfer",
    paymentDate: "",
    salaryMonth: "",
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

        const response = await fetch(`${API_BASE_URL}/api/salary/${empIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch salary details');
        }

        const data = await response.json();
        const salaryInfo = data.data;
        
        const transformedData = {
          photo: salaryInfo.photo || INITIAL_PHOTO,
          empId: salaryInfo.empId || "",
          empName: salaryInfo.empName || "",
          designation: salaryInfo.designation || "",
          department: salaryInfo.department || "",
          departmentId: salaryInfo.departmentId || "",
          reportingManagerName: salaryInfo.reportingManagerName || "Not Assigned",
          contact1: salaryInfo.contact1 || "",
          contact2: salaryInfo.contact2 || "",
          mailId1: salaryInfo.mailId1 || "",
          mailId2: salaryInfo.mailId2 || "",
          dateOfJoining: formatDateForInput(salaryInfo.dateOfJoining) || "",
          basicSalary: salaryInfo.basicSalary || "",
          hra: salaryInfo.hra || "",
          conveyanceAllowance: salaryInfo.conveyanceAllowance || "",
          medicalAllowance: salaryInfo.medicalAllowance || "",
          specialAllowance: salaryInfo.specialAllowance || "",
          otherAllowances: salaryInfo.otherAllowances || "",
          grossSalary: salaryInfo.grossSalary || "",
          providentFund: salaryInfo.providentFund || "",
          professionalTax: salaryInfo.professionalTax || "",
          incomeTax: salaryInfo.incomeTax || "",
          totalDeductions: salaryInfo.totalDeductions || "",
          netSalary: salaryInfo.netSalary || "",
          paymentMode: salaryInfo.paymentMode || "Bank Transfer",
          paymentDate: formatDateForInput(salaryInfo.paymentDate) || "",
          salaryMonth: salaryInfo.salaryMonth || "",
          remarks: salaryInfo.remarks || ""
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

  // Auto-calculate Gross Salary
  useEffect(() => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const hra = parseFloat(formData.hra) || 0;
    const conveyance = parseFloat(formData.conveyanceAllowance) || 0;
    const medical = parseFloat(formData.medicalAllowance) || 0;
    const special = parseFloat(formData.specialAllowance) || 0;
    const other = parseFloat(formData.otherAllowances) || 0;

    const gross = basic + hra + conveyance + medical + special + other;
    setFormData(prev => ({ ...prev, grossSalary: gross.toFixed(2) }));
  }, [
    formData.basicSalary,
    formData.hra,
    formData.conveyanceAllowance,
    formData.medicalAllowance,
    formData.specialAllowance,
    formData.otherAllowances
  ]);

  // Auto-calculate Total Deductions
  useEffect(() => {
    const pf = parseFloat(formData.providentFund) || 0;
    const pt = parseFloat(formData.professionalTax) || 0;
    const it = parseFloat(formData.incomeTax) || 0;

    const total = pf + pt + it;
    setFormData(prev => ({ ...prev, totalDeductions: total.toFixed(2) }));
  }, [
    formData.providentFund,
    formData.professionalTax,
    formData.incomeTax
  ]);

  // Auto-calculate Net Salary
  useEffect(() => {
    const gross = parseFloat(formData.grossSalary) || 0;
    const deductions = parseFloat(formData.totalDeductions) || 0;

    const net = gross - deductions;
    setFormData(prev => ({ ...prev, netSalary: net.toFixed(2) }));
  }, [formData.grossSalary, formData.totalDeductions]);

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
        ? `${API_BASE_URL}/api/salary`
        : `${API_BASE_URL}/api/salary/${id}`;
      
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
          navigate("/salary");
        }
      } else {
        alert(result.message || "Error saving salary details!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving salary details!");
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
        navigate("/salary");
      }
    } else {
      navigate("/salary");
    }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "₹0.00" : `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading salary details...</p>
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
              <span className="text-primary">Salary</span> Management
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
                  onClick={() => navigate("/salary")}
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
            <span className="text-primary">Salary</span> Management
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

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Date of Joining</label>
                  <input 
                    type="date" 
                    className="form-control bg-light"
                    value={formData.dateOfJoining}
                    disabled
                  />
                  <small className="text-muted">Auto-filled from Joining Details</small>
                </div>
              </div>

              {/* Salary Components - Earnings */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Salary Components - Earnings</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Basic Salary</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="basicSalary"
                      value={formData.basicSalary}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">HRA (House Rent Allowance)</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="hra"
                      value={formData.hra}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Conveyance Allowance</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="conveyanceAllowance"
                      value={formData.conveyanceAllowance}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Medical Allowance</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="medicalAllowance"
                      value={formData.medicalAllowance}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Special Allowance</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="specialAllowance"
                      value={formData.specialAllowance}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Other Allowances</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="otherAllowances"
                      value={formData.otherAllowances}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-12">
                  <div className="card bg-success text-white">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-semibold">Gross Salary</h6>
                        <h4 className="mb-0 fw-bold">{formatCurrency(formData.grossSalary)}</h4>
                      </div>
                      <small className="text-white-50">Auto-calculated from all allowances</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Components - Deductions */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Salary Components - Deductions</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Provident Fund (PF)</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="providentFund"
                      value={formData.providentFund}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Professional Tax</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="professionalTax"
                      value={formData.professionalTax}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Income Tax (TDS)</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="incomeTax"
                      value={formData.incomeTax}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Other Deductions</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input 
                      type="number" 
                      className="form-control"
                      name="otherDeductions"
                      value={formData.otherDeductions}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="col-12">
                  <div className="card bg-danger text-white">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-semibold">Total Deductions</h6>
                        <h4 className="mb-0 fw-bold">{formatCurrency(formData.totalDeductions)}</h4>
                      </div>
                      <small className="text-white-50">Auto-calculated from all deductions</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <div className="card bg-primary text-white">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1 fw-bold">Net Salary (Take Home)</h5>
                          <small className="text-white-50">Gross Salary - Total Deductions</small>
                        </div>
                        <h2 className="mb-0 fw-bold">{formatCurrency(formData.netSalary)}</h2>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Payment Information</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Salary Month</label>
                  <input 
                    type="month" 
                    className="form-control"
                    name="salaryMonth"
                    value={formData.salaryMonth}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Payment Date</label>
                  <input 
                    type="date" 
                    className="form-control"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Payment Mode</label>
                  <select 
                    className="form-select"
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleChange}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
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
                      {isNewEntry ? "Save Salary Details" : "Update Salary Details"}
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

export default Salary;