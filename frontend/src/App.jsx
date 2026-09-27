import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/public/Header';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FinancialLedger from './pages/FinancialLedger';
import Financials from './pages/Financials';
import GalleryCategory from './pages/GalleryCategory';
import Leadership from './pages/Leadership';
import CheckIn from './pages/CheckIn';
import RegistryManagement from './pages/RegistryManagement';
import AuditLogs from './pages/AuditLogs';
import DeaneryTargets from './pages/DeaneryTargets';
import Users from './pages/Users';
import AdminControl from './pages/AdminControl';
import AdminContent from './pages/AdminContent';
import ExecutiveManagement from './pages/ExecutiveManagement';
import EventCalendar from './pages/EventCalendar';
import Profile from './pages/Profile';

const getStoredRole = () => {
  const token = localStorage.getItem('clan_token');
  if (!token) return 'member';

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = String(payload.role || 'member').toLowerCase();
    return role === 'admin' ? 'executive' : role;
  } catch {
    return 'member';
  }
};

const RoleGate = ({ allow, children, redirect = '/dashboard' }) => {
  const role = getStoredRole();
  return allow.includes(role) ? children : <Navigate to={redirect} replace />;
};

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/gallery/:category" element={<GalleryCategory />} />
        <Route path="/leadership" element={<Leadership />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/ledger" element={<RoleGate allow={['superadmin', 'executive', 'president']}><FinancialLedger /></RoleGate>} />
        <Route path="/registry" element={<RoleGate allow={['superadmin', 'executive', 'president']}><RegistryManagement /></RoleGate>} />
        <Route path="/admin/audit" element={<RoleGate allow={['superadmin', 'executive']}><AuditLogs /></RoleGate>} />
        <Route path="/admin/deanery-targets" element={<RoleGate allow={['superadmin', 'executive']}><DeaneryTargets /></RoleGate>} />
        <Route path="/users" element={<RoleGate allow={['superadmin', 'executive']}><Users /></RoleGate>} />
        <Route path="/admin/executives" element={<RoleGate allow={['superadmin', 'executive']}><ExecutiveManagement /></RoleGate>} />
        <Route path="/admin/control" element={<RoleGate allow={['superadmin', 'executive']}><AdminControl /></RoleGate>} />
        <Route path="/admin/content/:section" element={<RoleGate allow={['superadmin', 'executive']}><AdminContent /></RoleGate>} />
        <Route path="/events" element={<RoleGate allow={['superadmin', 'executive']}><EventCalendar /></RoleGate>} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/settings" element={<Navigate to="/admin/control" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;