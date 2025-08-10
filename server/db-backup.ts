// Database backup and data protection utilities
import { db } from "./db.js";
import { users, attendance, departments, designations, leaveRequests, expenseClaims } from "../shared/schema.js";

export class DatabaseBackup {
  // Create a backup before any schema changes
  static async createBackup(): Promise<void> {
    try {
      console.log('Creating database backup...');
      
      // Export critical data to backup tables
      await db.execute(`
        -- Create backup tables with timestamp
        CREATE TABLE IF NOT EXISTS backup_users_${Date.now()} AS SELECT * FROM users;
        CREATE TABLE IF NOT EXISTS backup_attendance_${Date.now()} AS SELECT * FROM attendance;
        CREATE TABLE IF NOT EXISTS backup_departments_${Date.now()} AS SELECT * FROM departments;
        CREATE TABLE IF NOT EXISTS backup_designations_${Date.now()} AS SELECT * FROM designations;
        CREATE TABLE IF NOT EXISTS backup_leave_requests_${Date.now()} AS SELECT * FROM leave_requests;
        CREATE TABLE IF NOT EXISTS backup_expense_claims_${Date.now()} AS SELECT * FROM expense_claims;
      `);
      
      console.log('Database backup created successfully');
    } catch (error) {
      console.error('Failed to create database backup:', error);
    }
  }
  
  // Restore data from backup if needed
  static async restoreFromBackup(backupTimestamp: string): Promise<void> {
    try {
      console.log(`Restoring from backup: ${backupTimestamp}`);
      
      await db.execute(`
        -- Restore data from backup tables
        INSERT INTO users SELECT * FROM backup_users_${backupTimestamp} ON CONFLICT (id) DO NOTHING;
        INSERT INTO attendance SELECT * FROM backup_attendance_${backupTimestamp} ON CONFLICT (id) DO NOTHING;
        INSERT INTO departments SELECT * FROM backup_departments_${backupTimestamp} ON CONFLICT (id) DO NOTHING;
        INSERT INTO designations SELECT * FROM backup_designations_${backupTimestamp} ON CONFLICT (id) DO NOTHING;
        INSERT INTO leave_requests SELECT * FROM backup_leave_requests_${backupTimestamp} ON CONFLICT (id) DO NOTHING;
        INSERT INTO expense_claims SELECT * FROM backup_expense_claims_${backupTimestamp} ON CONFLICT (id) DO NOTHING;
      `);
      
      console.log('Database restore completed successfully');
    } catch (error) {
      console.error('Failed to restore database:', error);
    }
  }
  
  // Validate data integrity
  static async validateDataIntegrity(): Promise<boolean> {
    try {
      const userCount = await db.select().from(users);
      const attendanceCount = await db.select().from(attendance);
      
      if (userCount.length === 0) {
        console.warn('No users found - data integrity issue detected');
        return false;
      }
      
      console.log(`Data integrity check passed: ${userCount.length} users, ${attendanceCount.length} attendance records`);
      return true;
    } catch (error) {
      console.error('Data integrity check failed:', error);
      return false;
    }
  }
}

// Export functions for use in other modules
export const { createBackup, restoreFromBackup, validateDataIntegrity } = DatabaseBackup;