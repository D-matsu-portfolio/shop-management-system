const db = require('../config/db');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getCustomers = async (req, res) => {
  const { address } = req.query;

  let query = `
    SELECT c.*, h.household_name 
    FROM customers c
    LEFT JOIN households h ON c.household_id = h.id
  `;
  const queryParams = [];

  if (address) {
    query += ' WHERE c.address = $1';
    queryParams.push(address);
  }

  query += ' ORDER BY c.id';

  try {
    const { rows } = await db.query(query, queryParams);
    res.json(rows);
  } catch (err) {
    console.error('getCustomers Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Public
const getCustomerById = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getCustomerById Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Public
const createCustomer = async (req, res) => {
  const { name, phone_number, email, address, household_id } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO customers (name, phone_number, email, address, household_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone_number, email, address, household_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createCustomer Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
  const { name, phone_number, email, address, household_id } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE customers SET name = $1, phone_number = $2, email = $3, address = $4, household_id = $5 WHERE id = $6 RETURNING *',
      [name, phone_number, email, address, household_id || null, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('updateCustomer Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM customers WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Customer not found' });
    }
    res.json({ msg: 'Customer deleted' });
  } catch (err) {
    console.error('deleteCustomer Error:', err);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
