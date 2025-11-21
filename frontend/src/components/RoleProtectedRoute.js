// components/RoleProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../utils/authUtils";

function RoleProtectedRoute({ children, allowedRoles }) {
  const currentUser = getCurrentUser();
  
  // Check if user's role is in the allowed roles list
  const hasAccess = currentUser && allowedRoles.includes(currentUser.role);

  if (!hasAccess) {
    // Redirect to dashboard with access denied message
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RoleProtectedRoute;