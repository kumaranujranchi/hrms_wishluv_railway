import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireAdmin } from "./auth";
import { createEmployeeByAdmin, registerUser, loginUser } from "./auth";
import { ObjectStorageService } from "./objectStorage";
import { 
  insertAttendanceSchema,
  insertLeaveRequestSchema,
  insertExpenseClaimSchema,
  insertAnnouncementSchema,
  insertEmployeeProfileSchema,
  insertDepartmentSchema,
  insertDesignationSchema,
  registerUserSchema,
  loginUserSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
} from "@shared/schema";
import debugRouter from "./routes/debug";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = loginUserSchema.parse(req.body);
      const user = await loginUser(credentials);
      
      // Store user in session
      (req.session as any).user = user;
      
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Login failed" 
      });
    }
  });

  // Register route
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      const user = await registerUser(userData);
      
      // Store user in session
      (req.session as any).user = user;
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Registration failed" 
      });
    }
  });

  // Change password route
  app.post('/api/auth/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }
      
      const userId = req.user.id;
      const success = await storage.changeUserPassword(userId, currentPassword, newPassword);
      
      if (!success) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie('connect.sid');
      res.clearCookie('sessionId');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Admin creates employee account
  app.post('/api/admin/create-employee', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can create employee accounts' });
      }

      const employeeData = createEmployeeSchema.parse(req.body);
      const employee = await createEmployeeByAdmin(employeeData);
      
      res.status(201).json({
        ...employee,
        tempPassword: employeeData.tempPassword // Return temp password for admin to share
      });
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create employee" 
      });
    }
  });

  // Admin updates employee details
  app.put('/api/admin/employees/:employeeId', isAuthenticated, async (req: any, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can edit employee details' });
      }

      const { employeeId } = req.params;
      const updateData = updateEmployeeSchema.parse(req.body);
      
      const updatedEmployee = await storage.updateEmployeeProfile(employeeId, updateData);
      
      res.json(updatedEmployee);
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update employee" 
      });
    }
  });

  // Get employee profile details
  app.get('/api/employees/:employeeId/profile', isAuthenticated, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      
      // Allow access if user is admin or it's their own profile
      if (req.user.role !== 'admin' && req.user.id !== employeeId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const profile = await storage.getEmployeeProfile(employeeId);
      res.json(profile || {});
    } catch (error) {
      console.error("Get employee profile error:", error);
      res.status(500).json({ message: "Failed to get employee profile" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Geofencing validation function
  const validateGeofencing = (latitude: number, longitude: number): { isValid: boolean; distance: number } => {
    const OFFICE_LAT = 25.6146835780726;
    const OFFICE_LNG = 85.1126174983296;
    const RADIUS_METERS = 50;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (latitude * Math.PI) / 180;
    const φ2 = (OFFICE_LAT * Math.PI) / 180;
    const Δφ = ((OFFICE_LAT - latitude) * Math.PI) / 180;
    const Δλ = ((OFFICE_LNG - longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      isValid: distance <= RADIUS_METERS,
      distance: distance
    };
  };

  // Attendance routes
  app.post('/api/attendance/check-in', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { location, latitude, longitude, locationName, reason } = req.body;

      // Validate geofencing if coordinates are provided
      let isOutOfOffice = false;
      let distance = 0;
      if (latitude && longitude) {
        const geofencingResult = validateGeofencing(parseFloat(latitude), parseFloat(longitude));
        isOutOfOffice = !geofencingResult.isValid;
        distance = geofencingResult.distance;
        
        // If outside office and no reason provided, require reason
        if (isOutOfOffice && !reason) {
          return res.status(400).json({ 
            message: `आप ऑफिस से ${Math.round(distance)} मीटर दूर हैं। ऑफिस के बाहर से चेक-इन करने के लिए कारण आवश्यक है।`,
            distance: distance,
            requiresReason: true,
            isOutOfOffice: true
          });
        }
      }

      // Check if already checked in today
      const todayAttendance = await storage.getTodayAttendance(userId);
      if (todayAttendance) {
        return res.status(400).json({ message: "Already checked in today" });
      }

      const attendance = await storage.markAttendance({
        userId,
        date: new Date(),
        checkIn: new Date(),
        status: isOutOfOffice ? 'out_of_office' : 'present',
        location: location || `${latitude}, ${longitude}`, // Fallback for backward compatibility
        locationName: locationName,
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null,
        reason: reason || null,
        isOutOfOffice: isOutOfOffice,
        distanceFromOffice: distance ? Math.round(distance) : null,
      });

      console.log('Check-in successful for user:', userId, 'at:', new Date().toISOString());
      
      res.json({
        ...attendance,
        success: true,
        message: 'Check-in successful'
      });
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.post('/api/attendance/check-out', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { location, latitude, longitude, locationName, reason } = req.body;

      // Validate geofencing if coordinates are provided
      let isOutOfOffice = false;
      let distance = 0;
      if (latitude && longitude) {
        const geofencingResult = validateGeofencing(parseFloat(latitude), parseFloat(longitude));
        isOutOfOffice = !geofencingResult.isValid;
        distance = geofencingResult.distance;
        
        // If outside office and no reason provided, require reason
        if (isOutOfOffice && !reason) {
          return res.status(400).json({ 
            message: `आप ऑफिस से ${Math.round(distance)} मीटर दूर हैं। ऑफिस के बाहर से चेक-आउट करने के लिए कारण आवश्यक है।`,
            distance: distance,
            requiresReason: true,
            isOutOfOffice: true
          });
        }
      }

      const todayAttendance = await storage.getTodayAttendance(userId);
      if (!todayAttendance) {
        return res.status(400).json({ message: "No check-in record found for today" });
      }

      if (todayAttendance.checkOut) {
        return res.status(400).json({ message: "Already checked out today" });
      }

      // Update attendance record with check-out time and location
      const attendance = await storage.updateAttendance(todayAttendance.id, {
        checkOut: new Date(),
        status: isOutOfOffice ? 'out_of_office' : 'present',
        location: location || `${latitude}, ${longitude}`,
        locationName: locationName,
        latitude: latitude ? latitude.toString() : null,
        longitude: longitude ? longitude.toString() : null,
        checkOutReason: reason || null,
        isOutOfOfficeCheckOut: isOutOfOffice,
        checkOutDistanceFromOffice: distance ? Math.round(distance) : null,
      });

      console.log('Check-out successful for user:', userId, 'at:', new Date().toISOString());
      
      res.json({
        ...attendance,
        success: true,
        message: 'Check-out successful'
      });
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ message: "Failed to check out" });
    }
  });

  app.get('/api/attendance/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
      const todayAttendance = await storage.getTodayAttendance(userId);
      res.json(todayAttendance || null);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Failed to fetch today's attendance" });
    }
  });

  // Attendance status endpoint for frontend
  app.get('/api/attendance/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const todayAttendance = await storage.getTodayAttendance(userId);
      
      console.log('Attendance status check for user:', userId);
      console.log('Today attendance record:', todayAttendance);
      
      if (!todayAttendance) {
        console.log('No attendance record found for today');
        res.json({
          isCheckedIn: false,
          checkInTime: null,
          checkOutTime: null,
          todayStatus: 'not_checked_in'
        });
        return;
      }

      const isCheckedIn = !!todayAttendance.checkIn && !todayAttendance.checkOut;
      const isCheckedOut = !!todayAttendance.checkOut;
      
      let todayStatus = 'not_checked_in';
      if (todayAttendance.checkIn && !todayAttendance.checkOut) {
        todayStatus = 'checked_in';
      } else if (todayAttendance.checkIn && todayAttendance.checkOut) {
        todayStatus = 'checked_out';
      }

      console.log('Attendance status result:', {
        isCheckedIn,
        checkInTime: todayAttendance.checkIn,
        checkOutTime: todayAttendance.checkOut,
        todayStatus
      });

      res.json({
        isCheckedIn: isCheckedIn,
        checkInTime: todayAttendance.checkIn ? todayAttendance.checkIn.toISOString() : null,
        checkOutTime: todayAttendance.checkOut ? todayAttendance.checkOut.toISOString() : null,
        todayStatus: todayStatus
      });
    } catch (error) {
      console.error("Error fetching attendance status:", error);
      res.status(500).json({ message: "Failed to fetch attendance status" });
    }
  });

  // Geocoding endpoint to get location name from coordinates
  app.get('/api/geocode/reverse', async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      console.log('Geocoding request for coordinates:', { latitude, longitude });

      // Use OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&extratags=1&namedetails=1`,
        {
          headers: {
            'User-Agent': 'HRMS-App/1.0'
          }
        }
      );

      if (!response.ok) {
        console.error('Nominatim API error:', response.status, response.statusText);
        throw new Error(`Geocoding request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract meaningful location information
      const address = data.address || {};
      const displayName = data.display_name || '';
      
      // Build a friendly location name prioritizing specific locations over city
      const locationParts = [];
      
      // Add building/amenity name if available (highest priority)
      if (data.name && data.name !== data.display_name) {
        locationParts.push(data.name);
      }
      
      // Add amenity type if available (parks, schools, etc.)
      if (data.amenity) {
        locationParts.push(data.amenity);
      }
      
      // Add road/street if available
      if (address.road) {
        locationParts.push(address.road);
      } else if (address.pedestrian) {
        locationParts.push(address.pedestrian);
      }
      
      // Add specific area information (neighborhood, suburb, etc.)
      if (address.suburb) {
        locationParts.push(address.suburb);
      } else if (address.neighbourhood) {
        locationParts.push(address.neighbourhood);
      } else if (address.hamlet) {
        locationParts.push(address.hamlet);
      } else if (address.quarter) {
        locationParts.push(address.quarter);
      } else if (address.district) {
        locationParts.push(address.district);
      }
      
      // Only add city if we don't have enough specific information
      if (locationParts.length < 2) {
        if (address.city) {
          locationParts.push(address.city);
        } else if (address.town) {
          locationParts.push(address.town);
        } else if (address.village) {
          locationParts.push(address.village);
        }
      }
      
      // Construct the friendly name - prioritize specific locations
      let name;
      if (locationParts.length > 0) {
        // If we have specific location info, use it (max 2 parts to keep it concise)
        name = locationParts.slice(0, 2).join(', ');
      } else {
        // Fallback: try to extract meaningful parts from display name
        const displayParts = displayName.split(',');
        // Look for parts that are not just the city name
        const meaningfulParts = displayParts.filter(part => {
          const trimmed = part.trim();
          // Skip generic terms and very long parts
          return trimmed.length > 0 && 
                 trimmed.length < 50 && 
                 !['city', 'district', 'state', 'country'].some(term => 
                   trimmed.toLowerCase().includes(term)
                 );
        });
        name = meaningfulParts.slice(0, 2).join(', ');
      }

      res.json({
        name: name || 'Unknown Location',
        address: displayName,
        city: address.city || address.town || address.village || 'Unknown City',
        country: address.country || 'Unknown Country'
      });

    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      
      // Fallback: Return a simple location name based on coordinates
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      
      // Simple fallback location name
      const fallbackName = `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
      
      res.status(200).json({ 
        message: "Using fallback location name",
        name: fallbackName,
        address: fallbackName,
        city: "Unknown City",
        country: "Unknown Country"
      });
    }
  });

  // Test geocoding endpoint
  app.get('/api/geocode/test', async (req, res) => {
    try {
      // Test with a known location (New York City)
      const testLat = 40.7128;
      const testLon = -74.0060;
      
      console.log('Testing geocoding with coordinates:', { testLat, testLon });
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${testLat}&lon=${testLon}&addressdetails=1&extratags=1&namedetails=1`,
        {
          headers: {
            'User-Agent': 'HRMS-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Test geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      res.json({
        success: true,
        testLocation: data.display_name,
        message: "Geocoding service is working"
      });
    } catch (error) {
      console.error('Test geocoding failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Geocoding service is not working"
      });
    }
  });

  // Leave management routes
  app.post('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
      const leaves = await storage.getLeaveRequestsByUser(userId);
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      res.status(500).json({ message: "Failed to fetch leaves" });
    }
  });

  app.get('/api/leaves/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      const userId = req.user.id;
      const expenses = await storage.getExpenseClaimsByUser(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get('/api/expenses/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
      // Remove sensitive information and include onboarding status
      const sanitizedEmployees = employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        department: emp.department,
        position: emp.position,
        profileImageUrl: emp.profileImageUrl,
        role: emp.role,
        isOnboardingComplete: emp.isOnboardingComplete,
        joinDate: emp.joinDate,
        isActive: emp.isActive,
      }));
      res.json(sanitizedEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.delete('/api/admin/employees/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if employee exists
      const employee = await storage.getUser(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Prevent admin from deleting themselves
      if (id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Delete employee and all related data
      await storage.deleteEmployee(id);
      
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Payroll routes
  app.get('/api/payroll/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      // Return empty array - real notifications would be generated based on actual data
      res.json([]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      // Mark notification as read (mock implementation)
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // AI Insights route
  app.get('/api/ai/insights/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'manager') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Return empty array - real AI insights would be generated based on actual data
      res.json([]);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Recent activities endpoint
  app.get('/api/recent-activities', isAuthenticated, async (req: any, res) => {
    try {
      // For now return empty array - this would show recent leave requests, expense claims, etc.
      // In a real implementation, this would aggregate recent activities from multiple tables
      res.json([]);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ message: 'Failed to fetch recent activities' });
    }
  });

  // Attendance statistics route
  app.get('/api/attendance/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Calculate real attendance statistics based on user data
      const attendanceRecords = await storage.getAttendanceByUser(userId);
      
      const stats = {
        totalDays: attendanceRecords.length || 0,
        presentDays: attendanceRecords.filter(a => a.status === 'present').length || 0,
        lateDays: attendanceRecords.filter(a => a.status === 'late').length || 0,
        absentDays: attendanceRecords.filter(a => a.status === 'absent').length || 0,
        averageHours: 0, // This would need calculation based on check-in/out times
        attendanceRate: attendanceRecords.length > 0 ? 
          Math.round((attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length / attendanceRecords.length) * 100) : 0
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      res.status(500).json({ message: "Failed to fetch attendance statistics" });
    }
  });

  // Admin attendance management routes
  app.get("/api/admin/attendance/today", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const attendanceRecords = await storage.getTodayAttendanceForAll();
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching today's attendance for all employees:", error);
      res.status(500).json({ message: "Failed to fetch attendance data" });
    }
  });

  app.get("/api/admin/attendance/range/:startDate/:endDate", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.params;
      const attendanceRecords = await storage.getAttendanceRangeForAll(startDate, endDate);
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching attendance range for all employees:", error);
      res.status(500).json({ message: "Failed to fetch attendance data" });
    }
  });

  app.get("/api/admin/attendance/stats", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAttendanceStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      res.status(500).json({ message: "Failed to fetch attendance statistics" });
    }
  });

  // Admin payroll management routes
  app.post("/api/admin/payroll", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const payrollRecord = await storage.createPayrollRecord(req.body);
      res.status(201).json(payrollRecord);
    } catch (error) {
      console.error("Error creating payroll record:", error);
      res.status(500).json({ message: "Failed to create payroll record" });
    }
  });

  app.get("/api/admin/payroll", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { month, year } = req.query;
      const records = await storage.getPayrollRecords(
        month ? parseInt(month) : undefined,
        year ? parseInt(year) : undefined
      );
      res.json(records);
    } catch (error) {
      console.error("Error fetching payroll records:", error);
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  app.put("/api/admin/payroll/:id/process", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const record = await storage.processPayrollRecord(id);
      res.json(record);
    } catch (error) {
      console.error("Error processing payroll record:", error);
      res.status(500).json({ message: "Failed to process payroll record" });
    }
  });

  app.get("/api/admin/payroll/:id/payslip", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getPayrollRecordById(id);
      
      if (!record) {
        return res.status(404).json({ message: "Payroll record not found" });
      }

      // Generate and return payslip PDF
      // For now, return a placeholder response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payslip-${id}.pdf"`);
      res.status(200).send("PDF generation not implemented yet");
    } catch (error) {
      console.error("Error generating payslip:", error);
      res.status(500).json({ message: "Failed to generate payslip" });
    }
  });

  // Admin leave management routes
  app.post("/api/admin/leave-assignments", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const assignment = await storage.createLeaveAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating leave assignment:", error);
      res.status(500).json({ message: "Failed to create leave assignment" });
    }
  });

  app.get("/api/admin/leave-assignments", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const assignments = await storage.getLeaveAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching leave assignments:", error);
      res.status(500).json({ message: "Failed to fetch leave assignments" });
    }
  });

  app.get("/api/admin/leave-requests", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getAllLeaveRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  app.put("/api/admin/leave-requests/:id/respond", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const approverId = req.user.id;
      
      const request = await storage.respondToLeaveRequest(id, status, notes, approverId);
      res.json(request);
    } catch (error) {
      console.error("Error responding to leave request:", error);
      res.status(500).json({ message: "Failed to respond to leave request" });
    }
  });

  // Employee salary structure routes
  app.get("/api/admin/employees-with-salary", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const employees = await storage.getAllEmployeesWithSalaryStructure();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees with salary structure:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/admin/salary-structure", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const structure = await storage.createOrUpdateSalaryStructure(req.body);
      res.status(201).json(structure);
    } catch (error) {
      console.error("Error creating/updating salary structure:", error);
      res.status(500).json({ message: "Failed to save salary structure" });
    }
  });

  app.get("/api/admin/salary-structure/:userId", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const structure = await storage.getEmployeeSalaryStructure(userId);
      res.json(structure);
    } catch (error) {
      console.error("Error fetching salary structure:", error);
      res.status(500).json({ message: "Failed to fetch salary structure" });
    }
  });

  // Employee onboarding routes
  app.get('/api/employee/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getEmployeeProfile(userId);
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching employee profile:", error);
      res.status(500).json({ message: "Failed to fetch employee profile" });
    }
  });

  app.post('/api/employee/onboarding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if profile already exists
      const existingProfile = await storage.getEmployeeProfile(userId);
      if (existingProfile) {
        return res.status(400).json({ message: "Profile already exists" });
      }

      const profileData = insertEmployeeProfileSchema.parse({ 
        ...req.body, 
        userId 
      });

      const profile = await storage.createEmployeeProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating employee profile:", error);
      res.status(500).json({ message: "Failed to create employee profile" });
    }
  });

  app.put('/api/employee/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      const profile = await storage.updateEmployeeProfile(userId, updates);
      res.json(profile);
    } catch (error) {
      console.error("Error updating employee profile:", error);
      res.status(500).json({ message: "Failed to update employee profile" });
    }
  });

  // Object storage routes (required for file uploads in onboarding)
  app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  });

  app.put('/api/objects/bank-proof', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.body.documentURL) {
        return res.status(400).json({ error: 'documentURL is required' });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.documentURL,
        {
          owner: userId,
          visibility: "private",
        }
      );

      res.json({ objectPath });
    } catch (error) {
      console.error('Error setting document ACL:', error);
      res.status(500).json({ error: 'Failed to set document permissions' });
    }
  });

  // Departments API
  app.get("/api/departments", async (req, res) => {
    try {
      const departmentList = await storage.getDepartments();
      res.json(departmentList);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      console.log("Received department creation request:", req.body);
      const result = insertDepartmentSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Department validation failed:", result.error.issues);
        return res.status(400).json({ 
          message: "Invalid department data", 
          errors: result.error.issues 
        });
      }

      console.log("Creating department with data:", result.data);
      const department = await storage.createDepartment({
        ...result.data,
        createdBy: req.user?.id
      });

      console.log("Department created successfully:", department);
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.put("/api/departments/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const result = insertDepartmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid department data", 
          errors: result.error.issues 
        });
      }

      const department = await storage.updateDepartment(req.params.id, result.data);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const success = await storage.deleteDepartment(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Department not found" });
      }

      res.json({ message: "Department deleted successfully" });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // Designations API
  app.get("/api/designations", async (req, res) => {
    try {
      const designationList = await storage.getDesignations();
      res.json(designationList);
    } catch (error) {
      console.error("Error fetching designations:", error);
      res.status(500).json({ message: "Failed to fetch designations" });
    }
  });

  app.post("/api/designations", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      console.log("Received designation creation request:", req.body);
      const result = insertDesignationSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Designation validation failed:", result.error.issues);
        return res.status(400).json({ 
          message: "Invalid designation data", 
          errors: result.error.issues 
        });
      }

      console.log("Creating designation with data:", result.data);
      const designation = await storage.createDesignation({
        ...result.data,
        createdBy: req.user?.id
      });

      console.log("Designation created successfully:", designation);
      res.status(201).json(designation);
    } catch (error) {
      console.error("Error creating designation:", error);
      res.status(500).json({ message: "Failed to create designation" });
    }
  });

  app.put("/api/designations/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const result = insertDesignationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid designation data", 
          errors: result.error.issues 
        });
      }

      const designation = await storage.updateDesignation(req.params.id, result.data);
      if (!designation) {
        return res.status(404).json({ message: "Designation not found" });
      }

      res.json(designation);
    } catch (error) {
      console.error("Error updating designation:", error);
      res.status(500).json({ message: "Failed to update designation" });
    }
  });

  app.delete("/api/designations/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const success = await storage.deleteDesignation(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Designation not found" });
      }

      res.json({ message: "Designation deleted successfully" });
    } catch (error) {
      console.error("Error deleting designation:", error);
      res.status(500).json({ message: "Failed to delete designation" });
    }
  });

  // Debug routes for production database sync
  app.use(debugRouter);

  const httpServer = createServer(app);
  return httpServer;
}
