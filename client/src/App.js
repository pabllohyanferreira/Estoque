import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Clients from './pages/Clients';
import AccountsPayable from './pages/AccountsPayable';
import AccountsReceivable from './pages/AccountsReceivable';
import Catalog from './pages/Catalog';
import PublicCatalog from './pages/PublicCatalog';
import Reports from './pages/Reports';
import Sales from './pages/Sales';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/public" element={<PublicCatalog />} />
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/items" element={<Items />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/accounts-payable" element={<AccountsPayable />} />
                  <Route path="/accounts-receivable" element={<AccountsReceivable />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/sales" element={<Sales />} />
                </Routes>
              </Layout>
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