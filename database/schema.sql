-- AniAlerto Farm Management System Database Schema
-- PostgreSQL Database Schema

-- ============================================================================
-- USERS AND AUTHENTICATION
-- ============================================================================

-- Admin Users Table
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'supervisor', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================================================
-- FARM BATCHES
-- ============================================================================

-- Farm Batches Table
CREATE TABLE farm_batches (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., BR-2026-001
    name VARCHAR(200) NOT NULL,
    location VARCHAR(200) NOT NULL,
    planting_date DATE NOT NULL,
    area_hectares DECIMAL(10, 2) NOT NULL,
    variety VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'Planning' CHECK (status IN ('Planning', 'Active', 'Harvested')),
    harvest_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES admin_users(id)
);

-- Create index for faster queries
CREATE INDEX idx_farm_batches_status ON farm_batches(status);
CREATE INDEX idx_farm_batches_planting_date ON farm_batches(planting_date);

-- ============================================================================
-- WORKERS
-- ============================================================================

-- Workers Table
CREATE TABLE workers (
    id SERIAL PRIMARY KEY,
    worker_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., W001
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., Field Worker, Supervisor, Equipment Operator
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    date_hired DATE,
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_phone ON workers(phone_number);

-- ============================================================================
-- BATCH-WORKER ASSIGNMENTS
-- ============================================================================

-- Batch Worker Assignments Table (Many-to-Many relationship)
CREATE TABLE batch_worker_assignments (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES farm_batches(id) ON DELETE CASCADE,
    worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    assigned_by INTEGER REFERENCES admin_users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_id, worker_id)
);

-- Create indexes
CREATE INDEX idx_batch_worker_batch ON batch_worker_assignments(batch_id);
CREATE INDEX idx_batch_worker_worker ON batch_worker_assignments(worker_id);

-- ============================================================================
-- MESSAGE TEMPLATES
-- ============================================================================

-- Message Templates Table
CREATE TABLE message_templates (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., MSG001
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Irrigation', 'Fertilization', 'Pest Control', 'Harvest', 'General')),
    message_content TEXT NOT NULL,
    days_after_planting INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expected_responses TEXT[], -- Array of expected response commands
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES admin_users(id)
);

-- Create index for faster queries
CREATE INDEX idx_message_templates_category ON message_templates(category);
CREATE INDEX idx_message_templates_active ON message_templates(is_active);

-- ============================================================================
-- SMS MESSAGES AND LOGS
-- ============================================================================

-- SMS Messages Table
CREATE TABLE sms_messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(100) UNIQUE NOT NULL,
    batch_id INTEGER REFERENCES farm_batches(id) ON DELETE SET NULL,
    worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES message_templates(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    sent_date DATE NOT NULL,
    sent_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Delivered')),
    response_status VARCHAR(20) CHECK (response_status IN ('DONE', 'DELAY', 'HELP', 'CANCEL', 'OK', 'Pending')),
    response_text TEXT,
    response_date DATE,
    response_time TIME,
    delivery_status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_sms_messages_worker ON sms_messages(worker_id);
CREATE INDEX idx_sms_messages_batch ON sms_messages(batch_id);
CREATE INDEX idx_sms_messages_sent_date ON sms_messages(sent_date);
CREATE INDEX idx_sms_messages_response_status ON sms_messages(response_status);

-- ============================================================================
-- COMMAND RESPONSES
-- ============================================================================

-- Command Responses Configuration Table
CREATE TABLE command_responses (
    id SERIAL PRIMARY KEY,
    command_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., CMD001
    command_text VARCHAR(20) UNIQUE NOT NULL, -- e.g., DONE, DELAY, HELP
    description TEXT NOT NULL,
    color VARCHAR(20) NOT NULL,
    action_description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TASKS AND ACTIVITIES
-- ============================================================================

-- Tasks Table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) UNIQUE NOT NULL,
    batch_id INTEGER NOT NULL REFERENCES farm_batches(id) ON DELETE CASCADE,
    worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL, -- e.g., Irrigation, Fertilization, Pest Control
    task_description TEXT NOT NULL,
    due_date DATE NOT NULL,
    completion_status VARCHAR(20) DEFAULT 'Pending' CHECK (completion_status IN ('Pending', 'In Progress', 'Completed', 'Delayed', 'Cancelled')),
    completed_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES admin_users(id)
);

-- Create indexes
CREATE INDEX idx_tasks_batch ON tasks(batch_id);
CREATE INDEX idx_tasks_worker ON tasks(worker_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(completion_status);

-- ============================================================================
-- ACTIVITY LOGS
-- ============================================================================

-- Activity Logs Table (for audit trail)
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id),
    action_type VARCHAR(50) NOT NULL, -- e.g., CREATE, UPDATE, DELETE, LOGIN
    table_name VARCHAR(50), -- which table was affected
    record_id INTEGER, -- ID of the affected record
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farm_batches_updated_at BEFORE UPDATE ON farm_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_messages_updated_at BEFORE UPDATE ON sms_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_command_responses_updated_at BEFORE UPDATE ON command_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
