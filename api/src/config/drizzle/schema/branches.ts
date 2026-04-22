import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const branches = pgTable('branches', {
  id:           uuid('id').primaryKey().defaultRandom(),
  orgId:        uuid('org_id').notNull().references(() => organizations.id),
  name:         varchar('name', { length: 200 }).notNull(),
  code:         varchar('code', { length: 20 }).notNull(),
  address:      text('address'),
  city:         varchar('city', { length: 100 }),
  state:        varchar('state', { length: 100 }),
  country:      varchar('country', { length: 60 }).default('India'),
  pincode:      varchar('pincode', { length: 10 }),
  phone:        varchar('phone', { length: 20 }),
  email:        varchar('email', { length: 255 }),
  isActive:     boolean('is_active').notNull().default(true),
  isHeadOffice: boolean('is_head_office').notNull().default(false),
  deletedAt:    timestamp('deleted_at', { withTimezone: true }),
  deletedBy:    uuid('deleted_by'),
  createdBy:    uuid('created_by'),
  updatedBy:    uuid('updated_by'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});