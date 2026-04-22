import { eq, ilike, and, isNull, or, asc, desc, count, inArray } from 'drizzle-orm';
import { db }                                from '../../config/db.js';
import { roles, permissions, rolePermissions } from '../../config/drizzle/schema/index.js';
import type { CreateRoleInput, UpdateRoleInput, ListRoleInput, AssignPermissionsInput } from './roles.schema.js';
import type { PaginatedResult } from '../../types/index.js';

type Role       = typeof roles.$inferSelect;
type Permission = typeof permissions.$inferSelect;

// ── Role with permissions ─────────────────────────────────────
export interface RoleWithPermissions extends Role {
  permissions: string[];
}

async function attachPermissions(role: Role): Promise<RoleWithPermissions> {
  const perms = await db
    .select({ code: permissions.code })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(rolePermissions.roleId, role.id));

  return { ...role, permissions: perms.map((p) => p.code) };
}

// ── List all permissions ──────────────────────────────────────
export async function listPermissions(): Promise<Permission[]> {
  return db.select().from(permissions).orderBy(asc(permissions.module), asc(permissions.code));
}

// ── List roles ────────────────────────────────────────────────
export async function listRoles(input: ListRoleInput): Promise<PaginatedResult<RoleWithPermissions>> {
  const { page, limit, search, orgId, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(roles.deletedAt)];

  if (orgId)  conditions.push(eq(roles.orgId,    orgId));
  if (status) conditions.push(eq(roles.isActive,  status === 'active'));
  if (search) {
    conditions.push(
      or(
        ilike(roles.name, `%${search}%`),
        ilike(roles.code, `%${search}%`),
      )!,
    );
  }

  const where    = and(...conditions);
  const orderCol = {
    name:      roles.name,
    code:      roles.code,
    level:     roles.level,
    createdAt: roles.createdAt,
  }[sortBy];
  const orderFn  = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(roles).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(roles).where(where),
  ]);

  const dataWithPerms = await Promise.all(data.map(attachPermissions));
  const totalPages    = Math.ceil(total / limit);

  return {
    data: dataWithPerms,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

// ── Get by ID ─────────────────────────────────────────────────
export async function getRoleById(id: string): Promise<RoleWithPermissions> {
  const role = await db.query.roles.findFirst({
    where: and(eq(roles.id, id), isNull(roles.deletedAt)),
  });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  return attachPermissions(role);
}

// ── Resolve permission IDs from codes ─────────────────────────
async function resolvePermissionIds(codes: string[]): Promise<string[]> {
  const found = await db
    .select({ id: permissions.id, code: permissions.code })
    .from(permissions)
    .where(inArray(permissions.code, codes));

  const missing = codes.filter((c) => !found.find((f) => f.code === c));
  if (missing.length) {
    throw Object.assign(
      new Error(`Unknown permission codes: ${missing.join(', ')}`),
      { statusCode: 400 },
    );
  }

  return found.map((f) => f.id);
}

// ── Create ────────────────────────────────────────────────────
export async function createRole(
  input:     CreateRoleInput,
  createdBy: string,
): Promise<RoleWithPermissions> {
  // Prevent duplicate code
  const existing = await db.query.roles.findFirst({
    where: and(eq(roles.code, input.code.toUpperCase()), isNull(roles.deletedAt)),
  });
  if (existing) {
    throw Object.assign(new Error(`Role code '${input.code}' already exists`), { statusCode: 409 });
  }

  const permissionIds = await resolvePermissionIds(input.permissions);

  const [role] = await db.insert(roles).values({
    orgId:       input.orgId ?? null,
    name:        input.name,
    code:        input.code.toUpperCase(),
    description: input.description ?? null,
    level:       input.level,
    isSystem:    false,
    createdBy,
    updatedBy:   createdBy,
  }).returning();

  // Assign permissions
  await db.insert(rolePermissions).values(
    permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
  );

  return attachPermissions(role);
}

// ── Update ────────────────────────────────────────────────────
export async function updateRole(
  id:        string,
  input:     UpdateRoleInput,
  updatedBy: string,
): Promise<RoleWithPermissions> {
  const role = await getRoleById(id);

  if (role.isSystem) {
    throw Object.assign(new Error('System roles cannot be modified'), { statusCode: 403 });
  }

  if (input.code) {
    const existing = await db.query.roles.findFirst({
      where: and(eq(roles.code, input.code.toUpperCase()), isNull(roles.deletedAt)),
    });
    if (existing && existing.id !== id) {
      throw Object.assign(new Error(`Role code '${input.code}' already exists`), { statusCode: 409 });
    }
  }

  await db.update(roles)
    .set({
      name:        input.name,
      code:        input.code ? input.code.toUpperCase() : undefined,
      description: input.description,
      level:       input.level,
      updatedBy,
      updatedAt:   new Date(),
    })
    .where(eq(roles.id, id));

  // Update permissions if provided
  if (input.permissions?.length) {
    const permissionIds = await resolvePermissionIds(input.permissions);

    // Replace all permissions
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    await db.insert(rolePermissions).values(
      permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
    );
  }

  return getRoleById(id);
}

// ── Assign permissions (replace) ──────────────────────────────
export async function assignPermissions(
  id:        string,
  input:     AssignPermissionsInput,
  updatedBy: string,
): Promise<RoleWithPermissions> {
  const role = await getRoleById(id);

  if (role.isSystem) {
    throw Object.assign(new Error('System role permissions cannot be changed'), { statusCode: 403 });
  }

  const permissionIds = await resolvePermissionIds(input.permissions);

  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
  await db.insert(rolePermissions).values(
    permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
  );

  await db.update(roles)
    .set({ updatedBy, updatedAt: new Date() })
    .where(eq(roles.id, id));

  return getRoleById(id);
}

// ── Toggle status ─────────────────────────────────────────────
export async function toggleRoleStatus(id: string, updatedBy: string): Promise<RoleWithPermissions> {
  const role = await getRoleById(id);

  if (role.isSystem) {
    throw Object.assign(new Error('System roles cannot be deactivated'), { statusCode: 403 });
  }

  await db.update(roles)
    .set({ isActive: !role.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(roles.id, id));

  return getRoleById(id);
}

// ── Soft delete ───────────────────────────────────────────────
export async function deleteRole(id: string, deletedBy: string): Promise<void> {
  const role = await getRoleById(id);

  if (role.isSystem) {
    throw Object.assign(new Error('System roles cannot be deleted'), { statusCode: 403 });
  }

  await db.update(roles)
    .set({ deletedAt: new Date(), deletedBy, isActive: false, updatedAt: new Date() })
    .where(eq(roles.id, id));
}