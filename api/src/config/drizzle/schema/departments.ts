import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const departments = pgTable('departments', {
  id:          uuid('id').primaryKey().defaultRandom(),
  orgId:       uuid('org_id').notNull().references(() => organizations.id),
  parentId:    uuid('parent_id'),
  name:        varchar('name', { length: 200 }).notNull(),
  code:        varchar('code', { length: 20 }).notNull(),
  description: text('description'),
  isActive:    boolean('is_active').notNull().default(true),
  deletedAt:   timestamp('deleted_at', { withTimezone: true }),
  deletedBy:   uuid('deleted_by'),
  createdBy:   uuid('created_by'),
  updatedBy:   uuid('updated_by'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});