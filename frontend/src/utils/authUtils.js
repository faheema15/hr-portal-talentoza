// utils/authUtils.js

// Get current user from sessionStorage
export const getCurrentUser = () => {
  try {
    const user_string = sessionStorage.getItem('user');
    if (!user_string) return null;
    
    const user = JSON.parse(user_string);
    return user;
  } catch (error) {
    console.error('Error parsing user from sessionStorage:', error);
    return null;
  }
};

// Get token from sessionStorage
export const getToken = () => {
  return sessionStorage.getItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  return !!(token && user);
};

// Check if user has specific role
export const hasRole = (required_role) => {
  const user = getCurrentUser();
  if (!user || !user.role) return false;
  
  // Handle both string and array of roles
  if (Array.isArray(required_role)) {
    return required_role.includes(user.role);
  }
  
  return user.role === required_role;
};

// Logout user
export const logout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

// Login user - store token and user data
export const login = (token, user_data) => {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user_data));
};

// Get user role
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

// Check if user is HR
export const isHR = () => {
  return hasRole('HR');
};

// Check if user is Manager
export const isManager = () => {
  return hasRole('Manager');
};

// Check if user is Skip Manager
export const isSkipManager = () => {
  return hasRole('SkipManager');
};

// Check if user is Employee
export const isEmployee = () => {
  return hasRole('Employee');
};

// Get user ID
export const getUserId = () => {
  const user = getCurrentUser();
  return user?.id || null;
};

// Get employee ID (from employee_details table)
export const getEmployeeId = () => {
  const user = getCurrentUser();
  return user?.emp_id || null;
};