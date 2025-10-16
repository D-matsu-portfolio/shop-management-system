require('dotenv').config();
const express = require('express');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// API Routes
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));

app.use('/api/estimates', require('./routes/estimateRoutes'));
app.use('/api/parts', require('./routes/partsRoutes'));
app.use('/api/services', require('./routes/servicesRoutes'));
app.use('/api/households', require('./routes/householdsRoutes'));
app.use('/api/invoices', require('./routes/invoicesRoutes'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});