import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import './print.css'; // Import print-specific styles
import { CssBaseline, Typography } from '@mui/material';

function App() {
  return (
    <React.Fragment>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Typography>ダッシュボードへようこそ！</Typography>} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/households" element={<HouseholdsPage />} />
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/estimates" element={<EstimatePage />} />
            <Route path="/estimates/:id" element={<EstimateDetailPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/services" element={<ServicesPage />} />
          </Routes>
        </Layout>
      </Router>
    </React.Fragment>
  );
}

export default App;
