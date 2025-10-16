const { Client } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Public
const getInvoices = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query(`
      SELECT i.*, c.name as customer_name, v.make, v.model, v.license_plate
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN estimates e ON i.estimate_id = e.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      ORDER BY i.invoice_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('getInvoices Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Generate an invoice from an estimate
// @route   POST /api/invoices/from-estimate/:estimateId
// @access  Public
const createInvoiceFromEstimate = async (req, res) => {
  const client = new Client(dbConfig);
  const { estimateId } = req.params;
  const { invoice_date, due_date } = req.body;

  try {
    await client.connect();
    await client.query('BEGIN');

    // 1. Get the estimate and its line items
    const estimateRes = await client.query('SELECT * FROM estimates WHERE id = $1', [estimateId]);
    if (estimateRes.rows.length === 0) throw new Error('Estimate not found');
    const estimate = estimateRes.rows[0];

    const lineItemsRes = await client.query('SELECT * FROM estimate_line_items WHERE estimate_id = $1', [estimateId]);
    const lineItems = lineItemsRes.rows;

    // 2. Create the new invoice record
    const invoiceQuery = `
      INSERT INTO invoices (customer_id, estimate_id, invoice_date, due_date, sub_total, tax, grand_total, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid', $8) RETURNING id;
    `;
    const invoiceResult = await client.query(invoiceQuery, [
      estimate.customer_id, estimate.id, invoice_date, due_date, 
      estimate.sub_total, estimate.tax, estimate.grand_total, estimate.notes
    ]);
    const invoiceId = invoiceResult.rows[0].id;

    // 3. Copy line items from estimate to invoice
    for (const item of lineItems) {
      const invoiceLineItemQuery = `
        INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5);
      `;
      await client.query(invoiceLineItemQuery, [invoiceId, item.description, item.quantity, item.unit_price, item.total_price]);
    }

    // 4. Update the estimate status to 'invoiced'
    await client.query('UPDATE estimates SET status = \'invoiced\' WHERE id = $1', [estimateId]);

    await client.query('COMMIT');
    res.status(201).json({ id: invoiceId, message: 'Invoice created successfully from estimate' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createInvoiceFromEstimate Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Get a single invoice by its ID, including all details
// @route   GET /api/invoices/:id
// @access  Public
const getInvoiceById = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    // Query 1: Get the main invoice data and join with customer/vehicle
    const invoiceQuery = `
      SELECT i.*, c.name as customer_name, c.address as customer_address, c.phone_number as customer_phone,
             v.make, v.model, v.license_plate, v.vin
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN estimates e ON i.estimate_id = e.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE i.id = $1
    `;
    const invoiceResult = await client.query(invoiceQuery, [req.params.id]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];

    // Query 2: Get the line items for this invoice
    const lineItemsQuery = `SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id`;
    const lineItemsResult = await client.query(lineItemsQuery, [req.params.id]);

    invoice.line_items = lineItemsResult.rows;

    res.json(invoice);

  } catch (err) {
    console.error('getInvoiceById Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};


module.exports = {
  getInvoices,
  createInvoiceFromEstimate,
  getInvoiceById,
};
