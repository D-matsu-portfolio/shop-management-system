const db = require('../config/db');

// @desc    Get all statutory costs
// @route   GET /api/statutory-costs
// @access  Private
const getStatutoryCosts = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM statutory_costs ORDER BY item_name, weight_min');
    res.json(rows);
  } catch (err) {
    console.error('getStatutoryCosts Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Create a statutory cost
// @route   POST /api/statutory-costs
// @access  Private
const createStatutoryCost = async (req, res) => {
  const { item_name, weight_min, weight_max, cost, notes } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO statutory_costs (item_name, weight_min, weight_max, cost, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [item_name, weight_min, weight_max, cost, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createStatutoryCost Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a statutory cost
// @route   PUT /api/statutory-costs/:id
// @access  Private
const updateStatutoryCost = async (req, res) => {
  const { id } = req.params;
  const { item_name, weight_min, weight_max, cost, notes } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE statutory_costs SET item_name = $1, weight_min = $2, weight_max = $3, cost = $4, notes = $5 WHERE id = $6 RETURNING *',
      [item_name, weight_min, weight_max, cost, notes, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Statutory cost not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('updateStatutoryCost Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a statutory cost
// @route   DELETE /api/statutory-costs/:id
// @access  Private
const deleteStatutoryCost = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('DELETE FROM statutory_costs WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Statutory cost not found' });
    }
    res.json({ msg: 'Statutory cost deleted' });
  } catch (err) {
    console.error('deleteStatutoryCost Error:', err);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getStatutoryCosts,
  createStatutoryCost,
  updateStatutoryCost,
  deleteStatutoryCost,
};
