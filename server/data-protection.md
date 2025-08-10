# Data Protection Guidelines

## Data Backup and Recovery Strategy

### Current Database Status (Restored August 10, 2025)
- **Users**: 5 records (admin + employees)
- **Departments**: 8 records
- **Designations**: 10 records  
- **Attendance**: 4 records with location names and coordinates
- **Leave Assignments**: 4 records
- **Announcements**: 2 records

### Data Protection Rules

1. **Never Use Destructive SQL Operations**
   - Avoid `DROP TABLE`, `TRUNCATE`, `DELETE FROM` without WHERE clauses
   - Always use `INSERT ... ON CONFLICT DO NOTHING` for safe inserts
   - Use `UPDATE ... WHERE` with specific conditions

2. **Schema Migration Safety**
   - Always add new columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
   - Use `DEFAULT` values for non-null columns
   - Never drop columns without explicit user confirmation
   - Test migrations on development data first

3. **Database Operations**
   - Use transactions for multi-table operations
   - Always check data integrity after schema changes
   - Keep backup of critical data before major changes

4. **Monitoring**
   - Log all database errors
   - Monitor table row counts
   - Alert on unexpected data loss

### Recovery Procedures

If data is lost:
1. Check logs for the cause
2. Restore from the latest backup tables
3. Re-run data restoration scripts
4. Verify data integrity

### Essential Data Templates

```sql
-- Admin user restoration
INSERT INTO users (id, email, first_name, last_name, password_hash, role, is_onboarding_complete, needs_password_reset, is_active)
VALUES ('admin-001', 'anuj.kumar@wishluvbuildcon.com', 'Anuj', 'Kumar', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', 'admin', true, false, true)
ON CONFLICT (id) DO NOTHING;

-- Sample departments
INSERT INTO departments (id, name, description) VALUES 
  ('dept-001', 'Engineering', 'Software Development and Technical Operations'),
  ('dept-002', 'Human Resources', 'Employee Management and Administration')
ON CONFLICT (id) DO NOTHING;
```

This strategy ensures data persistence and prevents accidental data loss during development.