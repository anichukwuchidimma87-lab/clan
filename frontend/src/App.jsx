import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/public/Header';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Financials from './pages/Financials';
import GalleryCategory from './pages/GalleryCategory';
import Leadership from './pages/Leadership';
import CheckIn from './pages/CheckIn';
import EventCalendar from './pages/EventCalendar';
import EventDetails from './pages/EventDetails';
import WorkspaceLayout from './components/WorkspaceLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const FinancialLedger = lazy(() => import('./pages/FinancialLedger'));
const ParishLedgerDetails = lazy(() => import('./pages/ParishLedgerDetails'));
const RegistryManagement = lazy(() => import('./pages/RegistryManagement'));
const ParishDetails = lazy(() => import('./pages/ParishDetails'));
const LectorDetails = lazy(() => import('./pages/LectorDetails'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const DeaneryTargets = lazy(() => import('./pages/DeaneryTargets'));
const Users = lazy(() => import('./pages/Users'));
const ExecutiveManagement = lazy(() => import('./pages/ExecutiveManagement'));
const AdminControl = lazy(() => import('./pages/AdminControl'));
const AdminContent = lazy(() => import('./pages/AdminContent'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Birthdays = lazy(() => import('./pages/Birthdays'));

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

const PageLoading = () => (
  <div className="flex min-h-[50vh] items-center justify-center p-8">
    <p role="status" aria-live="polite" className="text-sm font-medium text-slate-600">Loading page...</p>
  </div>
);

const LazyPage = ({ component: Component }) => (
  <Suspense fallback={<PageLoading />}>
    <Component />
  </Suspense>
);

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isWorkspaceRoute = /^\/(dashboard|profile|ledger|registry(?:\/|$)|users|settings|birthdays|admin(?:\/|$))/.test(location.pathname);
  const hasToken = Boolean(localStorage.getItem('clan_token'));

  return (
    <>
      {(!isWorkspaceRoute || !hasToken) && <Header />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/gallery/:category" element={<GalleryCategory />} />
        <Route path="/leadership" element={<Leadership />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<EventCalendar />} />
        <Route path="/events/:eventId" element={<EventDetails />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route element={<WorkspaceLayout />}>
          <Route path="/dashboard" element={<LazyPage component={Dashboard} />} />
          <Route path="/profile" element={<LazyPage component={Profile} />} />
          <Route path="/birthdays" element={<RoleGate allow={['superadmin', 'executive', 'president']}><LazyPage component={Birthdays} /></RoleGate>} />
          <Route path="/settings" element={<RoleGate allow={['superadmin', 'executive']}><LazyPage component={Settings} /></RoleGate>} />
          <Route path="/ledger" element={<RoleGate allow={['superadmin', 'executive', 'president']}><LazyPage component={FinancialLedger} /></RoleGate>} />
          <Route path="/ledger/parishes/:parishId" element={<RoleGate allow={['superadmin', 'executive', 'president']}><LazyPage component={ParishLedgerDetails} /></RoleGate>} />
          <Route path="/registry" element={<RoleGate allow={['superadmin', 'executive', 'president']}><LazyPage component={RegistryManagement} /></RoleGate>} />
          <Route path="/registry/parishes/:parishId" element={<RoleGate allow={['superadmin', 'executive', 'president']}><LazyPage component={ParishDetails} /></RoleGate>} />
          <Route path="/registry/lectors/:lectorId" element={<RoleGate allow={['superadmin', 'executive', 'president']}><LazyPage component={LectorDetails} /></RoleGate>} />
          <Route path="/admin/audit" element={<RoleGate allow={['superadmin', 'executive']}><LazyPage component={AuditLogs} /></RoleGate>} />
          <Route path="/admin/deanery-targets" element={<RoleGate allow={['superadmin', 'executive']}><LazyPage component={DeaneryTargets} /></RoleGate>} />
          <Route path="/users" element={<RoleGate allow={['superadmin', 'executive']}><LazyPage component={Users} /></RoleGate>} />
          <Route path="/admin/executives" element={<RoleGate allow={['superadmin', 'executive']}><LazyPage component={ExecutiveManagement} /></RoleGate>} />
          <Route path="/admin/control" element={<RoleGate allow={['superadmin', 'executive']}><LazyPage component={AdminControl} /></RoleGate>} />
          <Route path="/admin/content/:section" element={<RoleGate allow={['superadmin', 'executive']}><LazyPage component={AdminContent} /></RoleGate>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;