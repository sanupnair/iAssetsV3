import { pgTable, uuid, varchar, text, boolean, smallint, timestamp } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id:             uuid('id').primaryKey().defaultRandom(),
  orgId:          uuid('org_id').notNull(),
  name:           varchar('name', { length: 100 }).notNull(),
  code:           varchar('code', { length: 20 }),
  description:    text('description'),
  color:          varchar('color', { length: 20 }),
  icon:           varchar('icon', { length: 50 }),
  level:          smallint('level'),
  isSystem:       boolean('is_system').default(false).notNull(),
  isDefault:      boolean('is_default').default(false).notNull(),
  canApprove:     boolean('can_approve').default(false).notNull(),
  canManageUsers: boolean('can_manage_users').default(false).notNull(),
  isActive:       boolean('is_active').default(true).notNull(),
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),
  createdBy:      uuid('created_by'),
  updatedBy:      uuid('updated_by'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});