const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

// Get all workers
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        w.*,
        json_agg(
          json_build_object(
            'id', fb.batch_id,
            'name', fb.name
          )
        ) FILTER (WHERE fb.id IS NOT NULL) as batches
      FROM workers w
      LEFT JOIN batch_worker_assignments bwa ON w.id = bwa.worker_id AND bwa.is_active = true
      LEFT JOIN farm_batches fb ON bwa.batch_id = fb.id
      GROUP BY w.id
      ORDER BY w.full_name
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.worker_id,
        name: row.full_name,
        phone: row.phone_number,
        role: row.role,
        status: row.status,
        dateHired: row.date_hired,
        address: row.address,
        emergencyContact: row.emergency_contact_name,
        emergencyPhone: row.emergency_contact_phone,
        notes: row.notes,
        batches: row.batches || []
      }))
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single worker
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        w.*,
        json_agg(
          json_build_object(
            'id', fb.batch_id,
            'name', fb.name
          )
        ) FILTER (WHERE fb.id IS NOT NULL) as batches
      FROM workers w
      LEFT JOIN batch_worker_assignments bwa ON w.id = bwa.worker_id AND bwa.is_active = true
      LEFT JOIN farm_batches fb ON bwa.batch_id = fb.id
      WHERE w.worker_id = $1
      GROUP BY w.id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.worker_id,
        name: row.full_name,
        phone: row.phone_number,
        role: row.role,
        status: row.status,
        dateHired: row.date_hired,
        address: row.address,
        emergencyContact: row.emergency_contact_name,
        emergencyPhone: row.emergency_contact_phone,
        notes: row.notes,
        batches: row.batches || []
      }
    });
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new worker
router.post('/', async (req, res) => {
  const { name, phone, role, status, dateHired, address, emergencyContact, emergencyPhone, notes } = req.body;

  try {
    // Generate worker ID
    const countResult = await query('SELECT COUNT(*) as count FROM workers');
    const workerNumber = String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0');
    const workerId = `W${workerNumber}`;

    const result = await query(`
      INSERT INTO workers
        (worker_id, full_name, phone_number, role, status, date_hired, address,
         emergency_contact_name, emergency_contact_phone, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [workerId, name, phone, role, status || 'Active', dateHired, address,
        emergencyContact, emergencyPhone, notes]);

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].worker_id,
        name: result.rows[0].full_name,
        phone: result.rows[0].phone_number,
        role: result.rows[0].role,
        status: result.rows[0].status,
        dateHired: result.rows[0].date_hired,
        address: result.rows[0].address,
        emergencyContact: result.rows[0].emergency_contact_name,
        emergencyPhone: result.rows[0].emergency_contact_phone,
        notes: result.rows[0].notes,
        batches: []
      }
    });
  } catch (error) {
    console.error('Error creating worker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update worker
router.put('/:id', async (req, res) => {
  const { name, phone, role, status, dateHired, address, emergencyContact, emergencyPhone, notes } = req.body;

  try {
    const result = await query(`
      UPDATE workers
      SET full_name = $1, phone_number = $2, role = $3, status = $4, date_hired = $5,
          address = $6, emergency_contact_name = $7, emergency_contact_phone = $8, notes = $9
      WHERE worker_id = $10
      RETURNING *
    `, [name, phone, role, status, dateHired, address, emergencyContact, emergencyPhone, notes, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }

    res.json({
      success: true,
      data: {
        id: result.rows[0].worker_id,
        name: result.rows[0].full_name,
        phone: result.rows[0].phone_number,
        role: result.rows[0].role,
        status: result.rows[0].status,
        dateHired: result.rows[0].date_hired,
        address: result.rows[0].address,
        emergencyContact: result.rows[0].emergency_contact_name,
        emergencyPhone: result.rows[0].emergency_contact_phone,
        notes: result.rows[0].notes
      }
    });
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete worker
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM workers WHERE worker_id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }

    res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
