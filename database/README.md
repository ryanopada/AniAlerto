# AniAlerto Database Scripts

This directory contains SQL scripts for setting up the AniAlerto Farm Management System database.

## Files

- **schema.sql** - Database schema with all tables, indexes, and triggers
- **seed_data.sql** - Sample data for testing and development

## Database Setup

### Prerequisites

- PostgreSQL 12 or higher
- Database user with CREATE privileges

### Setup Instructions

1. **Create the database:**
   ```bash
   createdb anialerto_db
   ```

2. **Run the schema script:**
   ```bash
   psql -d anialerto_db -f schema.sql
   ```

3. **Load sample data (optional):**
   ```bash
   psql -d anialerto_db -f seed_data.sql
   ```

### Database Connection

Default connection string:
```
postgresql://username:password@localhost:5432/anialerto_db
```

## Database Schema Overview

### Core Tables

1. **admin_users** - System administrators and users
2. **farm_batches** - Farm batch information (planting cycles)
3. **workers** - Farm workers and their contact information
4. **batch_worker_assignments** - Links workers to specific batches
5. **message_templates** - SMS message templates for farm activities
6. **sms_messages** - SMS message logs and responses
7. **command_responses** - Available response commands configuration
8. **tasks** - Task assignments and tracking
9. **activity_logs** - Audit trail of system activities

### Key Features

- **Automatic timestamps** - `created_at` and `updated_at` fields with triggers
- **Foreign key constraints** - Data integrity across tables
- **Indexes** - Optimized queries on frequently accessed columns
- **Check constraints** - Valid values for status fields
- **Cascading deletes** - Proper cleanup of related records

## Sample Data

The seed data includes:

- 3 admin users (admin, supervisor, viewer)
- 7 workers with different roles
- 4 farm batches (3 active, 1 harvested)
- 6 message templates for different farm activities
- 5 command responses (DONE, DELAY, HELP, CANCEL, OK)
- Sample SMS messages and task records

## Security Notes

⚠️ **Important:** The seed data contains example password hashes. In production:

1. Use proper bcrypt password hashing
2. Generate strong, unique passwords
3. Store database credentials securely (use environment variables)
4. Enable SSL/TLS for database connections
5. Implement proper role-based access control
6. Regular database backups

## Maintenance

### Backup Database
```bash
pg_dump anialerto_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql anialerto_db < backup_20260305.sql
```

### Reset Database (Development Only)
```bash
dropdb anialerto_db
createdb anialerto_db
psql -d anialerto_db -f schema.sql
psql -d anialerto_db -f seed_data.sql
```

## Environment Variables

Recommended environment variables for database configuration:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anialerto_db
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=require  # for production
```

## Future Enhancements

Consider adding:

- Database migrations system (e.g., Flyway, Liquibase)
- Partitioning for large tables (sms_messages, activity_logs)
- Additional indexes based on query patterns
- Database views for common report queries
- Stored procedures for complex operations
- Full-text search capabilities
