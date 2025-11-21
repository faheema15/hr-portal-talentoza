// App.js 
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import EmployeeDetails from "./pages/EmployeeDetails";
import JoiningDetails from "./pages/JoiningDetails";
import BankDetails from "./pages/BankDetails";
import BGV from "./pages/BGV";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Leave from "./pages/Leave";
import Attendance from "./pages/Attendance";
import Salary from "./pages/Salary";
import Insurance from "./pages/Insurance";
import Departments from './pages/Departments';
import Teams from './pages/Teams';
import ProtectedRoute from "./components/ProtectedRoute";
import RouteHandler from "./components/RouteHandler";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Employee Details Routes */}
        <Route 
          path="/employee-details" 
          element={
            <ProtectedRoute>
              <RouteHandler section="employee-details" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/employee-details/:id" 
          element={
            <ProtectedRoute>
              <EmployeeDetails />
            </ProtectedRoute>
          } 
        />
        
        {/* Joining Details Routes */}
        <Route 
          path="/joining-details" 
          element={
            <ProtectedRoute>
              <RouteHandler section="joining-details" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/joining-details/:id" 
          element={
            <ProtectedRoute>
              <JoiningDetails />
            </ProtectedRoute>
          } 
        />

        {/* Bank Details Routes */}
        <Route 
          path="/bank-details" 
          element={
            <ProtectedRoute>
              <RouteHandler section="bank-details" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bank-details/:id" 
          element={
            <ProtectedRoute>
              <BankDetails />
            </ProtectedRoute>
          } 
        />

        {/* BGV Routes - PROTECTED FROM EMPLOYEES */}
        <Route 
          path="/bgv" 
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['HR', 'manager', 'skip_level_manager']}>
                <RouteHandler section="bgv" />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bgv/:id" 
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['HR', 'manager', 'skip_level_manager']}>
                <BGV />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } 
        />
        
        {/* Department Routes */}
        <Route 
          path="/departments" 
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['HR', 'skip_level_manager']}>
                <Departments />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } 
        />

        {/* Project Routes */}
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/projects/:id" 
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          } 
        />

        {/* Leave Routes */}
        <Route 
          path="/leave" 
          element={
            <ProtectedRoute>
              <RouteHandler section="leave" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/leave/:id" 
          element={
            <ProtectedRoute>
              <Leave />
            </ProtectedRoute>
          } 
        />

        {/* Attendance Routes */}
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute>
              <RouteHandler section="attendance" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendance/:id" 
          element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          } 
        />

        {/* Salary Routes */}
        <Route 
          path="/salary" 
          element={
            <ProtectedRoute>
              <RouteHandler section="salary" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/salary/:id" 
          element={
            <ProtectedRoute>
              <Salary />
            </ProtectedRoute>
          } 
        />

        {/* Insurance Routes */}
        <Route 
          path="/insurance" 
          element={
            <ProtectedRoute>
              <RouteHandler section="insurance" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/insurance/:id" 
          element={
            <ProtectedRoute>
              <Insurance />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/teams" 
          element={
            <ProtectedRoute>
              <RoleProtectedRoute allowedRoles={['HR', 'manager', 'skip_level_manager']}>
                <Teams />
              </RoleProtectedRoute>
            </ProtectedRoute>
          } 
        />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;