import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Attendance() {
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
    shiftTimings: "",
    regularisationDays: ""
  });

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [attendanceData, setAttendanceData] = useState({});
  const [originalData, setOriginalData] = useState(formData);
  const [hasChanges, setHasChanges] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(INITIAL_PHOTO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = getCurrentUser();
  const isHR = currentUser?.role === 'HR';

  // Government holidays (can be customized)
  const getGovernmentHolidays = (year) => {
    return [
      `${year}-01-26`, // Republic Day
      `${year}-08-15`, // Independence Day
      `${year}-10-02`, // Gandhi Jayanti
      `${year}-12-25`  // Christmas
    ];
  };

  const fetchAttendanceForMonth = useCallback((month, year) => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

    const token = sessionStorage.getItem('token');
    
    fetch(`${API_BASE_URL}/api/attendance/${id}/records?startDate=${startDate}&endDate=${endDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const attendanceMap = {};
          data.data.forEach(record => {
            attendanceMap[record.attendance_date] = record.status;
          });
          setAttendanceData(attendanceMap);
        }
      })
      .catch(err => console.error("Error fetching attendance records:", err));
  }, [id]); 

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

        const response = await fetch(`${API_BASE_URL}/api/attendance/${empIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch attendance details');
        }

        const data = await response.json();
        const attendanceInfo = data.data;
        
        const transformedData = {
          photo: attendanceInfo.photo 
          ? (attendanceInfo.photo.startsWith('http') ? attendanceInfo.photo : `${API_BASE_URL}${attendanceInfo.photo}`)
          : INITIAL_PHOTO,
          empId: attendanceInfo.empId || "",
          empName: attendanceInfo.empName || "",
          designation: attendanceInfo.designation || "",
          department: attendanceInfo.department || "",
          departmentId: attendanceInfo.departmentId || "",
          reportingManagerName: attendanceInfo.reportingManagerName || "Not Assigned",
          contact1: attendanceInfo.contact1 || "",
          contact2: attendanceInfo.contact2 || "",
          mailId1: attendanceInfo.mailId1 || "",
          mailId2: attendanceInfo.mailId2 || "",
          shiftTimings: attendanceInfo.shiftTimings || "",
          regularisationDays: attendanceInfo.regularisationDays || ""
        };
        
        setFormData(transformedData);
        setOriginalData(transformedData);
        setPhotoPreview(transformedData.photo);
        setError(null);
        
        // Fetch attendance records for current month
        fetchAttendanceForMonth(currentMonth, currentYear);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser?.emp_id, currentMonth, currentYear, fetchAttendanceForMonth]);

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

      const empUrl = isNewEntry 
        ? `${API_BASE_URL}/api/attendance`
        : `${API_BASE_URL}/api/attendance/${id}`;
      
      const empMethod = isNewEntry ? 'POST' : 'PUT';
      
      const empResponse = await fetch(empUrl, {
        method: empMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const empResult = await empResponse.json();

      if (!empResult.success) {
        alert(empResult.message || "Error saving employee details!");
        setLoading(false);
        return;
      }

      // Save attendance records
      const attendanceRecords = Object.entries(attendanceData).map(([date, status]) => ({
        empId: formData.empId,
        attendanceDate: date,
        status: status
      }));

      if (attendanceRecords.length > 0) {
        const attResponse = await fetch(`${API_BASE_URL}/api/attendance/records/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ records: attendanceRecords }),
        });

        const attResult = await attResponse.json();
        
        if (!attResult.success) {
          alert("Employee saved but error saving attendance records!");
          setLoading(false);
          return;
        }
      }

      setOriginalData(formData);
      setHasChanges(false);
      alert(empResult.message);
      
      if (isHR) {
        navigate("/attendance");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving attendance details!");
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
        navigate("/attendance");
      }
    } else {
      navigate("/attendance");
    }
  };

  // Calendar functions
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day) => {
    if (!isHR) return;
    
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const currentStatus = attendanceData[dateKey];
    const holidays = getGovernmentHolidays(currentYear);
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
    const isSunday = dayOfWeek === 0;
    const isHoliday = holidays.includes(dateKey);

    // Can't change Sundays or holidays
    if (isSunday || isHoliday) {
      alert("Cannot change attendance for Sundays and Government Holidays");
      return;
    }

    // Cycle through: present -> absent -> present
    let newStatus;
    if (currentStatus === "present") {
      newStatus = "absent";
    } else {
      newStatus = "present";
    }

    setAttendanceData(prev => ({
      ...prev,
      [dateKey]: newStatus
    }));
    setHasChanges(true);
  };

  const getDateStatus = (day) => {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceData[dateKey];
  };

  const getDateColor = (day, status) => {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holidays = getGovernmentHolidays(currentYear);
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();

    if (dayOfWeek === 0) return "#eab308"; // Sunday = yellow
    if (holidays.includes(dateKey)) return "#eab308"; // Holiday = yellow
    if (status === "present") return "#22c55e"; // Green
    if (status === "absent") return "#ef4444"; // Red
    return "transparent";
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const status = getDateStatus(day);
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const holidays = getGovernmentHolidays(currentYear);
      const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
      const isSunday = dayOfWeek === 0;
      const isHoliday = holidays.includes(dateKey);
      const bgColor = getDateColor(day, status);
      const isToday = day === new Date().getDate() && 
                      currentMonth === new Date().getMonth() && 
                      currentYear === new Date().getFullYear();
      const isClickable = isHR && !isSunday && !isHoliday;

      days.push(
        <div
          key={day}
          className="p-2 text-center position-relative"
          style={{
            cursor: isClickable ? "pointer" : "default",
            backgroundColor: bgColor,
            border: isToday ? "2px solid #3b82f6" : "1px solid #e5e7eb",
            fontWeight: status || isSunday || isHoliday ? "600" : "normal",
            color: (status || isSunday || isHoliday) ? "#fff" : "#000",
            minHeight: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "all 0.2s"
          }}
          onClick={() => handleDateClick(day)}
          title={isSunday ? "Sunday" : isHoliday ? "Government Holiday" : ""}
          onMouseEnter={(e) => {
            if (isClickable && status !== "absent") {
              e.currentTarget.style.opacity = "0.8";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  // Calculate attendance statistics (UPDATED)
  const calculateStats = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const holidays = getGovernmentHolidays(currentYear);
    let daysPresent = 0, daysLeave = 0, totalWorkingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
      const status = getDateStatus(day);

      // Count working days (Mon-Sat, excluding holidays)
      if (dayOfWeek !== 0 && !holidays.includes(dateKey)) {
        totalWorkingDays++;
        if (status === "present") {
          daysPresent++;
        } else if (status === "absent") {
          daysLeave++;
        }
      }
    }

    return { 
      daysPresent, 
      daysLeave, 
      totalWorkingDays, 
      totalDays: daysInMonth,
      attendancePercentage: totalWorkingDays > 0 ? ((daysPresent / totalWorkingDays) * 100).toFixed(2) : 0
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading attendance details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 bg-light">
        <nav className="navbar navbar-dark bg-dark shadow-sm">
          <div className="container-fluid px-4">
            <button className="btn btn-outline-light btn-sm" onClick={() => navigate(-1)}>
              ← Back 
            </button>
            <span className="navbar-brand mb-0 h1 fw-bold">
              <span className="text-primary">Attendance</span> Management
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
                <button className="btn btn-primary mt-3" onClick={() => navigate("/attendance")}>
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
      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container-fluid px-4">
          <button className="btn btn-outline-light btn-sm" onClick={() => navigate(-1)}>
            ← Back 
          </button>
          <span className="navbar-brand mb-0 h1 fw-bold">
            <span className="text-primary">Attendance</span> Management
          </span>
          <div style={{ width: "120px" }}></div>
        </div>
      </nav>

      <div className="container py-5">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              
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

              <div className="row g-3 mb-4">
                <div className="col-12">
                  <h5 className="fw-bold text-primary mb-4">Basic Information</h5>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Employee ID</label>
                  <input type="text" className="form-control bg-light fw-bold" value={formData.empId} disabled />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Employee Name</label>
                  <input type="text" className="form-control bg-light" value={formData.empName} disabled />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Designation</label>
                  <input type="text" className="form-control bg-light" value={formData.designation} disabled />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Department</label>
                  <input type="text" className="form-control bg-light" value={formData.department} disabled />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Reporting Manager</label>
                  <input type="text" className="form-control bg-light" value={formData.reportingManagerName} disabled />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Primary Contact</label>
                  <input type="tel" className="form-control bg-light" value={formData.contact1} disabled />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Secondary Contact</label>
                  <input type="tel" className="form-control bg-light" value={formData.contact2} disabled />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Primary Email</label>
                  <input type="email" className="form-control bg-light" value={formData.mailId1} disabled />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Secondary Email</label>
                  <input type="email" className="form-control bg-light" value={formData.mailId2} disabled />
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <h5 className="fw-bold text-primary mb-3">Shift Information</h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Shift Timings</label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="shiftTimings"
                    value={formData.shiftTimings}
                    onChange={handleChange}
                    placeholder="e.g., 9:00 AM - 6:00 PM"
                    disabled={!isHR}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold"># of days of Regularisation</label>
                  <input 
                    type="number" 
                    className="form-control"
                    name="regularisationDays"
                    value={formData.regularisationDays}
                    onChange={handleChange}
                    placeholder="Enter number of days"
                    min="0"
                    disabled={!isHR}
                  />
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12 mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-primary mb-0">Attendance Calendar</h5>
                    <div className="d-flex gap-3">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: "20px", height: "20px", backgroundColor: "#22c55e", borderRadius: "4px" }}></div>
                        <small>Present</small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: "20px", height: "20px", backgroundColor: "#ef4444", borderRadius: "4px" }}></div>
                        <small>Absent</small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: "20px", height: "20px", backgroundColor: "#eab308", borderRadius: "4px" }}></div>
                        <small>Sunday/Holiday</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="card border">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={handlePrevMonth}>
                        ← Previous
                      </button>
                      <h6 className="mb-0 fw-bold">
                        {monthNames[currentMonth]} {currentYear}
                      </h6>
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleNextMonth}>
                        Next →
                      </button>
                    </div>
                    <div className="card-body p-3">
                      <div className="d-grid mb-2" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                        {dayNames.map(day => (
                          <div key={day} className="text-center fw-semibold text-muted p-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="d-grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                        {renderCalendar()}
                      </div>
                      <div className="mt-3 text-center">
                        <small className="text-muted">
                          {isHR ? "Click on a weekday to toggle: Present ↔ Absent" : "Contact HR to update attendance"}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 mt-4">
                  <h6 className="fw-bold mb-3">Monthly Summary</h6>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="card border-0 bg-success text-white">
                        <div className="card-body text-center">
                          <h3 className="mb-0">{stats.daysPresent}</h3>
                          <small>Days Present</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 bg-danger text-white">
                        <div className="card-body text-center">
                          <h3 className="mb-0">{stats.daysLeave}</h3>
                          <small>Days Absent</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 bg-info text-white">
                        <div className="card-body text-center">
                          <h3 className="mb-0">{stats.totalWorkingDays}</h3>
                          <small>Total Working Days</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-0 bg-primary text-white">
                        <div className="card-body text-center">
                          <h3 className="mb-0">{stats.attendancePercentage}%</h3>
                          <small>Attendance %</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isHR && (
                <div className="row mt-5">
                  <div className="col-12">
                    {hasChanges && (
                      <div className="alert alert-warning mb-3">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        You have unsaved changes!
                      </div>
                    )}
                    <div className="d-flex gap-3 justify-content-end">
                      <button type="button" className="btn btn-secondary px-4" onClick={handleCancel}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary px-4" disabled={!hasChanges}>
                        {isNewEntry ? "Save Attendance Details" : "Update Attendance Details"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;