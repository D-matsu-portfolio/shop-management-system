const db = require('../config/db');
const csv = require('csv-parser');
const multer = require('multer');
const { Readable } = require('stream'); // To convert buffer to stream

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory as a Buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// @desc    Get all estimates
// @route   GET /api/estimates
// @access  Public
const getEstimates = async (req, res) => {
  try {
    const { rows } = await db.query(`
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
  }
};

// @desc    Create a new estimate with line items
// @route   POST /api/estimates
// @access  Public
const createEstimate = async (req, res) => {
  const { customer_id, vehicle_id, estimate_date, status, notes, line_items } = req.body;
  const client = await db.pool.connect(); // Get a client from the pool

  try {
    await client.query('BEGIN'); // Start transaction

    const estimateQuery = `
      INSERT INTO estimates (customer_id, vehicle_id, estimate_date, status, notes)
      VALUES ($1, $2, $3, $4, $5) RETURNING id;
    `;
    const estimateResult = await client.query(estimateQuery, [customer_id, vehicle_id, estimate_date, status, notes]);
    const estimateId = estimateResult.rows[0].id;

    let sub_total = 0;
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

    const tax = sub_total * 0.10;
    const grand_total = sub_total + tax;

    const updateQuery = `UPDATE estimates SET sub_total = $1, tax = $2, grand_total = $3 WHERE id = $4`;
    await client.query(updateQuery, [sub_total, tax, grand_total, estimateId]);

    await client.query('COMMIT'); // Commit transaction

    res.status(201).json({ id: estimateId, message: 'Estimate created successfully' });

  } catch (err) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error('createEstimate Error:', err);
    res.status(500).send('Server Error');
  } finally {
    client.release(); // Release the client back to the pool
  }
};

// @desc    Get statutory fees for a given vehicle weight
// @route   GET /api/shaken-fees?vehicleWeight=1200
// @access  Public
const getShakenFees = async (req, res) => {
  const { vehicleWeight } = req.query;
  const weight = parseInt(vehicleWeight, 10);

  if (isNaN(weight)) {
    return res.status(400).json({ msg: 'Invalid vehicleWeight parameter' });
  }

  try {
    const { rows } = await db.query(
      'SELECT * FROM statutory_costs WHERE (weight_min <= $1 AND weight_max > $1) OR item_name LIKE \'%自賠責%\' OR item_name LIKE \'%印紙代%\'',
      [weight]
    );
    res.json(rows);
  } catch (err) {
    console.error('getShakenFees Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all estimates for a specific customer
// @route   GET /api/estimates/by-customer/:customerId
// @access  Public
const getEstimatesByCustomerId = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        e.id, e.estimate_date, e.status, e.grand_total,
        v.make, v.model, v.license_plate
      FROM estimates e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.customer_id =  
      ORDER BY e.estimate_date DESC
    `, [req.params.customerId]);
    res.json(rows);
  } catch (err) {
    console.error('getEstimatesByCustomerId Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all estimates for a specific vehicle
// @route   GET /api/estimates/by-vehicle/:vehicleId
// @access  Public
const getEstimatesByVehicleId = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM estimates WHERE vehicle_id =  ORDER BY estimate_date DESC', [req.params.vehicleId]);
    res.json(rows);
  } catch (err) {
    console.error('getEstimatesByVehicleId Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Get a single estimate by its ID, including all details
// @route   GET /api/estimates/:id
// @access  Public
const getEstimateById = async (req, res) => {
  try {
    const estimateQuery = `
      SELECT e.*, c.name as customer_name, c.address as customer_address, c.phone_number as customer_phone,
             v.make, v.model, v.license_plate, v.vin, v.weight
      FROM estimates e
      LEFT JOIN customers c ON e.customer_id = c.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE e.id = 
    `;
    const estimateResult = await db.query(estimateQuery, [req.params.id]);

    if (estimateResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Estimate not found' });
    }

    const estimate = estimateResult.rows[0];

    const lineItemsQuery = `SELECT * FROM estimate_line_items WHERE estimate_id =  ORDER BY id`;
    const lineItemsResult = await db.query(lineItemsQuery, [req.params.id]);

    estimate.line_items = lineItemsResult.rows;

    res.json(estimate);

  } catch (err) {
    console.error('getEstimateById Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete an estimate
// @route   DELETE /api/estimates/:id
// @access  Public
const deleteEstimate = async (req, res) => {
  try {
    // Deleting an estimate will also delete its line items due to ON DELETE CASCADE
    const { rows } = await db.query('DELETE FROM estimates WHERE id =  RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Estimate not found' });
    }
    res.json({ msg: 'Estimate deleted' });
  } catch (err) {
    console.error('deleteEstimate Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Import statutory costs from CSV
// @route   POST /api/statutory-costs/import
// @access  Private
const importStatutoryCosts = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ msg: `File upload error: ${err.message}` });
    }
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const costsToImport = [];
    const readableStream = Readable.from(req.file.buffer.toString('utf-8'));

    readableStream
      .pipe(csv())
      .on('data', (data) => {
        costsToImport.push({
          item_name: data.item_name,
          weight_min: parseInt(data.weight_min, 10) || 0,
          weight_max: parseInt(data.weight_max, 10) || 99999,
          cost: parseFloat(data.cost) || 0,
        });
      })
      .on('end', async () => {
        if (costsToImport.length === 0) {
          return res.status(400).json({ msg: 'CSV contains no data or invalid format' });
        }

        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          let importedCount = 0;
          let updatedCount = 0;

          for (const cost of costsToImport) {
            const selectQuery = `
              SELECT id FROM statutory_costs 
              WHERE item_name = $1 AND weight_min = $2 AND weight_max = $3;
            `;
            const existing = await client.query(selectQuery, [cost.item_name, cost.weight_min, cost.weight_max]);

            if (existing.rows.length > 0) {
              // Record exists, so UPDATE
              const updateQuery = `
                UPDATE statutory_costs SET cost = $1 
                WHERE id = $2;
              `;
              await client.query(updateQuery, [cost.cost, existing.rows[0].id]);
              updatedCount++;
            } else {
              // Record does not exist, so INSERT
              const insertQuery = `
                INSERT INTO statutory_costs (item_name, weight_min, weight_max, cost)
                VALUES ($1, $2, $3, $4);
              `;
              await client.query(insertQuery, [cost.item_name, cost.weight_min, cost.weight_max, cost.cost]);
              importedCount++;
            }
          }

          await client.query('COMMIT');
          res.status(200).json({ msg: `Import successful: ${importedCount} new costs added, ${updatedCount} costs updated.` });
        } catch (dbErr) {
          await client.query('ROLLBACK');
          console.error('importStatutoryCosts DB Error:', dbErr);
          res.status(500).json({ msg: 'Database error during import', error: dbErr.message });
        } finally {
          client.release();
        }
      })
      .on('error', (csvErr) => {
        console.error('CSV parsing error:', csvErr);
        res.status(400).json({ msg: 'Error parsing CSV file', error: csvErr.message });
      });
  });
};

module.exports = {
  getEstimates,
  createEstimate,
  getShakenFees,
  getEstimatesByCustomerId,
  getEstimatesByVehicleId,
  getEstimateById,
  deleteEstimate,
  importStatutoryCosts,
};