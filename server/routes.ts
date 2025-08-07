import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService } from "./objectStorage";
import { 
  insertAttendanceSchema,
  insertLeaveRequestSchema,
  insertExpenseClaimSchema,
  insertAnnouncementSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Get attendance stats
      const attendanceStats = await storage.getAttendanceStats(startOfMonth, endOfMonth);
      
      // Get pending approvals based on user role
      let pendingLeaves = 0;
      let pendingExpenses = 0;
      
      if (user?.role === 'manager' || user?.role === 'admin') {
        const leaves = await storage.getPendingLeaveRequests(userId);
        const expenses = await storage.getPendingExpenseClaims(userId);
        pendingLeaves = leaves.length;
        pendingExpenses = expenses.length;
      }

      // Get employee count
      const employees = await storage.getAllEmployees();
      
      res.json({
        attendanceRate: attendanceStats?.attendanceRate || 0,
        pendingApprovals: pendingLeaves + pendingExpenses,
        totalEmployees: employees.length,
        monthlyPayroll: 0, // This would be calculated from payroll data
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/announcements', isAuthenticated, async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Attendance routes
  app.post('/api/attendance/check-in', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { location } = req.body;

      // Check if already checked in today
      const todayAttendance = await storage.getTodayAttendance(userId);
      if (todayAttendance) {
        return res.status(400).json({ message: "Already checked in today" });
      }

      const attendance = await storage.markAttendance({
        userId,
        date: new Date(),
        checkIn: new Date(),
        status: 'present',
        location,
      });

      res.json(attendance);
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.post('/api/attendance/check-out', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const todayAttendance = await storage.getTodayAttendance(userId);
      if (!todayAttendance) {
        return res.status(400).json({ message: "No check-in record found for today" });
      }

      if (todayAttendance.checkOut) {
        return res.status(400).json({ message: "Already checked out today" });
      }

      // Update attendance record with check-out time
      // Note: This is a simplified implementation - in a real app you'd update the existing record
      res.json({ message: "Checked out successfully", checkOut: new Date() });
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ message: "Failed to check out" });
    }
  });

  app.get('/api/attendance/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      const attendance = await storage.getAttendanceByUser(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get('/api/attendance/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const todayAttendance = await storage.getTodayAttendance(userId);
      res.json(todayAttendance || null);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Failed to fetch today's attendance" });
    }
  });

  // Leave management routes
  app.post('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leaveData = insertLeaveRequestSchema.parse({ ...req.body, userId });
      
      const leave = await storage.createLeaveRequest(leaveData);
      res.json(leave);
    } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(500).json({ message: "Failed to create leave request" });
    }
  });

  app.get('/api/leaves/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leaves = await storage.getLeaveRequestsByUser(userId);
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      res.status(500).json({ message: "Failed to fetch leaves" });
    }
  });

  app.get('/api/leaves/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'manager' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const leaves = await storage.getPendingLeaveRequests(
        user.role === 'admin' ? undefined : userId
      );
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching pending leaves:", error);
      res.status(500).json({ message: "Failed to fetch pending leaves" });
    }
  });

  app.put('/api/leaves/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status, notes } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'manager' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const leave = await storage.updateLeaveRequestStatus(id, status, userId, notes);
      res.json(leave);
    } catch (error) {
      console.error("Error updating leave status:", error);
      res.status(500).json({ message: "Failed to update leave status" });
    }
  });

  // Expense management routes
  app.post('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenseData = insertExpenseClaimSchema.parse({ ...req.body, userId });
      
      const expense = await storage.createExpenseClaim(expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense claim:", error);
      res.status(500).json({ message: "Failed to create expense claim" });
    }
  });

  app.get('/api/expenses/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenses = await storage.getExpenseClaimsByUser(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get('/api/expenses/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'manager' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const expenses = await storage.getPendingExpenseClaims(
        user.role === 'admin' ? undefined : userId
      );
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching pending expenses:", error);
      res.status(500).json({ message: "Failed to fetch pending expenses" });
    }
  });

  app.put('/api/expenses/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status, notes } = req.body;
      
      const user = await storage.getUser(userId);
      if (user?.role !== 'manager' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const expense = await storage.updateExpenseClaimStatus(id, status, userId, notes);
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense status:", error);
      res.status(500).json({ message: "Failed to update expense status" });
    }
  });

  // Employee directory routes
  app.get('/api/employees', isAuthenticated, async (req: any, res) => {
    try {
      const employees = await storage.getAllEmployees();
      // Remove sensitive information
      const sanitizedEmployees = employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        department: emp.department,
        position: emp.position,
        profileImageUrl: emp.profileImageUrl,
        role: emp.role,
      }));
      res.json(sanitizedEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Payroll routes
  app.get('/api/payroll/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payroll = await storage.getPayrollByUser(userId);
      res.json(payroll);
    } catch (error) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  // Object storage routes for file uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      return res.sendStatus(404);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
