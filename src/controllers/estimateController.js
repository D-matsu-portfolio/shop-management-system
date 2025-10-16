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

// @desc    Get all estimates
// @route   GET /api/estimates
// @access  Public
const getEstimates = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query(`
      SELECT 
        e.id, e.estimate_date, e.status, e.grand_total, 
        c.name as customer_name, 
        v.make, v.model, v.license_plate 
      FROM estimates e
      LEFT JOIN customers c ON e.customer_id = c.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      ORDER BY e.estimate_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('getEstimates Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Create a new estimate with line items
// @route   POST /api/estimates
// @access  Public
const createEstimate = async (req, res) => {
  const client = new Client(dbConfig);
  // Note: `notes` field is added to the request body
  const { customer_id, vehicle_id, estimate_date, status, notes, line_items } = req.body;

  try {
    await client.connect();
    await client.query('BEGIN'); // Start transaction

    // Insert the main estimate record first, with temporary totals
    const estimateQuery = `
      INSERT INTO estimates (customer_id, vehicle_id, estimate_date, status, notes)
      VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `;
    const estimateResult = await client.query(estimateQuery, [customer_id, vehicle_id, estimate_date, status, notes]);
    const estimateId = estimateResult.rows[0].id;

    let sub_total = 0;
    // Insert each line item and calculate sub_total
    for (const item of line_items) {
      const itemTotalPrice = Number(item.quantity) * Number(item.unit_price);
      sub_total += itemTotalPrice;
      const lineItemQuery = `
        INSERT INTO estimate_line_items (estimate_id, item_type, part_id, service_id, description, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `;
      await client.query(lineItemQuery, [
        estimateId, 
        item.item_type, 
        item.part_id || null, 
        item.service_id || null, 
        item.description, 
        item.quantity, 
        item.unit_price, 
        itemTotalPrice
      ]);
    }

    // Calculate final totals (e.g., 10% tax)
    const tax = sub_total * 0.10;
    const grand_total = sub_total + tax;

    // Now, update the estimate with the correct totals
    const updateQuery = `UPDATE estimates SET sub_total = $1, tax = $2, grand_total = $3 WHERE id = $4`;
    await client.query(updateQuery, [sub_total, tax, grand_total, estimateId]);

    await client.query('COMMIT'); // Commit transaction

    res.status(201).json({ id: estimateId, message: 'Estimate created successfully' });

  } catch (err) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error('createEstimate Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Get statutory fees for a given vehicle weight
// @route   GET /api/shaken-fees?vehicleWeight=1200
// @access  Public
const getShakenFees = async (req, res) => {
  const client = new Client(dbConfig);
  const { vehicleWeight } = req.query;
  const weight = parseInt(vehicleWeight, 10);

  if (isNaN(weight)) {
    return res.status(400).json({ msg: 'Invalid vehicleWeight parameter' });
  }

  try {
    await client.connect();
    // Find fees where the vehicle weight falls within the bracket
    // Also include fees that are not weight-dependent (e.g., where min/max is a wide range or a specific code)
    const { rows } = await client.query(
      'SELECT * FROM statutory_costs WHERE (weight_min <= $1 AND weight_max > $1) OR (item_name LIKE \'%自賠責%\' AND weight_max > $1) OR (item_name LIKE \'%印紙代%\')',
      [weight]
    );
    res.json(rows);
  } catch (err) {
    console.error('getShakenFees Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Get all estimates for a specific customer
// @route   GET /api/estimates/by-customer/:customerId
// @access  Public
const getEstimatesByCustomerId = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query(`
      SELECT 
        e.id, e.estimate_date, e.status, e.grand_total,
        v.make, v.model, v.license_plate
      FROM estimates e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.customer_id = $1 
      ORDER BY e.estimate_date DESC
    `, [req.params.customerId]);
    res.json(rows);
  } catch (err) {
    console.error('getEstimatesByCustomerId Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Get all estimates for a specific vehicle
// @route   GET /api/estimates/by-vehicle/:vehicleId
// @access  Public
const getEstimatesByVehicleId = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query('SELECT * FROM estimates WHERE vehicle_id = $1 ORDER BY estimate_date DESC', [req.params.vehicleId]);
    res.json(rows);
  } catch (err) {
    console.error('getEstimatesByVehicleId Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Get a single estimate by its ID, including all details
// @route   GET /api/estimates/:id
// @access  Public
const getEstimateById = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    // Query 1: Get the main estimate data and join with customer/vehicle
    const estimateQuery = `
      SELECT e.*, c.name as customer_name, c.address as customer_address, c.phone_number as customer_phone,
             v.make, v.model, v.license_plate, v.vin, v.weight
      FROM estimates e
      LEFT JOIN customers c ON e.customer_id = c.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.id = $1
    `;
    const estimateResult = await client.query(estimateQuery, [req.params.id]);

    if (estimateResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Estimate not found' });
    }

    const estimate = estimateResult.rows[0];

    // Query 2: Get the line items for this estimate
    const lineItemsQuery = `SELECT * FROM estimate_line_items WHERE estimate_id = $1 ORDER BY id`;
    const lineItemsResult = await client.query(lineItemsQuery, [req.params.id]);

    estimate.line_items = lineItemsResult.rows;

    res.json(estimate);

  } catch (err) {
    console.error('getEstimateById Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Delete an estimate
// @route   DELETE /api/estimates/:id
// @access  Public
const deleteEstimate = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    // Deleting an estimate will also delete its line items due to ON DELETE CASCADE
    const { rows } = await client.query('DELETE FROM estimates WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Estimate not found' });
    }
    res.json({ msg: 'Estimate deleted' });
  } catch (err) {
    console.error('deleteEstimate Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};


module.exports = {
  getEstimates,
  createEstimate,
  getShakenFees,
  getEstimatesByCustomerId,
  getEstimatesByVehicleId,
  getEstimateById,
  deleteEstimate,
};