import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
const recordsPerPage = 15;

  const navigate = useNavigate();

 useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/employee-details/hr/list", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await res.json();

      console.log("API RESULT:", result); 

      setEmployees(result.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      } finally {
      setLoading(false);
    }
  };

  fetchEmployees();
}, []);
const indexOfLast = currentPage * recordsPerPage;
const indexOfFirst = indexOfLast - recordsPerPage;
const currentEmployees = employees.slice(indexOfFirst, indexOfLast);

const totalPages = Math.ceil(employees.length / recordsPerPage) || 1;

  const handleView = async (emp) => {
    if (!emp.is_deleted) {
      //  Active → go to details page
      navigate(`/employee-details/${emp.emp_id}`);
    } else {
      //  Deleted → open modal with full details
      try {
        const token = sessionStorage.getItem("token");

        const res = await fetch(
          `${API_BASE_URL}/api/employee-details/full/${emp.emp_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        console.log("FULL API RESPONSE:", data);
        setSelectedEmployee(data);
        setShowModal(true);
      } catch (err) {
        console.error(err);
        alert("Error fetching employee details");
      }
    }
  };

  if (loading) {
    return <h4 className="text-center mt-5">Loading...</h4>;
  }

  return (
    <>
    <div
      style={{
        backgroundColor: "#1f2937",
        color: "white",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          position: "absolute",
          left: "20px",
          backgroundColor: "transparent",
          border: "1px solid #ccc",
          color: "white",
          padding: "6px 12px",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        ← Back to Dashboard
      </button>

      <h4 style={{ margin: 0, fontWeight: "600" }}>
  <span style={{ color: "#3b82f6" }}>Employee</span>{" "}
  <span style={{ color: "#e5e7eb" }}>List</span>
</h4>
    </div>
    <div className="container mt-4">

      <table className="table table-hover align-middle">
  <thead style={{ backgroundColor: "#1f2937", color: "white" }}>
          <tr>
            <th style={{ fontSize: "14px", fontWeight: "500" }}>Employee ID</th>
    <th style={{ fontSize: "14px", fontWeight: "500" }}>Name</th>
    <th style={{ fontSize: "14px", fontWeight: "500" }}>Email</th>
    <th style={{ fontSize: "14px", fontWeight: "500" }}>Status</th>
    <th style={{ fontSize: "14px" , fontWeight: "500"}}>Action</th>
          </tr>
        </thead>

       <tbody>
  {currentEmployees.map((emp) => (
    <tr key={emp.emp_id}>
      
      {/* Employee ID */}
      <td style={{ fontSize: "14px", fontWeight: "500", color: "#2563eb" }}>
        {emp.emp_id}
      </td>

      {/* Name */}
      <td style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
        {emp.full_name}
      </td>

      {/* Email */}
      <td style={{ fontSize: "13px", color: "#6b7280" }}>
        {emp.email || emp.email1 || emp.user_email || "N/A"}
      </td>

      {/* Status */}
      <td>
        {emp.is_deleted ? (
          <span className="badge rounded-pill bg-danger px-3">
            Deleted
          </span>
        ) : (
          <span className="badge rounded-pill bg-success px-3">
            Active
          </span>
        )}
      </td>

      {/* Action */}
      <td>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleView(emp)}
        >
          View
        </button>
      </td>

    </tr>
  ))}
</tbody>
      </table>
      <style>
{`
.segment-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.segment-pagination .group {
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  overflow: hidden;
  background: #e5e7eb;
}

.segment-pagination button {
  border: none;
  background: transparent;
  padding: 8px 16px;
  font-size: 16px;
  color: #555;
  cursor: pointer;
}

.segment-pagination button.active {
  background-color: #1f6feb;
  color: white;
}

.segment-pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`}
</style>
     <div className="segment-pagination">
  <div className="group">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(currentPage - 1)}
    >
      Previous
    </button>

    <button className="active">
      {currentPage}
    </button>

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(currentPage + 1)}
    >
      Next
    </button>
  </div>
</div>

      {/*  MODAL for deleted employee */}
      {showModal && selectedEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">

              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">
                  <span className="badge bg-danger me-2">Deleted</span>
                  Employee Details — {selectedEmployee.full_name || selectedEmployee.emp_id}
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <div className="modal-body">

                {/* Deletion Info */}
                <div className="alert alert-danger mb-4">
                  <div className="row">
                    <div className="col-md-4"><strong>Last Working Date:</strong> {selectedEmployee.last_working_date ? new Date(selectedEmployee.last_working_date).toLocaleDateString() : "N/A"}</div>
                    <div className="col-md-8"><strong>Reason for Leaving:</strong> {selectedEmployee.reason_for_leaving || "N/A"}</div>
                  </div>
                </div>

                {/* Basic Info */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Basic Information</h6>
                <div className="row mb-4">
                  <div className="col-md-4 mb-2"><strong>Employee ID:</strong> {selectedEmployee.emp_id || "N/A"}</div>
                  <div className="col-md-4 mb-2"><strong>Full Name:</strong> {selectedEmployee.full_name || "N/A"}</div>
                  <div className="col-md-4 mb-2"><strong>Designation:</strong> {selectedEmployee.designation || "N/A"}</div>
                  <div className="col-md-4 mb-2"><strong>Department:</strong> {selectedEmployee.department_name || "N/A"}</div>
                  <div className="col-md-4 mb-2"><strong>Date of Birth:</strong> {selectedEmployee.dob ? new Date(selectedEmployee.dob).toLocaleDateString() : "N/A"}</div>
                  <div className="col-md-4 mb-2"><strong>Date of Joining:</strong> {selectedEmployee.date_of_joining ? new Date(selectedEmployee.date_of_joining).toLocaleDateString() : "N/A"}</div>
                </div>

                {/* Identification */}
                {(selectedEmployee.aadhar_no || selectedEmployee.pan_no || selectedEmployee.passport_no) && (
                  <>
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Identification</h6>
                    <div className="row mb-4">
                      {selectedEmployee.aadhar_no && <div className="col-md-4 mb-2"><strong>Aadhar No:</strong> {selectedEmployee.aadhar_no}</div>}
                      {selectedEmployee.pan_no && <div className="col-md-4 mb-2"><strong>PAN No:</strong> {selectedEmployee.pan_no}</div>}
                      {selectedEmployee.passport_no && <div className="col-md-4 mb-2"><strong>Passport No:</strong> {selectedEmployee.passport_no}</div>}
                    </div>
                  </>
                )}

                {/* Contact Info */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Contact Information</h6>
                <div className="row mb-4">
                  <div className="col-md-6 mb-2"><strong>Primary Email:</strong> {selectedEmployee.email1 || selectedEmployee.email || selectedEmployee.user_email || "N/A"}</div>
                  {selectedEmployee.email2 && <div className="col-md-6 mb-2"><strong>Secondary Email:</strong> {selectedEmployee.email2}</div>}
                  <div className="col-md-6 mb-2"><strong>Primary Contact:</strong> {selectedEmployee.contact1 || "N/A"}</div>
                  {selectedEmployee.contact2 && <div className="col-md-6 mb-2"><strong>Secondary Contact:</strong> {selectedEmployee.contact2}</div>}
                </div>

                {/* Family Info */}
                {(selectedEmployee.father_name || selectedEmployee.mother_name || selectedEmployee.spouse_name) && (
                  <>
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Family Information</h6>
                    <div className="row mb-4">
                      {selectedEmployee.father_name && <div className="col-md-4 mb-2"><strong>Father's Name:</strong> {selectedEmployee.father_name}</div>}
                      {selectedEmployee.mother_name && <div className="col-md-4 mb-2"><strong>Mother's Name:</strong> {selectedEmployee.mother_name}</div>}
                      <div className="col-md-4 mb-2"><strong>Marital Status:</strong> {selectedEmployee.marital_status || "N/A"}</div>
                      {selectedEmployee.spouse_name && <div className="col-md-4 mb-2"><strong>Spouse Name:</strong> {selectedEmployee.spouse_name}</div>}
                    </div>
                  </>
                )}

                {/* Address Info */}
                {(selectedEmployee.present_address || selectedEmployee.permanent_address) && (
                  <>
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Address Information</h6>
                    <div className="row mb-4">
                      {selectedEmployee.present_address && <div className="col-md-6 mb-2"><strong>Present Address:</strong> {selectedEmployee.present_address}</div>}
                      {selectedEmployee.permanent_address && <div className="col-md-6 mb-2"><strong>Permanent Address:</strong> {selectedEmployee.permanent_address}</div>}
                    </div>
                  </>
                )}

                {/* Emergency Contact */}
                {selectedEmployee.emergency_contact_name && (
                  <>
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Emergency Contact</h6>
                    <div className="row mb-4">
                      <div className="col-md-4 mb-2"><strong>Name:</strong> {selectedEmployee.emergency_contact_name}</div>
                      {selectedEmployee.emergency_relation && <div className="col-md-4 mb-2"><strong>Relation:</strong> {selectedEmployee.emergency_relation}</div>}
                      {selectedEmployee.emergency_contact_number && <div className="col-md-4 mb-2"><strong>Phone:</strong> {selectedEmployee.emergency_contact_number}</div>}
                    </div>
                  </>
                )}

                {/* Bank Details */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Bank Details</h6>
                <div className="row mb-4">
                  <div className="col-md-3 mb-2"><strong>Bank Name:</strong> {selectedEmployee.bank_name || "N/A"}</div>
                  <div className="col-md-3 mb-2"><strong>Account No:</strong> {selectedEmployee.account_number || "N/A"}</div>
                  <div className="col-md-3 mb-2"><strong>IFSC Code:</strong> {selectedEmployee.ifsc_code || "N/A"}</div>
                  {selectedEmployee.branch_address && <div className="col-md-3 mb-2"><strong>Branch:</strong> {selectedEmployee.branch_address}</div>}
                </div>

                {/* Salary */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Salary Details</h6>
                <div className="row mb-4">
                  <div className="col-md-3 mb-2"><strong>Basic Salary:</strong> {selectedEmployee.basic_salary || "N/A"}</div>
                  <div className="col-md-3 mb-2"><strong>HRA:</strong> {selectedEmployee.hra || "N/A"}</div>
                  <div className="col-md-3 mb-2"><strong>Gross Salary:</strong> {selectedEmployee.gross_salary || "N/A"}</div>
                  <div className="col-md-3 mb-2"><strong>Net Salary:</strong> {selectedEmployee.net_salary || "N/A"}</div>
                </div>

                {/* Insurance */}
                {(selectedEmployee.insurance_provider || selectedEmployee.policy_number) && (
                  <>
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Insurance</h6>
                    <div className="row mb-4">
                      {selectedEmployee.insurance_provider && <div className="col-md-3 mb-2"><strong>Provider:</strong> {selectedEmployee.insurance_provider}</div>}
                      {selectedEmployee.policy_number && <div className="col-md-3 mb-2"><strong>Policy No:</strong> {selectedEmployee.policy_number}</div>}
                      {selectedEmployee.policy_type && <div className="col-md-3 mb-2"><strong>Type:</strong> {selectedEmployee.policy_type}</div>}
                      {selectedEmployee.coverage_amount && <div className="col-md-3 mb-2"><strong>Coverage:</strong> {selectedEmployee.coverage_amount}</div>}
                    </div>
                  </>
                )}

                {/* BGV */}
                {selectedEmployee.bgv_status && (
                  <>
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Background Verification</h6>
                    <div className="row mb-4">
                      <div className="col-md-4 mb-2"><strong>Status:</strong>{" "}
                        <span className={`badge ${selectedEmployee.bgv_status === 'Green' ? 'bg-success' : selectedEmployee.bgv_status === 'Red' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {selectedEmployee.bgv_status}
                        </span>
                      </div>
                      {selectedEmployee.bgv_remarks && <div className="col-md-8 mb-2"><strong>Remarks:</strong> {selectedEmployee.bgv_remarks}</div>}
                    </div>
                  </>
                )}

                {/* Other Details */}
                {(selectedEmployee.health_condition || selectedEmployee.addictions || selectedEmployee.pandemic_diseases) && (
                  <>
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">Other Details</h6>
                    <div className="row mb-4">
                      <div className="col-md-4 mb-2"><strong>Ready for Relocation:</strong> {selectedEmployee.ready_for_relocation ? "Yes" : "No"}</div>
                      <div className="col-md-4 mb-2"><strong>Criminal Cases:</strong> {selectedEmployee.criminal_cases ? "Yes" : "No"}</div>
                      {selectedEmployee.health_condition && <div className="col-md-4 mb-2"><strong>Health Condition:</strong> {selectedEmployee.health_condition}</div>}
                      {selectedEmployee.addictions && <div className="col-md-4 mb-2"><strong>Addictions:</strong> {selectedEmployee.addictions}</div>}
                      {selectedEmployee.pandemic_diseases && <div className="col-md-4 mb-2"><strong>Pandemic Diseases:</strong> {selectedEmployee.pandemic_diseases}</div>}
                    </div>
                  </>
                )}

              </div>

              

            </div>
          </div>
        </div>
      )}
    </div>
     </>
  );
}

 



export default EmployeeList;