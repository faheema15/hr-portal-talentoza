import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Leave() {
  const navigate = useNavigate();
  const { id } = useParams();
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
    sickLeavesAllocated: "",
    sickLeavesConsumed: "",
    sickLeavesRemaining: "",
    rhAllocated: "",
    rhConsumed: "",
    rhRemaining: "",
    plAllocated: "",
    plConsumed: "",
    plRemaining: "",
    leaveApplyType: "",
    leaveFromDate: "",
    leaveToDate: "",
    reasonForLeave: "",
    leaveApprovalStatus: "Pending"
  });

  const [originalData, setOriginalData] = useState(formData);
  const [photoPreview, setPhotoPreview] = useState(INITIAL_PHOTO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showLeavePolicy, setShowLeavePolicy] = useState(false);
  const [activeTab, setActiveTab] = useState('types');
  const [newLeaveApplication, setNewLeaveApplication] = useState({
    leaveApplyType: "",
    leaveFromDate: "",
    leaveToDate: "",
    reasonForLeave: "",
    duration: "full"
  });

  const currentUser = getCurrentUser();
  const isEmployee = currentUser?.role === 'Employee';
  const isHR = currentUser?.role === 'HR';
  const isManager = currentUser?.role === 'Manager';
  const isSkipManager = currentUser?.role === 'Skip Manager';

  const leavePolicy = [
    { type: "Casual Leave", days: 10 },
    { type: "Sick Leave", days: 10 },
    { type: "Earned Leave", days: 15 },
    { type: "Parental Leave", days: 30 },
    { type: "Compensatory Off", days: "As Earned" },
    { type: "Loss of Pay", days: "Unlimited" },
    { type: "Bereavement Leave", days: 5 },
    { type: "Marriage Leave", days: 5 },
  ];

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

        const response = await fetch(`${API_BASE_URL}/api/leave/${empIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leave details');
        }

        const data = await response.json();
        const leaveInfo = data.data;
        
        const transformedData = {
          photo: leaveInfo.photo 
          ? (leaveInfo.photo.startsWith('http') ? leaveInfo.photo : `${API_BASE_URL}${leaveInfo.photo}`)
          : INITIAL_PHOTO,
          empId: leaveInfo.empId || "",
          empName: leaveInfo.empName || "",
          designation: leaveInfo.designation || "",
          department: leaveInfo.department || "",
          departmentId: leaveInfo.departmentId || "",
          reportingManagerName: leaveInfo.reportingManagerName || "Not Assigned",
          contact1: leaveInfo.contact1 || "",
          contact2: leaveInfo.contact2 || "",
          mailId1: leaveInfo.mailId1 || "",
          mailId2: leaveInfo.mailId2 || "",
          sickLeavesAllocated: leaveInfo.sickLeavesAllocated || "",
          sickLeavesConsumed: leaveInfo.sickLeavesConsumed || "",
          sickLeavesRemaining: leaveInfo.sickLeavesRemaining || "",
          rhAllocated: leaveInfo.rhAllocated || "",
          rhConsumed: leaveInfo.rhConsumed || "",
          rhRemaining: leaveInfo.rhRemaining || "",
          plAllocated: leaveInfo.plAllocated || "",
          plConsumed: leaveInfo.plConsumed || "",
          plRemaining: leaveInfo.plRemaining || "",
          leaveApplyType: leaveInfo.leaveApplyType || "",
          leaveFromDate: formatDateForInput(leaveInfo.leaveFromDate) || "",
          leaveToDate: formatDateForInput(leaveInfo.leaveToDate) || "",
          reasonForLeave: leaveInfo.reasonForLeave || "",
          leaveApprovalStatus: leaveInfo.leaveApprovalStatus || "Pending"
        };
        
        setFormData(transformedData);
        setOriginalData(transformedData);
        setPhotoPreview(transformedData.photo);
        setError(null);

        // Fetch leave history
        const leaveListResponse = await fetch(`${API_BASE_URL}/api/leave-list/${empIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (leaveListResponse.ok) {
          const leaveListData = await leaveListResponse.json();
          setLeaveHistory(leaveListData.data || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser?.emp_id]);

  const handleApplyLeave = async () => {
    if (!newLeaveApplication.leaveApplyType || !newLeaveApplication.leaveFromDate || !newLeaveApplication.leaveToDate) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newLeaveApplication,
          empId: formData.empId,
          leaveApprovalStatus: "Pending"
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message || "Leave applied successfully!");
        setShowApplyForm(false);
        setNewLeaveApplication({ leaveApplyType: "", leaveFromDate: "", leaveToDate: "", reasonForLeave: "", duration: "full" });
        window.location.reload();
      } else {
        alert(result.message || "Error applying leave!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error applying leave!");
    }
  };

  const handleApproveReject = async (leaveId, status) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/leave/${leaveId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leaveApprovalStatus: status }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Leave ${status} successfully!`);
        window.location.reload();
      } else {
        alert(result.message || "Error updating leave!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error updating leave!");
    }
  };

  const calculateLeaveStats = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    let totalTaken = 0;
    let upcomingApproved = 0;
    let pendingApproval = 0;

    leaveHistory.forEach(leave => {
      const leaveFromDate = new Date(leave.leaveFromDate);
      
      if (leaveFromDate.getFullYear() === currentYear) {
        if (leave.leaveApprovalStatus === "Approved") {
          if (leaveFromDate < today) {
            totalTaken++;
          } else {
            upcomingApproved++;
          }
        } else if (leave.leaveApprovalStatus === "Pending") {
          pendingApproval++;
        }
      }
    });

    return { totalTaken, upcomingApproved, pendingApproval };
  };

  const stats = calculateLeaveStats();

  // Loading state
  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading leave details...</p>
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
              <span className="text-primary">Leave</span> Management
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
                  onClick={() => navigate("/leave")}
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
            <span className="text-primary">Leave</span> Management
          </span>
          <div style={{ width: "120px" }}></div>
        </div>
      </nav>

      {/* Form Content */}
      <div className="container py-5">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            
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

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-calendar-check text-success" style={{ fontSize: "2rem" }}></i>
                    <h6 className="mt-3 fw-semibold">Total Leaves Taken</h6>
                    <p className="fs-4 fw-bold text-success mb-0">{stats.totalTaken}</p>
                    <small className="text-muted">This year</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-calendar-event text-info" style={{ fontSize: "2rem" }}></i>
                    <h6 className="mt-3 fw-semibold">Upcoming Leaves</h6>
                    <p className="fs-4 fw-bold text-info mb-0">{stats.upcomingApproved}</p>
                    <small className="text-muted">Approved</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-clock-history text-warning" style={{ fontSize: "2rem" }}></i>
                    <h6 className="mt-3 fw-semibold">Pending Approval</h6>
                    <p className="fs-4 fw-bold text-warning mb-0">{stats.pendingApproval}</p>
                    <small className="text-muted">Awaiting approval</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave History Table */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="mb-0 fw-bold text-primary">Leave History</h6>
              </div>
              <div className="card-body p-3">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Days</th>
                        <th>Duration</th>
                        <th>Applied On</th>
                        <th>Leave Type</th>
                        <th>Status</th>
                        {(isHR || isManager || isSkipManager) && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {leaveHistory.length > 0 ? (
                        leaveHistory.map((leave, index) => (
                          <tr key={index}>
                            <td>{formatDateForInput(leave.leaveFromDate)}</td>
                            <td>{formatDateForInput(leave.leaveToDate)}</td>
                            <td>
                              {Math.ceil((new Date(leave.leaveToDate) - new Date(leave.leaveFromDate)) / (1000 * 60 * 60 * 24) + 1)}
                            </td>
                            <td>{leave.duration || "Full"}</td>
                            <td>{formatDateForInput(leave.createdAt)}</td>
                            <td>{leave.leaveApplyType}</td>
                            <td>
                              <span className={`badge bg-${leave.leaveApprovalStatus === 'Approved' ? 'success' : leave.leaveApprovalStatus === 'Pending' ? 'warning' : 'danger'}`}>
                                {leave.leaveApprovalStatus}
                              </span>
                            </td>
                            {(isHR || isManager || isSkipManager) && (
                              <td>
                                {leave.leaveApprovalStatus === 'Pending' && (
                                  <>
                                    <button
                                      className="btn btn-sm btn-success me-2"
                                      onClick={() => handleApproveReject(leave._id, 'Approved')}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => handleApproveReject(leave._id, 'Rejected')}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-4">
                            No leave applications found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Employee Action Buttons */}
            {isEmployee && (
              <div className="row">
                <div className="col-12">
                  <div className="d-flex gap-3 justify-content-end">
                    <button
                      className="btn btn-primary px-4"
                      onClick={() => setShowApplyForm(true)}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Apply for Leave
                    </button>
                    <button
                      className="btn btn-outline-primary px-4"
                      onClick={() => setShowLeavePolicy(true)}
                    >
                      <i className="bi bi-file-text me-2"></i>
                      View Leave Policy
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyForm && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Apply for Leave</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowApplyForm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Type of Leave *</label>
                  <select
                    className="form-select"
                    value={newLeaveApplication.leaveApplyType}
                    onChange={(e) => setNewLeaveApplication({ ...newLeaveApplication, leaveApplyType: e.target.value })}
                  >
                    <option value="">Select Leave Type</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                    <option value="Parental Leave">Parental Leave</option>
                    <option value="Compensatory Off">Compensatory Off</option>
                    <option value="Loss of Pay">Loss of Pay</option>
                    <option value="Bereavement Leave">Bereavement Leave</option>
                    <option value="Marriage Leave">Marriage Leave</option>
                  </select>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">From Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newLeaveApplication.leaveFromDate}
                      onChange={(e) => setNewLeaveApplication({ ...newLeaveApplication, leaveFromDate: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">To Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newLeaveApplication.leaveToDate}
                      onChange={(e) => setNewLeaveApplication({ ...newLeaveApplication, leaveToDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Duration</label>
                  <select
                    className="form-select"
                    value={newLeaveApplication.duration}
                    onChange={(e) => setNewLeaveApplication({ ...newLeaveApplication, duration: e.target.value })}
                  >
                    <option value="full">Full Day</option>
                    <option value="half">Half Day</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Reason for Leave</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter reason for leave"
                    value={newLeaveApplication.reasonForLeave}
                    onChange={(e) => setNewLeaveApplication({ ...newLeaveApplication, reasonForLeave: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowApplyForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyLeave}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Apply for Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Policy Modal */}
{showLeavePolicy && (
  <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title fw-bold">Leave Policy</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowLeavePolicy(false)}
          ></button>
        </div>
        <div className="modal-body">
          {/* Tabs */}
          <ul className="nav nav-tabs mb-3" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'types' ? 'active' : ''}`}
                onClick={() => setActiveTab('types')}
                type="button"
                role="tab"
              >
                Leave Types
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'guidelines' ? 'active' : ''}`}
                onClick={() => setActiveTab('guidelines')}
                type="button"
                role="tab"
              >
                Guidelines
              </button>
            </li>
          </ul>

          <div className="tab-content">
            {/* Tab 1: Leave Types */}
            {activeTab === 'types' && (
              <div className="tab-pane fade show active" role="tabpanel">
                <table className="table table-bordered table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>Leave Type</th>
                      <th>Annual Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leavePolicy.map((policy, index) => (
                      <tr key={index}>
                        <td>{policy.type}</td>
                        <td className="fw-semibold">{policy.days}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Guidelines */}
            {activeTab === 'guidelines' && (
              <div className="tab-pane fade show active" role="tabpanel">
                <ul>
                  <li><strong>Advance Notice:</strong> For CL or PL, inform at least 2 days in advance.</li>
                  <li><strong>Quarterly Limits:</strong> Maximum 5 CL and 5 PL per quarter.</li>
                  <li><strong>Half Day Rule:</strong> Two half-days (more than 4 hours off) = 1 full day CL.</li>
                  <li><strong>Emergency Exception:</strong> Emergency leave can be informed on the same day.</li>
                  <li><strong>Applicability:</strong> These rules apply to all interns and full-time employees.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowLeavePolicy(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default Leave;