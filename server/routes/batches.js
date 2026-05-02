const express = require('express');
const router = express.Router();
const { query, transaction } = require('../db/connection');

// Get all batches
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        fb.*,
        json_agg(
          json_build_object(
            'id', w.worker_id,
            'name', w.full_name,
            'role', w.role,
            'status', w.status
          )
        ) FILTER (WHERE w.id IS NOT NULL) as workers
      FROM farm_batches fb
      LEFT JOIN batch_worker_assignments bwa ON fb.id = bwa.batch_id AND bwa.is_active = true
      LEFT JOIN workers w ON bwa.worker_id = w.id
      GROUP BY fb.id
      ORDER BY fb.planting_date DESC
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.batch_id,
        name: row.name,
        location: row.location,
        plantingDate: row.planting_date,
        area: `${row.area_hectares} ha`,
        variety: row.variety,
        status: row.status,
        harvestDate: row.harvest_date,
        notes: row.notes,
        workers: row.workers || []
      }))
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single batch
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        fb.*,
        json_agg(
          json_build_object(
            'id', w.worker_id,
            'name', w.full_name,
            'role', w.role,
            'status', w.status
          )
        ) FILTER (WHERE w.id IS NOT NULL) as workers
      FROM farm_batches fb
      LEFT JOIN batch_worker_assignments bwa ON fb.id = bwa.batch_id AND bwa.is_active = true
      LEFT JOIN workers w ON bwa.worker_id = w.id
      WHERE fb.batch_id = $1
      GROUP BY fb.id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.batch_id,
        name: row.name,
        location: row.location,
        plantingDate: row.planting_date,
        area: `${row.area_hectares} ha`,
        variety: row.variety,
        status: row.status,
        harvestDate: row.harvest_date,
        notes: row.notes,
        workers: row.workers || []
      }
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new batch
router.post('/', async (req, res) => {
  const { name, location, plantingDate, area, variety, status, notes, createdBy } = req.body;

  try {
    // Generate batch ID
    const year = new Date().getFullYear();
    const countResult = await query(
      `SELECT COUNT(*) as count FROM farm_batches WHERE batch_id LIKE $1`,
      [`BR-${year}-%`]
    );
    const batchNumber = String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0');
    const batchId = `BR-${year}-${batchNumber}`;

    // Parse area (remove 'ha' if present)
    const areaHectares = parseFloat(area.toString().replace(/[^0-9.]/g, ''));

    const result = await query(`
      INSERT INTO farm_batches
        (batch_id, name, location, planting_date, area_hectares, variety, status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [batchId, name, location, plantingDate, areaHectares, variety, status || 'Planning', notes, createdBy || 1]);

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].batch_id,
        name: result.rows[0].name,
        location: result.rows[0].location,
        plantingDate: result.rows[0].planting_date,
        area: `${result.rows[0].area_hectares} ha`,
        variety: result.rows[0].variety,
        status: result.rows[0].status,
        notes: result.rows[0].notes,
        workers: []
      }
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update batch
router.put('/:id', async (req, res) => {
  const { name, location, plantingDate, area, variety, status, harvestDate, notes } = req.body;

  try {
    const areaHectares = parseFloat(area.toString().replace(/[^0-9.]/g, ''));

    const result = await query(`
      UPDATE farm_batches
      SET name = $1, location = $2, planting_date = $3, area_hectares = $4,
          variety = $5, status = $6, harvest_date = $7, notes = $8
      WHERE batch_id = $9
      RETURNING *
    `, [name, location, plantingDate, areaHectares, variety, status, harvestDate, notes, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    res.json({
      success: true,
      data: {
        id: result.rows[0].batch_id,
        name: result.rows[0].name,
        location: result.rows[0].location,
        plantingDate: result.rows[0].planting_date,
        area: `${result.rows[0].area_hectares} ha`,
        variety: result.rows[0].variety,
        status: result.rows[0].status,
        harvestDate: result.rows[0].harvest_date,
        notes: result.rows[0].notes
      }
    });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete batch
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM farm_batches WHERE batch_id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign worker to batch
router.post('/:batchId/workers/:workerId', async (req, res) => {
  const { batchId, workerId } = req.params;
  const { assignedBy } = req.body;

  try {
    await transaction(async (client) => {
      // Get database IDs
      const batchResult = await client.query(
        'SELECT id FROM farm_batches WHERE batch_id = $1',
        [batchId]
      );
      const workerResult = await client.query(
        'SELECT id FROM workers WHERE worker_id = $1',
        [workerId]
      );

      if (batchResult.rows.length === 0 || workerResult.rows.length === 0) {
        throw new Error('Batch or worker not found');
      }

      await client.query(`
        INSERT INTO batch_worker_assignments (batch_id, worker_id, assigned_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (batch_id, worker_id) DO UPDATE SET is_active = true
      `, [batchResult.rows[0].id, workerResult.rows[0].id, assignedBy || 1]);
    });

    res.json({ success: true, message: 'Worker assigned to batch' });
  } catch (error) {
    console.error('Error assigning worker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove worker from batch
router.delete('/:batchId/workers/:workerId', async (req, res) => {
  const { batchId, workerId } = req.params;

  try {
    await transaction(async (client) => {
      const result = await client.query(`
        UPDATE batch_worker_assignments bwa
        SET is_active = false
        FROM farm_batches fb, workers w
        WHERE bwa.batch_id = fb.id
          AND bwa.worker_id = w.id
          AND fb.batch_id = $1
          AND w.worker_id = $2
        RETURNING *
      `, [batchId, workerId]);

      if (result.rows.length === 0) {
        throw new Error('Assignment not found');
      }
    });

    res.json({ success: true, message: 'Worker removed from batch' });
  } catch (error) {
    console.error('Error removing worker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
