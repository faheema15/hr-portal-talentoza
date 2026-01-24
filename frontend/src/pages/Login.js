import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // Step 1: Enter details, Step 2: Temp password form
  const [forgotData, setForgotData] = useState({
    emp_id: "",
    email: ""
  });
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [resetData, setResetData] = useState({
    tempPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { token, user } = data.data;
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        navigate("/");
      } else {
        setError(data.message || data.error || "Login failed");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FORGOT PASSWORD HANDLERS ====================

  const handleForgotModalOpen = () => {
    setShowForgotModal(true);
    setForgotStep(1);
    setForgotError("");
    setForgotSuccess(false);
  };

  const handleForgotModalClose = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotData({ emp_id: "", email: "" });
    setForgotError("");
    setForgotSuccess(false);
    setTempPassword("");
    setResetData({ tempPassword: "", newPassword: "", confirmPassword: "" });
    setResetError("");
  };

  const handleForgotDataChange = (e) => {
    setForgotData({
      ...forgotData,
      [e.target.name]: e.target.value
    });
    setForgotError("");
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");

    try {
      if (!forgotData.emp_id || !forgotData.email) {
        setForgotError("Employee ID and Email are required");
        setForgotLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(forgotData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setForgotSuccess(true);
        setForgotStep(2);
        setTimeout(() => {
          // Auto-close after 5 seconds of success
          setShowForgotModal(false);
          setForgotStep(1);
          setForgotData({ emp_id: "", email: "" });
          setForgotSuccess(false);
        }, 5000);
      } else {
        setForgotError(data.message || "Failed to send reset email");
      }
    } catch (err) {
      setForgotError("Server error. Please try again later.");
      console.error('Forgot password error:', err);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetDataChange = (e) => {
    setResetData({
      ...resetData,
      [e.target.name]: e.target.value
    });
    setResetError("");
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");

    try {
      if (!resetData.tempPassword || !resetData.newPassword || !resetData.confirmPassword) {
        setResetError("All fields are required");
        setResetLoading(false);
        return;
      }

      if (resetData.newPassword !== resetData.confirmPassword) {
        setResetError("Passwords do not match");
        setResetLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emp_id: forgotData.emp_id,
          email: forgotData.email,
          tempPassword: resetData.tempPassword,
          newPassword: resetData.newPassword,
          confirmPassword: resetData.confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResetError("");
        setShowForgotModal(false);
        setFormData({ ...formData, email: forgotData.email });
        setForgotStep(1);
        setForgotData({ emp_id: "", email: "" });
        setResetData({ tempPassword: "", newPassword: "", confirmPassword: "" });
        setError("Password reset successful! You can now login with your new password.");
      } else {
        setResetError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setResetError("Server error. Please try again later.");
      console.error('Reset password error:', err);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                {/* Logo/Title */}
                <div className="text-center mb-4">
                  <h2 className="fw-bold">
                    <span className="text-primary">HR</span> Portal
                  </h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>

                {/* Success Message */}
                {error && !error.includes("Password reset successful") && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {error && error.includes("Password reset successful") && (
                  <div className="alert alert-success" role="alert">
                    {error}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                {/* Footer Links */}
                <div className="text-center mt-4">
                  <button 
                    type="button"
                    onClick={handleForgotModalOpen}
                    className="text-decoration-none text-primary small"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="mb-0 text-muted small">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-primary text-decoration-none fw-semibold">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== FORGOT PASSWORD MODAL ==================== */}
      {showForgotModal && (
        <>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark"
            style={{ 
              zIndex: 1040, 
              opacity: 0.5
            }}
            onClick={handleForgotModalClose}
          />
          
          <div 
            className="position-fixed top-50 start-50 translate-middle"
            style={{ 
              zIndex: 1050,
              width: "90%",
              maxWidth: "500px",
              animation: "slideDown 0.3s ease-out"
            }}
          >
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                
                {/* STEP 1: Enter Employee ID and Email */}
                {forgotStep === 1 && (
                  <>
                    <div className="text-center mb-3">
                      <div 
                        className="rounded-circle d-inline-flex align-items-center justify-content-center"
                        style={{
                          width: "60px",
                          height: "60px",
                          backgroundColor: "#E7F3FF",
                          fontSize: "1.75rem"
                        }}
                      >
                        🔐
                      </div>
                    </div>

                    <h5 className="text-center fw-bold mb-2">Reset Your Password</h5>
                    <p className="text-center text-muted mb-4 small">
                      Enter your Employee ID and Email to receive a temporary password
                    </p>

                    {forgotError && (
                      <div className="alert alert-danger small" role="alert">
                        {forgotError}
                      </div>
                    )}

                    {forgotSuccess && (
                      <div className="alert alert-success small" role="alert">
                        ✅ Email sent successfully! Check your inbox for the temporary password.
                      </div>
                    )}

                    <form onSubmit={handleForgotSubmit}>
                      <div className="mb-3">
                        <label className="form-label fw-semibold small">Employee ID</label>
                        <input
                          type="text"
                          className="form-control"
                          name="emp_id"
                          value={forgotData.emp_id}
                          onChange={handleForgotDataChange}
                          placeholder="e.g., 12345"
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold small">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={forgotData.email}
                          onChange={handleForgotDataChange}
                          placeholder="your.email@company.com"
                          required
                        />
                      </div>

                      <div className="d-flex gap-2">
                        <button 
                          type="button"
                          className="btn btn-outline-secondary flex-fill py-2"
                          onClick={handleForgotModalClose}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="btn btn-primary flex-fill py-2"
                          disabled={forgotLoading}
                        >
                          {forgotLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Sending...
                            </>
                          ) : (
                            "Send Password"
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                <style>{`
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
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Login;