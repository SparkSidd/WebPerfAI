import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Comparison from './pages/Comparison';
import Research from './pages/Research';
import ImageOptimizer from './pages/ImageOptimizer';
import CodeOptimizer from './pages/CodeOptimizer';
import DeepAnalysis from './pages/DeepAnalysis';
import Reports from './pages/Reports';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-white font-sans selection:bg-neon-purple/30 selection:text-white">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compare" element={<Comparison />} />
          <Route path="/research" element={<Research />} />
          <Route path="/images" element={<ImageOptimizer />} />
          <Route path="/code" element={<CodeOptimizer />} />
          <Route path="/deep" element={<DeepAnalysis />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/history" element={<Reports />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
