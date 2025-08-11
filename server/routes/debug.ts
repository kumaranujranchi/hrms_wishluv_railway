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

// Debug endpoint to sync production data to development
router.post('/api/debug/sync-production-data', async (req, res) => {
  try {
    // Create missing employees that exist in production
    const productionEmployees = [
      { email: 'bikashkumar.gupta@wishluvbuildcon.com', firstName: 'Bikashkumar', lastName: 'Gupta' },
      { email: 'manish.verma@wishluvbuildcon.com', firstName: 'Manish', lastName: 'Verma' },
      { email: 'shalu.singh@wishluvbuildcon.com', firstName: 'Shalu', lastName: 'Singh' },
      { email: 'arinash.mishra@wishluvbuildcon.com', firstName: 'Arinash', lastName: 'Mishra' },
      { email: 'om.renuka@wishluvbuildcon.com', firstName: 'Om', lastName: 'Renuka' },
      { email: 'sahil.kumar@wishluvbuildcon.com', firstName: 'Sahil', lastName: 'Kumar' },
      { email: 'rahul.ranjan@wishluvbuildcon.com', firstName: 'Rahul', lastName: 'Ranjan' },
      { email: 'kanishka.singh@wishluvbuildcon.com', firstName: 'Kanishka', lastName: 'Singh' },
      { email: 'vikash.kumar@wishluvbuildcon.com', firstName: 'Vikash', lastName: 'Kumar' },
      { email: 'girdhari.thakur@wishluvbuildcon.com', firstName: 'Girdhari', lastName: 'Thakur' }
    ];
    
    const passwordHash = await bcrypt.hash('password123', 10);
    const createdUsers = [];
    
    for (const emp of productionEmployees) {
      // Check if user already exists
      const existing = await db.execute(sql`
        SELECT id FROM users WHERE email = ${emp.email}
      `);
      
      if (existing.length === 0) {
        const newUser = await db.execute(sql`
          INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at)
          VALUES (gen_random_uuid(), ${emp.email}, ${passwordHash}, ${emp.firstName}, ${emp.lastName}, 'employee', true, NOW())
          RETURNING id, email, first_name, last_name
        `);
        createdUsers.push(newUser[0]);
      }
    }
    
    res.json({ 
      message: 'Production data sync completed', 
      createdUsers: createdUsers,
      totalCreated: createdUsers.length 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to sync production data', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug endpoint to create sample attendance data
router.post('/api/debug/create-sample-attendance', async (req, res) => {
  try {
    // Get all employees
    const employeesResult = await db.execute(sql`
      SELECT id, email FROM users WHERE role = 'employee'
    `);
    const employees = employeesResult;
    
    const today = new Date().toISOString().split('T')[0];
    const createdAttendance = [];
    
    for (const emp of employees) {
      // Check if attendance already exists for today
      const existing = await db.execute(sql`
        SELECT id FROM attendance WHERE user_id = ${emp.id} AND DATE(check_in_time) = ${today}
      `);
      
      if (existing.length === 0) {
        const checkInTime = new Date();
        checkInTime.setHours(9, Math.floor(Math.random() * 60), 0, 0); // Random time between 9:00-9:59
        
        const newAttendance = await db.execute(sql`
          INSERT INTO attendance (id, user_id, check_in_time, check_in_location, status, created_at)
          VALUES (
            gen_random_uuid(), 
            ${emp.id}, 
            ${checkInTime.toISOString()}, 
            'Patna', 
            'checked_in', 
            NOW()
          )
          RETURNING id, user_id, check_in_time, check_in_location
        `);
        createdAttendance.push(newAttendance[0]);
      }
    }
    
    res.json({ 
      message: 'Sample attendance data created', 
      createdAttendance: createdAttendance,
      totalCreated: createdAttendance.length 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create sample attendance', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Production data validation endpoint
router.get('/api/debug/validate-production-sync', async (req, res) => {
  try {
    // Check database connection and data
    const [userCount] = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const [attendanceCount] = await db.execute(sql`SELECT COUNT(*) as count FROM attendance`);
    const [todayAttendanceCount] = await db.execute(sql`
      SELECT COUNT(*) as count FROM attendance WHERE DATE(date) = CURRENT_DATE
    `);
    
    // Get latest user additions
    const latestUsers = await db.execute(sql`
      SELECT email, first_name, created_at 
      FROM users 
      WHERE role = 'employee' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    // Check database URL (masked for security)
    const dbUrl = process.env.DATABASE_URL;
    const dbInfo = dbUrl ? 
      `Connected to: ${dbUrl.split('@')[1]?.split('/')[0] || 'Database'}` : 
      'No DATABASE_URL found';
    
    res.json({
      status: 'success',
      environment: process.env.NODE_ENV || 'unknown',
      databaseInfo: dbInfo,
      dataSync: {
        totalUsers: userCount.count,
        totalAttendance: attendanceCount.count,
        todayAttendance: todayAttendanceCount.count,
        latestEmployees: latestUsers
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: 'Production sync validation failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;