const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

router.get('/templates', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM message_templates
      ORDER BY days_after_planting
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.template_id,
        name: row.name,
        category: row.category,
        message: row.message_content,
        daysAfterPlanting: row.days_after_planting,
        active: row.is_active,
        expectedResponses: row.expected_responses || []
      }))
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM message_templates WHERE template_id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.template_id,
        name: row.name,
        category: row.category,
        message: row.message_content,
        daysAfterPlanting: row.days_after_planting,
        active: row.is_active,
        expectedResponses: row.expected_responses || []
      }
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/templates', async (req, res) => {
  const { name, category, message, daysAfterPlanting, active, expectedResponses, createdBy } = req.body;

  try {
    const countResult = await query('SELECT COUNT(*) as count FROM message_templates');
    const templateNumber = String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0');
    const templateId = `MSG${templateNumber}`;

    const result = await query(`
      INSERT INTO message_templates
        (template_id, name, category, message_content, days_after_planting,
         is_active, expected_responses, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [templateId, name, category, message, daysAfterPlanting, active !== false,
        expectedResponses || [], createdBy || 1]);

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].template_id,
        name: result.rows[0].name,
        category: result.rows[0].category,
        message: result.rows[0].message_content,
        daysAfterPlanting: result.rows[0].days_after_planting,
        active: result.rows[0].is_active,
        expectedResponses: result.rows[0].expected_responses || []
      }
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  const { name, category, message, daysAfterPlanting, active, expectedResponses } = req.body;

  try {
    const result = await query(`
      UPDATE message_templates
      SET name = $1, category = $2, message_content = $3, days_after_planting = $4,
          is_active = $5, expected_responses = $6
      WHERE template_id = $7
      RETURNING *
    `, [name, category, message, daysAfterPlanting, active, expectedResponses || [], req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({
      success: true,
      data: {
        id: result.rows[0].template_id,
        name: result.rows[0].name,
        category: result.rows[0].category,
        message: result.rows[0].message_content,
        daysAfterPlanting: result.rows[0].days_after_planting,
        active: result.rows[0].is_active,
        expectedResponses: result.rows[0].expected_responses || []
      }
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM message_templates WHERE template_id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sms', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let queryText = `
      SELECT
        sm.*,
        w.full_name as worker_name,
        fb.batch_id as batch_code,
        fb.name as batch_name
      FROM sms_messages sm
      LEFT JOIN workers w ON sm.worker_id = w.id
      LEFT JOIN farm_batches fb ON sm.batch_id = fb.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (status && status !== 'All') {
      queryText += ` AND sm.response_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (startDate) {
      queryText += ` AND sm.sent_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND sm.sent_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    queryText += ' ORDER BY sm.sent_date DESC, sm.sent_time DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.message_id,
        worker: row.worker_name,
        phone: row.phone_number,
        batch: row.batch_code,
        message: row.message_content,
        sentDate: row.sent_date,
        sentTime: row.sent_time,
        response: row.response_status || 'Pending',
        responseDate: row.response_date,
        responseTime: row.response_time,
        responseText: row.response_text
      }))
    });
  } catch (error) {
    console.error('Error fetching SMS messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
