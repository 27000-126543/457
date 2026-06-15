import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import RiskMonitor from '@/pages/RiskMonitor';
import Emergency from '@/pages/Emergency';
import Approval from '@/pages/Approval';
import Analysis from '@/pages/Analysis';
import Reports from '@/pages/Reports';
import Query from '@/pages/Query';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="risk-monitor" element={<RiskMonitor />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="approval" element={<Approval />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="reports" element={<Reports />} />
          <Route path="query" element={<Query />} />
        </Route>
      </Routes>
    </Router>
  );
}
