import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function EmployeeDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNewEmployee = id === "new";

  const [formData, setFormData] = useState({
    // Required fields for HR when creating new employee
    emp_id: "",
    user_role: "Employee",
    
    // EMPLOYEE DETAILS
    photo_url: null,
    full_name: "", // RENAMED from 'user_id' to store the employee's full name
    designation: "",
    department_id: "",
    reporting_manager_id: "",
    dob: "",
    aadhar_no: "",
    pan_no: "",
    passport_no: "",
    contact1: "",
    contact2: "",
    email1: "",
    email2: "",
    father_name: "",
    mother_name: "",
    present_address: "",
    permanent_address: "",
    marital_status: "Single",
    spouse_name: "",
    emergency_contact_name: "",
    emergency_relation: "",
    emergency_contact_number: "",
    ready_for_relocation: false,
    criminal_cases: false,
    addictions: "",
    health_condition: "",
    pandemic_diseases: "",
    aadhar_document_url: null,
    pan_document_url: null,
  });

  // Education, Certification, Research Papers state
  const [educationDetails, setEducationDetails] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [researchPapers, setResearchPapers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

   // Form visibility states
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showCertificationForm, setShowCertificationForm] = useState(false);
  const [showResearchPaperForm, setShowResearchPaperForm] = useState(false);
  
  // New entry forms
  const [newEducation, setNewEducation] = useState({
    level: '',
    board_university: '',
    year_of_passing: '',
    cgpa: '',
    document_url: ''
  });
  
  const [newCertification, setNewCertification] = useState({
    exam_body: '',
    registration_no: '',
    year_of_passing: '',
    has_expiry: false,
    valid_till: '',
    certificate: ''
  });
  
  const [newResearchPaper, setNewResearchPaper] = useState({
    title: '',
    publication_name: '',
    publication_date: '',
    doi_link: '',
    research_paper: ''
  });

  const [originalData, setOriginalData] = useState(formData);
  const [hasChanges, setHasChanges] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("https://via.placeholder.com/150/cccccc/666666?text=Upload+Photo");
  const [loading, setLoading] = useState(!isNewEmployee);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [createdEmployee, setCreatedEmployee] = useState(null);

  const fetchEmployee = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      alert("Session expired. Please login again.");
      navigate("/login");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/employee-details/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      sessionStorage.removeItem('token');
      navigate("/login");
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch employee: ${response.status}`);
    }

    const responseData = await response.json();
    const data = responseData.data || responseData;
    
    const employeeData = {
      emp_id: data.emp_id || "",
      photo_url: data.photo_url || null,
      full_name: data.full_name || data.user_id || "",
      designation: data.designation || "",
      department_id: data.department_id || "",
      reporting_manager_id: data.reporting_manager_id || "",
      dob: data.dob ? data.dob.split('T')[0] : "",
      aadhar_no: data.aadhar_no || "",
      pan_no: data.pan_no || "",
      passport_no: data.passport_no || "",
      contact1: data.contact1 || "",
      contact2: data.contact2 || "",
      email1: data.email1 || "",
      email2: data.email2 || "",
      father_name: data.father_name || "",
      mother_name: data.mother_name || "",
      present_address: data.present_address || "",
      permanent_address: data.permanent_address || "",
      marital_status: data.marital_status || "Single",
      spouse_name: data.spouse_name || "",
      emergency_contact_name: data.emergency_contact_name || "",
      emergency_relation: data.emergency_relation || "",
      emergency_contact_number: data.emergency_contact_number || "",
      ready_for_relocation: data.ready_for_relocation || false,
      criminal_cases: data.criminal_cases || false,
      addictions: data.addictions || "",
      health_condition: data.health_condition || "",
      pandemic_diseases: data.pandemic_diseases || "",
      aadhar_document_url: data.aadhar_document_url || null,
      pan_document_url: data.pan_document_url || null,
    };

    setFormData(employeeData);
    setOriginalData(employeeData);
    
    // ============================================
    // FIX: Handle photo URL properly
    // ============================================
    if (employeeData.photo_url) {
      // If it's already a full URL (starts with http), use it as-is
      if (employeeData.photo_url.startsWith('http')) {
        setPhotoPreview(employeeData.photo_url);
      } else {
        // If it's a relative path, construct the full URL
        // Remove leading slash if present to avoid double slashes
        const cleanPath = employeeData.photo_url.startsWith('/') 
          ? employeeData.photo_url.substring(1) 
          : employeeData.photo_url;
        setPhotoPreview(`${API_BASE_URL}/${cleanPath}`);
      }
    } else {
      setPhotoPreview("https://via.placeholder.com/150/0066cc/ffffff?text=Employee");
    }
    // ============================================
    
    setError(null);
    setHasChanges(false);

    // Fetch additional details
    fetchEducationDetails(data.emp_id, token);
    fetchCertifications(data.emp_id, token);
    fetchResearchPapers(data.emp_id, token);
    
  } catch (err) {
    console.error("Error fetching employee:", err);
    setError(err.message || "Failed to load employee data");
  } finally {
    setLoading(false);
  }
}, [id, navigate]);

  const fetchEducationDetails = async (empId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/education/${empId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEducationDetails(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching education:", err);
    }
  };

  // Generic file upload handler
  const handleFileUpload = async (file, fieldType) => {
    if (!file) return null;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid file (PDF, JPG, PNG, DOC, DOCX)');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return null;
    }

    try {
      setUploadingFile(true);
      setUploadProgress(prev => ({ ...prev, [fieldType]: 0 }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldName', fieldType);

      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/upload/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadProgress(prev => ({ ...prev, [fieldType]: 100 }));
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fieldType];
            return newProgress;
          });
        }, 1000);
        return result.data.file_url;
      } else {
        const errorData = await response.json();
        alert(`Error uploading file: ${errorData.message}`);
        return null;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleViewDocument = (url) => {
    if (url) {
      // Handle both relative and absolute URLs
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}/${url.startsWith('/') ? url.substring(1) : url}`;
      window.open(fullUrl, '_blank');
    }
  };

  const fetchCertifications = async (empId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/${empId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCertifications(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching certifications:", err);
    }
  };

  const fetchResearchPapers = async (empId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/research-papers/${empId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResearchPapers(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching research papers:", err);
    }
  };

    const fetchDepartments = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || data || []);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/employee-details`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter only users with Manager or HR roles
        const allEmployees = data.data || data || [];
        const managersList = allEmployees.filter(emp => 
          emp.user_role === 'Manager' || 
          emp.user_role === 'SkipManager' || 
          emp.user_role === 'HR'
        );
        setManagers(managersList);
      }
    } catch (err) {
      console.error("Error fetching managers:", err);
    }
  };


  useEffect(() => {
    if (!isNewEmployee) {
      fetchEmployee();
    }
    // Fetch departments and managers for dropdowns
    fetchDepartments();
    fetchManagers();
  }, [isNewEmployee, fetchEmployee]);


  useEffect(() => {
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(hasFormChanges);
  }, [formData, originalData]);

  useEffect(() => {
    if (successMessage && !createdEmployee) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, createdEmployee]);

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Real-time check for employee ID
    if (isNewEmployee && name === 'emp_id' && value.trim()) {
      const exists = await checkEmployeeIdExists(value.trim());
      if (exists) {
        setError(`Employee ID "${value}" already exists. Please use a different ID.`);
      } else {
        setError(null);
      }
    }
    
    if (!createdEmployee) {
      setSuccessMessage(null);
    }
  };

  const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    alert('Please upload a valid image file (JPG, PNG, GIF, WEBP)');
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return;
  }

  try {
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file to server
    const formData = new FormData();
    formData.append('photo', file);

    const token = sessionStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/upload/employee-photo/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - browser handles it for FormData
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload response:', result);
      
      const uploadedPhotoUrl = result.data.photo_url;
      console.log('📸 Photo URL from server:', uploadedPhotoUrl);
      
      // Update form data with the photo URL
      setFormData(prev => ({ ...prev, photo_url: uploadedPhotoUrl }));
      
      // Auto-save the photo URL to database
      await handlePhotoUpdate(uploadedPhotoUrl);
      
      // Set preview - handle both relative and absolute URLs
      if (uploadedPhotoUrl.startsWith('http')) {
        setPhotoPreview(uploadedPhotoUrl);
      } else {
        const cleanPath = uploadedPhotoUrl.startsWith('/') 
          ? uploadedPhotoUrl.substring(1) 
          : uploadedPhotoUrl;
        setPhotoPreview(`${API_BASE_URL}/${cleanPath}`);
      }
      
      setSuccessMessage('Photo uploaded successfully!');
    } else {
      const errorData = await response.json();
      alert(`Error uploading photo: ${errorData.message}`);
    }
  } catch (error) {
    console.error('❌ Error uploading photo:', error);
    alert('Error uploading photo. Please try again.');
  }
};

const handlePhotoUpdate = async (photoUrl) => {
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/employee-details/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ photo_url: photoUrl })
    });

    if (!response.ok) {
      console.error('Failed to update photo URL in database');
    }
  } catch (error) {
    console.error('Error updating photo URL:', error);
  }
};

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (isNewEmployee) {
    if (!formData.emp_id || !formData.user_role || !formData.full_name || !formData.email1 || !formData.designation) {
      alert("Employee ID, Role, Name, Email, and Designation are required!");
      return;
    }
    
    // Check if employee ID already exists before proceeding
    const exists = await checkEmployeeIdExists(formData.emp_id);
    if (exists) {
      setError(`Employee ID "${formData.emp_id}" already exists. Please use a different ID.`);
      return;
    }
  }
  
  if (!isNewEmployee && !hasChanges) {
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

      const url = isNewEmployee 
        ? `${API_BASE_URL}/api/employee-details`
        : `${API_BASE_URL}/api/employee-details/${id}`;
      
      const method = isNewEmployee ? 'POST' : 'PUT';
      
      const dataToSend = isNewEmployee 
        ? { 
            emp_id: formData.emp_id, 
            user_role: formData.user_role,
            full_name: formData.full_name,
            email: formData.email1,
            designation: formData.designation,
            department_id: formData.department_id,
            reporting_manager_id: formData.reporting_manager_id
          }
        : formData;
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        if (isNewEmployee) {
          setCreatedEmployee(responseData.data);
          setSuccessMessage("Employee ID created successfully!");
          setLoading(false);
          setFormData({
            emp_id: "",
            user_role: "Employee",
            full_name: "", // Reset new field
          });
        } else {
          setSuccessMessage("Employee details updated successfully!");
          setTimeout(() => fetchEmployee(), 500);
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Unknown error'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving employee details!");
      setLoading(false);
    }
  };

  // --- START CRUD HANDLERS ---

  const getToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      alert("Session expired. Please login again.");
      navigate("/login");
    }
    return token;
  };
  
  // Handlers for Education
  const handleAddEducation = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    
    if (!formData.emp_id) {
      alert("Employee ID is required to add education details.");
      return;
    }

    try {
      const payload = { ...newEducation, emp_id: formData.emp_id };
      const response = await fetch(`${API_BASE_URL}/api/education/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newEntry = await response.json();
        setEducationDetails(prev => [newEntry.data, ...prev]);
        setNewEducation({
          level: '',
          board_university: '',
          year_of_passing: '',
          cgpa: '',
          document_url: ''
        });
        setShowEducationForm(false);
        setSuccessMessage("Education added successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error adding education: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Add education error:", error);
      alert("Error adding education details!");
    }
  };

  // Handlers for Certification
  const handleAddCertification = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    if (!formData.emp_id) {
      alert("Employee ID is required to add certification details.");
      return;
    }

    try {
      const payload = { ...newCertification, emp_id: formData.emp_id };
      const response = await fetch(`${API_BASE_URL}/api/certifications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newEntry = await response.json();
        setCertifications(prev => [newEntry.data, ...prev]);
        setNewCertification({
          exam_body: '',
          registration_no: '',
          year_of_passing: '',
          has_expiry: false,
          valid_till: '',
          certificate: ''
        });
        setShowCertificationForm(false);
        setSuccessMessage("Certification added successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error adding certification: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Add certification error:", error);
      alert("Error adding certification details!");
    }
  };
  
  const handleDeleteCertification = async (certId) => {
    if (!window.confirm("Are you sure you want to delete this certification?")) return;
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/${certId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        setCertifications(prev => prev.filter(cert => cert.id !== certId));
        setSuccessMessage("Certification deleted successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error deleting certification: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Delete certification error:", error);
      alert("Error deleting certification!");
    }
  };


  // Handlers for Research Papers
  const handleAddResearchPaper = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    if (!formData.emp_id) {
      alert("Employee ID is required to add research paper details.");
      return;
    }

    try {
      const payload = { ...newResearchPaper, emp_id: formData.emp_id };
      const response = await fetch(`${API_BASE_URL}/api/research-papers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newEntry = await response.json();
        setResearchPapers(prev => [newEntry.data, ...prev]);
        setNewResearchPaper({
          title: '',
          publication_name: '',
          publication_date: '',
          doi_link: '',
          research_paper: ''
        });
        setShowResearchPaperForm(false);
        setSuccessMessage("Research Paper added successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error adding research paper: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Add research paper error:", error);
      alert("Error adding research paper details!");
    }
  };

  // --- END CRUD HANDLERS ---

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const checkEmployeeIdExists = async (empId) => {
    if (!empId) return false;
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/api/employee-details/${empId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // If status is 200, employee exists
      // If status is 404, employee doesn't exist
      return response.ok;
    } catch (error) {
      console.error('Error checking employee ID:', error);
      return false;
    }
  };

  const dismissSuccessMessage = () => {
    setSuccessMessage(null);
    setCreatedEmployee(null);
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !isNewEmployee) {
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
              <span className="text-primary">Employee</span> Details
            </span>
            <div style={{ width: "120px" }}></div>
          </div>
        </nav>
        <div className="container py-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-5 text-center">
              <div className="alert alert-danger">
                <h5>Error Loading Employee</h5>
                <p>{error}</p>
                <button 
                  className="btn btn-primary mt-3"
                  onClick={() => navigate("/employee-details")}
                >
                  Back to Employee List
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
      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container-fluid px-4">
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Back 
          </button>
          <span className="navbar-brand mb-0 h1 fw-bold">
            <span className="text-primary">{isNewEmployee ? 'Create New Employee' : 'Employee Details'}</span>
          </span>
          <div style={{ width: "120px" }}></div>
        </div>
      </nav>

      <div className="container py-5">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            
            <form onSubmit={handleSubmit}>
              
              {isNewEmployee && (
                <>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4">🆕 Create Employee</h5>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Employee ID <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        className={`form-control ${error && error.includes('already exists') ? 'is-invalid' : ''}`}
                        name="emp_id"
                        value={formData.emp_id || ""}
                        onChange={handleChange}
                        placeholder="e.g., EMP001"
                        required
                        disabled={createdEmployee !== null}
                      />
                      {error && error.includes('already exists') && (
                        <div className="invalid-feedback d-block">
                          {error}
                        </div>
                      )}
                      <small className="text-muted">Unique employee identifier</small>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Role <span className="text-danger">*</span>
                      </label>
                      <select 
                        className="form-select"
                        name="user_role"
                        value={formData.user_role || "Employee"}
                        onChange={handleChange}
                        required
                        disabled={createdEmployee !== null}
                      >
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="SkipManager">Skip Level Manager</option>
                        <option value="HR">HR</option>
                      </select>
                      <small className="text-muted">Access level</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Employee Name <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="full_name"
                        value={formData.full_name || ""}
                        onChange={handleChange}
                        placeholder="Full Name"
                        required
                        disabled={createdEmployee !== null}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="email" 
                        className="form-control"
                        name="email1"
                        value={formData.email1 || ""}
                        onChange={handleChange}
                        placeholder="email@company.com"
                        required
                        disabled={createdEmployee !== null}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Designation <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="designation"
                        value={formData.designation || ""}
                        onChange={handleChange}
                        placeholder="Job Title"
                        required
                        disabled={createdEmployee !== null}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Department</label>
                      <select 
                        className="form-select"
                        name="department_id"
                        value={formData.department_id || ""}
                        onChange={handleChange}
                        disabled={createdEmployee !== null}
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Reporting Manager</label>
                      <select 
                        className="form-select"
                        name="reporting_manager_id"
                        value={formData.reporting_manager_id || ""}
                        onChange={handleChange}
                        disabled={createdEmployee !== null}
                      >
                        <option value="">Select Manager</option>
{managers.map(mgr => (
  <option key={mgr.user_id} value={mgr.user_id}>
    {mgr.user_name || mgr.full_name || mgr.user_email}
  </option>
))}
                      </select>
                    </div>

                    <div className="col-12">
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle-fill me-2"></i>
                        <strong>Note:</strong> Employee should visit the signup page and use the Employee ID to complete their registration.
                      </div>
                    </div>
                  </div>

                  {successMessage && createdEmployee && (
                    <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                      <h5 className="alert-heading">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        Employee Created Successfully!
                      </h5>
                      <hr />
                      <div className="mt-3">
                        <h6 className="fw-bold">📋 Share with Employee:</h6>
                        <div className="bg-white p-3 rounded mt-2 border">
                          <div className="row">
                            <div className="col-md-6 mb-2">
                              <strong>Employee ID:</strong> 
                              <span className="badge bg-primary ms-2 fs-6">{createdEmployee.emp_id}</span>
                              <button 
                                className="btn btn-sm btn-outline-primary ms-2"
                                onClick={() => copyToClipboard(createdEmployee.emp_id)}
                                type="button"
                              >
                                <i className="bi bi-clipboard"></i> Copy
                              </button>
                            </div>
                            <div className="col-md-6 mb-2">
                              <strong>Role:</strong> 
                              <span className="badge bg-secondary ms-2">{createdEmployee.role}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 d-flex gap-2">
                          <button 
                            className="btn btn-primary"
                            onClick={() => navigate("/employee-details")}
                            type="button"
                          >
                            <i className="bi bi-list-ul me-2"></i>
                            Go to Employee List
                          </button>
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={dismissSuccessMessage}
                            type="button"
                          >
                            <i className="bi bi-plus-circle me-2"></i>
                            Create Another Employee
                          </button>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={dismissSuccessMessage}
                        aria-label="Close"
                      ></button>
                    </div>
                  )}
                </>
              )}

              {!isNewEmployee && (
                <>
                  {successMessage && !createdEmployee && (
                    <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      {successMessage}
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setSuccessMessage(null)}
                        aria-label="Close"
                      ></button>
                    </div>
                  )}

                  {/* PHOTO SECTION */}
                  <div className="row mb-5">
                    <div className="col-12 text-center mb-4">
                      <img 
                        src={photoPreview} 
                        alt="Employee" 
                        className="img-thumbnail rounded-circle"
                        style={{ width: "200px", height: "250px", objectFit: "cover", borderRadius: "20px" }}
                      />
                      <div className="mt-3">
                        <label className="form-label fw-semibold">Upload Photo</label>
                        <input 
                          type="file" 
                          className="form-control mx-auto"
                          style={{ maxWidth: "400px" }}
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* BASIC INFO SECTION - IMPROVED GROUPING */}
                  <div className="row g-3 mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4">Basic Information</h5>
                    </div>
                    
                    {/* Employee ID and Name (Prominent) */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Employee ID</label>
                      <input 
                        type="text" 
                        className="form-control fw-bold"
                        value={id} // Use the ID from useParams for existing employee
                        disabled 
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Employee Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="full_name" // Updated field name
                        value={formData.full_name} // Updated field value
                        onChange={handleChange}
                        placeholder="Employee's Full Name"
                      />
                    </div>

                    {/* Organizational Role Group */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-secondary border-bottom pb-2">Organizational Role</h6>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Designation</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        placeholder="e.g., Software Engineer"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Department</label>
                      <select 
                        className="form-select"
                        name="department_id"
                        value={formData.department_id}
                        onChange={handleChange}
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Reporting Manager</label>
                      <select 
                        className="form-select"
                        name="reporting_manager_id"
                        value={formData.reporting_manager_id}
                        onChange={handleChange}
                      >
                        <option value="">Select Manager</option>
{managers.map(mgr => (
  <option key={mgr.user_id} value={mgr.user_id}>
    {mgr.user_name || mgr.full_name || mgr.user_email}
  </option>
))}
                      </select>
                    </div>

                    {/* Identification & Compliance Group */}
                    <div className="col-12 mt-4">
                      <h6 className="fw-bold text-secondary border-bottom pb-2">Identification & Compliance</h6>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Date of Birth</label>
                      <input 
                        type="date" 
                        className="form-control"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Aadhar Number</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="aadhar_no"
                        value={formData.aadhar_no}
                        onChange={handleChange}
                        placeholder="XXXX-XXXX-XXXX"
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-semibold">PAN Number</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="pan_no"
                        value={formData.pan_no}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Passport Number</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="passport_no"
                        value={formData.passport_no}
                        onChange={handleChange}
                        placeholder="XXXX-XXXX"
                      />
                    </div>
                  </div>

                  {/* CONTACT INFO */}
                  <div className="row g-3 mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4">Contact Information</h5>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Primary Contact</label>
                      <input 
                        type="tel" 
                        className="form-control"
                        name="contact1"
                        value={formData.contact1}
                        onChange={handleChange}
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Secondary Contact</label>
                      <input 
                        type="tel" 
                        className="form-control"
                        name="contact2"
                        value={formData.contact2}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Primary Email</label>
                      <input 
                        type="email" 
                        className="form-control"
                        name="email1"
                        value={formData.email1}
                        onChange={handleChange}
                        placeholder="employee@company.com"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Secondary Email</label>
                      <input 
                        type="email" 
                        className="form-control"
                        name="email2"
                        value={formData.email2}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* FAMILY INFO */}
                  <div className="row g-3 mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4"> Family Information</h5>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Father's Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="father_name"
                        value={formData.father_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Mother's Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="mother_name"
                        value={formData.mother_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Marital Status</label>
                      <select 
                        className="form-select"
                        name="marital_status"
                        value={formData.marital_status}
                        onChange={handleChange}
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                      </select>
                    </div>

                    {formData.marital_status === "Married" && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Spouse Name</label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="spouse_name"
                          value={formData.spouse_name}
                          onChange={handleChange}
                        />
                      </div>
                    )}
                  </div>

                  {/* ADDRESS INFO */}
                  <div className="row g-3 mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4"> Address Information</h5>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Present Address</label>
                      <textarea 
                        className="form-control"
                        name="present_address"
                        value={formData.present_address}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Current residential address"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Permanent Address</label>
                      <textarea 
                        className="form-control"
                        name="permanent_address"
                        value={formData.permanent_address}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Permanent residential address"
                      />
                    </div>
                  </div>

                  {/* EMERGENCY CONTACT */}
                  <div className="row g-3 mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4">Emergency Contact</h5>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Contact Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Relation</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="emergency_relation"
                        value={formData.emergency_relation}
                        onChange={handleChange}
                        placeholder="e.g., Father, Spouse, Sibling"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Contact Number</label>
                      <input 
                        type="tel" 
                        className="form-control"
                        name="emergency_contact_number"
                        value={formData.emergency_contact_number}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* ADDITIONAL INFO */}
                  <div className="row g-3 mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4"> Additional Information</h5>
                    </div>

                    <div className="col-md-6">
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          name="ready_for_relocation"
                          checked={formData.ready_for_relocation}
                          onChange={handleChange}
                          id="relocCheck"
                        />
                        <label className="form-check-label" htmlFor="relocCheck">
                          Ready for Relocation
                        </label>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          name="criminal_cases"
                          checked={formData.criminal_cases}
                          onChange={handleChange}
                          id="crimCheck"
                        />
                        <label className="form-check-label" htmlFor="crimCheck">
                          Any Criminal Cases
                        </label>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Addictions (if any)</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="addictions"
                        value={formData.addictions}
                        onChange={handleChange}
                        placeholder="None"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Health Condition</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="health_condition"
                        value={formData.health_condition}
                        onChange={handleChange}
                        placeholder="Good"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Pandemic Diseases</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="pandemic_diseases"
                        value={formData.pandemic_diseases}
                        onChange={handleChange}
                        placeholder="None"
                      />
                    </div>
                  </div>

                  {/* ID CARDS UPLOAD SECTION */}
                  <div className="row g-3 mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4">Identity Documents</h5>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Aadhar Card</label>
                      <input 
                        type="file"
                        className="form-control"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleFileUpload(file, 'aadhar');
                            if (url) {
                              setFormData(prev => ({ ...prev, aadhar_document_url: url }));
                              handlePhotoUpdate({ aadhar_document_url: url });
                            }
                          }
                        }}
                        disabled={uploadingFile}
                      />
                      {uploadProgress['aadhar'] !== undefined && (
                        <div className="progress mt-2" style={{height: '5px'}}>
                          <div className="progress-bar" style={{width: `${uploadProgress['aadhar']}%`}}></div>
                        </div>
                      )}
                      {formData.aadhar_document_url && (
                        <button 
                          type="button"
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => handleViewDocument(formData.aadhar_document_url)}
                        >
                          <i className="bi bi-eye me-1"></i> View Aadhar
                        </button>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">PAN Card</label>
                      <input 
                        type="file"
                        className="form-control"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = await handleFileUpload(file, 'pan');
                            if (url) {
                              setFormData(prev => ({ ...prev, pan_document_url: url }));
                              handlePhotoUpdate({ pan_document_url: url });
                            }
                          }
                        }}
                        disabled={uploadingFile}
                      />
                      {uploadProgress['pan'] !== undefined && (
                        <div className="progress mt-2" style={{height: '5px'}}>
                          <div className="progress-bar" style={{width: `${uploadProgress['pan']}%`}}></div>
                        </div>
                      )}
                      {formData.pan_document_url && (
                        <button 
                          type="button"
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => handleViewDocument(formData.pan_document_url)}
                        >
                          <i className="bi bi-eye me-1"></i> View PAN Card
                        </button>
                      )}
                    </div>
                  </div>

                  {/* EDUCATION SECTION */}
                  <div className="row mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4"> Educational Details</h5>
                    </div>
                    <div className="col-12">
                      {educationDetails.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Level</th>
                                <th>Board/University</th>
                                <th>Year of Passing</th>
                                <th>CGPA/Percentage</th>
                                <th>Document</th>
                              </tr>
                            </thead>
                            <tbody>
                              {educationDetails.map((edu, idx) => (
                                <tr key={idx}>
                                  <td>{edu.level}</td>
                                  <td>{edu.board_university}</td>
                                  <td>{edu.year_of_passing}</td>
                                  <td>{edu.cgpa}</td>
                                  <td>
                                    {edu.document_url ? (
                                      <button 
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleViewDocument(edu.document_url)}
                                      >
                                        <i className="bi bi-eye me-1"></i> View
                                      </button>
                                    ) : (
                                      <span className="text-muted">No document</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2"></i>
                          No educational details added yet.
                        </div>
                      )}
                    </div>
                    <div className="col-12 mt-3">
                      <button 
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setShowEducationForm(!showEducationForm)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        {showEducationForm ? 'Close Form' : 'Add Education'}
                      </button>
                    </div>

                    {showEducationForm && (
                      <div className="col-12 mt-3">
                        <div className="card border-primary">
                          <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">Add Educational Detail</h6>
                          </div>
                          <div className="card-body">
                            <form onSubmit={handleAddEducation}>
                              <div className="row g-3">
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">Level <span className="text-danger">*</span></label>
                                  <select 
                                    className="form-select"
                                    value={newEducation.level}
                                    onChange={(e) => setNewEducation({...newEducation, level: e.target.value})}
                                    required
                                  >
                                    <option value="">Select Level</option>
                                    <option value="10th">10th</option>
                                    <option value="12th">12th</option>
                                    <option value="Graduation">Graduation</option>
                                    <option value="PostGraduation">PostGraduation</option>
                                    <option value="PhD">PhD</option>
                                  </select>
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">Board/University <span className="text-danger">*</span></label>
                                  <input 
                                    type="text"
                                    className="form-control"
                                    value={newEducation.board_university}
                                    onChange={(e) => setNewEducation({...newEducation, board_university: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fw-semibold">Year of Passing <span className="text-danger">*</span></label>
                                  <input 
                                    type="number"
                                    className="form-control"
                                    value={newEducation.year_of_passing}
                                    onChange={(e) => setNewEducation({...newEducation, year_of_passing: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fw-semibold">CGPA/Percentage</label>
                                  <input 
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={newEducation.cgpa}
                                    onChange={(e) => setNewEducation({...newEducation, cgpa: e.target.value})}
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fw-semibold">Upload Document</label>
                                  <input 
                                    type="file"
                                    className="form-control"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const url = await handleFileUpload(file, 'education');
                                        if (url) {
                                          setNewEducation({...newEducation, document_url: url});
                                        }
                                      }
                                    }}
                                    disabled={uploadingFile}
                                  />
                                  {uploadProgress['education'] !== undefined && (
                                    <div className="progress mt-2" style={{height: '5px'}}>
                                      <div className="progress-bar" style={{width: `${uploadProgress['education']}%`}}></div>
                                    </div>
                                  )}
                                  {newEducation.document_url && (
                                    <button 
                                      type="button"
                                      className="btn btn-sm btn-outline-primary mt-2"
                                      onClick={() => handleViewDocument(newEducation.document_url)}
                                    >
                                      <i className="bi bi-eye me-1"></i> View Uploaded Document
                                    </button>
                                  )}
                                </div>
                                <div className="col-12 text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-outline-danger me-2"
                                    onClick={() => setShowEducationForm(false)}
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={uploadingFile}
                                  >
                                    Save Education
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* CERTIFICATIONS SECTION */}
                  <div className="row mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4">Certifications</h5>
                    </div>
                    <div className="col-12">
                      {certifications.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Exam Body</th>
                                <th>Registration No</th>
                                <th>Year</th>
                                <th>Valid Till</th>
                                <th>Certificate</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {certifications.map((cert, idx) => (
                                <tr key={idx}>
                                  <td>{cert.exam_body}</td>
                                  <td>{cert.registration_no}</td>
                                  <td>{cert.year_of_passing}</td>
                                  <td>
                                    {cert.has_expiry ? (
                                      cert.valid_till ? new Date(cert.valid_till).toLocaleDateString() : 'N/A'
                                    ) : (
                                      <span className="badge bg-success">No Expiry</span>
                                    )}
                                  </td>
                                  <td>
                                    {cert.certificate ? (
                                      <button 
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleViewDocument(cert.certificate)}
                                      >
                                        <i className="bi bi-eye me-1"></i> View
                                      </button>
                                    ) : (
                                      <span className="text-muted">No certificate</span>
                                    )}
                                  </td>
                                  <td>
                                    <button 
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteCertification(cert.id)}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2"></i>
                          No certifications added yet.
                        </div>
                      )}
                    </div>
                    <div className="col-12 mt-3">
                      <button 
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setShowCertificationForm(!showCertificationForm)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        {showCertificationForm ? 'Close Form' : 'Add Certification'}
                      </button>
                    </div>
                    
                    {showCertificationForm && (
                      <div className="col-12 mt-3">
                        <div className="card border-primary">
                          <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">Add Certification</h6>
                          </div>
                          <div className="card-body">
                            <form onSubmit={handleAddCertification}>
                              <div className="row g-3">
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">Exam Body <span className="text-danger">*</span></label>
                                  <input 
                                    type="text"
                                    className="form-control"
                                    value={newCertification.exam_body}
                                    onChange={(e) => setNewCertification({...newCertification, exam_body: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">Registration No <span className="text-danger">*</span></label>
                                  <input 
                                    type="text"
                                    className="form-control"
                                    value={newCertification.registration_no}
                                    onChange={(e) => setNewCertification({...newCertification, registration_no: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fw-semibold">Year of Passing <span className="text-danger">*</span></label>
                                  <input 
                                    type="number"
                                    className="form-control"
                                    value={newCertification.year_of_passing}
                                    onChange={(e) => setNewCertification({...newCertification, year_of_passing: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="col-md-4">
                                  <div className="form-check mt-4">
                                    <input 
                                      type="checkbox"
                                      className="form-check-input"
                                      id="certHasExpiry"
                                      checked={newCertification.has_expiry}
                                      onChange={(e) => setNewCertification({...newCertification, has_expiry: e.target.checked, valid_till: e.target.checked ? newCertification.valid_till : ''})}
                                    />
                                    <label className="form-check-label" htmlFor="certHasExpiry">
                                      Has Expiry Date
                                    </label>
                                  </div>
                                </div>
                                {newCertification.has_expiry && (
                                  <div className="col-md-4">
                                    <label className="form-label fw-semibold">Valid Till <span className="text-danger">*</span></label>
                                    <input 
                                      type="date"
                                      className="form-control"
                                      value={newCertification.valid_till}
                                      onChange={(e) => setNewCertification({...newCertification, valid_till: e.target.value})}
                                      required={newCertification.has_expiry}
                                    />
                                  </div>
                                )}
                               <div className="col-12">
                                  <label className="form-label fw-semibold">Upload Certificate</label>
                                  <input 
                                    type="file"
                                    className="form-control"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={async (e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const url = await handleFileUpload(file, 'certificate');
                                        if (url) {
                                          setNewCertification({...newCertification, certificate: url});
                                        }
                                      }
                                    }}
                                    disabled={uploadingFile}
                                  />
                                  {uploadProgress['certificate'] !== undefined && (
                                    <div className="progress mt-2" style={{height: '5px'}}>
                                      <div className="progress-bar" style={{width: `${uploadProgress['certificate']}%`}}></div>
                                    </div>
                                  )}
                                  {newCertification.certificate && (
                                    <button 
                                      type="button"
                                      className="btn btn-sm btn-outline-primary mt-2"
                                      onClick={() => handleViewDocument(newCertification.certificate)}
                                    >
                                      <i className="bi bi-eye me-1"></i> View Uploaded Certificate
                                    </button>
                                  )}
                                </div>
                                <div className="col-12 text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-outline-danger me-2"
                                    onClick={() => setShowCertificationForm(false)}
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={uploadingFile}
                                  >
                                    Save Certification
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* RESEARCH PAPERS SECTION */}
                  <div className="row mb-5">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-4"> Research Papers</h5>
                    </div>
                    <div className="col-12">
                      {researchPapers.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Title</th>
                                <th>Publication Name</th>
                                <th>Publication Date</th>
                                <th>DOI Link</th>
                                <th>Paper</th>
                              </tr>
                            </thead>
                            <tbody>
                              {researchPapers.map((paper, idx) => (
                                <tr key={idx}>
                                  <td>{paper.title}</td>
                                  <td>{paper.publication_name}</td>
                                  <td>{paper.publication_date ? new Date(paper.publication_date).toLocaleDateString() : 'N/A'}</td>
                                  <td>
                                    {paper.doi_link && (
                                      <a href={paper.doi_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                                        DOI
                                      </a>
                                    )}
                                  </td>
                                  <td>
                                    {paper.research_paper && (
                                      <a href={paper.research_paper} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                        View
                                      </a>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2"></i>
                          No research papers added yet.
                        </div>
                      )}
                    </div>
                    <div className="col-12 mt-3">
                      <button 
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setShowResearchPaperForm(!showResearchPaperForm)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        {showResearchPaperForm ? 'Close Form' : 'Add Research Paper'}
                      </button>
                    </div>

                    {showResearchPaperForm && (
                      <div className="col-12 mt-3">
                        <div className="card border-primary">
                          <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">Add Research Paper</h6>
                          </div>
                          <div className="card-body">
                            <form onSubmit={handleAddResearchPaper}>
                              <div className="row g-3">
                                <div className="col-md-12">
                                  <label className="form-label fw-semibold">Title <span className="text-danger">*</span></label>
                                  <input 
                                    type="text"
                                    className="form-control"
                                    value={newResearchPaper.title}
                                    onChange={(e) => setNewResearchPaper({...newResearchPaper, title: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">Publication Name <span className="text-danger">*</span></label>
                                  <input 
                                    type="text"
                                    className="form-control"
                                    value={newResearchPaper.publication_name}
                                    onChange={(e) => setNewResearchPaper({...newResearchPaper, publication_name: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">Publication Date <span className="text-danger">*</span></label>
                                  <input 
                                    type="date"
                                    className="form-control"
                                    value={newResearchPaper.publication_date}
                                    onChange={(e) => setNewResearchPaper({...newResearchPaper, publication_date: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">DOI Link</label>
                                  <input 
                                    type="url"
                                    className="form-control"
                                    value={newResearchPaper.doi_link}
                                    onChange={(e) => setNewResearchPaper({...newResearchPaper, doi_link: e.target.value})}
                                    placeholder="https://doi.org/..."
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fw-semibold">Paper URL</label>
                                  <input 
                                    type="url"
                                    className="form-control"
                                    value={newResearchPaper.research_paper}
                                    onChange={(e) => setNewResearchPaper({...newResearchPaper, research_paper: e.target.value})}
                                    placeholder="https://..."
                                  />
                                </div>
                                <div className="col-12 text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-outline-danger me-2"
                                    onClick={() => setShowResearchPaperForm(false)}
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                  >
                                    Save Research Paper
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="row mt-5">
                <div className="col-12">
                  {!isNewEmployee && hasChanges && (
                    <div className="alert alert-warning mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      You have unsaved changes!
                    </div>
                  )}
                  <div className="d-flex gap-3 justify-content-end">
                    {!createdEmployee && (
                      <button 
                        type="submit" 
                        className="btn btn-primary px-4"
                        disabled={!isNewEmployee && !hasChanges}
                      >
                        {isNewEmployee ? "Create Employee ID" : "Update Details"}
                      </button>
                    )}
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

export default EmployeeDetails;