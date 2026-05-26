import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';

function App() {
  return (
    <Router>
      <Routes>
        {/* LANDING PAGE FIX: Root URL now automatically redirects to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Core Financial Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Attendance Check-In Form (Moved safely to its own dedicated path) */}
        <Route path="/checkin" element={<CheckIn />} />
      </Routes>
    </Router>
  );
}

export default App;