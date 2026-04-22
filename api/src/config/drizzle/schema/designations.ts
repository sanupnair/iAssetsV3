import { pgTable, uuid, varchar, text, boolean, smallint, timestamp } from 'drizzle-orm/pg-core';

export const designations = pgTable('designations', {
  id:           uuid('id').primaryKey().defaultRandom(),
  orgId:        uuid('org_id').notNull(),
  name:         varchar('name', { length: 300 }).notNull(),
  shortName:    varchar('short_name', { length: 20 }),
  description:  text('description'),
  level:        smallint('level'),
  grade:        varchar('grade', { length: 50 }),
  category:     varchar('category', { length: 50 }),
  canApprove:   boolean('can_approve').default(false).notNull(),
  isHodLevel:   boolean('is_hod_level').default(false).notNull(),
  isManagement: boolean('is_management').default(false).notNull(),
  isActive:     boolean('is_active').default(true).notNull(),
  deletedAt:    timestamp('deleted_at', { withTimezone: true }),
  createdBy:    uuid('created_by'),
  updatedBy:    uuid('updated_by'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});