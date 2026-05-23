import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Page Imports
import CheckIn from './pages/CheckIn';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// A lightweight wrapper to protect the Financial Dashboard layout
// For now, it reads from a local mock flag. Later, we will use genuine API tokens.
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
        <Routes>
          {/* 1. Public Member Check-In Screen (Accessible by scanning meeting QR Code) */}
          <Route path="/" element={<CheckIn />} />
          <Route path="/checkin" element={<Navigate to="/" replace />} />

          {/* 2. Admin & Financial Secretary Entry Point */}
          <Route path="/login" element={<Login />} />

          {/* 3. Protected Ledger Dashboard & Attendance Panel */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* 4. Fallback 404 Route redirecting to Check-In */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;