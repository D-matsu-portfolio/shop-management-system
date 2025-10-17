const db = require('../config/db');
const csv = require('csv-parser');
const multer = require('multer');
const { Readable } = require('stream'); // To convert buffer to stream

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory as a Buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

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

// @desc    Import services from CSV
// @route   POST /api/services/import
// @access  Private
const importServices = async (req, res) => {
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

    const servicesToImport = [];
    const readableStream = Readable.from(req.file.buffer.toString('utf-8')); // Convert buffer to readable stream

    readableStream
      .pipe(csv())
      .on('data', (data) => {
        // Basic validation and type conversion
        servicesToImport.push({
          service_code: data.service_code,
          name: data.name,
          description: data.description || null,
          default_total_cost: parseFloat(data.default_total_cost) || 0,
        });
      })
      .on('end', async () => {
        if (servicesToImport.length === 0) {
          return res.status(400).json({ msg: 'CSV contains no data or invalid format' });
        }

        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          let importedCount = 0;

          for (const service of servicesToImport) {
            // UPSERT operation: INSERT if service_code does not exist, UPDATE if it does
            const upsertQuery = `
              INSERT INTO services (service_code, name, description, default_total_cost)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (service_code) DO UPDATE
              SET name = EXCLUDED.name,
                  description = EXCLUDED.description,
                  default_total_cost = EXCLUDED.default_total_cost
              RETURNING id;
            `;
            await client.query(upsertQuery, [
              service.service_code,
              service.name,
              service.description,
              service.default_total_cost,
            ]);
            importedCount++;
          }

          await client.query('COMMIT');
          res.status(200).json({ msg: `${importedCount} services imported successfully` });
        } catch (dbErr) {
          await client.query('ROLLBACK');
          console.error('importServices DB Error:', dbErr);
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
  getServices,
  createService,
  updateService,
  deleteService,
  importServices,
};
