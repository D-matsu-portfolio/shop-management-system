const db = require('../config/db');
const csv = require('csv-parser');
const multer = require('multer');
const { Readable } = require('stream'); // To convert buffer to stream

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory as a Buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

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

// @desc    Import parts from CSV
// @route   POST /api/parts/import
// @access  Private
const importParts = async (req, res) => {
  // Use upload.single('file') as a middleware here
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ msg: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ msg: `Unknown error: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const partsToImport = [];
    const readableStream = Readable.from(req.file.buffer.toString('utf-8')); // Convert buffer to readable stream

    readableStream
      .pipe(csv())
      .on('data', (data) => {
        // Basic validation and type conversion
        partsToImport.push({
          part_number: data.part_number,
          name: data.name,
          description: data.description || null,
          cost_price: parseFloat(data.cost_price) || 0,
          sale_price: parseFloat(data.sale_price) || 0,
        });
      })
      .on('end', async () => {
        if (partsToImport.length === 0) {
          return res.status(400).json({ msg: 'CSV contains no data or invalid format' });
        }

        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          let importedCount = 0;

          for (const part of partsToImport) {
            // UPSERT operation: INSERT if part_number does not exist, UPDATE if it does
            const upsertQuery = `
              INSERT INTO parts (part_number, name, description, cost_price, sale_price)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (part_number) DO UPDATE
              SET name = EXCLUDED.name,
                  description = EXCLUDED.description,
                  cost_price = EXCLUDED.cost_price,
                  sale_price = EXCLUDED.sale_price
              RETURNING id;
            `;
            await client.query(upsertQuery, [
              part.part_number,
              part.name,
              part.description,
              part.cost_price,
              part.sale_price,
            ]);
            importedCount++;
          }

          await client.query('COMMIT');
          res.status(200).json({ msg: `${importedCount} parts imported successfully` });
        } catch (dbErr) {
          await client.query('ROLLBACK');
          console.error('importParts DB Error:', dbErr);
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
  getParts,
  createPart,
  updatePart,
  deletePart,
  importParts,
};
