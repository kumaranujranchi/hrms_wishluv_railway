import {
  users,
  attendance,
  leaveRequests,
  expenseClaims,
  payroll,
  announcements,
  companySettings,
  employeeProfiles,
  departments,
  designations,
  leaveAssignments,
  employeeSalaryStructure,
  type User,
  type InsertUser,
  type Attendance,
  type InsertAttendance,
  type LeaveRequest,
  type InsertLeaveRequest,
  type ExpenseClaim,
  type InsertExpenseClaim,
  type Payroll,
  type InsertPayroll,
  type Announcement,
  type InsertAnnouncement,
  type CompanySettings,
  type EmployeeProfile,
  type InsertEmployeeProfile,
  type Department,
  type InsertDepartment,
  type Designation,
  type InsertDesignation,
  type LeaveAssignment,
  type InsertLeaveAssignment,
  type EmployeeSalaryStructure,
  type InsertEmployeeSalaryStructure,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations 
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: { email: string; passwordHash: string; firstName: string; lastName: string; }): Promise<User>;
  createEmployeeByAdmin(userData: { email: string; passwordHash: string; firstName: string; lastName: string; department?: string; position?: string; needsPasswordReset?: boolean; }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Employee operations
  getAllEmployees(): Promise<User[]>;
  getEmployeesByManager(managerId: string): Promise<User[]>;
  updateEmployee(id: string, updates: Partial<User>): Promise<User>;
  
  // Attendance operations
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByUser(userId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]>;
  getTodayAttendance(userId: string): Promise<Attendance | undefined>;
  getAttendanceStats(startDate?: Date, endDate?: Date): Promise<any>;
  
  // Admin attendance operations
  getTodayAttendanceForAll(): Promise<any[]>;
  getAttendanceRangeForAll(startDate: string, endDate: string): Promise<any[]>;
  
  // Admin payroll operations
  createPayrollRecord(payrollData: InsertPayroll): Promise<Payroll>;
  getPayrollRecords(month?: number, year?: number): Promise<any[]>;
  processPayrollRecord(recordId: string): Promise<Payroll>;
  getPayrollRecordById(recordId: string): Promise<Payroll | undefined>;
  
  // Employee salary structure operations
  createOrUpdateSalaryStructure(structureData: InsertEmployeeSalaryStructure): Promise<EmployeeSalaryStructure>;
  getEmployeeSalaryStructure(userId: string): Promise<EmployeeSalaryStructure | undefined>;
  getAllEmployeesWithSalaryStructure(): Promise<any[]>;
  
  // Admin leave management operations
  createLeaveAssignment(assignmentData: InsertLeaveAssignment): Promise<LeaveAssignment>;
  getLeaveAssignments(): Promise<any[]>;
  getAllLeaveRequests(): Promise<any[]>;
  respondToLeaveRequest(requestId: string, status: string, notes?: string, approverId?: string): Promise<LeaveRequest>;
  updateLeaveBalance(userId: string, leaveType: string, days: number): Promise<void>;
  
  // Leave operations
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(approverId?: string): Promise<LeaveRequest[]>;
  updateLeaveRequestStatus(id: string, status: string, approverId: string, notes?: string): Promise<LeaveRequest>;
  
  // Expense operations
  createExpenseClaim(expense: InsertExpenseClaim): Promise<ExpenseClaim>;
  getExpenseClaimsByUser(userId: string): Promise<ExpenseClaim[]>;
  getPendingExpenseClaims(approverId?: string): Promise<ExpenseClaim[]>;
  updateExpenseClaimStatus(id: string, status: string, approverId: string, notes?: string): Promise<ExpenseClaim>;
  
  // Payroll operations
  getPayrollByUser(userId: string): Promise<Payroll[]>;
  getPayrollByUserAndPeriod(userId: string, month: number, year: number): Promise<Payroll | undefined>;
  
  // Employee Profile operations
  getEmployeeProfile(userId: string): Promise<EmployeeProfile | undefined>;
  createEmployeeProfile(profile: InsertEmployeeProfile): Promise<EmployeeProfile>;
  updateEmployeeProfile(userId: string, updates: Partial<EmployeeProfile>): Promise<EmployeeProfile>;
  
  // Announcements operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  
  // Company settings
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings>;

  // Department operations
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment & { createdBy: string }): Promise<Department>;
  updateDepartment(id: string, department: InsertDepartment): Promise<Department | null>;
  deleteDepartment(id: string): Promise<boolean>;

  // Designation operations
  getDesignations(): Promise<(Designation & { department?: Department })[]>;
  createDesignation(designation: InsertDesignation & { createdBy: string }): Promise<Designation>;
  updateDesignation(id: string, designation: InsertDesignation): Promise<Designation | null>;
  deleteDesignation(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: { email: string; passwordHash: string; firstName: string; lastName: string; }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async createEmployeeByAdmin(userData: { email: string; passwordHash: string; firstName: string; lastName: string; department?: string; position?: string; needsPasswordReset?: boolean; }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        role: 'employee',
        needsPasswordReset: userData.needsPasswordReset ?? true,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Employee operations
  async getAllEmployees(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async getEmployeesByManager(managerId: string): Promise<User[]> {
    return await db.select().from(users).where(
      and(eq(users.managerId, managerId), eq(users.isActive, true))
    );
  }

  async updateEmployee(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Attendance operations
  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [result] = await db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return result;
  }

  async getAttendanceByUser(userId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    let query = db.select().from(attendance).where(eq(attendance.userId, userId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(attendance.date, startDate),
          lte(attendance.date, endDate)
        )
      );
    }
    
    return await query.orderBy(desc(attendance.date));
  }

  async getTodayAttendance(userId: string): Promise<Attendance | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAttendance] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, today),
          lte(attendance.date, tomorrow)
        )
      );
    
    return todayAttendance;
  }

  async getAttendanceStats(startDate?: Date, endDate?: Date): Promise<any> {
    // Default to current month if no dates provided
    const today = new Date();
    const defaultStart = startDate || new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultEnd = endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const [monthlyStats] = await db
      .select({
        totalEmployees: sql<number>`count(distinct ${users.id})`,
        presentCount: sql<number>`count(${attendance.id})`,
        attendanceRate: sql<number>`round((count(${attendance.id})::decimal / count(distinct ${users.id})) * 100, 2)`,
      })
      .from(users)
      .leftJoin(attendance, 
        and(
          eq(users.id, attendance.userId),
          gte(attendance.date, defaultStart),
          lte(attendance.date, defaultEnd),
          eq(attendance.status, 'present')
        )
      )
      .where(eq(users.isActive, true));

    const [todayStats] = await db
      .select({
        presentToday: sql<number>`count(case when ${attendance.status} = 'present' then 1 end)`,
        lateToday: sql<number>`count(case when ${attendance.status} = 'late' then 1 end)`,
        absentToday: sql<number>`count(distinct ${users.id}) - count(${attendance.id})`,
        averageWorkingHours: sql<number>`
          round(avg(
            case 
              when ${attendance.checkOut} is not null 
              then extract(epoch from (${attendance.checkOut} - ${attendance.checkIn})) / 3600
              else null
            end
          ), 2)
        `,
      })
      .from(users)
      .leftJoin(attendance, 
        and(
          eq(users.id, attendance.userId),
          gte(attendance.date, todayStart),
          lte(attendance.date, todayEnd)
        )
      )
      .where(eq(users.isActive, true));

    return {
      totalEmployees: monthlyStats.totalEmployees || 0,
      presentToday: todayStats.presentToday || 0,
      lateToday: todayStats.lateToday || 0,
      absentToday: todayStats.absentToday || 0,
      averageWorkingHours: todayStats.averageWorkingHours || 0,
      attendanceRate: monthlyStats.attendanceRate || 0,
    };
  }

  // Leave operations
  async createLeaveRequest(leaveRequestData: InsertLeaveRequest): Promise<LeaveRequest> {
    const [leaveRequest] = await db
      .insert(leaveRequests)
      .values(leaveRequestData)
      .returning();
    return leaveRequest;
  }

  async getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getPendingLeaveRequests(approverId?: string): Promise<LeaveRequest[]> {
    let query = db
      .select({
        id: leaveRequests.id,
        userId: leaveRequests.userId,
        type: leaveRequests.type,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        days: leaveRequests.days,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,
        approverId: leaveRequests.approverId,
        approverNotes: leaveRequests.approverNotes,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          department: users.department,
        },
      })
      .from(leaveRequests)
      .innerJoin(users, eq(leaveRequests.userId, users.id))
      .where(eq(leaveRequests.status, 'pending'));

    if (approverId) {
      query = query.where(eq(users.managerId, approverId));
    }

    return await query.orderBy(desc(leaveRequests.createdAt));
  }

  async updateLeaveRequestStatus(id: string, status: string, approverId: string, notes?: string): Promise<LeaveRequest> {
    const [leaveRequest] = await db
      .update(leaveRequests)
      .set({
        status: status as any,
        approverId,
        approverNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return leaveRequest;
  }

  // Expense operations
  async createExpenseClaim(expenseData: InsertExpenseClaim): Promise<ExpenseClaim> {
    const [expense] = await db
      .insert(expenseClaims)
      .values(expenseData)
      .returning();
    return expense;
  }

  async getExpenseClaimsByUser(userId: string): Promise<ExpenseClaim[]> {
    return await db
      .select()
      .from(expenseClaims)
      .where(eq(expenseClaims.userId, userId))
      .orderBy(desc(expenseClaims.submissionDate));
  }

  async getPendingExpenseClaims(approverId?: string): Promise<ExpenseClaim[]> {
    let query = db
      .select({
        id: expenseClaims.id,
        userId: expenseClaims.userId,
        title: expenseClaims.title,
        amount: expenseClaims.amount,
        category: expenseClaims.category,
        description: expenseClaims.description,
        receiptUrl: expenseClaims.receiptUrl,
        status: expenseClaims.status,
        submissionDate: expenseClaims.submissionDate,
        approverId: expenseClaims.approverId,
        approverNotes: expenseClaims.approverNotes,
        approvalDate: expenseClaims.approvalDate,
        reimbursementDate: expenseClaims.reimbursementDate,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          department: users.department,
        },
      })
      .from(expenseClaims)
      .innerJoin(users, eq(expenseClaims.userId, users.id))
      .where(eq(expenseClaims.status, 'submitted'));

    if (approverId) {
      query = query.where(eq(users.managerId, approverId));
    }

    return await query.orderBy(desc(expenseClaims.submissionDate));
  }

  async updateExpenseClaimStatus(id: string, status: string, approverId: string, notes?: string): Promise<ExpenseClaim> {
    const [expense] = await db
      .update(expenseClaims)
      .set({
        status: status as any,
        approverId,
        approverNotes: notes,
        approvalDate: status === 'approved' ? new Date() : null,
      })
      .where(eq(expenseClaims.id, id))
      .returning();
    return expense;
  }

  // Payroll operations
  async getPayrollByUser(userId: string): Promise<Payroll[]> {
    return await db
      .select()
      .from(payroll)
      .where(eq(payroll.userId, userId))
      .orderBy(desc(payroll.year), desc(payroll.month));
  }

  async getPayrollByUserAndPeriod(userId: string, month: number, year: number): Promise<Payroll | undefined> {
    const [payrollRecord] = await db
      .select()
      .from(payroll)
      .where(
        and(
          eq(payroll.userId, userId),
          eq(payroll.month, month),
          eq(payroll.year, year)
        )
      );
    return payrollRecord;
  }

  // Announcements operations
  async createAnnouncement(announcementData: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values(announcementData)
      .returning();
    return announcement;
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        priority: announcements.priority,
        createdAt: announcements.createdAt,
        isActive: announcements.isActive,
        authorId: announcements.authorId,
        author: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.createdAt))
      .limit(5);
  }

  // Employee profile management
  async updateEmployeeProfile(employeeId: string, profileData: any): Promise<EmployeeProfile> {
    // First update the user table with basic info
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        department: profileData.department,
        position: profileData.position,
        updatedAt: new Date(),
      })
      .where(eq(users.id, employeeId))
      .returning();

    // Then update or insert the employee profile details
    const profileUpdate = {
      userId: employeeId,
      fatherName: profileData.fatherName,
      dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
      marriageAnniversary: profileData.marriageAnniversary ? new Date(profileData.marriageAnniversary) : null,
      personalMobile: profileData.personalMobile,
      emergencyContactName: profileData.emergencyContactName,
      emergencyContactNumber: profileData.emergencyContactNumber,
      emergencyContactRelation: profileData.emergencyContactRelation,
      panNumber: profileData.panNumber,
      aadharNumber: profileData.aadharNumber,
      currentAddress: profileData.currentAddress,
      permanentAddress: profileData.permanentAddress,
      bankAccountNumber: profileData.bankAccountNumber,
      ifscCode: profileData.ifscCode,
      bankName: profileData.bankName,
      // Salary structure fields
      basicSalary: profileData.basicSalary ? profileData.basicSalary : null,
      hra: profileData.hra ? profileData.hra : null,
      pfEmployeeContribution: profileData.pfEmployeeContribution ? profileData.pfEmployeeContribution : null,
      pfEmployerContribution: profileData.pfEmployerContribution ? profileData.pfEmployerContribution : null,
      esicEmployeeContribution: profileData.esicEmployeeContribution ? profileData.esicEmployeeContribution : null,
      esicEmployerContribution: profileData.esicEmployerContribution ? profileData.esicEmployerContribution : null,
      specialAllowance: profileData.specialAllowance ? profileData.specialAllowance : null,
      performanceBonus: profileData.performanceBonus ? profileData.performanceBonus : null,
      gratuity: profileData.gratuity ? profileData.gratuity : null,
      professionalTax: profileData.professionalTax ? profileData.professionalTax : null,
      medicalAllowance: profileData.medicalAllowance ? profileData.medicalAllowance : null,
      conveyanceAllowance: profileData.conveyanceAllowance ? profileData.conveyanceAllowance : null,
      foodCoupons: profileData.foodCoupons ? profileData.foodCoupons : null,
      lta: profileData.lta ? profileData.lta : null,
      shiftAllowance: profileData.shiftAllowance ? profileData.shiftAllowance : null,
      overtimePay: profileData.overtimePay ? profileData.overtimePay : null,
      attendanceBonus: profileData.attendanceBonus ? profileData.attendanceBonus : null,
      joiningBonus: profileData.joiningBonus ? profileData.joiningBonus : null,
      retentionBonus: profileData.retentionBonus ? profileData.retentionBonus : null,
      updatedAt: new Date(),
    };

    // Check if profile already exists
    const existingProfile = await this.getEmployeeProfile(employeeId);
    
    if (existingProfile) {
      await db
        .update(employeeProfiles)
        .set(profileUpdate)
        .where(eq(employeeProfiles.userId, employeeId));
    } else {
      await db
        .insert(employeeProfiles)
        .values(profileUpdate)
        .onConflictDoUpdate({
          target: employeeProfiles.userId,
          set: profileUpdate
        });
    }

    return existingProfile || await this.createEmployeeProfile(profileUpdate);
  }

  async getEmployeeProfile(employeeId: string): Promise<EmployeeProfile | undefined> {
    const [profile] = await db
      .select()
      .from(employeeProfiles)
      .where(eq(employeeProfiles.userId, employeeId));
    return profile;
  }

  // Company settings
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
  }

  async updateCompanySettings(settingsData: Partial<CompanySettings>): Promise<CompanySettings> {
    const existingSettings = await this.getCompanySettings();
    
    if (existingSettings) {
      const [updated] = await db
        .update(companySettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(companySettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(companySettings)
        .values(settingsData as any)
        .returning();
      return created;
    }
  }

  async createEmployeeProfile(profile: InsertEmployeeProfile): Promise<EmployeeProfile> {
    const [newProfile] = await db
      .insert(employeeProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(desc(departments.createdAt));
  }

  async createDepartment(department: InsertDepartment & { createdBy: string }): Promise<Department> {
    try {
      console.log("Attempting to create department in database:", department);
      const [newDepartment] = await db
        .insert(departments)
        .values(department)
        .returning();
      console.log("Department created successfully in database:", newDepartment);
      return newDepartment;
    } catch (error) {
      console.error("Database error creating department:", error);
      throw error;
    }
  }

  async updateDepartment(id: string, departmentData: InsertDepartment): Promise<Department | null> {
    const [updated] = await db
      .update(departments)
      .set({ ...departmentData, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return updated || null;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    const result = await db.delete(departments).where(eq(departments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Designation operations
  async getDesignations(): Promise<(Designation & { department?: Department })[]> {
    const result = await db
      .select({
        id: designations.id,
        name: designations.name,
        description: designations.description,
        departmentId: designations.departmentId,
        createdBy: designations.createdBy,
        createdAt: designations.createdAt,
        updatedAt: designations.updatedAt,
        department: {
          id: departments.id,
          name: departments.name,
          description: departments.description,
          createdBy: departments.createdBy,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
        },
      })
      .from(designations)
      .leftJoin(departments, eq(designations.departmentId, departments.id))
      .orderBy(desc(designations.createdAt));
    
    return result.map(row => ({
      ...row,
      department: (row.department && row.department.id) ? row.department : undefined
    }));
  }

  async createDesignation(designation: InsertDesignation & { createdBy: string }): Promise<Designation> {
    try {
      console.log("Attempting to create designation in database:", designation);
      const [newDesignation] = await db
        .insert(designations)
        .values(designation)
        .returning();
      console.log("Designation created successfully in database:", newDesignation);
      return newDesignation;
    } catch (error) {
      console.error("Database error creating designation:", error);
      throw error;
    }
  }

  async updateDesignation(id: string, designationData: InsertDesignation): Promise<Designation | null> {
    const [updated] = await db
      .update(designations)
      .set({ ...designationData, updatedAt: new Date() })
      .where(eq(designations.id, id))
      .returning();
    return updated || null;
  }

  async deleteDesignation(id: string): Promise<boolean> {
    const result = await db.delete(designations).where(eq(designations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Admin attendance operations
  async getTodayAttendanceForAll(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        userEmail: users.email,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        status: attendance.status,
        location: attendance.location,
        workingHours: sql<number>`
          case 
            when ${attendance.checkOut} is not null 
            then extract(epoch from (${attendance.checkOut} - ${attendance.checkIn})) / 3600
            else null
          end
        `,
      })
      .from(attendance)
      .innerJoin(users, eq(attendance.userId, users.id))
      .where(
        and(
          gte(attendance.date, today),
          lte(attendance.date, tomorrow),
          eq(users.isActive, true)
        )
      )
      .orderBy(attendance.checkIn);
  }

  async getAttendanceRangeForAll(startDate: string, endDate: string): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        userEmail: users.email,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        status: attendance.status,
        location: attendance.location,
        workingHours: sql<number>`
          case 
            when ${attendance.checkOut} is not null 
            then extract(epoch from (${attendance.checkOut} - ${attendance.checkIn})) / 3600
            else null
          end
        `,
      })
      .from(attendance)
      .innerJoin(users, eq(attendance.userId, users.id))
      .where(
        and(
          gte(attendance.date, start),
          lte(attendance.date, end),
          eq(users.isActive, true)
        )
      )
      .orderBy(desc(attendance.date), attendance.checkIn);
  }

  // Admin payroll operations
  async createPayrollRecord(payrollData: InsertPayroll): Promise<Payroll> {
    const [record] = await db
      .insert(payroll)
      .values({
        ...payrollData,
        updatedAt: new Date(),
      })
      .returning();
    return record;
  }

  async getPayrollRecords(month?: number, year?: number): Promise<any[]> {
    let query = db
      .select({
        id: payroll.id,
        userId: payroll.userId,
        month: payroll.month,
        year: payroll.year,
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        grossSalary: payroll.grossSalary,
        netSalary: payroll.netSalary,
        salaryBreakup: payroll.salaryBreakup,
        status: payroll.status,
        processedAt: payroll.processedAt,
        createdAt: payroll.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          department: users.department,
        },
      })
      .from(payroll)
      .innerJoin(users, eq(payroll.userId, users.id));

    if (month && year) {
      query = query.where(
        and(
          eq(payroll.month, month),
          eq(payroll.year, year)
        )
      );
    }

    return await query.orderBy(desc(payroll.createdAt));
  }

  async processPayrollRecord(recordId: string): Promise<Payroll> {
    const [record] = await db
      .update(payroll)
      .set({
        status: 'processed',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payroll.id, recordId))
      .returning();
    return record;
  }

  async getPayrollRecordById(recordId: string): Promise<Payroll | undefined> {
    const [record] = await db
      .select()
      .from(payroll)
      .where(eq(payroll.id, recordId));
    return record;
  }

  // Admin leave management operations
  async createLeaveAssignment(assignmentData: InsertLeaveAssignment): Promise<LeaveAssignment> {
    const [assignment] = await db
      .insert(leaveAssignments)
      .values({
        ...assignmentData,
        updatedAt: new Date(),
      })
      .returning();
    return assignment;
  }

  async getLeaveAssignments(): Promise<any[]> {
    return await db
      .select({
        id: leaveAssignments.id,
        userId: leaveAssignments.userId,
        year: leaveAssignments.year,
        annualLeave: leaveAssignments.annualLeave,
        sickLeave: leaveAssignments.sickLeave,
        casualLeave: leaveAssignments.casualLeave,
        maternityLeave: leaveAssignments.maternityLeave,
        paternityLeave: leaveAssignments.paternityLeave,
        annualUsed: leaveAssignments.annualUsed,
        sickUsed: leaveAssignments.sickUsed,
        casualUsed: leaveAssignments.casualUsed,
        maternityUsed: leaveAssignments.maternityUsed,
        paternityUsed: leaveAssignments.paternityUsed,
        createdAt: leaveAssignments.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          department: users.department,
        },
      })
      .from(leaveAssignments)
      .innerJoin(users, eq(leaveAssignments.userId, users.id))
      .orderBy(desc(leaveAssignments.createdAt));
  }

  async getAllLeaveRequests(): Promise<any[]> {
    return await db
      .select({
        id: leaveRequests.id,
        userId: leaveRequests.userId,
        type: leaveRequests.type,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        days: leaveRequests.days,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approverId: leaveRequests.approverId,
        approverNotes: leaveRequests.approverNotes,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          department: users.department,
          position: users.position,
        },
      })
      .from(leaveRequests)
      .innerJoin(users, eq(leaveRequests.userId, users.id))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async respondToLeaveRequest(requestId: string, status: string, notes?: string, approverId?: string): Promise<LeaveRequest> {
    const [request] = await db
      .update(leaveRequests)
      .set({
        status: status as any,
        approverNotes: notes,
        approverId,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, requestId))
      .returning();
    
    // If approved, update leave balance
    if (status === 'approved' && request) {
      await this.updateLeaveBalance(request.userId, request.type, request.days);
    }
    
    return request;
  }

  async updateLeaveBalance(userId: string, leaveType: string, days: number): Promise<void> {
    const currentYear = new Date().getFullYear();
    
    // Map leave types to database columns
    const columnMap: { [key: string]: string } = {
      annual: 'annualUsed',
      sick: 'sickUsed',
      casual: 'casualUsed',
      maternity: 'maternityUsed',
      paternity: 'paternityUsed',
    };

    const column = columnMap[leaveType];
    if (!column) return;

    // Get current assignment
    const [currentAssignment] = await db
      .select()
      .from(leaveAssignments)
      .where(
        and(
          eq(leaveAssignments.userId, userId),
          eq(leaveAssignments.year, currentYear)
        )
      );

    if (currentAssignment) {
      // Update existing assignment
      await db
        .update(leaveAssignments)
        .set({
          [column]: (currentAssignment[column as keyof typeof currentAssignment] as number) + days,
          updatedAt: new Date(),
        })
        .where(eq(leaveAssignments.id, currentAssignment.id));
    }
  }

  // Employee salary structure operations
  async createOrUpdateSalaryStructure(structureData: InsertEmployeeSalaryStructure): Promise<EmployeeSalaryStructure> {
    const [structure] = await db
      .insert(employeeSalaryStructure)
      .values({
        ...structureData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: employeeSalaryStructure.userId,
        set: {
          ...structureData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return structure;
  }

  async getEmployeeSalaryStructure(userId: string): Promise<EmployeeSalaryStructure | undefined> {
    const [structure] = await db
      .select()
      .from(employeeSalaryStructure)
      .where(eq(employeeSalaryStructure.userId, userId));
    return structure;
  }

  async getAllEmployeesWithSalaryStructure(): Promise<any[]> {
    // Get all employees with their salary structure (if exists)
    return await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        department: users.department,
        position: users.position,
        isOnboardingComplete: users.isOnboardingComplete,
        salaryStructure: {
          id: employeeSalaryStructure.id,
          basicSalary: employeeSalaryStructure.basicSalary,
          hra: employeeSalaryStructure.hra,
          conveyanceAllowance: employeeSalaryStructure.conveyanceAllowance,
          medicalAllowance: employeeSalaryStructure.medicalAllowance,
          specialAllowance: employeeSalaryStructure.specialAllowance,
          grossSalary: employeeSalaryStructure.grossSalary,
          providentFund: employeeSalaryStructure.providentFund,
          professionalTax: employeeSalaryStructure.professionalTax,
          incomeTax: employeeSalaryStructure.incomeTax,
          otherDeductions: employeeSalaryStructure.otherDeductions,
          totalDeductions: employeeSalaryStructure.totalDeductions,
          netSalary: employeeSalaryStructure.netSalary,
          effectiveDate: employeeSalaryStructure.effectiveDate,
        },
      })
      .from(users)
      .leftJoin(employeeSalaryStructure, eq(users.id, employeeSalaryStructure.userId))
      .where(and(
        eq(users.role, 'employee'),
        eq(users.isActive, true),
        eq(users.isOnboardingComplete, true)
      ))
      .orderBy(users.firstName, users.lastName);
  }
}

export const storage = new DatabaseStorage();
