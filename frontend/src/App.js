import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CustomerList from './components/CustomerList';
import VehicleList from './components/VehicleList';
import EstimatePage from './components/EstimatePage';
import PartsPage from './components/PartsPage';
import ServicesPage from './components/ServicesPage';
import CustomerDetailPage from './components/CustomerDetailPage';
import HouseholdsPage from './components/HouseholdsPage';
import EstimateDetailPage from './components/EstimateDetailPage';
import InvoicesPage from './components/InvoicesPage';
import InvoiceDetailPage from './components/InvoiceDetailPage';
import StatutoryCostsPage from './components/StatutoryCostsPage'; // Import the new page
import LoginPage from './components/LoginPage'; // Import the login page
import RegisterPage from './components/RegisterPage'; // Import the register page
import ImportPage from './components/ImportPage'; // Import the ImportPage
import { AuthContext } from './context/AuthContext'; // Import the auth context
import './print.css';
import { CssBaseline, Typography } from '@mui/material';

// A wrapper for protected routes
const PrivateRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Typography>ダッシュボードへようこそ！</Typography>} />
      <Route path="/customers" element={<CustomerList />} />
      <Route path="/customers/:id" element={<CustomerDetailPage />} />
      <Route path="/households" element={<HouseholdsPage />} />
      <Route path="/vehicles" element={<VehicleList />} />
      <Route path="/estimates" element={<EstimatePage />} />
      <Route path="/estimates/new" element={<EstimateDetailPage />} />
      <Route path="/estimates/:id" element={<EstimateDetailPage />} />
      <Route path="/invoices" element={<InvoicesPage />} />
      <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
      <Route path="/parts" element={<PartsPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/statutory-costs" element={<StatutoryCostsPage />} />
      <Route path="/import" element={<ImportPage />} />
      {/* Redirect any other path to dashboard */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </Layout>
);

function App() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <React.Fragment>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/*" 
            element={isAuthenticated ? <PrivateRoutes /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
    </React.Fragment>
  );
}

export default App;

