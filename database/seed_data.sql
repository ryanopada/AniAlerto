-- AniAlerto Farm Management System - Sample Data
-- PostgreSQL Seed Data Script

-- ============================================================================
-- ADMIN USERS
-- ============================================================================

-- Insert admin user (password: admin123 - use bcrypt in production)
INSERT INTO admin_users (username, password_hash, email, full_name, role, is_active) VALUES
('admin', '$2a$10$exampleHashHere', 'admin@anialerto.com', 'System Administrator', 'admin', TRUE),
('supervisor1', '$2a$10$exampleHashHere', 'supervisor@anialerto.com', 'Juan Dela Cruz', 'supervisor', TRUE),
('viewer1', '$2a$10$exampleHashHere', 'viewer@anialerto.com', 'Maria Santos', 'viewer', TRUE);

-- ============================================================================
-- WORKERS
-- ============================================================================

INSERT INTO workers (worker_id, full_name, phone_number, role, status, date_hired, address) VALUES
('W001', 'Juan Dela Cruz', '+639123456789', 'Field Supervisor', 'Active', '2025-01-15', 'Brgy. San Jose, Cabanatuan City'),
('W002', 'Maria Garcia', '+639234567890', 'Agronomist', 'Active', '2025-02-01', 'Brgy. Santa Rosa, Cabanatuan City'),
('W003', 'Pedro Santos', '+639345678901', 'Field Worker', 'Active', '2025-02-15', 'Brgy. Lagare, Cabanatuan City'),
('W004', 'Jose Ramirez', '+639456789012', 'Equipment Operator', 'Active', '2025-03-01', 'Brgy. Aduas, Cabanatuan City'),
('W005', 'Ana Reyes', '+639567890123', 'Field Worker', 'Active', '2025-01-20', 'Brgy. Pula, Cabanatuan City'),
('W006', 'Carlos Mendoza', '+639678901234', 'Field Worker', 'Active', '2025-02-10', 'Brgy. Bakero, Cabanatuan City'),
('W007', 'Luis Torres', '+639789012345', 'Field Worker', 'Active', '2025-03-05', 'Brgy. San Juan, Cabanatuan City');

-- ============================================================================
-- FARM BATCHES
-- ============================================================================

INSERT INTO farm_batches (batch_id, name, location, planting_date, area_hectares, variety, status, notes, created_by) VALUES
('BR-2026-001', 'Field A - Wet Season', 'Field A', '2026-01-15', 2.5, 'Pioneer 30G40', 'Active', 'Regular monitoring for Fall Armyworm. Irrigation system functioning well.', 1),
('BR-2026-002', 'Field B - Early Planting', 'Field B', '2026-02-01', 3.0, 'Dekalb 9150', 'Active', 'Early planting trial. Monitor growth stages closely.', 1),
('BR-2026-003', 'Field C - Main Crop', 'Field C', '2026-02-15', 4.0, 'NK6410', 'Active', 'Largest field. Requires additional attention during harvest season.', 1),
('BR-2025-012', 'Field D - Previous', 'Field D', '2025-11-10', 2.0, 'Pioneer 30G40', 'Harvested', 'Successful harvest. Yield was above average. Good soil condition for next season.', 1);

-- Update harvest date for harvested batch
UPDATE farm_batches SET harvest_date = '2026-02-20' WHERE batch_id = 'BR-2025-012';

-- ============================================================================
-- BATCH-WORKER ASSIGNMENTS
-- ============================================================================

INSERT INTO batch_worker_assignments (batch_id, worker_id, assigned_by) VALUES
-- Field A assignments
((SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-001'), (SELECT id FROM workers WHERE worker_id = 'W001'), 1),
((SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-001'), (SELECT id FROM workers WHERE worker_id = 'W003'), 1),
((SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-001'), (SELECT id FROM workers WHERE worker_id = 'W005'), 1),

-- Field B assignments
((SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-002'), (SELECT id FROM workers WHERE worker_id = 'W002'), 1),
((SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-002'), (SELECT id FROM workers WHERE worker_id = 'W004'), 1),

-- Field C assignments
((SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-003'), (SELECT id FROM workers WHERE worker_id = 'W001'), 1),
((SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-003'), (SELECT id FROM workers WHERE worker_id = 'W006'), 1),

-- Field D (harvested) assignments
((SELECT id FROM farm_batches WHERE batch_id = 'BR-2025-012'), (SELECT id FROM workers WHERE worker_id = 'W007'), 1);

-- ============================================================================
-- MESSAGE TEMPLATES
-- ============================================================================

INSERT INTO message_templates (template_id, name, category, message_content, days_after_planting, is_active, expected_responses, created_by) VALUES
('MSG001', 'First Irrigation Reminder', 'Irrigation', 'Reminder: Perform irrigation check today. Ensure adequate soil moisture. Reply DONE when complete.', 7, TRUE, ARRAY['DONE', 'DELAY'], 1),
('MSG002', 'Basal Fertilizer Application', 'Fertilization', 'Apply basal fertilizer today (14-14-14, 2-3 bags/ha). Mix with soil 5-7cm from plants. Reply DONE or DELAY.', 0, TRUE, ARRAY['DONE', 'DELAY'], 1),
('MSG003', 'First Side Dressing', 'Fertilization', 'Time for first side dressing! Apply Urea (2 bags/ha) beside plants. Incorporate and irrigate. Reply DONE when finished.', 23, TRUE, ARRAY['DONE', 'DELAY'], 1),
('MSG004', 'Pest Monitoring Check', 'Pest Control', 'Conduct pest monitoring today. Check for corn borer and armyworm. Report findings or reply HELP if assistance needed.', 30, TRUE, ARRAY['DONE', 'HELP'], 1),
('MSG005', 'Second Side Dressing', 'Fertilization', 'Apply second side dressing today! Urea (2 bags/ha) between rows. Hill up soil around plants. Reply DONE when complete.', 42, TRUE, ARRAY['DONE', 'DELAY'], 1),
('MSG006', 'Pre-Harvest Preparation', 'Harvest', 'Prepare for harvest in 2 weeks. Check kernel maturity and moisture. Stop irrigation. Reply DONE to confirm.', 90, TRUE, ARRAY['DONE'], 1);

-- ============================================================================
-- COMMAND RESPONSES
-- ============================================================================

INSERT INTO command_responses (command_id, command_text, description, color, action_description, is_active) VALUES
('CMD001', 'DONE', 'Task completed successfully', 'green', 'Mark task as completed', TRUE),
('CMD002', 'DELAY', 'Task delayed or in progress', 'yellow', 'Flag for follow-up', TRUE),
('CMD003', 'HELP', 'Worker needs assistance', 'red', 'Send immediate support', TRUE),
('CMD004', 'CANCEL', 'Task cancelled', 'gray', 'Mark task as cancelled and remove from schedule', TRUE),
('CMD005', 'OK', 'Message acknowledged', 'blue', 'Mark message as read and acknowledged', TRUE);

-- ============================================================================
-- SMS MESSAGES (Sample)
-- ============================================================================

INSERT INTO sms_messages (message_id, batch_id, worker_id, template_id, phone_number, message_content, sent_date, sent_time, status, response_status, response_date, response_time) VALUES
('SMS001',
 (SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-001'),
 (SELECT id FROM workers WHERE worker_id = 'W001'),
 (SELECT id FROM message_templates WHERE template_id = 'MSG001'),
 '+639123456789',
 'Reminder: Perform irrigation check today. Ensure adequate soil moisture. Reply DONE when complete.',
 '2026-03-05',
 '08:00:00',
 'Delivered',
 'DONE',
 '2026-03-05',
 '10:30:00'),

('SMS002',
 (SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-002'),
 (SELECT id FROM workers WHERE worker_id = 'W002'),
 (SELECT id FROM message_templates WHERE template_id = 'MSG003'),
 '+639234567890',
 'Time for first side dressing! Apply Urea (2 bags/ha) beside plants. Incorporate and irrigate. Reply DONE when finished.',
 '2026-03-04',
 '09:00:00',
 'Delivered',
 'DELAY',
 '2026-03-04',
 '14:00:00'),

('SMS003',
 (SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-001'),
 (SELECT id FROM workers WHERE worker_id = 'W003'),
 (SELECT id FROM message_templates WHERE template_id = 'MSG004'),
 '+639345678901',
 'Conduct pest monitoring today. Check for corn borer and armyworm. Report findings or reply HELP if assistance needed.',
 '2026-03-03',
 '07:30:00',
 'Delivered',
 'HELP',
 '2026-03-03',
 '11:00:00');

-- ============================================================================
-- TASKS (Sample)
-- ============================================================================

INSERT INTO tasks (task_id, batch_id, worker_id, task_type, task_description, due_date, completion_status, created_by) VALUES
('TASK001',
 (SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-001'),
 (SELECT id FROM workers WHERE worker_id = 'W001'),
 'Irrigation',
 'Perform irrigation check and ensure adequate soil moisture',
 '2026-03-05',
 'Completed',
 1),

('TASK002',
 (SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-002'),
 (SELECT id FROM workers WHERE worker_id = 'W002'),
 'Fertilization',
 'Apply first side dressing with Urea',
 '2026-03-04',
 'Delayed',
 1),

('TASK003',
 (SELECT id FROM farm_batches WHERE batch_id = 'BR-2026-001'),
 (SELECT id FROM workers WHERE worker_id = 'W003'),
 'Pest Control',
 'Conduct pest monitoring for corn borer and armyworm',
 '2026-03-03',
 'In Progress',
 1);

-- Update completion date for completed tasks
UPDATE tasks SET completed_date = '2026-03-05' WHERE task_id = 'TASK001';

-- ============================================================================
-- ACTIVITY LOGS (Sample)
-- ============================================================================

INSERT INTO activity_logs (user_id, action_type, table_name, record_id, description) VALUES
(1, 'CREATE', 'farm_batches', 1, 'Created new farm batch BR-2026-001'),
(1, 'CREATE', 'farm_batches', 2, 'Created new farm batch BR-2026-002'),
(1, 'CREATE', 'workers', 1, 'Registered new worker W001 - Juan Dela Cruz'),
(1, 'UPDATE', 'farm_batches', 4, 'Updated batch BR-2025-012 status to Harvested'),
(2, 'CREATE', 'tasks', 1, 'Created irrigation task for batch BR-2026-001'),
(1, 'LOGIN', NULL, NULL, 'Admin user logged in');
