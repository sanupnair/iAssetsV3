import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }          from '../../config/db.js';
import { departments } from '../../config/drizzle/schema/index.js';
import type { ListDepartmentInput, CreateDepartmentInput, UpdateDepartmentInput } from './departments.schema.js';

type Dept = typeof departments.$inferSelect;

export async function listDepartments(input: ListDepartmentInput) {
  const { page, limit, search, orgId, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(departments.deletedAt)];
  if (orgId)  conditions.push(eq(departments.orgId, orgId));
  if (status) conditions.push(eq(departments.isActive, status === 'active'));
  if (search) {
    conditions.push(
      or(
        ilike(departments.name, `%${search}%`),
        ilike(departments.code, `%${search}%`),
      )!
    );
  }

  const where   = and(...conditions);
  const orderCol = sortBy === 'code' ? departments.code : sortBy === 'createdAt' ? departments.createdAt : departments.name;
  const orderFn  = sortOrder === 'desc' ? desc : asc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(departments).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(departments).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { data, meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } };
}

export async function getDepartmentById(id: string): Promise<Dept> {
  const dept = await db.query.departments.findFirst({
    where: and(eq(departments.id, id), isNull(departments.deletedAt)),
  });
  if (!dept) throw Object.assign(new Error('Department not found'), { statusCode: 404 });
  return dept;
}

export async function createDepartment(input: CreateDepartmentInput, createdBy: string): Promise<Dept> {
  const [dept] = await db.insert(departments).values({
    orgId:              input.orgId,
    name:               input.name,
    code:               input.code?.toUpperCase(),
    description:        input.description,
    parentDepartmentId: input.parentDepartmentId,
    email:              input.email,
    phone:              input.phone,
    createdBy,
    updatedBy: createdBy,
  }).returning();
  return dept;
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput, updatedBy: string): Promise<Dept> {
  await getDepartmentById(id);
  const [updated] = await db.update(departments)
    .set({ ...input, code: input.code?.toUpperCase(), updatedBy, updatedAt: new Date() })
    .where(eq(departments.id, id))
    .returning();
  return updated;
}

export async function toggleDepartmentStatus(id: string, updatedBy: string): Promise<Dept> {
  const dept = await getDepartmentById(id);
  const [updated] = await db.update(departments)
    .set({ isActive: !dept.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(departments.id, id))
    .returning();
  return updated;
}

export async function deleteDepartment(id: string, deletedBy: string): Promise<void> {
  await getDepartmentById(id);
  await db.update(departments)
    .set({ deletedAt: new Date(), updatedBy: deletedBy, updatedAt: new Date() })
    .where(eq(departments.id, id));
}