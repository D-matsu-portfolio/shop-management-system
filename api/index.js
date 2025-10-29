const express = require('express');

// .envファイルはローカル開発でのみ使用
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// Middleware
app.use(express.json());

// API Routes
// Vercelでは、すべてのリクエストがこのファイルに来るため、
// Expressのルーターを使って各エンドポイントに振り分けます。
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/estimates', require('./routes/estimateRoutes'));
app.use('/api/parts', require('./routes/partsRoutes'));
app.use('/api/services', require('./routes/servicesRoutes'));
app.use('/api/households', require('./routes/householdsRoutes'));
app.use('/api/invoices', require('./routes/invoicesRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/payments', require('./routes/paymentsRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/statutory-costs', require('./routes/statutoryCostsRoutes'));

// ローカル開発時にAPIが動作しているか確認するためのルート
app.get('/api', (req, res) => {
  res.send('API is running');
});

// VercelがExpressアプリをサーバーレス関数として扱えるようにエクスポートします
module.exports = app;
