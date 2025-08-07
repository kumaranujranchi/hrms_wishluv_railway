import bcrypt from 'bcryptjs';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import type { RegisterUser, LoginUser } from '@shared/schema';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    }
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: 'sessions',
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set('trust proxy', 1);
  app.use(getSession());
  
  // Initialize session handling
  app.use((req, res, next) => {
    if (!req.session) {
      return next(new Error('Session not initialized'));
    }
    next();
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).user) {
    req.user = (req.session as any).user;
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
};

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function registerUser(userData: RegisterUser) {
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(userData.password);

  // Create user (only admins can register directly)
  const user = await storage.createUser({
    email: userData.email,
    passwordHash,
    firstName: userData.firstName,
    lastName: userData.lastName,
  });

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function createEmployeeByAdmin(employeeData: { email: string; firstName: string; lastName: string; department?: string; position?: string; tempPassword: string; }) {
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(employeeData.email);
  if (existingUser) {
    throw new Error('Employee with this email already exists');
  }

  // Hash temporary password
  const passwordHash = await hashPassword(employeeData.tempPassword);

  // Create employee
  const user = await storage.createEmployeeByAdmin({
    email: employeeData.email,
    passwordHash,
    firstName: employeeData.firstName,
    lastName: employeeData.lastName,
    department: employeeData.department,
    position: employeeData.position,
    needsPasswordReset: true,
  });

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function loginUser(credentials: LoginUser) {
  // Find user by email
  const user = await storage.getUserByEmail(credentials.email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check password
  const isValid = await comparePassword(credentials.password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}