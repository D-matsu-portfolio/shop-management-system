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

// @desc    Get all households
// @route   GET /api/households
// @access  Public
const getHouseholds = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query('SELECT * FROM households ORDER BY household_name');
    res.json(rows);
  } catch (err) {
    console.error('getHouseholds Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Create a household
// @route   POST /api/households
// @access  Public
const createHousehold = async (req, res) => {
  const client = new Client(dbConfig);
  const { household_name } = req.body;
  try {
    await client.connect();
    const { rows } = await client.query(
      'INSERT INTO households (household_name) VALUES ($1) RETURNING *',
      [household_name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createHousehold Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Update a household
// @route   PUT /api/households/:id
// @access  Public
const updateHousehold = async (req, res) => {
  const client = new Client(dbConfig);
  const { household_name } = req.body;
  try {
    await client.connect();
    const { rows } = await client.query(
      'UPDATE households SET household_name = $1 WHERE id = $2 RETURNING *',
      [household_name, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Household not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('updateHousehold Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};

// @desc    Delete a household
// @route   DELETE /api/households/:id
// @access  Public
const deleteHousehold = async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const { rows } = await client.query('DELETE FROM households WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Household not found' });
    }
    res.json({ msg: 'Household deleted' });
  } catch (err) {
    console.error('deleteHousehold Error:', err);
    res.status(500).send('Server Error');
  } finally {
    await client.end();
  }
};


module.exports = {
  getHouseholds,
  createHousehold,
  updateHousehold,
  deleteHousehold,
};
