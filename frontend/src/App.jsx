import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FinancialLedger from './pages/FinancialLedger';
import CheckIn from './pages/CheckIn'; // Public submission form
import Registry from './pages/Registry'; // New secure management panel
import Users from './pages/Users';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Core Executive & Admin Hub */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Financial Module */}
        <Route path="/ledger" element={<FinancialLedger />} />
        
        {/* Roster & Registry Database Segregations */}
        <Route path="/checkin" element={<CheckIn />} />   {/* PUBLIC LINK: Send this to all parishes */}
        <Route path="/registry" element={<Registry />} /> {/* SECURE DASHBOARD: Behind the login wall */}
        <Route path="/users" element={<Users />} /> {/* USER ACCESS MANAGEMENT: For approving new users */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;