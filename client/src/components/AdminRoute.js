import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  // Verificar se o usuário está logado e é admin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user || user.role !== 'admin') {
    // Se não for admin, redirecionar para dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default AdminRoute;
