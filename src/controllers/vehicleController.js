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

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query('SELECT * FROM vehicles');
    res.json(rows);
  } catch (err) {
    console.error('getVehicles Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getVehicleById Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Create a vehicle
// @route   POST /api/vehicles
// @access  Public
const createVehicle = async (req, res) => {
  const client = new Client(dbConfig);
  const { customer_id, make, model, year, vin, license_plate, weight } = req.body;
  try {
    await client.connect();
    const { rows } = await client.query(
      'INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, weight) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [customer_id, make, model, year, vin, license_plate, weight]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createVehicle Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Public
const updateVehicle = async (req, res) => {
  const client = new Client(dbConfig);
  const { customer_id, make, model, year, vin, license_plate, weight } = req.body;
  try {
    await client.connect();
    const { rows } = await client.query(
      'UPDATE vehicles SET customer_id = $1, make = $2, model = $3, year = $4, vin = $5, license_plate = $6, weight = $7 WHERE id = $8 RETURNING *',
      [customer_id, make, model, year, vin, license_plate, weight, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('updateVehicle Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Public
const deleteVehicle = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.json({ msg: 'Vehicle deleted' });
  } catch (err) {
    console.error('deleteVehicle Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Get all vehicles for a specific customer
// @route   GET /api/vehicles/by-customer/:customerId
// @access  Public
const getVehiclesByCustomerId = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query('SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY make, model', [req.params.customerId]);
    res.json(rows);
  } catch (err) {
    console.error('getVehiclesByCustomerId Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};


module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByCustomerId,
};
