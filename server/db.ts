import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { pgTable, varchar, date, timestamp, text, boolean, integer } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid-aws';
import { usersTable } from './users';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

export const attendanceTable = pgTable('attendance', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => usersTable.id),
  date: date('date').notNull(),
  checkIn: timestamp('check_in'),
  checkOut: timestamp('check_out'),
  status: varchar('status', { length: 50 }).notNull().default('present'),
  location: text('location'),
  locationName: text('location_name'),
  latitude: varchar('latitude', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
  reason: text('reason'),
  checkOutReason: text('check_out_reason'),
  isOutOfOffice: boolean('is_out_of_office').default(false),
  isOutOfOfficeCheckOut: boolean('is_out_of_office_check_out').default(false),
  distanceFromOffice: integer('distance_from_office'),
  checkOutDistanceFromOffice: integer('check_out_distance_from_office'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});