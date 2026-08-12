import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-container" style={{ padding: '2rem' }}>
        <Loading label="Checking session..." />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-container" style={{ padding: '2rem' }}>
        <Loading label="Checking session..." />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return (
      <div className="page-container" style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
        <div className="panel-card empty-state" style={{ padding: '3rem' }}>
          <ShieldAlert size={40} className="text-warning" />
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Admin access required</p>
          <span>This section is restricted to admin accounts.</span>
        </div>
      </div>
    );
  }
  return children;
};
