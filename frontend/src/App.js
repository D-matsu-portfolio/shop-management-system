import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import { AuthContext } from './context/AuthContext';

// Layout and Pages
import Layout from './components/Layout';
import DashboardPage from './components/DashboardPage';
import CustomerList from './components/CustomerList';
import CustomerDetailPage from './components/CustomerDetailPage';
import HouseholdsPage from './components/HouseholdsPage';
import VehicleList from './components/VehicleList';
import EstimatePage from './components/EstimatePage';

import EstimateDetailPage from './components/EstimateDetailPage';
import InvoicesPage from './components/InvoicesPage';
import InvoiceDetailPage from './components/InvoiceDetailPage';
import PartsPage from './components/PartsPage';
import ServicesPage from './components/ServicesPage';
import StatutoryCostsPage from './components/StatutoryCostsPage';
import ImportPage from './components/ImportPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

import './print.css';

// A wrapper for authenticated routes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        {isAuthenticated && <Layout />}
        <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
          {isAuthenticated && <Toolbar />}
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />

            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
            <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetailPage /></ProtectedRoute>} />
            <Route path="/households" element={<ProtectedRoute><HouseholdsPage /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><VehicleList /></ProtectedRoute>} />
            <Route path="/estimates" element={<ProtectedRoute><EstimatePage /></ProtectedRoute>} />
            <Route path="/estimates/new" element={<ProtectedRoute><EstimateDetailPage /></ProtectedRoute>} />
            <Route path="/estimates/:id" element={<ProtectedRoute><EstimateDetailPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
            <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetailPage /></ProtectedRoute>} />
            <Route path="/parts" element={<ProtectedRoute><PartsPage /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
            <Route path="/statutory-costs" element={<ProtectedRoute><StatutoryCostsPage /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;