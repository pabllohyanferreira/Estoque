import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Clients from './pages/Clients';
import AccountsPayable from './pages/AccountsPayable';
import AccountsReceivable from './pages/AccountsReceivable';
import Catalog from './pages/Catalog';
import PublicCatalog from './pages/PublicCatalog';
import Checkout from './pages/Checkout';
import Reports from './pages/Reports';
import Sales from './pages/Sales';
import PaymentLinks from './pages/PaymentLinks';
import Users from './pages/Users';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token no localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Verificar se o token é válido
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Função para atualizar o estado de autenticação
  const updateAuthState = (authenticated) => {
    setIsAuthenticated(authenticated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/public" element={<PublicCatalog />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={() => updateAuthState(true)} />
            } />
            <Route path="/*" element={
              isAuthenticated ? (
                <Layout onLogout={() => updateAuthState(false)}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/items" element={<Items />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/accounts-payable" element={<AccountsPayable />} />
                    <Route path="/accounts-receivable" element={<AccountsReceivable />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/payment-links" element={<PaymentLinks />} />
                    <Route path="/users" element={<Users />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App; 