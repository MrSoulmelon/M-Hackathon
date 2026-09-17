import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { ConsumerDashboard } from './pages/ConsumerDashboard';
import { SupplierDashboard } from './pages/SupplierDashboard';
import { LoadingScreen } from './components/LoadingScreen';
import { Landing } from './pages/Landing';

import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin' || user.role === 'analyst') return <Navigate to="/admin" replace />;
    if (user.role === 'consumer') return <Navigate to="/consumer" replace />;
    if (user.role === 'supplier') return <Navigate to="/supplier" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(true);

  // Skip global loading screen for root path where Landing handles it, 
  // or if they are already authenticated and going to a dashboard.
  const isRoot = location.pathname === '/';

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          !isAuthenticated ? <Landing /> :
          (user?.role === 'admin' || user?.role === 'analyst') ? <Navigate to="/admin" replace /> :
          user?.role === 'consumer' ? <Navigate to="/consumer" replace /> :
          user?.role === 'supplier' ? <Navigate to="/supplier" replace /> :
          <Navigate to="/login" replace />
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'analyst']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/consumer" element={
          <ProtectedRoute allowedRoles={['consumer']}>
            <ConsumerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/supplier" element={
          <ProtectedRoute allowedRoles={['supplier']}>
            <SupplierDashboard />
          </ProtectedRoute>
        } />
      </Routes>

      {showLoading && !isRoot && (
        <LoadingScreen onComplete={() => setShowLoading(false)} />
      )}
    </>
  );
}

export default App;
