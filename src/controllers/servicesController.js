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

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query('SELECT * FROM services ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('getServices Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Public
const createService = async (req, res) => {
  const client = new Client(dbConfig);
  const { service_code, name, description, default_total_cost } = req.body;
  try {
    await client.connect();
    const { rows } = await client.query(
      'INSERT INTO services (service_code, name, description, default_total_cost) VALUES ($1, $2, $3, $4) RETURNING *',
      [service_code, name, description, default_total_cost]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createService Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Public
const updateService = async (req, res) => {
  const client = new Client(dbConfig);
  const { service_code, name, description, default_total_cost } = req.body;
  try {
    await client.connect();
    const { rows } = await client.query(
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
  } finally {
    await client.end();
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Public
const deleteService = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query('DELETE FROM services WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Service not found' });
    }
    res.json({ msg: 'Service deleted' });
  } catch (err) {
    console.error('deleteService Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};


module.exports = {
  getServices,
  createService,
  updateService,
  deleteService,
};
