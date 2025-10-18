const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/db'); // Require db directly

// Define the function directly in the route file
const getDashboardStats = async (req, res) => {
  try {
    const customerCount = await db.query('SELECT COUNT(*) FROM customers');
    const vehicleCount = await db.query('SELECT COUNT(*) FROM vehicles');
    const draftEstimates = await db.query("SELECT COUNT(*) FROM estimates WHERE status = 'draft'");
    const unpaidInvoices = await db.query("SELECT COUNT(*) FROM invoices WHERE status = 'unpaid'");

    const recentEstimates = await db.query(`
      SELECT e.id, e.estimate_date, e.grand_total, c.name as customer_name
      FROM estimates e
      LEFT JOIN customers c ON e.customer_id = c.id
      ORDER BY e.estimate_date DESC, e.id DESC
      LIMIT 5
    `);

    const recentCustomers = await db.query(`
      SELECT id, name, address, created_at
      FROM customers
      ORDER BY created_at DESC, id DESC
      LIMIT 5
    `);

    res.json({
      customerCount: customerCount.rows[0].count,
      vehicleCount: vehicleCount.rows[0].count,
      draftEstimatesCount: draftEstimates.rows[0].count,
      unpaidInvoicesCount: unpaidInvoices.rows[0].count,
      recentEstimates: recentEstimates.rows,
      recentCustomers: recentCustomers.rows,
    });

  } catch (err) {
    console.error('getDashboardStats Error:', err);
    res.status(500).send('Server Error');
  }
};

// Use the locally defined function
router.get('/stats', authMiddleware, getDashboardStats);

module.exports = router;