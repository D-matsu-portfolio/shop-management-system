const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000; // Use Render's port if available

// Middleware
app.use(express.json());

// API Routes
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/estimates', require('./routes/estimateRoutes'));
app.use('/api/parts', require('./routes/partsRoutes'));
app.use('/api/services', require('./routes/servicesRoutes'));
app.use('/api/households', require('./routes/householdsRoutes'));
app.use('/api/invoices', require('./routes/invoicesRoutes'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // Serve the static files from the React app
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // Handles any requests that don't match the ones above
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running in development mode');
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});