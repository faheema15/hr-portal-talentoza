// pages/Dashboard.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../utils/authUtils";

function Dashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const allMenuItems = [ 
    { id: 1, title: "Employee Details", icon: "🧑‍💼", path: "/employee-details", color: "#4F46E5", useEmployeeList: true }, 
    { id: 2, title: "Joining Details", icon: "📝", path: "/joining-details", color: "#7C3AED", useEmployeeList: true }, 
    { id: 3, title: "Bank Details", icon: "🏦", path: "/bank-details", color: "#2563EB", useEmployeeList: true }, 
    { id: 4, title: "BGV", icon: "✓", path: "/bgv", color: "#0891B2", allowedRoles: ['HR', 'skip_level_manager'], useEmployeeList: true },
    { id: 5, title: "Projects", icon: "🔧", path: "/projects", color: "#059669", useEmployeeList: false }, 
    { id: 6, title: "Leave", icon: "🌴", path: "/leave", color: "#DC2626", useEmployeeList: true }, 
    { id: 7, title: "Attendance", icon: "📅", path: "/attendance", color: "#EA580C", useEmployeeList: true }, 
    { id: 8, title: "Salary", icon: "💰", path: "/salary", color: "#CA8A04", useEmployeeList: true }, 
    { id: 9, title: "Insurance", icon: "🛡️", path: "/insurance", color: "#DB2777", useEmployeeList: true }, 
    { id: 10, title: "Departments", icon: "🏢", path: "/departments", color: "#16A34A", allowedRoles: ['HR', 'skip_level_manager'], useEmployeeList: false }, 
    { id: 11, title: "Teams", icon: "👥", path: "/teams", color: "#0D9488", allowedRoles: ['HR', 'skip_level_manager'], useEmployeeList: false },
    { id: 12, title: "Offer Letter", icon: "📄", path: "/offer-letter", color: "#8B5CF6", allowedRoles: ['HR', 'skip_level_manager'], useEmployeeList: false }
  ];

  // Filter menu items based on user role
   const menuItems = allMenuItems.filter(item => {
    const userRole = currentUser?.role;
    if (item.allowedRoles && !item.allowedRoles.includes(userRole)) {
      return false;
    }
    return true;
  });

  const handleNavigation = (path, useEmployeeList) => {
    if (useEmployeeList === false) {
      navigate(path);
      return;
    }
    
    if (currentUser?.role === 'employee' && currentUser?.emp_id) {
      navigate(`${path}/${currentUser.emp_id}`);
    } else {
      navigate(path);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/login");
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container-fluid px-4">
          <span className="navbar-brand mb-0 h1 fw-bold">
            <span className="text-primary">HR</span> Portal
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white d-none d-md-block">
              Welcome, {currentUser?.full_name || "User"}
            </span>
            <span className="badge bg-primary">{currentUser?.role?.toUpperCase()}</span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogoutClick}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row mb-4">
          <div className="col">
            <h2 className="fw-bold text-dark mb-2">Dashboard</h2>
            <p className="text-muted">
              {currentUser?.role === 'employee' 
                ? 'View and manage your personal information' 
                : 'Manage your HR operations efficiently'}
            </p>
          </div>
        </div>

        <div className="row g-4">
          {menuItems.map((item) => (
            <div key={item.id} className="col-12 col-sm-6 col-lg-4">
              <div
                className="card h-100 border-0 shadow-sm hover-card"
                style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                onClick={() => handleNavigation(item.path, item.useEmployeeList)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                }}
              >
                <div className="card-body p-4 d-flex flex-column align-items-center text-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: "80px",
                      height: "80px",
                      backgroundColor: `${item.color}15`,
                      fontSize: "2rem"
                    }}
                  >
                    {item.icon}
                  </div>
                  <h5 className="card-title fw-semibold mb-2" style={{ color: item.color }}>
                    {item.title}
                  </h5>
                  <p className="card-text text-muted small mb-0">
                    {currentUser?.role === 'employee' 
                      ? `View your ${item.title.toLowerCase()}` 
                      : `Click to manage ${item.title.toLowerCase()}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showLogoutModal && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
            style={{ 
              zIndex: 1040, 
              opacity: 0.5,
              animation: "fadeIn 0.2s ease-in"
            }}
            onClick={handleLogoutCancel}
          />
          
          <div 
            className="position-fixed top-50 start-50 translate-middle"
            style={{ 
              zIndex: 1050,
              width: "90%",
              maxWidth: "450px",
              animation: "slideDown 0.3s ease-out"
            }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <div className="text-center mb-3">
                  <div 
                    className="rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{
                      width: "60px",
                      height: "60px",
                      backgroundColor: "#FEE2E2",
                      fontSize: "1.75rem"
                    }}
                  >
                    🚪
                  </div>
                </div>

                <h5 className="text-center fw-bold mb-2">Logout Confirmation</h5>
                <p className="text-center text-muted mb-4">
                  Are you sure you want to logout from your account?
                </p>

                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-secondary flex-fill py-2"
                    onClick={handleLogoutCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-danger flex-fill py-2"
                    onClick={handleLogoutConfirm}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 0.5; }
            }
            
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translate(-50%, -60%);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default Dashboard;