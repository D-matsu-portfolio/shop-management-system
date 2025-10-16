const db = require('../config/db');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM services ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('getServices Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Public
const createService = async (req, res) => {
  const { service_code, name, description, default_total_cost } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO services (service_code, name, description, default_total_cost) VALUES ($1, $2, $3, $4) RETURNING *',
      [service_code, name, description, default_total_cost]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createService Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Public
const updateService = async (req, res) => {
  const { service_code, name, description, default_total_cost } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE services SET service_code = $1, name = $2, description = $3, default_total_cost = $4 WHERE id = $5 RETURNING *',
      [service_code, name, description, default_total_cost, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Service not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('updateService Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Public
const deleteService = async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM services WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Service not found' });
    }
    res.json({ msg: 'Service deleted' });
  } catch (err) {
    console.error('deleteService Error:', err);
    res.status(500).send('Server Error');
  }
};


module.exports = {
  getServices,
  createService,
  updateService,
  deleteService,
};
