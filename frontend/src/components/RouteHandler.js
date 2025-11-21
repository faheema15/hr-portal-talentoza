// components/RouteHandler.js
import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";
import EmployeeList from "./EmployeeList";

/**
 * Universal Route Handler for all HR Portal sections
 * Routes employees directly to their own data
 * Shows employee list to HR/Admin for selection
 */
function RouteHandler({ section }) {
  const currentUser = getCurrentUser();

  console.log('RouteHandler - Current user:', currentUser);
  console.log('RouteHandler - User role:', currentUser?.role);
  console.log('RouteHandler - Section:', section);

  // If user is an employee, redirect to their own details
  if (currentUser?.role === 'Employee') {  // Changed from 'employee' to 'Employee'
    // Get emp_id from user data
    const empId = currentUser.emp_id;
    
    console.log('Employee detected, emp_id:', empId);
    
    if (empId) {
      const redirectPath = `/${section}/${empId}`;
      console.log('Redirecting employee to:', redirectPath);
      return <Navigate to={redirectPath} replace />;
    } else {
      // If employee doesn't have emp_id, show error message
      return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-5 text-center">
                    <div 
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                      style={{
                        width: "80px",
                        height: "80px",
                        backgroundColor: "#FEE2E2",
                        fontSize: "2.5rem"
                      }}
                    >
                      ⚠️
                    </div>
                    <h4 className="text-danger fw-bold mb-3">No Employee ID Found</h4>
                    <p className="text-muted mb-4">
                      Your account is not linked to an employee ID. Please contact your HR department to complete your profile setup.
                    </p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.history.back()}
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  console.log('Not an employee, showing employee list');
  
  return <EmployeeList section={section} />;
}

export default RouteHandler;