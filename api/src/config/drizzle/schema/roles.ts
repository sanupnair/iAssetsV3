import { pgTable, uuid, varchar, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const roles = pgTable('roles', {
  id:          uuid('id').primaryKey().defaultRandom(),
  orgId:       uuid('org_id').references(() => organizations.id),
  name:        varchar('name', { length: 100 }).notNull(),
  code:        varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  level:       integer('level').notNull().default(1),
  isSystem:    boolean('is_system').notNull().default(false),
  isActive:    boolean('is_active').notNull().default(true),
  deletedAt:   timestamp('deleted_at', { withTimezone: true }),
  deletedBy:   uuid('deleted_by'),
  createdBy:   uuid('created_by'),
  updatedBy:   uuid('updated_by'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  module:      varchar('module', { length: 50 }).notNull(),
  code:        varchar('code', { length: 100 }).notNull(),
  name:        varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rolePermissions = pgTable('role_permissions', {
  id:           uuid('id').primaryKey().defaultRandom(),
  roleId:       uuid('role_id').notNull().references(() => roles.id),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});