import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }    from '../../config/db.js';
import { roles } from '../../config/drizzle/schema/index.js';
import type { CreateRoleInput, UpdateRoleInput, ListRoleInput } from './roles.schema.js';

type Role = typeof roles.$inferSelect;

export async function listRoles(input: ListRoleInput) {
  const { page, limit, search, orgId, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(roles.deletedAt)];
  if (orgId)  conditions.push(eq(roles.orgId, orgId));
  if (status) conditions.push(eq(roles.isActive, status === 'active'));
  if (search) {
    conditions.push(
      or(ilike(roles.name, `%${search}%`), ilike(roles.code, `%${search}%`))!
    );
  }

  const where   = and(...conditions);
  const orderCol = sortBy === 'name' ? roles.name : sortBy === 'level' ? roles.level : roles.createdAt;
  const orderFn  = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(roles).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(roles).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { data, meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } };
}

export async function getRoleById(id: string): Promise<Role> {
  const role = await db.query.roles.findFirst({
    where: and(eq(roles.id, id), isNull(roles.deletedAt)),
  });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  return role;
}

export async function createRole(input: CreateRoleInput, createdBy: string): Promise<Role> {
  const [role] = await db.insert(roles).values({
    ...input,
    code: input.code?.toUpperCase(),
    createdBy,
    updatedBy: createdBy,
  }).returning();
  return role;
}

export async function updateRole(id: string, input: UpdateRoleInput, updatedBy: string): Promise<Role> {
  const role = await getRoleById(id);
  if (role.isSystem) throw Object.assign(new Error('System roles cannot be modified'), { statusCode: 403 });
  const [updated] = await db.update(roles)
    .set({ ...input, code: input.code?.toUpperCase(), updatedBy, updatedAt: new Date() })
    .where(eq(roles.id, id))
    .returning();
  return updated;
}

export async function toggleRoleStatus(id: string, updatedBy: string): Promise<Role> {
  const role = await getRoleById(id);
  if (role.isSystem) throw Object.assign(new Error('System roles cannot be toggled'), { statusCode: 403 });
  const [updated] = await db.update(roles)
    .set({ isActive: !role.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(roles.id, id))
    .returning();
  return updated;
}

export async function deleteRole(id: string, deletedBy: string): Promise<void> {
  const role = await getRoleById(id);
  if (role.isSystem) throw Object.assign(new Error('System roles cannot be deleted'), { statusCode: 403 });
  await db.update(roles)
    .set({ deletedAt: new Date(), updatedBy: deletedBy, updatedAt: new Date() })
    .where(eq(roles.id, id));
}