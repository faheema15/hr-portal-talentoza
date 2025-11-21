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
      console.log('Login response:', data);

      if (response.ok && data.success) {
        // Backend returns: { success: true, data: { token, user } }
        const { token, user } = data.data;
        
        // Store token and user info in sessionStorage (changed from localStorage)
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        
        console.log('Login successful, stored:', { token, user });
        
        // Redirect to dashboard
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

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger" role="alert">
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
                  <Link to="/forgot-password" className="text-decoration-none text-primary small">
                    Forgot Password?
                  </Link>
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
    </div>
  );
}

export default Login;