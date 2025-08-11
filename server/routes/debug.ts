import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const router = Router();

// Debug endpoint to check database connection and data
router.get('/api/debug/db-info', async (req, res) => {
  try {
    // Get database connection info
    const connectionResult = await db.execute(sql`SELECT current_database(), current_user, version()`);
    
    // Get user count
    const userCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    
    // Get recent users
    const recentUsers = await db.execute(sql`
      SELECT email, first_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    res.json({
      database: connectionResult[0],
      userCount: userCountResult[0],
      recentUsers: recentUsers,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Present' : 'Missing'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint to create test employee if not exists
router.post('/api/debug/create-test-employee', async (req, res) => {
  try {
    
    // Check if test employee exists
    const existingUser = await db.execute(sql`
      SELECT * FROM users WHERE email = 'test.employee@wishluvbuildcon.com'
    `);
    
    if (existingUser.length > 0) {
      return res.json({ message: 'Test employee already exists', user: existingUser[0] });
    }
    
    // Create test employee
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const newUser = await db.execute(sql`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
      VALUES (gen_random_uuid(), 'test.employee@wishluvbuildcon.com', ${passwordHash}, 'Test', 'Employee', 'employee', true)
      RETURNING *
    `);
    
    res.json({ message: 'Test employee created successfully', user: newUser[0] });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create test employee', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;