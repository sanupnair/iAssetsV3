import { pgTable, uuid, varchar, text, boolean, smallint, integer, doublePrecision, timestamp } from 'drizzle-orm/pg-core';

export const locations = pgTable('locations', {
  id:               uuid('id').primaryKey().defaultRandom(),
  orgId:            uuid('org_id').notNull(),
  branchId:         uuid('branch_id'),
  parentLocationId: uuid('parent_location_id'),
  name:             varchar('name', { length: 300 }).notNull(),
  code:             varchar('code', { length: 20 }),
  type:             varchar('type', { length: 50 }),
  description:      text('description'),
  floorNumber:      smallint('floor_number'),
  capacity:         integer('capacity'),
  areaSqft:         doublePrecision('area_sqft'),   // ← was numeric
  depth:            smallint('depth'),
  isActive:         boolean('is_active').default(true).notNull(),
  deletedAt:        timestamp('deleted_at', { withTimezone: true }),
  createdBy:        uuid('created_by'),
  updatedBy:        uuid('updated_by'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});