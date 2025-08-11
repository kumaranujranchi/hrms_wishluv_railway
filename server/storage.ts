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
import { eq, and, gte, lte, desc, sql, lt } from "drizzle-orm";
import * as schema from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  createUser(userData: { email: string; passwordHash: string; firstName: string; lastName: string; }): Promise<User>;
  createEmployeeByAdmin(userData: { email: string; passwordHash: string; firstName: string; lastName: string; department?: string; position?: string; needsPasswordReset?: boolean; }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  upsertUser(id: string, userData: { email: string; firstName: string; lastName: string; profileImageUrl?: string; role?: string; }): Promise<User>;

  // Employee operations
  getAllEmployees(): Promise<User[]>;
  getEmployeesByManager(managerId: string): Promise<User[]>;
  updateEmployee(id: string, updates: Partial<User>): Promise<User>;
  deleteEmployee(id: string): Promise<void>;

  // Attendance operations
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance>;
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
  // Use the schema directly to avoid issues with 'this.db' not being defined in the constructor
  private db = db;

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get user with current password hash
      const [user] = await this.db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return false;
      }

      // Verify current password
      const bcrypt = await import('bcryptjs');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return false;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password in database
      await this.db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error("Error changing password:", error);
      return false;
    }
  }

  async createUser(userData: { email: string; passwordHash: string; firstName: string; lastName: string; }): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async createEmployeeByAdmin(userData: { email: string; passwordHash: string; firstName: string; lastName: string; department?: string; position?: string; needsPasswordReset?: boolean; }): Promise<User> {
    const [user] = await this.db
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
    const [user] = await this.db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Employee operations
  async getAllEmployees(): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.isActive, true));
  }

  async getEmployeesByManager(managerId: string): Promise<User[]> {
    return await this.db.select().from(users).where(
      and(eq(users.managerId, managerId), eq(users.isActive, true))
    );
  }

  async updateEmployee(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteEmployee(id: string): Promise<void> {
    // Delete in order to respect foreign key constraints
    // First delete dependent records, then the employee
    await this.db.delete(attendance).where(eq(attendance.userId, id));
    await this.db.delete(leaveRequests).where(eq(leaveRequests.userId, id));
    await this.db.delete(expenseClaims).where(eq(expenseClaims.userId, id));
    await this.db.delete(payroll).where(eq(payroll.userId, id));
    await this.db.delete(employeeProfiles).where(eq(employeeProfiles.userId, id));
    await this.db.delete(leaveAssignments).where(eq(leaveAssignments.userId, id));
    await this.db.delete(employeeSalaryStructure).where(eq(employeeSalaryStructure.userId, id));

    // Finally delete the user record
    await this.db.delete(users).where(eq(users.id, id));
  }

  async upsertUser(id: string, userData: { email: string; firstName: string; lastName: string; profileImageUrl?: string; role?: string; }): Promise<User> {
    const existingUser = await this.getUser(id);

    if (existingUser) {
      // Update existing user
      const [updated] = await this.db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          ...(userData.role && { role: userData.role as 'admin' | 'manager' | 'employee' }),
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return updated;
    } else {
      // Create new user with a placeholder password hash
      const [created] = await this.db
        .insert(users)
        .values({
          id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          passwordHash: 'oauth-placeholder', // This user will authenticate via OAuth
          needsPasswordReset: false,
          role: (userData.role as 'admin' | 'manager' | 'employee') || 'employee'
        })
        .returning();
      return created;
    }
  }

  // Attendance operations
  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    console.log('Marking attendance in database:', attendanceData);
    const [record] = await this.db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    console.log('Attendance record created:', record);
    return record;
  }

  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance> {
    console.log('Updating attendance in database:', { id, updates });
    const [record] = await this.db
      .update(attendance)
      .set({ ...updates })
      .where(eq(attendance.id, id))
      .returning();
    console.log('Attendance record updated:', record);
    return record;
  }

  async getAttendanceByUser(userId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    if (startDate && endDate) {
      return await this.db.select().from(attendance)
        .where(
          and(
            eq(attendance.userId, userId),
            gte(attendance.date, startDate),
            lte(attendance.date, endDate)
          )
        )
        .orderBy(desc(attendance.date));
    }

    return await this.db.select().from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }

  async getTodayAttendance(userId: string): Promise<Attendance | undefined> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    console.log('Getting today attendance for user:', userId);
    console.log('Date range:', { startOfDay, endOfDay });

    const result = await this.db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay)
        )
      )
      .orderBy(desc(attendance.date))
      .limit(1);

    console.log('Today attendance result:', result[0]);
    return result[0] || null;
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

    const [monthlyStats] = await this.db
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

    const [todayStats] = await this.db
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
    const [leaveRequest] = await this.db
      .insert(leaveRequests)
      .values(leaveRequestData)
      .returning();
    return leaveRequest;
  }

  async getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[] > {
    return await this.db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async getPendingLeaveRequests(approverId?: string): Promise<LeaveRequest[]> {
    if (approverId) {
      return await this.db
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
        .where(
          and(
            eq(leaveRequests.status, 'pending'),
            eq(users.managerId, approverId)
          )
        )
        .orderBy(desc(leaveRequests.createdAt));
    }

    return await this.db
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
      .where(eq(leaveRequests.status, 'pending'))
      .orderBy(desc(leaveRequests.createdAt));
  }

  async updateLeaveRequestStatus(id: string, status: string, approverId: string, notes?: string): Promise<LeaveRequest> {
    const [leaveRequest] = await this.db
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
    const [expense] = await this.db
      .insert(expenseClaims)
      .values(expenseData)
      .returning();
    return expense;
  }

  async getExpenseClaimsByUser(userId: string): Promise<ExpenseClaim[]> {
    return await this.db
      .select()
      .from(expenseClaims)
      .where(eq(expenseClaims.userId, userId))
      .orderBy(desc(expenseClaims.submissionDate));
  }

  async getPendingExpenseClaims(approverId?: string): Promise<ExpenseClaim[]> {
    if (approverId) {
      return await this.db
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
        .where(
          and(
            eq(expenseClaims.status, 'submitted'),
            eq(users.managerId, approverId)
          )
        )
        .orderBy(desc(expenseClaims.submissionDate));
    }

    return await this.db
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
      .where(eq(expenseClaims.status, 'submitted'))
      .orderBy(desc(expenseClaims.submissionDate));
  }

  async updateExpenseClaimStatus(id: string, status: string, approverId: string, notes?: string): Promise<ExpenseClaim> {
    const [expense] = await this.db
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
    return await this.db
      .select()
      .from(payroll)
      .where(eq(payroll.userId, userId))
      .orderBy(desc(payroll.year), desc(payroll.month));
  }

  async getPayrollByUserAndPeriod(userId: string, month: number, year: number): Promise<Payroll | undefined> {
    const [payrollRecord] = await this.db
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
    const [announcement] = await this.db
      .insert(announcements)
      .values(announcementData)
      .returning();
    return announcement;
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await this.db
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
    // First update the user table with basic info (only if provided)
    const userUpdate: any = { updatedAt: new Date() };
    if (profileData.firstName) userUpdate.firstName = profileData.firstName;
    if (profileData.lastName) userUpdate.lastName = profileData.lastName;
    if (profileData.email) userUpdate.email = profileData.email;
    if (profileData.department) userUpdate.department = profileData.department;
    if (profileData.position) userUpdate.position = profileData.position;

    await this.db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, employeeId));

    // Then update or insert the employee profile details
    const profileUpdate: any = {
      userId: employeeId,
      updatedAt: new Date(),
    };

    // Only add fields that are provided
    if (profileData.fatherName !== undefined) profileUpdate.fatherName = profileData.fatherName;
    if (profileData.dateOfBirth) profileUpdate.dateOfBirth = new Date(profileData.dateOfBirth);
    if (profileData.marriageAnniversary) profileUpdate.marriageAnniversary = new Date(profileData.marriageAnniversary);
    if (profileData.personalMobile !== undefined) profileUpdate.personalMobile = profileData.personalMobile;
    if (profileData.emergencyContactName !== undefined) profileUpdate.emergencyContactName = profileData.emergencyContactName;
    if (profileData.emergencyContactNumber !== undefined) profileUpdate.emergencyContactNumber = profileData.emergencyContactNumber;
    if (profileData.emergencyContactRelation !== undefined) profileUpdate.emergencyContactRelation = profileData.emergencyContactRelation;
    if (profileData.panNumber !== undefined) profileUpdate.panNumber = profileData.panNumber;
    if (profileData.aadharNumber !== undefined) profileUpdate.aadharNumber = profileData.aadharNumber;
    if (profileData.bankAccountNumber !== undefined) profileUpdate.bankAccountNumber = profileData.bankAccountNumber;
    if (profileData.ifscCode !== undefined) profileUpdate.ifscCode = profileData.ifscCode;
    if (profileData.bankName !== undefined) profileUpdate.bankName = profileData.bankName;

    // Salary structure fields
    if (profileData.basicSalary) profileUpdate.basicSalary = profileData.basicSalary;
    if (profileData.hra) profileUpdate.hra = profileData.hra;
    if (profileData.pfEmployeeContribution) profileUpdate.pfEmployeeContribution = profileData.pfEmployeeContribution;
    if (profileData.pfEmployerContribution) profileUpdate.pfEmployerContribution = profileData.pfEmployerContribution;
    if (profileData.esicEmployeeContribution) profileUpdate.esicEmployeeContribution = profileData.esicEmployeeContribution;
    if (profileData.esicEmployerContribution) profileUpdate.esicEmployerContribution = profileData.esicEmployerContribution;
    if (profileData.specialAllowance) profileUpdate.specialAllowance = profileData.specialAllowance;
    if (profileData.performanceBonus) profileUpdate.performanceBonus = profileData.performanceBonus;
    if (profileData.gratuity) profileUpdate.gratuity = profileData.gratuity;
    if (profileData.professionalTax) profileUpdate.professionalTax = profileData.professionalTax;
    if (profileData.medicalAllowance) profileUpdate.medicalAllowance = profileData.medicalAllowance;
    if (profileData.conveyanceAllowance) profileUpdate.conveyanceAllowance = profileData.conveyanceAllowance;
    if (profileData.foodCoupons) profileUpdate.foodCoupons = profileData.foodCoupons;
    if (profileData.lta) profileUpdate.lta = profileData.lta;
    if (profileData.shiftAllowance) profileUpdate.shiftAllowance = profileData.shiftAllowance;
    if (profileData.overtimePay) profileUpdate.overtimePay = profileData.overtimePay;
    if (profileData.attendanceBonus) profileUpdate.attendanceBonus = profileData.attendanceBonus;
    if (profileData.joiningBonus) profileUpdate.joiningBonus = profileData.joiningBonus;
    if (profileData.retentionBonus) profileUpdate.retentionBonus = profileData.retentionBonus;

    // Check if profile already exists
    const existingProfile = await this.getEmployeeProfile(employeeId);

    if (existingProfile) {
      await this.db
        .update(employeeProfiles)
        .set(profileUpdate)
        .where(eq(employeeProfiles.userId, employeeId));
    } else {
      await this.db
        .insert(employeeProfiles)
        .values(profileUpdate)
        .onConflictDoUpdate({
          target: employeeProfiles.userId,
          set: profileUpdate
        });
    }

    return await this.getEmployeeProfile(employeeId) || existingProfile;
  }

  async getEmployeeProfile(employeeId: string): Promise<EmployeeProfile | undefined> {
    const [profile] = await this.db
      .select()
      .from(employeeProfiles)
      .where(eq(employeeProfiles.userId, employeeId));
    return profile;
  }

  // Company settings
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await this.db.select().from(companySettings).limit(1);
    return settings;
  }

  async updateCompanySettings(settingsData: Partial<CompanySettings>): Promise<CompanySettings> {
    const existingSettings = await this.getCompanySettings();

    if (existingSettings) {
      const [updated] = await this.db
        .update(companySettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(companySettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await this.db
        .insert(companySettings)
        .values(settingsData as any)
        .returning();
      return created;
    }
  }

  async createEmployeeProfile(profile: InsertEmployeeProfile): Promise<EmployeeProfile> {
    const [newProfile] = await this.db
      .insert(employeeProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await this.db.select().from(departments).orderBy(desc(departments.createdAt));
  }

  async createDepartment(department: InsertDepartment & { createdBy: string }): Promise<Department> {
    try {
      console.log("Attempting to create department in database:", department);
      const [newDepartment] = await this.db
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
    const [updated] = await this.db
      .update(departments)
      .set({ ...departmentData, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return updated || null;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    const result = await this.db.delete(departments).where(eq(departments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Designation operations
  async getDesignations(): Promise<(Designation & { department?: Department })[]> {
    const result = await this.db
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
      const [newDesignation] = await this.db
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
    const [updated] = await this.db
      .update(designations)
      .set({ ...designationData, updatedAt: new Date() })
      .where(eq(designations.id, id))
      .returning();
    return updated || null;
  }

  async deleteDesignation(id: string): Promise<boolean> {
    const result = await this.db.delete(designations).where(eq(designations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Admin attendance operations
  async getTodayAttendanceForAll(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return await this.db
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
        locationName: attendance.locationName,
        latitude: attendance.latitude,
        longitude: attendance.longitude,
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

    return await this.db
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
        locationName: attendance.locationName,
        latitude: attendance.latitude,
        longitude: attendance.longitude,
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
    const [record] = await this.db
      .insert(payroll)
      .values({
        ...payrollData,
        updatedAt: new Date(),
      })
      .returning();
    return record;
  }

  async getPayrollRecords(month?: number, year?: number): Promise<any[]> {
    if (month && year) {
      return await this.db
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
        .innerJoin(users, eq(payroll.userId, users.id))
        .where(
          and(
            eq(payroll.month, month),
            eq(payroll.year, year)
          )
        )
        .orderBy(desc(payroll.createdAt));
    }

    return await this.db
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
      .innerJoin(users, eq(payroll.userId, users.id))
      .orderBy(desc(payroll.createdAt));
  }

  async processPayrollRecord(recordId: string): Promise<Payroll> {
    const [record] = await this.db
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
    const [record] = await this.db
      .select()
      .from(payroll)
      .where(eq(payroll.id, recordId));
    return record;
  }

  // Admin leave management operations
  async createLeaveAssignment(assignmentData: InsertLeaveAssignment): Promise<LeaveAssignment> {
    const [assignment] = await this.db
      .insert(leaveAssignments)
      .values({
        ...assignmentData,
        updatedAt: new Date(),
      })
      .returning();
    return assignment;
  }

  async getLeaveAssignments(): Promise<any[]> {
    return await this.db
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
    return await this.db
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
    const [request] = await this.db
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
    const [currentAssignment] = await this.db
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
      await this.db
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
    const [structure] = await this.db
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
    const [structure] = await this.db
      .select()
      .from(employeeSalaryStructure)
      .where(eq(employeeSalaryStructure.userId, userId));
    return structure;
  }

  async getAllEmployeesWithSalaryStructure(): Promise<any[]> {
    // Get all employees with their salary structure (if exists)
    return await this.db
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