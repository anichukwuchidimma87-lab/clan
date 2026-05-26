import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FinancialLedger from './pages/FinancialLedger';
import CheckIn from './pages/CheckIn'; // Your existing check-in form component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* New Route Segregations */}
        <Route path="/ledger" element={<FinancialLedger />} />
        <Route path="/registry" element={<CheckIn />} />
      </Routes>
    </Router>
  );
}

export default App;