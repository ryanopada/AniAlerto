const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM command_responses
      WHERE is_active = true
      ORDER BY command_text
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.command_id,
        command: row.command_text,
        description: row.description,
        color: row.color,
        action: row.action_description
      }))
    });
  } catch (error) {
    console.error('Error fetching command responses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM command_responses WHERE command_id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Command response not found' });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.command_id,
        command: row.command_text,
        description: row.description,
        color: row.color,
        action: row.action_description
      }
    });
  } catch (error) {
    console.error('Error fetching command response:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { command, description, color, action } = req.body;

  try {
    const countResult = await query('SELECT COUNT(*) as count FROM command_responses');
    const commandNumber = String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0');
    const commandId = `CMD${commandNumber}`;

    const result = await query(`
      INSERT INTO command_responses
        (command_id, command_text, description, color, action_description, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [commandId, command.toUpperCase(), description, color, action]);

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].command_id,
        command: result.rows[0].command_text,
        description: result.rows[0].description,
        color: result.rows[0].color,
        action: result.rows[0].action_description
      }
    });
  } catch (error) {
    console.error('Error creating command response:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { command, description, color, action } = req.body;

  try {
    const result = await query(`
      UPDATE command_responses
      SET command_text = $1, description = $2, color = $3, action_description = $4
      WHERE command_id = $5
      RETURNING *
    `, [command.toUpperCase(), description, color, action, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Command response not found' });
    }

    res.json({
      success: true,
      data: {
        id: result.rows[0].command_id,
        command: result.rows[0].command_text,
        description: result.rows[0].description,
        color: result.rows[0].color,
        action: result.rows[0].action_description
      }
    });
  } catch (error) {
    console.error('Error updating command response:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'UPDATE command_responses SET is_active = false WHERE command_id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Command response not found' });
    }

    res.json({ success: true, message: 'Command response deleted successfully' });
  } catch (error) {
    console.error('Error deleting command response:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
