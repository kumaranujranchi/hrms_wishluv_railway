import {
  users,
  attendance,
  leaveRequests,
  expenseClaims,
  payroll,
  announcements,
  companySettings,
  type User,
  type UpsertUser,
  type Attendance,
  type InsertAttendance,
  type LeaveRequest,
  type InsertLeaveRequest,
  type ExpenseClaim,
  type InsertExpenseClaim,
  type Payroll,
  type Announcement,
  type InsertAnnouncement,
  type CompanySettings,
  employeeProfiles,
  type EmployeeProfile,
  type InsertEmployeeProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(id: string, user: UpsertUser): Promise<User>;
  
  // Employee operations
  getAllEmployees(): Promise<User[]>;
  getEmployeesByManager(managerId: string): Promise<User[]>;
  updateEmployee(id: string, updates: Partial<User>): Promise<User>;
  
  // Attendance operations
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByUser(userId: string, startDate?: Date, endDate?: Date): Promise<Attendance[]>;
  getTodayAttendance(userId: string): Promise<Attendance | undefined>;
  getAttendanceStats(startDate: Date, endDate: Date): Promise<any>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(id: string, userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...userData, id })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
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

  async getAttendanceStats(startDate: Date, endDate: Date): Promise<any> {
    const stats = await db
      .select({
        totalEmployees: sql<number>`count(distinct ${users.id})`,
        presentCount: sql<number>`count(${attendance.id})`,
        attendanceRate: sql<number>`round((count(${attendance.id})::decimal / count(distinct ${users.id})) * 100, 2)`,
      })
      .from(users)
      .leftJoin(attendance, 
        and(
          eq(users.id, attendance.userId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate),
          eq(attendance.status, 'present')
        )
      )
      .where(eq(users.isActive, true));

    return stats[0];
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

  // Employee Profile operations
  async getEmployeeProfile(userId: string): Promise<EmployeeProfile | undefined> {
    const [profile] = await db
      .select()
      .from(employeeProfiles)
      .where(eq(employeeProfiles.userId, userId));
    return profile;
  }

  async createEmployeeProfile(profile: InsertEmployeeProfile): Promise<EmployeeProfile> {
    const [newProfile] = await db
      .insert(employeeProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateEmployeeProfile(userId: string, updates: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    const [updated] = await db
      .update(employeeProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employeeProfiles.userId, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
