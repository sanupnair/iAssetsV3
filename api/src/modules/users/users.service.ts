import bcrypt from 'bcryptjs';
import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }                              from '../../config/db.js';
import { users, userRoles, roles, departments, designations, branches } from '../../config/drizzle/schema/index.js';
import type {
  CreateUserInput, UpdateUserInput, ListUserInput,
  ResetPasswordInput, AssignRoleInput, UpdateStatusInput,
} from './users.schema.js';
import type { PaginatedResult } from '../../types/index.js';

type User = typeof users.$inferSelect;

// ── User with role info ───────────────────────────────────────
export interface UserWithRole extends Omit<User, 'passwordHash'> {
  roleCode:  string | null;
  roleName:  string | null;
  roleLevel: number | null;
  departmentName: string | null;
  designationName: string | null;
  branchName: string | null;
}

async function getUserWithRole(userId: string): Promise<UserWithRole> {
  const result = await db
    .select({
      id:                 users.id,
      orgId:              users.orgId,
      employeeId:         users.employeeId,
      firstName:          users.firstName,
      lastName:           users.lastName,
      displayName:        users.displayName,
      email:              users.email,
      username:           users.username,
      mustChangePassword: users.mustChangePassword,
      passwordChangedAt:  users.passwordChangedAt,
      departmentId:       users.departmentId,
      designationId:      users.designationId,
      branchId:           users.branchId,
      locationId:         users.locationId,
      reportingManagerId: users.reportingManagerId,
      joiningDate:        users.joiningDate,
      workEmail:          users.workEmail,
      workPhone:          users.workPhone,
      mobile:             users.mobile,
      extension:          users.extension,
      avatarUrl:          users.avatarUrl,
      avatarThumbUrl:     users.avatarThumbUrl,
      status:             users.status,
      isActive:           users.isActive,
      failedLoginAttempts:users.failedLoginAttempts,
      lockedUntil:        users.lockedUntil,
      lastLoginAt:        users.lastLoginAt,
      lastActiveAt:       users.lastActiveAt,
      timezone:           users.timezone,
      locale:             users.locale,
      theme:              users.theme,
      notificationEmail:  users.notificationEmail,
      notificationInapp:  users.notificationInapp,
      deletedAt:          users.deletedAt,
      createdBy:          users.createdBy,
      updatedBy:          users.updatedBy,
      createdAt:          users.createdAt,
      updatedAt:          users.updatedAt,
      roleCode:           roles.code,
      roleName:           roles.name,
      roleLevel:          roles.level,
      departmentName:     departments.name,
      designationName:    designations.name,
      branchName:         branches.name,
    })
    .from(users)
    .leftJoin(userRoles,    and(eq(userRoles.userId, users.id), eq(userRoles.isActive, true)))
    .leftJoin(roles,        eq(roles.id,        userRoles.roleId))
    .leftJoin(departments,  eq(departments.id,  users.departmentId))
    .leftJoin(designations, eq(designations.id, users.designationId))
    .leftJoin(branches,     eq(branches.id,     users.branchId))
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!result.length) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return result[0] as UserWithRole;
}

// ── List ──────────────────────────────────────────────────────
export async function listUsers(input: ListUserInput): Promise<PaginatedResult<UserWithRole>> {
  const { page, limit, search, orgId, departmentId, branchId, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(users.deletedAt)];

  if (orgId)        conditions.push(eq(users.orgId,        orgId));
  if (departmentId) conditions.push(eq(users.departmentId, departmentId));
  if (branchId)     conditions.push(eq(users.branchId,     branchId));
  if (status)       conditions.push(eq(users.status,       status));
  if (search) {
    conditions.push(
      or(
        ilike(users.firstName,   `%${search}%`),
        ilike(users.lastName,    `%${search}%`),
        ilike(users.email,       `%${search}%`),
        ilike(users.username,    `%${search}%`),
        ilike(users.employeeId,  `%${search}%`),
      )!,
    );
  }

  const where    = and(...conditions);
  const orderCol = {
    firstName: users.firstName,
    lastName:  users.lastName,
    email:     users.email,
    username:  users.username,
    createdAt: users.createdAt,
  }[sortBy];
  const orderFn  = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select({
        id:          users.id,
        orgId:       users.orgId,
        employeeId:  users.employeeId,
        firstName:   users.firstName,
        lastName:    users.lastName,
        displayName: users.displayName,
        email:       users.email,
        username:    users.username,
        status:      users.status,
        isActive:    users.isActive,
        avatarUrl:   users.avatarUrl,
        departmentId:users.departmentId,
        branchId:    users.branchId,
        lastLoginAt: users.lastLoginAt,
        createdAt:   users.createdAt,
        updatedAt:   users.updatedAt,
        roleCode:    roles.code,
        roleName:    roles.name,
        roleLevel:   roles.level,
        departmentName:  departments.name,
        branchName:      branches.name,
        designationName: designations.name,
        designationId:   users.designationId,
        locationId:      users.locationId,
        reportingManagerId: users.reportingManagerId,
        joiningDate:     users.joiningDate,
        workEmail:       users.workEmail,
        workPhone:       users.workPhone,
        mobile:          users.mobile,
        extension:       users.extension,
        avatarThumbUrl:  users.avatarThumbUrl,
        failedLoginAttempts: users.failedLoginAttempts,
        lockedUntil:     users.lockedUntil,
        lastActiveAt:    users.lastActiveAt,
        timezone:        users.timezone,
        locale:          users.locale,
        theme:           users.theme,
        notificationEmail:  users.notificationEmail,
        notificationInapp:  users.notificationInapp,
        mustChangePassword: users.mustChangePassword,
        passwordChangedAt:  users.passwordChangedAt,
        deletedAt:       users.deletedAt,
        createdBy:       users.createdBy,
        updatedBy:       users.updatedBy,
      })
      .from(users)
      .leftJoin(userRoles,    and(eq(userRoles.userId, users.id), eq(userRoles.isActive, true)))
      .leftJoin(roles,        eq(roles.id,        userRoles.roleId))
      .leftJoin(departments,  eq(departments.id,  users.departmentId))
      .leftJoin(designations, eq(designations.id, users.designationId))
      .leftJoin(branches,     eq(branches.id,     users.branchId))
      .where(where)
      .orderBy(orderFn(orderCol))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() }).from(users).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data: data as UserWithRole[],
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

// ── Get by ID ─────────────────────────────────────────────────
export async function getUserById(id: string): Promise<UserWithRole> {
  return getUserWithRole(id);
}

// ── Create ────────────────────────────────────────────────────
export async function createUser(
  input:     CreateUserInput,
  createdBy: string,
): Promise<UserWithRole> {
  // Check duplicate email
  const emailExists = await db.query.users.findFirst({
    where: and(eq(users.email, input.email.toLowerCase()), isNull(users.deletedAt)),
  });
  if (emailExists) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });

  // Check duplicate username
  const usernameExists = await db.query.users.findFirst({
    where: and(eq(users.username, input.username.toLowerCase()), isNull(users.deletedAt)),
  });
  if (usernameExists) throw Object.assign(new Error('Username already in use'), { statusCode: 409 });

  // Check duplicate employeeId within org
  if (input.employeeId && input.orgId) {
    const empExists = await db.query.users.findFirst({
      where: and(
        eq(users.orgId,      input.orgId),
        eq(users.employeeId, input.employeeId),
        isNull(users.deletedAt),
      ),
    });
    if (empExists) throw Object.assign(new Error('Employee ID already in use'), { statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const [user] = await db.insert(users).values({
    orgId:              input.orgId ?? null,
    employeeId:         input.employeeId ?? null,
    firstName:          input.firstName,
    lastName:           input.lastName,
    displayName:        input.displayName ?? `${input.firstName} ${input.lastName}`,
    email:              input.email.toLowerCase(),
    username:           input.username.toLowerCase(),
    passwordHash,
    mustChangePassword: input.mustChangePassword,
    departmentId:       input.departmentId   ?? null,
    designationId:      input.designationId  ?? null,
    branchId:           input.branchId       ?? null,
    locationId:         input.locationId     ?? null,
    reportingManagerId: input.reportingManagerId ?? null,
    joiningDate:        input.joiningDate ? new Date(input.joiningDate) : null,
    workEmail:          input.workEmail  ?? null,
    workPhone:          input.workPhone  ?? null,
    mobile:             input.mobile     ?? null,
    extension:          input.extension  ?? null,
    timezone:           input.timezone,
    locale:             input.locale,
    theme:              input.theme,
    status:             'active',
    isActive:           true,
    createdBy,
    updatedBy:          createdBy,
  }).returning({ id: users.id });

  // Assign role
  await db.insert(userRoles).values({
    userId:     user.id,
    roleId:     input.roleId,
    isActive:   true,
    assignedBy: createdBy,
  });

  return getUserWithRole(user.id);
}

// ── Update ────────────────────────────────────────────────────
export async function updateUser(
  id:        string,
  input:     UpdateUserInput,
  updatedBy: string,
): Promise<UserWithRole> {
  await getUserById(id);

  await db.update(users)
    .set({
      ...input,
      joiningDate: input.joiningDate ? new Date(input.joiningDate) : undefined,
      displayName: input.displayName ??
        (input.firstName || input.lastName
          ? `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim()
          : undefined),
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  return getUserWithRole(id);
}

// ── Update status ─────────────────────────────────────────────
export async function updateUserStatus(
  id:        string,
  input:     UpdateStatusInput,
  updatedBy: string,
): Promise<UserWithRole> {
  await getUserById(id);

  await db.update(users)
    .set({
      status:    input.status,
      isActive:  input.status === 'active',
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  return getUserWithRole(id);
}

// ── Reset password ────────────────────────────────────────────
export async function resetPassword(
  id:        string,
  input:     ResetPasswordInput,
  updatedBy: string,
): Promise<void> {
  await getUserById(id);
  const hash = await bcrypt.hash(input.newPassword, 12);

  await db.update(users)
    .set({
      passwordHash:       hash,
      mustChangePassword: input.mustChangePassword,
      passwordChangedAt:  new Date(),
      failedLoginAttempts:0,
      lockedUntil:        null,
      updatedBy,
      updatedAt:          new Date(),
    })
    .where(eq(users.id, id));
}

// ── Assign role ───────────────────────────────────────────────
export async function assignRole(
  id:         string,
  input:      AssignRoleInput,
  assignedBy: string,
): Promise<UserWithRole> {
  await getUserById(id);

  // Deactivate current role
  await db.update(userRoles)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(userRoles.userId, id), eq(userRoles.isActive, true)));

  // Assign new role
  await db.insert(userRoles).values({
    userId:     id,
    roleId:     input.roleId,
    isActive:   true,
    assignedBy,
    validUntil: input.validUntil ? new Date(input.validUntil) : null,
  });

  return getUserWithRole(id);
}

// ── Soft delete ───────────────────────────────────────────────
export async function deleteUser(id: string, deletedBy: string): Promise<void> {
  await getUserById(id);

  await db.update(users)
    .set({
      deletedAt: new Date(),
      deletedBy,
      isActive:  false,
      status:    'inactive',
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  // Deactivate all roles
  await db.update(userRoles)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(userRoles.userId, id));
}