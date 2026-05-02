const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

// Get message report
router.get('/messages', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const result = await query(`
      SELECT
        sent_date::DATE as date,
        COUNT(*) as sent,
        COUNT(CASE WHEN response_status = 'DONE' THEN 1 END) as done,
        COUNT(CASE WHEN response_status = 'DELAY' THEN 1 END) as delay,
        COUNT(CASE WHEN response_status = 'HELP' THEN 1 END) as help,
        COUNT(CASE WHEN response_status = 'Pending' OR response_status IS NULL THEN 1 END) as pending
      FROM sms_messages
      WHERE sent_date BETWEEN $1 AND $2
      GROUP BY sent_date
      ORDER BY sent_date DESC
    `, [startDate || '2026-03-01', endDate || '2026-03-31']);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching message report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get task completion report
router.get('/tasks', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const result = await query(`
      SELECT
        task_type as task,
        COUNT(*) as total,
        COUNT(CASE WHEN completion_status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN completion_status != 'Completed' THEN 1 END) as pending,
        ROUND(
          (COUNT(CASE WHEN completion_status = 'Completed' THEN 1 END)::DECIMAL /
          NULLIF(COUNT(*), 0) * 100), 0
        ) || '%' as rate
      FROM tasks
      WHERE due_date BETWEEN $1 AND $2
      GROUP BY task_type
      ORDER BY total DESC
    `, [startDate || '2026-03-01', endDate || '2026-03-31']);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching task report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get worker performance report
router.get('/workers', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const result = await query(`
      SELECT
        w.full_name as name,
        COUNT(t.id) as assigned,
        COUNT(CASE WHEN t.completion_status = 'Completed' THEN 1 END) as completed,
        ROUND(
          (COUNT(CASE WHEN t.completion_status = 'Completed' THEN 1 END)::DECIMAL /
          NULLIF(COUNT(t.id), 0) * 100), 0
        ) || '%' as rate
      FROM workers w
      LEFT JOIN tasks t ON w.id = t.worker_id
        AND t.due_date BETWEEN $1 AND $2
      WHERE w.status = 'Active'
      GROUP BY w.id, w.full_name
      HAVING COUNT(t.id) > 0
      ORDER BY completed DESC
    `, [startDate || '2026-03-01', endDate || '2026-03-31']);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching worker report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get batch activity report
router.get('/batches', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const result = await query(`
      SELECT
        fb.batch_id as batch,
        COUNT(DISTINCT bwa.worker_id) as workers,
        COUNT(t.id) as tasks,
        COUNT(CASE WHEN t.completion_status = 'Completed' THEN 1 END) as completed,
        ROUND(
          (COUNT(CASE WHEN t.completion_status = 'Completed' THEN 1 END)::DECIMAL /
          NULLIF(COUNT(t.id), 0) * 100), 0
        ) || '%' as rate
      FROM farm_batches fb
      LEFT JOIN batch_worker_assignments bwa ON fb.id = bwa.batch_id AND bwa.is_active = true
      LEFT JOIN tasks t ON fb.id = t.batch_id
        AND t.due_date BETWEEN $1 AND $2
      WHERE fb.status = 'Active'
      GROUP BY fb.id, fb.batch_id
      ORDER BY fb.batch_id
    `, [startDate || '2026-03-01', endDate || '2026-03-31']);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching batch report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [batchesResult, workersResult, messagesResult, tasksResult] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'Active\' THEN 1 END) as active FROM farm_batches'),
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'Active\' THEN 1 END) as active FROM workers'),
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN sent_date = CURRENT_DATE THEN 1 END) as today,
          ROUND(
            (COUNT(CASE WHEN response_status != 'Pending' AND response_status IS NOT NULL THEN 1 END)::DECIMAL /
            NULLIF(COUNT(*), 0) * 100), 0
          ) as response_rate
        FROM sms_messages
        WHERE sent_date >= CURRENT_DATE - INTERVAL '7 days'
      `),
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN completion_status = 'Completed' THEN 1 END) as completed,
          ROUND(
            (COUNT(CASE WHEN completion_status = 'Completed' THEN 1 END)::DECIMAL /
            NULLIF(COUNT(*), 0) * 100), 0
          ) as completion_rate
        FROM tasks
        WHERE due_date >= CURRENT_DATE - INTERVAL '7 days'
      `)
    ]);

    res.json({
      success: true,
      data: {
        batches: batchesResult.rows[0],
        workers: workersResult.rows[0],
        messages: messagesResult.rows[0],
        tasks: tasksResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
