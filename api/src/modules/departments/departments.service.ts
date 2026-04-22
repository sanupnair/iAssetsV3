import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }          from '../../config/db.js';
import { departments } from '../../config/drizzle/schema/index.js';
import type { CreateDepartmentInput, UpdateDepartmentInput, ListDepartmentInput } from './departments.schema.js';
import type { PaginatedResult } from '../../types/index.js';

type Department = typeof departments.$inferSelect;

// ── List ──────────────────────────────────────────────────────
export async function listDepartments(
  input: ListDepartmentInput,
): Promise<PaginatedResult<Department>> {
  const { page, limit, search, orgId, parentId, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(departments.deletedAt)];

  if (orgId)    conditions.push(eq(departments.orgId,    orgId));
  if (parentId) conditions.push(eq(departments.parentId, parentId));
  if (status)   conditions.push(eq(departments.isActive, status === 'active'));
  if (search) {
    conditions.push(
      or(
        ilike(departments.name, `%${search}%`),
        ilike(departments.code, `%${search}%`),
      )!,
    );
  }

  const where    = and(...conditions);
  const orderCol = {
    name:      departments.name,
    code:      departments.code,
    createdAt: departments.createdAt,
  }[sortBy];
  const orderFn  = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(departments).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(departments).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

// ── Get tree (root departments only) ─────────────────────────
export async function getDepartmentTree(orgId: string): Promise<Department[]> {
  return db.select()
    .from(departments)
    .where(and(
      eq(departments.orgId,    orgId),
      isNull(departments.parentId),
      isNull(departments.deletedAt),
      eq(departments.isActive, true),
    ))
    .orderBy(asc(departments.name));
}

// ── Get by ID ─────────────────────────────────────────────────
export async function getDepartmentById(id: string): Promise<Department> {
  const dept = await db.query.departments.findFirst({
    where: and(eq(departments.id, id), isNull(departments.deletedAt)),
  });
  if (!dept) throw Object.assign(new Error('Department not found'), { statusCode: 404 });
  return dept;
}

// ── Create ────────────────────────────────────────────────────
export async function createDepartment(
  input:     CreateDepartmentInput,
  createdBy: string,
): Promise<Department> {
  const existing = await db.query.departments.findFirst({
    where: and(
      eq(departments.orgId, input.orgId),
      eq(departments.code,  input.code.toUpperCase()),
      isNull(departments.deletedAt),
    ),
  });
  if (existing) {
    throw Object.assign(
      new Error(`Department code '${input.code}' already exists in this organization`),
      { statusCode: 409 },
    );
  }

  // Validate parentId belongs to same org
  if (input.parentId) {
    const parent = await db.query.departments.findFirst({
      where: and(
        eq(departments.id,    input.parentId),
        eq(departments.orgId, input.orgId),
        isNull(departments.deletedAt),
      ),
    });
    if (!parent) {
      throw Object.assign(new Error('Parent department not found in this organization'), { statusCode: 400 });
    }
  }

  const [dept] = await db.insert(departments).values({
    ...input,
    code:      input.code.toUpperCase(),
    createdBy,
    updatedBy: createdBy,
  }).returning();

  return dept;
}

// ── Update ────────────────────────────────────────────────────
export async function updateDepartment(
  id:        string,
  input:     UpdateDepartmentInput,
  updatedBy: string,
): Promise<Department> {
  const dept = await getDepartmentById(id);

  if (input.code) {
    const existing = await db.query.departments.findFirst({
      where: and(
        eq(departments.orgId, dept.orgId),
        eq(departments.code,  input.code.toUpperCase()),
        isNull(departments.deletedAt),
      ),
    });
    if (existing && existing.id !== id) {
      throw Object.assign(
        new Error(`Department code '${input.code}' already exists in this organization`),
        { statusCode: 409 },
      );
    }
  }

  if (input.parentId && input.parentId === id) {
    throw Object.assign(new Error('A department cannot be its own parent'), { statusCode: 400 });
  }

  const [updated] = await db.update(departments)
    .set({
      ...input,
      code:      input.code ? input.code.toUpperCase() : undefined,
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(departments.id, id))
    .returning();

  return updated;
}

// ── Toggle status ─────────────────────────────────────────────
export async function toggleDepartmentStatus(id: string, updatedBy: string): Promise<Department> {
  const dept = await getDepartmentById(id);
  const [updated] = await db.update(departments)
    .set({ isActive: !dept.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(departments.id, id))
    .returning();
  return updated;
}

// ── Soft delete ───────────────────────────────────────────────
export async function deleteDepartment(id: string, deletedBy: string): Promise<void> {
  await getDepartmentById(id);

  // Prevent delete if children exist
  const children = await db.query.departments.findFirst({
    where: and(eq(departments.parentId, id), isNull(departments.deletedAt)),
  });
  if (children) {
    throw Object.assign(
      new Error('Cannot delete department with sub-departments. Remove children first.'),
      { statusCode: 400 },
    );
  }

  await db.update(departments)
    .set({ deletedAt: new Date(), deletedBy, isActive: false, updatedAt: new Date() })
    .where(eq(departments.id, id));
}