import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'employee']);
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected']);
export const leaveTypeEnum = pgEnum('leave_type', ['sick', 'vacation', 'personal', 'maternity', 'paternity']);
export const expenseStatusEnum = pgEnum('expense_status', ['submitted', 'approved', 'rejected', 'reimbursed']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'half_day']);

// Users table 
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('employee'),
  isOnboardingComplete: boolean("is_onboarding_complete").default(false),
  needsPasswordReset: boolean("needs_password_reset").default(true),
  department: varchar("department"),
  position: varchar("position"),
  managerId: varchar("manager_id"),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  joinDate: timestamp("join_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  status: attendanceStatusEnum("status").default('present'),
  location: varchar("location"),
  locationName: varchar("location_name"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leave requests table
export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: leaveTypeEnum("type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default('pending'),
  approverId: varchar("approver_id"),
  approverNotes: text("approver_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expense claims table
export const expenseClaims = pgTable("expense_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  receiptUrl: varchar("receipt_url"),
  status: expenseStatusEnum("status").default('submitted'),
  approverId: varchar("approver_id"),
  approverNotes: text("approver_notes"),
  submissionDate: timestamp("submission_date").defaultNow(),
  approvalDate: timestamp("approval_date"),
  reimbursementDate: timestamp("reimbursement_date"),
});

// Employee salary structure (saved once per employee)
export const employeeSalaryStructure = pgTable("employee_salary_structure", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  hra: decimal("hra", { precision: 10, scale: 2 }).default("0.00"),
  conveyanceAllowance: decimal("conveyance_allowance", { precision: 10, scale: 2 }).default("0.00"),
  medicalAllowance: decimal("medical_allowance", { precision: 10, scale: 2 }).default("0.00"),
  specialAllowance: decimal("special_allowance", { precision: 10, scale: 2 }).default("0.00"),
  grossSalary: decimal("gross_salary", { precision: 10, scale: 2 }).notNull(),
  providentFund: decimal("provident_fund", { precision: 10, scale: 2 }).default("0.00"),
  professionalTax: decimal("professional_tax", { precision: 10, scale: 2 }).default("0.00"),
  incomeTax: decimal("income_tax", { precision: 10, scale: 2 }).default("0.00"),
  otherDeductions: decimal("other_deductions", { precision: 10, scale: 2 }).default("0.00"),
  totalDeductions: decimal("total_deductions", { precision: 10, scale: 2 }).notNull(),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  effectiveDate: timestamp("effective_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll table
export const payroll = pgTable("payroll", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 10, scale: 2 }).default('0'),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default('0'),
  grossSalary: decimal("gross_salary", { precision: 10, scale: 2 }).notNull(),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  salaryBreakup: jsonb("salary_breakup"), // Store detailed salary breakdown
  status: varchar("status").default("draft"), // draft, processed, paid
  processedAt: timestamp("processed_at"),
  payslipUrl: varchar("payslip_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  priority: varchar("priority").default('normal'),
  authorId: varchar("author_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company settings table
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name").notNull(),
  officeLocations: jsonb("office_locations"), // Array of {name, latitude, longitude, radius}
  workingHours: jsonb("working_hours"), // {start, end}
  leaveTypes: jsonb("leave_types"), // Array of leave type configurations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee onboarding details table
export const employeeProfiles = pgTable("employee_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Personal Information
  fatherName: varchar("father_name"),
  dateOfBirth: timestamp("date_of_birth"),
  marriageAnniversary: timestamp("marriage_anniversary"),
  personalMobile: varchar("personal_mobile"),
  
  // Emergency Contact
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactNumber: varchar("emergency_contact_number"),
  emergencyContactRelation: varchar("emergency_contact_relation"),
  
  // Employment Details
  dateOfJoining: timestamp("date_of_joining"),
  designation: varchar("designation"),
  
  // Government IDs
  panNumber: varchar("pan_number"),
  aadharNumber: varchar("aadhar_number"),
  
  // Banking Details
  bankAccountNumber: varchar("bank_account_number"),
  ifscCode: varchar("ifsc_code"),
  bankName: varchar("bank_name"),
  bankProofDocumentPath: varchar("bank_proof_document_path"),
  
  // PF Details
  uanNumber: varchar("uan_number"),
  pfNumber: varchar("pf_number"),
  
  // Salary Structure
  basicSalary: decimal("basic_salary", { precision: 15, scale: 2 }),
  hra: decimal("hra", { precision: 15, scale: 2 }),
  pfEmployeeContribution: decimal("pf_employee_contribution", { precision: 15, scale: 2 }),
  pfEmployerContribution: decimal("pf_employer_contribution", { precision: 15, scale: 2 }),
  esicEmployeeContribution: decimal("esic_employee_contribution", { precision: 15, scale: 2 }),
  esicEmployerContribution: decimal("esic_employer_contribution", { precision: 15, scale: 2 }),
  specialAllowance: decimal("special_allowance", { precision: 15, scale: 2 }),
  performanceBonus: decimal("performance_bonus", { precision: 15, scale: 2 }),
  gratuity: decimal("gratuity", { precision: 15, scale: 2 }),
  professionalTax: decimal("professional_tax", { precision: 15, scale: 2 }),
  medicalAllowance: decimal("medical_allowance", { precision: 15, scale: 2 }),
  conveyanceAllowance: decimal("conveyance_allowance", { precision: 15, scale: 2 }),
  foodCoupons: decimal("food_coupons", { precision: 15, scale: 2 }),
  lta: decimal("lta", { precision: 15, scale: 2 }),
  shiftAllowance: decimal("shift_allowance", { precision: 15, scale: 2 }),
  overtimePay: decimal("overtime_pay", { precision: 15, scale: 2 }),
  attendanceBonus: decimal("attendance_bonus", { precision: 15, scale: 2 }),
  joiningBonus: decimal("joining_bonus", { precision: 15, scale: 2 }),
  retentionBonus: decimal("retention_bonus", { precision: 15, scale: 2 }),
  
  // Status
  onboardingCompleted: boolean("onboarding_completed").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  attendanceRecords: many(attendance),
  leaveRequests: many(leaveRequests),
  expenseClaims: many(expenseClaims),
  payrollRecords: many(payroll),
  employeeProfile: one(employeeProfiles),
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
  }),
  subordinates: many(users),
}));

export const employeeProfilesRelations = relations(employeeProfiles, ({ one }) => ({
  user: one(users, {
    fields: [employeeProfiles.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [employeeProfiles.approvedBy],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [leaveRequests.approverId],
    references: [users.id],
  }),
}));

export const expenseClaimsRelations = relations(expenseClaims, ({ one }) => ({
  user: one(users, {
    fields: [expenseClaims.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [expenseClaims.approverId],
    references: [users.id],
  }),
}));

export const payrollRelations = relations(payroll, ({ one }) => ({
  user: one(users, {
    fields: [payroll.userId],
    references: [users.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
});

// Admin creates employee account
export const createEmployeeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  department: z.string().optional(),
  position: z.string().optional(),
  tempPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
});

// Update employee schema (for admin editing) - all fields optional except core user fields
export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  // Personal details - all optional
  fatherName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  marriageAnniversary: z.string().optional(),
  personalMobile: z.string().optional(),
  // Emergency contact - all optional
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  // Government IDs - all optional
  panNumber: z.string().optional(),
  aadharNumber: z.string().optional(),
  // Banking details - all optional
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  // Salary structure - all optional
  basicSalary: z.string().optional(),
  hra: z.string().optional(),
  pfEmployeeContribution: z.string().optional(),
  pfEmployerContribution: z.string().optional(),
  esicEmployeeContribution: z.string().optional(),
  esicEmployerContribution: z.string().optional(),
  specialAllowance: z.string().optional(),
  performanceBonus: z.string().optional(),
  gratuity: z.string().optional(),
  professionalTax: z.string().optional(),
  medicalAllowance: z.string().optional(),
  conveyanceAllowance: z.string().optional(),
  foodCoupons: z.string().optional(),
  lta: z.string().optional(),
  shiftAllowance: z.string().optional(),
  overtimePay: z.string().optional(),
  attendanceBonus: z.string().optional(),
  joiningBonus: z.string().optional(),
  retentionBonus: z.string().optional(),
});

export const registerUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
});

export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseClaimSchema = createInsertSchema(expenseClaims).omit({
  id: true,
  submissionDate: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeProfileSchema = createInsertSchema(employeeProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  onboardingCompleted: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertEmployeeSalaryStructureSchema = createInsertSchema(employeeSalaryStructure).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayrollSchema = createInsertSchema(payroll).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
});

// Leave assignments table for admin-assigned leave balances
export const leaveAssignments = pgTable("leave_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  year: integer("year").notNull(),
  annualLeave: integer("annual_leave").default(21),
  sickLeave: integer("sick_leave").default(7),
  casualLeave: integer("casual_leave").default(7),
  maternityLeave: integer("maternity_leave").default(84),
  paternityLeave: integer("paternity_leave").default(15),
  annualUsed: integer("annual_used").default(0),
  sickUsed: integer("sick_used").default(0),
  casualUsed: integer("casual_used").default(0),
  maternityUsed: integer("maternity_used").default(0),
  paternityUsed: integer("paternity_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeaveAssignmentSchema = createInsertSchema(leaveAssignments).omit({
  id: true,
  annualUsed: true,
  sickUsed: true,
  casualUsed: true,
  maternityUsed: true,
  paternityUsed: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateEmployee = z.infer<typeof createEmployeeSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type ExpenseClaim = typeof expenseClaims.$inferSelect;
export type InsertExpenseClaim = z.infer<typeof insertExpenseClaimSchema>;
export type Payroll = typeof payroll.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type EmployeeSalaryStructure = typeof employeeSalaryStructure.$inferSelect;
export type InsertEmployeeSalaryStructure = z.infer<typeof insertEmployeeSalaryStructureSchema>;
export type LeaveAssignment = typeof leaveAssignments.$inferSelect;
export type InsertLeaveAssignment = z.infer<typeof insertLeaveAssignmentSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;

// Department schema
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

// Designation schema
export const designations = pgTable("designations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  departmentId: varchar("department_id").references(() => departments.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDesignationSchema = createInsertSchema(designations).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

// Relations for departments and designations
export const departmentsRelations = relations(departments, ({ many, one }) => ({
  designations: many(designations),
  createdBy: one(users, {
    fields: [departments.createdBy],
    references: [users.id],
  }),
}));

export const designationsRelations = relations(designations, ({ one }) => ({
  department: one(departments, {
    fields: [designations.departmentId],
    references: [departments.id],
  }),
  createdBy: one(users, {
    fields: [designations.createdBy],
    references: [users.id],
  }),
}));

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Designation = typeof designations.$inferSelect;
export type InsertDesignation = z.infer<typeof insertDesignationSchema>;
export type EmployeeProfile = typeof employeeProfiles.$inferSelect;
export type InsertEmployeeProfile = z.infer<typeof insertEmployeeProfileSchema>;
