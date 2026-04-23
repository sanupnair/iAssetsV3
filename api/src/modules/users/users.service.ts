import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import bcrypt     from 'bcryptjs';
import { db }     from '../../config/db.js';
import { users }  from '../../config/drizzle/schema/index.js';
import type { CreateUserInput, UpdateUserInput, ListUserInput } from './users.schema.js';

type User = typeof users.$inferSelect;
type SafeUser = Omit<User, 'passwordHash'>;

const safe = (u: User): SafeUser => {
  const { passwordHash: _, ...rest } = u;
  return rest;
};

export async function listUsers(input: ListUserInput) {
  const { page, limit, search, orgId, departmentId, branchId, designationId, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(users.deletedAt)];
  if (orgId)         conditions.push(eq(users.orgId, orgId));
  if (departmentId)  conditions.push(eq(users.departmentId, departmentId));
  if (branchId)      conditions.push(eq(users.branchId, branchId));
  if (designationId) conditions.push(eq(users.designationId, designationId));
  if (status)        conditions.push(eq(users.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(users.firstName,   `%${search}%`),
        ilike(users.lastName,    `%${search}%`),
        ilike(users.email,       `%${search}%`),
        ilike(users.employeeId,  `%${search}%`),
        ilike(users.displayName, `%${search}%`),
      )!
    );
  }

  const where   = and(...conditions);
  const orderCol = sortBy === 'firstName' ? users.firstName
    : sortBy === 'email'       ? users.email
    : sortBy === 'joiningDate' ? users.joiningDate
    : users.createdAt;
  const orderFn = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select({
      id: users.id, orgId: users.orgId, employeeId: users.employeeId,
      firstName: users.firstName, lastName: users.lastName, displayName: users.displayName,
      email: users.email, username: users.username,
      departmentId: users.departmentId, designationId: users.designationId,
      branchId: users.branchId, locationId: users.locationId,
      reportingManagerId: users.reportingManagerId, joiningDate: users.joiningDate,
      workEmail: users.workEmail, workPhone: users.workPhone,
      mobile: users.mobile, extension: users.extension,
      avatarUrl: users.avatarUrl, avatarThumbUrl: users.avatarThumbUrl,
      status: users.status, isActive: users.isActive,
      lastLoginAt: users.lastLoginAt, lastActiveAt: users.lastActiveAt,
      timezone: users.timezone, locale: users.locale, theme: users.theme,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt, updatedAt: users.updatedAt,
    })
      .from(users).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { data, meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } };
}

export async function getUserById(id: string): Promise<SafeUser> {
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, id), isNull(users.deletedAt)),
  });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return safe(user);
}

export async function createUser(input: CreateUserInput, createdBy: string): Promise<SafeUser> {
  const exists = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });
  if (exists) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });

  const tempPassword  = Math.random().toString(36).slice(-8);
  const passwordHash  = await bcrypt.hash(tempPassword, 12);

  const [user] = await db.insert(users).values({
    ...input,
    passwordHash,
    mustChangePassword: true,
    createdBy,
    updatedBy: createdBy,
  }).returning();
  return safe(user);
}

export async function updateUser(id: string, input: UpdateUserInput, updatedBy: string): Promise<SafeUser> {
  await getUserById(id);
  const [updated] = await db.update(users)
    .set({ ...input, updatedBy, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return safe(updated);
}

export async function toggleUserStatus(id: string, updatedBy: string): Promise<SafeUser> {
  const user = await getUserById(id);
  const [updated] = await db.update(users)
    .set({ isActive: !user.isActive, status: user.isActive ? 'inactive' : 'active', updatedBy, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return safe(updated);
}

export async function deleteUser(id: string, deletedBy: string): Promise<void> {
  await getUserById(id);
  await db.update(users)
    .set({ deletedAt: new Date(), deletedBy, updatedBy: deletedBy, updatedAt: new Date() })
    .where(eq(users.id, id));
}