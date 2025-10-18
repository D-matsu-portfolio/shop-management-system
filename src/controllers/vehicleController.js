const db = require('../config/db');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM vehicles');
    res.json(rows);
  } catch (err) {
    console.error('getVehicles Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getVehicleById Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Create a vehicle
// @route   POST /api/vehicles
// @access  Public
const createVehicle = async (req, res) => {
  const { customer_id, make, model, year, vin, license_plate, weight, vehicle_type } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO vehicles (customer_id, make, model, year, vin, license_plate, weight, vehicle_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [customer_id, make, model, year, vin, license_plate, weight, vehicle_type]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createVehicle Error:', err);
    if (err.code === '23505' && err.constraint === 'vehicles_vin_key') {
      return res.status(409).json({ msg: 'この車台番号(VIN)は既に使用されています。' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Public
const updateVehicle = async (req, res) => {
  const { customer_id, make, model, year, vin, license_plate, weight, vehicle_type } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE vehicles SET customer_id = $1, make = $2, model = $3, year = $4, vin = $5, license_plate = $6, weight = $7, vehicle_type = $8 WHERE id = $9 RETURNING *',
      [customer_id, make, model, year, vin, license_plate, weight, vehicle_type, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('updateVehicle Error:', err);
    if (err.code === '23505' && err.constraint === 'vehicles_vin_key') {
      return res.status(409).json({ msg: 'この車台番号(VIN)は既に使用されています。' });
    }
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Public
const deleteVehicle = async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Vehicle not found' });
    }
    res.json({ msg: 'Vehicle deleted' });
  } catch (err) {
    console.error('deleteVehicle Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all vehicles for a specific customer
// @route   GET /api/vehicles/by-customer/:customerId
// @access  Public
const getVehiclesByCustomerId = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY make, model', [req.params.customerId]);
    res.json(rows);
  } catch (err) {
    console.error('getVehiclesByCustomerId Error:', err);
    res.status(500).send('Server Error');
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
