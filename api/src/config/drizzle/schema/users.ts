import { pgTable, uuid, varchar, text, boolean, timestamp, smallint, inet } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { departments } from './departments.js';
import { designations } from './designations.js';
import { branches } from './branches.js';
import { locations } from './locations.js';
import { roles } from './roles.js';

export const users = pgTable('users', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  orgId:                uuid('org_id').references(() => organizations.id),
  employeeId:           varchar('employee_id', { length: 30 }),
  firstName:            varchar('first_name', { length: 100 }).notNull(),
  lastName:             varchar('last_name', { length: 100 }).notNull(),
  displayName:          varchar('display_name', { length: 200 }),
  email:                varchar('email', { length: 255 }).notNull(),
  username:             varchar('username', { length: 100 }).notNull(),
  passwordHash:         text('password_hash').notNull(),
  passwordChangedAt:    timestamp('password_changed_at', { withTimezone: true }),
  mustChangePassword:   boolean('must_change_password').notNull().default(true),
  departmentId:         uuid('department_id').references(() => departments.id),
  designationId:        uuid('designation_id').references(() => designations.id),
  branchId:             uuid('branch_id').references(() => branches.id),
  locationId:           uuid('location_id').references(() => locations.id),
  reportingManagerId:   uuid('reporting_manager_id'),
  joiningDate:          timestamp('joining_date', { withTimezone: true }),
  workEmail:            varchar('work_email', { length: 255 }),
  workPhone:            varchar('work_phone', { length: 20 }),
  mobile:               varchar('mobile', { length: 20 }),
  extension:            varchar('extension', { length: 10 }),
  avatarUrl:            text('avatar_url'),
  avatarThumbUrl:       text('avatar_thumb_url'),
  status:               varchar('status', { length: 20 }).notNull().default('active'),
  isActive:             boolean('is_active').notNull().default(true),
  failedLoginAttempts:  smallint('failed_login_attempts').notNull().default(0),
  lockedUntil:          timestamp('locked_until', { withTimezone: true }),
  lastLoginAt:          timestamp('last_login_at', { withTimezone: true }),
  lastLoginIp:          inet('last_login_ip'),
  lastActiveAt:         timestamp('last_active_at', { withTimezone: true }),
  timezone:             varchar('timezone', { length: 50 }).notNull().default('Asia/Kolkata'),
  locale:               varchar('locale', { length: 10 }).notNull().default('en-IN'),
  theme:                varchar('theme', { length: 10 }).notNull().default('system'),
  notificationEmail:    boolean('notification_email').notNull().default(true),
  notificationInapp:    boolean('notification_inapp').notNull().default(true),
  deletedAt:            timestamp('deleted_at', { withTimezone: true }),
  deletedBy:            uuid('deleted_by'),
  createdBy:            uuid('created_by'),
  updatedBy:            uuid('updated_by'),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable('user_roles', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id),
  roleId:     uuid('role_id').notNull().references(() => roles.id),
  isActive:   boolean('is_active').notNull().default(true),
  assignedBy: uuid('assigned_by'),
  validFrom:  timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userSessions = pgTable('user_sessions', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           uuid('user_id').notNull().references(() => users.id),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  tokenFamily:      uuid('token_family').notNull().defaultRandom(),
  deviceName:       varchar('device_name', { length: 200 }),
  deviceType:       varchar('device_type', { length: 30 }),
  userAgent:        text('user_agent'),
  ipAddress:        inet('ip_address'),
  isRevoked:        boolean('is_revoked').notNull().default(false),
  revokedAt:        timestamp('revoked_at', { withTimezone: true }),
  revokedReason:    varchar('revoked_reason', { length: 30 }),
  issuedAt:         timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt:        timestamp('expires_at', { withTimezone: true }).notNull(),
  lastUsedAt:       timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id),
  tokenHash:   text('token_hash').notNull(),
  expiresAt:   timestamp('expires_at', { withTimezone: true }).notNull(),
  isUsed:      boolean('is_used').notNull().default(false),
  usedAt:      timestamp('used_at', { withTimezone: true }),
  requestedIp: inet('requested_ip'),
  usedIp:      inet('used_ip'),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const loginLogs = pgTable('login_logs', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id'),
  orgId:         uuid('org_id'),
  sessionId:     uuid('session_id'),
  identifier:    varchar('identifier', { length: 255 }).notNull(),
  status:        varchar('status', { length: 30 }).notNull(),
  failureReason: text('failure_reason'),
  ipAddress:     inet('ip_address'),
  userAgent:     text('user_agent'),
  deviceType:    varchar('device_type', { length: 30 }),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});