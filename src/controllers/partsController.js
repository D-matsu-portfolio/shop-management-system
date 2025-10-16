const db = require('../config/db');

// @desc    Get all parts
// @route   GET /api/parts
// @access  Public
const getParts = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM parts ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('getParts Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Create a part
// @route   POST /api/parts
// @access  Public
const createPart = async (req, res) => {
  const { part_number, name, description, cost_price, sale_price } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO parts (part_number, name, description, cost_price, sale_price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [part_number, name, description, cost_price, sale_price]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createPart Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Update a part
// @route   PUT /api/parts/:id
// @access  Public
const updatePart = async (req, res) => {
  const { part_number, name, description, cost_price, sale_price } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE parts SET part_number = $1, name = $2, description = $3, cost_price = $4, sale_price = $5 WHERE id = $6 RETURNING *',
      [part_number, name, description, cost_price, sale_price, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Part not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('updatePart Error:', err);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a part
// @route   DELETE /api/parts/:id
// @access  Public
const deletePart = async (req, res) => {
  try {
    const { rows } = await db.query('DELETE FROM parts WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'Part not found' });
    }
    res.json({ msg: 'Part deleted' });
  } catch (err) {
    console.error('deletePart Error:', err);
    res.status(500).send('Server Error');
  }
};


module.exports = {
  getParts,
  createPart,
  updatePart,
  deletePart,
};
