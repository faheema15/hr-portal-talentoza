// frontend/src/components/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

function Signup() {
  const navigate = useNavigate();
  const [form_data, set_form_data] = useState({
    emp_id: "",
    full_name: "",
    email: "",
    designation: "",
    department_name: "",
    reporting_manager_name: "",
    password: "",
    confirm_password: ""
  });
  const [isEmployeeVerified, setIsEmployeeVerified] = useState(false);
  const [error, set_error] = useState("");
  const [success, set_success] = useState("");
  const [loading, set_loading] = useState(false);

  const handle_change = (e) => {
    const { name, value } = e.target;
    set_form_data({
      ...form_data,
      [name]: value
    });
    set_error("");
    set_success("");
  };

  const verify_employee_id = async (emp_id) => {
  if (!emp_id) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-emp-id/${emp_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      set_form_data(prev => ({
        ...prev,
        full_name: data.data.full_name,
        email: data.data.email,
        designation: data.data.designation || "",
        department_name: data.data.department_name || "",
        reporting_manager_name: data.data.reporting_manager_name || ""
      }));
      setIsEmployeeVerified(true);
      set_error("");
    } else {
      set_error(data.message || "Invalid Employee ID");
      setIsEmployeeVerified(false);
    }
  } catch (err) {
    set_error("Error verifying Employee ID");
    setIsEmployeeVerified(false);
  }
  };

  const validate_form = () => {
    // Check if all required fields are filled
    if (!form_data.emp_id || !form_data.full_name || !form_data.email || !form_data.password || !form_data.confirm_password) {
      set_error("Please fill in all required fields");
      return false;
    }

    // Check if passwords match
    if (form_data.password !== form_data.confirm_password) {
      set_error("Passwords do not match");
      return false;
    }

    // Check password length
    if (form_data.password.length < 6) {
      set_error("Password must be at least 6 characters long");
      return false;
    }

    // Check password strength (at least one number and one letter)
    const password_regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/;
    if (!password_regex.test(form_data.password)) {
      set_error("Password must contain at least one letter and one number");
      return false;
    }

    // Email validation
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email_regex.test(form_data.email)) {
      set_error("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handle_submit = async (e) => {
    e.preventDefault();
    set_loading(true);
    set_error("");
    set_success("");

    // Validate form
    if (!validate_form()) {
      set_loading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emp_id: form_data.emp_id,
          full_name: form_data.full_name,
          email: form_data.email,
          password: form_data.password
        })
      });

      const data = await response.json();
      console.log('Signup response:', data);

      if (response.ok && data.success) {
        set_success("Account created successfully! Redirecting to login...");
        
        // Reset form
        set_form_data({
          emp_id: "",
          full_name: "",
          email: "",
          password: "",
          confirm_password: ""
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        set_error(data.message || data.error || "Signup failed");
      }
    } catch (err) {
      set_error("Server error. Please try again later.");
      console.error('Signup error:', err);
    } finally {
      set_loading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                {/* Logo/Title */}
                <div className="text-center mb-4">
                  <h2 className="fw-bold">
                    <span className="text-primary">HR</span> Portal
                  </h2>
                  <p className="text-muted">Complete Your Registration</p>
                </div>

                {/* Info Alert */}
                <div className="alert alert-info mb-4">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  <strong>Note:</strong> Use the Employee ID provided by your HR department to complete signup.
                </div>

                {/* Success Message */}
                {success && (
                  <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handle_submit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Employee ID <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="emp_id"
                      value={form_data.emp_id}
                      onChange={handle_change}
                      onBlur={(e) => verify_employee_id(e.target.value)}
                      placeholder="Enter Employee ID from HR"
                      required
                    />
                    <small className="text-muted">The ID provided by your HR department</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={form_data.full_name}
                      onChange={handle_change}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={form_data.email}
                      onChange={handle_change}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={form_data.password}
                      onChange={handle_change}
                      placeholder="Create a password"
                      required
                    />
                    <small className="text-muted">
                      Must be at least 6 characters with letters and numbers
                    </small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Confirm Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="confirm_password"
                      value={form_data.confirm_password}
                      onChange={handle_change}
                      placeholder="Confirm your password"
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
                        Creating Account...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                </form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="mb-0 text-muted small">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;