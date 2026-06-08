import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FinancialLedger from './pages/FinancialLedger';
import CheckIn from './pages/CheckIn'; // Public submission form
import RegistryManagement from './pages/RegistryManagement';
import Users from './pages/Users';
import AdminControl from './pages/AdminControl';
import AdminContent from './pages/AdminContent';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Core Executive & Admin Hub */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Financial Module */}
        <Route path="/ledger" element={<FinancialLedger />} />
        
        {/* Roster & Registry Database Segregations */}
        <Route path="/checkin" element={<CheckIn />} />   {/* PUBLIC LINK: Send this to all parishes */}
        <Route path="/registry" element={<RegistryManagement />} /> {/* SECURE DASHBOARD: Behind the login wall */}
        <Route path="/users" element={<Users />} /> {/* USER ACCESS MANAGEMENT: For approving new users */}
        <Route path="/admin/control" element={<AdminControl />} />
        <Route path="/admin/content/:section" element={<AdminContent />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;