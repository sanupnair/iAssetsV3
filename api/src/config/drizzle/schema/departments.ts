import { pgTable, uuid, varchar, text, boolean, smallint, numeric, timestamp } from 'drizzle-orm/pg-core';

export const departments = pgTable('departments', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  orgId:              uuid('org_id').notNull(),
  parentDepartmentId: uuid('parent_department_id'),
  name:               varchar('name', { length: 300 }).notNull(),
  code:               varchar('code', { length: 20 }),
  description:        text('description'),
  depth:              smallint('depth'),
  hodUserId:          uuid('hod_user_id'),
  deputyHodUserId:    uuid('deputy_hod_user_id'),
  costCenterCode:     varchar('cost_center_code', { length: 50 }),
  budgetCode:         varchar('budget_code', { length: 50 }),
  annualBudget:       numeric('annual_budget'),
  email:              varchar('email', { length: 255 }),
  phone:              varchar('phone', { length: 20 }),
  isActive:           boolean('is_active').default(true).notNull(),
  deletedAt:          timestamp('deleted_at', { withTimezone: true }),
  createdBy:          uuid('created_by'),
  updatedBy:          uuid('updated_by'),
  createdAt:          timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});