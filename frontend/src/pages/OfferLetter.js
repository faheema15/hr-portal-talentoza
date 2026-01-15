import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function OfferLetter() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    email: "",
    employmentType: "full-time",
    role: "",
    salary: ""
  });

  const [generatedLetter, setGeneratedLetter] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [offerId, setOfferId] = useState(null);
  const [skipLevelManagerEmail, setSkipLevelManagerEmail] = useState(null);
  const [sendStatus, setSendStatus] = useState(null);
  
  // New states for offer letter table
  const [offerLetters, setOfferLetters] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState({});
  const [candidateResponse, setCandidateResponse] = useState({});
  const [viewingLetter, setViewingLetter] = useState(null);
  const [viewMode, setViewMode] = useState(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('create');

  // Fetch offer letters on component mount
  useEffect(() => {
    fetchOfferLetters();
  }, []);

  const handleViewOfferLetter = async (letter, mode) => {
    try {
      setViewMode(mode);
      setViewingLetter(letter);
      
      const today = new Date();
      const joiningDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const letterContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0; color: #333;">OFFER LETTER</h2>
          </div>

          <div style="margin-bottom: 30px;">
            <p style="margin: 0;"><strong>Date:</strong> ${today.toLocaleDateString('en-IN')}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <p><strong>${letter.name}</strong></p>
            <p>${letter.address}</p>
            <p>${letter.email}</p>
            <p>${letter.mobile}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <p><strong>Dear ${letter.name},</strong></p>
            
            <p>We are pleased to extend an offer of employment to you for the position of <strong>${letter.role}</strong> in our organization on <strong>${letter.employment_type === 'full-time' ? 'Full-Time' : letter.employment_type === 'c2h' ? 'Contract to Hire (C2H)' : letter.employment_type === 'intern-unpaid' ? 'Unpaid Internship' : 'Paid Internship'}</strong> basis.</p>

            <h3 style="margin-top: 20px; margin-bottom: 10px;">Terms and Conditions:</h3>

            <p><strong>1. Position:</strong> ${letter.role}</p>
            
            <p><strong>2. Employment Type:</strong> ${letter.employment_type === 'full-time' ? 'Full-Time Employee' : letter.employment_type === 'c2h' ? 'Contract to Hire (C2H) - 6 months' : letter.employment_type === 'intern-unpaid' ? 'Unpaid Internship' : 'Paid Internship'}</p>
            
            <p><strong>3. Commencement Date:</strong> ${joiningDate.toLocaleDateString('en-IN')}</p>

            ${letter.employment_type === 'intern-paid' || letter.employment_type === 'full-time' ? `<p><strong>4. Compensation:</strong> ₹${Number(letter.salary).toLocaleString('en-IN')} ${letter.employment_type === 'intern-paid' ? 'per month (Internship Duration)' : 'per annum'}</p>` : ''}

            <p style="margin-top: 20px;"><strong>5. Responsibilities:</strong> You will be responsible for performing duties as assigned by the company related to the position of ${letter.role}.</p>

            <p><strong>6. Code of Conduct:</strong> You are expected to adhere to the company's code of conduct, policies, and procedures.</p>

            <p><strong>7. Confidentiality:</strong> All company information, trade secrets, and intellectual property must be kept confidential.</p>

            <p><strong>8. At-Will Employment:</strong> Your employment with the company is at-will and can be terminated by either party with appropriate notice as per company policy.</p>

            <p style="margin-top: 30px;">This offer is contingent upon successful background verification and medical examination, as per company policy.</p>

            <p style="margin-top: 20px;">Please confirm your acceptance of this offer within 5 business days. In case of any queries, please feel free to contact the HR department.</p>

            <p style="margin-top: 30px;">We look forward to your association with us.</p>

            <p><strong>Best Regards,</strong></p>

            <div style="margin-top: 60px; border-top: 1px solid #999; padding-top: 10px;">
              <p style="margin: 5px 0;"><strong>HR Department</strong></p>
              <p style="margin: 5px 0;">Company Name</p>
            </div>
          </div>
        </div>
      `;
      
      setGeneratedLetter(letterContent);
      setOfferId(letter.id);
      
      setFormData({
        name: letter.name,
        mobile: letter.mobile,
        address: letter.address,
        email: letter.email,
        employmentType: letter.employment_type,
        role: letter.role,
        salary: letter.salary || ""
      });
      
      setActiveTab('create');
    } catch (error) {
      console.error('Error viewing offer letter:', error);
      alert('Failed to load offer letter');
    }
  };

  const handleCloseViewer = () => {
    setViewingLetter(null);
    setViewMode(null);
    setGeneratedLetter(null);
    setActiveTab('history');
    handleReset();
  };

  const fetchOfferLetters = async () => {
    try {
      setTableLoading(true);
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/offer-letters/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOfferLetters(data.data);
        }
      } else {
        console.error('Failed to fetch offer letters:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching offer letters:', error);
    } finally {
      setTableLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile is required";
    if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = "Mobile must be 10 digits";
    }
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.role.trim()) newErrors.role = "Role is required";
    
    if ((formData.employmentType === "intern-paid" || formData.employmentType === "full-time") && !formData.salary) {
      newErrors.salary = "Salary is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateLetter = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // STEP 1: Save offer letter to database first
      const token = sessionStorage.getItem('token');
      const pdfFileName = `offer-letter-${formData.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      
      const saveResponse = await fetch(`${API_BASE_URL}/api/offer-letters/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          mobile: formData.mobile,
          address: formData.address,
          email: formData.email,
          employmentType: formData.employmentType,
          role: formData.role,
          salary: formData.salary || null,
          pdfFileName: pdfFileName
        })
      });

      const saveData = await saveResponse.json();

      if (saveResponse.ok && saveData.success) {
        setOfferId(saveData.offerId);
        console.log('✅ Offer letter saved with ID:', saveData.offerId);
      } else {
        throw new Error(saveData.error || 'Failed to save offer letter');
      }

      // STEP 2: Generate the letter content
      const today = new Date();
      const joiningDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const letterContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0; color: #333;">OFFER LETTER</h2>
          </div>

          <div style="margin-bottom: 30px;">
            <p style="margin: 0;"><strong>Date:</strong> ${today.toLocaleDateString('en-IN')}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <p><strong>${formData.name}</strong></p>
            <p>${formData.address}</p>
            <p>${formData.email}</p>
            <p>${formData.mobile}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <p><strong>Dear ${formData.name},</strong></p>
            
            <p>We are pleased to extend an offer of employment to you for the position of <strong>${formData.role}</strong> in our organization on <strong>${formData.employmentType === 'full-time' ? 'Full-Time' : formData.employmentType === 'c2h' ? 'Contract to Hire (C2H)' : formData.employmentType === 'intern-unpaid' ? 'Unpaid Internship' : 'Paid Internship'}</strong> basis.</p>

            <h3 style="margin-top: 20px; margin-bottom: 10px;">Terms and Conditions:</h3>

            <p><strong>1. Position:</strong> ${formData.role}</p>
            
            <p><strong>2. Employment Type:</strong> ${formData.employmentType === 'full-time' ? 'Full-Time Employee' : formData.employmentType === 'c2h' ? 'Contract to Hire (C2H) - 6 months' : formData.employmentType === 'intern-unpaid' ? 'Unpaid Internship' : 'Paid Internship'}</p>
            
            <p><strong>3. Commencement Date:</strong> ${joiningDate.toLocaleDateString('en-IN')}</p>

            ${formData.employmentType === 'intern-paid' || formData.employmentType === 'full-time' ? `<p><strong>4. Compensation:</strong> ₹${Number(formData.salary).toLocaleString('en-IN')} ${formData.employmentType === 'intern-paid' ? 'per month (Internship Duration)' : 'per annum'}</p>` : ''}

            <p style="margin-top: 20px;"><strong>5. Responsibilities:</strong> You will be responsible for performing duties as assigned by the company related to the position of ${formData.role}.</p>

            <p><strong>6. Code of Conduct:</strong> You are expected to adhere to the company's code of conduct, policies, and procedures.</p>

            <p><strong>7. Confidentiality:</strong> All company information, trade secrets, and intellectual property must be kept confidential.</p>

            <p><strong>8. At-Will Employment:</strong> Your employment with the company is at-will and can be terminated by either party with appropriate notice as per company policy.</p>

            <p style="margin-top: 30px;">This offer is contingent upon successful background verification and medical examination, as per company policy.</p>

            <p style="margin-top: 20px;">Please confirm your acceptance of this offer within 5 business days. In case of any queries, please feel free to contact the HR department.</p>

            <p style="margin-top: 30px;">We look forward to your association with us.</p>

            <p><strong>Best Regards,</strong></p>

            <div style="margin-top: 60px; border-top: 1px solid #999; padding-top: 10px;">
              <p style="margin: 5px 0;"><strong>HR Department</strong></p>
              <p style="margin: 5px 0;">Company Name</p>
            </div>
          </div>
        </div>
      `;

      setGeneratedLetter(letterContent);
      setSendStatus(null);
    } catch (error) {
      console.error('❌ Error generating offer letter:', error);
      setSendStatus({
        type: 'error',
        message: error.message || 'Failed to generate offer letter'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const html2pdf = require('html2pdf.js');
    const element = document.getElementById('offer-letter-content');
    const opt = {
      margin: 10,
      filename: `offer-letter-${formData.name.replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const handleSendOfferLetter = async () => {
    try {
      setLoading(true);
      setSendStatus({ type: 'loading', message: 'Generating PDF and sending offer letter...' });

      const token = sessionStorage.getItem('token');

      // STEP 1: Generate PDF from HTML content
      const html2pdf = require('html2pdf.js');
      const element = document.getElementById('offer-letter-content');
      
      const opt = {
        margin: 10,
        filename: `offer-letter-${formData.name.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      // Generate PDF as blob
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

      // STEP 2: Convert blob to base64 for sending to backend
      const reader = new FileReader();
      const pdfBase64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      // STEP 3: Send to backend with PDF data
      const response = await fetch(`${API_BASE_URL}/api/offer-letters/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          offerId,
          candidateEmail: formData.email,
          candidateName: formData.name,
          pdfBase64: pdfBase64,
          pdfFileName: `offer-letter-${formData.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`,
          skipLevelManagerEmail: skipLevelManagerEmail
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSendStatus({ 
          type: 'success', 
          message: `✅ Offer letter sent successfully to ${formData.email}${skipLevelManagerEmail ? ` and CC to ${skipLevelManagerEmail}` : ''}` 
        });

        // Refresh the table after sending
        setTimeout(() => {
          fetchOfferLetters();
        }, 1000);
        
        console.log('✅ Email sent:', data);
      } else {
        throw new Error(data.error || 'Failed to send offer letter');
      }
    } catch (error) {
      console.error('❌ Error sending offer letter:', error);
      setSendStatus({ 
        type: 'error', 
        message: error.message || 'Failed to send offer letter. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidateResponse = async (offerId, response) => {
    try {
      const token = sessionStorage.getItem('token');

      const res = await fetch(`${API_BASE_URL}/api/offer-letters/${offerId}/response`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateResponse: response
        })
      });

      if (res.ok) {
        // Update local state
        setCandidateResponse(prev => ({
          ...prev,
          [offerId]: response
        }));

        // Refresh table
        fetchOfferLetters();

        alert(`Candidate response updated to: ${response}`);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update response');
      }
    } catch (error) {
      console.error('❌ Error updating response:', error);
      alert('Failed to update candidate response');
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      mobile: "",
      address: "",
      email: "",
      employmentType: "full-time",
      role: "",
      salary: ""
    });
    setGeneratedLetter(null);
    setErrors({});
    setOfferId(null);
    setSendStatus(null);
    setSkipLevelManagerEmail(null);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Sent':
        return <span className="badge bg-success">📧 Sent</span>;
      case 'Draft':
        return <span className="badge bg-warning text-dark">📝 Draft</span>;
      case 'Failed':
        return <span className="badge bg-danger">❌ Failed</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getCandidateResponseBadge = (status) => {
    switch(status) {
      case 'Accepted':
        return <span className="badge bg-success">✅ Accepted</span>;
      case 'Rejected':
        return <span className="badge bg-danger">❌ Rejected</span>;
      case 'Pending':
        return <span className="badge bg-warning text-dark">⏳ Pending</span>;
      default:
        return <span className="badge bg-secondary">N/A</span>;
    }
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container-fluid px-4">
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate("/")}
          >
            ← Back to Dashboard
          </button>
          <span className="navbar-brand mb-0 h1 fw-bold">
            <span className="text-primary">Offer Letter</span> Management
          </span>
          <div style={{ width: "120px" }}></div>
        </div>
      </nav>
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-14 mx-auto">
            <div className="nav nav-tabs mb-4" role="tablist">
              <button 
                className={`nav-link px-4 py-3 ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
                type="button"
              >
                📋 Offer Letter History
              </button>
              <button 
                className={`nav-link px-4 py-3 ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
                type="button"
              >
                ➕ Create New Letter
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="tab-content">
              {/* CREATE TAB */}
              {activeTab === 'create' && (
                <div>
                  {!generatedLetter ? (
                    <div className="card border-0 shadow">
                      <div className="card-body p-4">
                        <form onSubmit={handleGenerateLetter}>
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-semibold">Full Name *</label>
                              <input
                                type="text"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter candidate name"
                              />
                              {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                            </div>

                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-semibold">Mobile Number *</label>
                              <input
                                type="tel"
                                className={`form-control ${errors.mobile ? 'is-invalid' : ''}`}
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                              />
                              {errors.mobile && <div className="invalid-feedback d-block">{errors.mobile}</div>}
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-semibold">Email Address *</label>
                            <input
                              type="email"
                              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="Enter email address"
                            />
                            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-semibold">Address *</label>
                            <textarea
                              className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="Enter full address"
                              rows="2"
                            />
                            {errors.address && <div className="invalid-feedback d-block">{errors.address}</div>}
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-semibold">Employment Type *</label>
                              <select
                                className="form-select"
                                name="employmentType"
                                value={formData.employmentType}
                                onChange={handleChange}
                              >
                                <option value="full-time">Full-Time</option>
                                <option value="c2h">Contract to Hire (C2H)</option>
                                <option value="intern-unpaid">Internship (Unpaid)</option>
                                <option value="intern-paid">Internship (Paid)</option>
                              </select>
                            </div>

                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-semibold">Role/Position *</label>
                              <input
                                type="text"
                                className={`form-control ${errors.role ? 'is-invalid' : ''}`}
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                placeholder="e.g., Software Engineer"
                              />
                              {errors.role && <div className="invalid-feedback d-block">{errors.role}</div>}
                            </div>
                          </div>

                          {(formData.employmentType === 'intern-paid' || formData.employmentType === 'full-time') && (
                            <div className="mb-3">
                              <label className="form-label fw-semibold">
                                Salary ({formData.employmentType === 'intern-paid' ? 'Monthly' : 'Annual'}) *
                              </label>
                              <input
                                type="number"
                                className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                placeholder="Enter salary amount"
                              />
                              {errors.salary && <div className="invalid-feedback d-block">{errors.salary}</div>}
                            </div>
                          )}

                          <div className="d-flex gap-2 mt-4">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                              {loading ? '⏳ Generating...' : '📝 Generate Offer Letter'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={handleReset}>
                              Clear
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {sendStatus && (
                        <div className={`alert alert-${sendStatus.type === 'success' ? 'success' : sendStatus.type === 'error' ? 'danger' : 'info'} alert-dismissible fade show mb-3`} role="alert">
                          {sendStatus.message}
                          <button type="button" className="btn-close" onClick={() => setSendStatus(null)}></button>
                        </div>
                      )}

                      <div className="d-flex gap-2 mb-4 flex-wrap align-items-center">
                        {viewMode && (
                          <button 
                            className="btn btn-secondary"
                            onClick={handleCloseViewer}
                          >
                            ← Back to History
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-success"
                          onClick={handleDownloadPDF}
                          disabled={loading}
                        >
                          📥 Download as PDF
                        </button>
                        
                        {(!viewMode || viewMode === 'draft') && (
                          <button 
                            className="btn btn-info text-white"
                            onClick={handleSendOfferLetter}
                            disabled={loading}
                          >
                            {loading ? '⏳ Sending...' : '📧 Send Offer Letter'}
                          </button>
                        )}
                        
                        {!viewMode && (
                          <button 
                            className="btn btn-secondary"
                            onClick={handleReset}
                            disabled={loading}
                          >
                            ➕ Create New Letter
                          </button>
                        )}
                        
                        {viewMode === 'sent' && (
                          <div className="alert alert-info mb-0 ms-3">
                            📧 This offer letter was sent on {viewingLetter?.sent_date ? new Date(viewingLetter.sent_date).toLocaleDateString('en-IN') : 'N/A'}
                          </div>
                        )}
                      </div>

                      <div className="card border-0 shadow">
                        <div className="card-body p-5" id="offer-letter-content">
                          <div dangerouslySetInnerHTML={{ __html: generatedLetter }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div className="card border-0 shadow">
                  <div className="card-header bg-light p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">📋 Offer Letter Records</h5>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={fetchOfferLetters}
                        disabled={tableLoading}
                      >
                        {tableLoading ? '⏳ Loading...' : '🔄 Refresh'}
                      </button>
                    </div>
                  </div>

                  <div className="card-body p-4">
                    {tableLoading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : offerLetters.length === 0 ? (
                      <div className="alert alert-info">
                        No offer letters found. Create one to get started!
                      </div>
                    ) : (
                      <>
                        {/* Offer Letter Status Table */}
                        <h6 className="fw-bold mb-3">Offer Letter Status</h6>
                        {/* Combined Offer Letter Table */}
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>S.No.</th>
                                <th>Candidate Name</th>
                                <th>Email</th>
                                <th>Position</th>
                                <th>Employment Type</th>
                                <th>Status</th>
                                <th>Sent Date</th>
                                <th>CC To</th>
                                <th>Candidate Response</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {offerLetters.map((letter, index) => (
                                <tr key={letter.id}>
                                  <td className="fw-semibold">{index + 1}</td>
                                  <td>{letter.name}</td>
                                  <td>
                                    <small>{letter.email}</small>
                                  </td>
                                  <td>{letter.role}</td>
                                  <td>
                                    <small className="badge bg-light text-dark">
                                      {letter.employment_type === 'full-time' ? 'Full-Time' :
                                      letter.employment_type === 'c2h' ? 'C2H' :
                                      letter.employment_type === 'intern-paid' ? 'Paid Internship' :
                                      'Unpaid Internship'}
                                    </small>
                                  </td>
                                  <td>{getStatusBadge(letter.status)}</td>
                                  <td>
                                    <small>
                                      {letter.sent_date ? new Date(letter.sent_date).toLocaleDateString('en-IN') : 'N/A'}
                                    </small>
                                  </td>
                                  <td>
                                    <small>{letter.cc_email || 'N/A'}</small>
                                  </td>
                                  <td>
                                    {letter.status === 'Sent' ? (
                                      getCandidateResponseBadge(letter.candidate_response || 'Pending')
                                    ) : (
                                      <span className="badge bg-secondary">N/A</span>
                                    )}
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1 flex-wrap">
                                      {/* View Button - Always visible */}
                                      <button
                                        className="btn btn-sm btn-info text-white"
                                        onClick={() => handleViewOfferLetter(letter, letter.status === 'Draft' ? 'draft' : 'sent')}
                                        title="View Offer Letter"
                                      >
                                        👁️ View
                                      </button>
                                      
                                      {/* Response Buttons - Only for Sent letters */}
                                      {letter.status === 'Sent' && (
                                        <div className="btn-group btn-group-sm" role="group">
                                          <button
                                            type="button"
                                            className={`btn ${letter.candidate_response === 'Accepted' ? 'btn-success' : 'btn-outline-success'}`}
                                            onClick={() => handleUpdateCandidateResponse(letter.id, 'Accepted')}
                                            title="Mark as Accepted"
                                          >
                                            ✅
                                          </button>
                                          <button
                                            type="button"
                                            className={`btn ${letter.candidate_response === 'Rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                                            onClick={() => handleUpdateCandidateResponse(letter.id, 'Rejected')}
                                            title="Mark as Rejected"
                                          >
                                            ❌
                                          </button>
                                          <button
                                            type="button"
                                            className={`btn ${letter.candidate_response === 'Pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                                            onClick={() => handleUpdateCandidateResponse(letter.id, 'Pending')}
                                            title="Mark as Pending"
                                          >
                                            ⏳
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfferLetter;