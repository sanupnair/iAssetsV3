import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }            from '../../config/db.js';
import { designations }  from '../../config/drizzle/schema/index.js';
import type { CreateDesignationInput, UpdateDesignationInput, ListDesignationInput } from './designations.schema.js';
import type { PaginatedResult } from '../../types/index.js';

type Designation = typeof designations.$inferSelect;

// ── List ──────────────────────────────────────────────────────
export async function listDesignations(
  input: ListDesignationInput,
): Promise<PaginatedResult<Designation>> {
  const { page, limit, search, orgId, departmentId, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(designations.deletedAt)];

  if (orgId)        conditions.push(eq(designations.orgId,        orgId));
  if (departmentId) conditions.push(eq(designations.departmentId, departmentId));
  if (status)       conditions.push(eq(designations.isActive,     status === 'active'));
  if (search) {
    conditions.push(
      or(
        ilike(designations.name, `%${search}%`),
        ilike(designations.code, `%${search}%`),
      )!,
    );
  }

  const where    = and(...conditions);
  const orderCol = {
    name:      designations.name,
    code:      designations.code,
    level:     designations.level,
    createdAt: designations.createdAt,
  }[sortBy];
  const orderFn  = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(designations).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(designations).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

// ── Get by ID ─────────────────────────────────────────────────
export async function getDesignationById(id: string): Promise<Designation> {
  const designation = await db.query.designations.findFirst({
    where: and(eq(designations.id, id), isNull(designations.deletedAt)),
  });
  if (!designation) throw Object.assign(new Error('Designation not found'), { statusCode: 404 });
  return designation;
}

// ── Create ────────────────────────────────────────────────────
export async function createDesignation(
  input:     CreateDesignationInput,
  createdBy: string,
): Promise<Designation> {
  const existing = await db.query.designations.findFirst({
    where: and(
      eq(designations.orgId, input.orgId),
      eq(designations.code,  input.code.toUpperCase()),
      isNull(designations.deletedAt),
    ),
  });
  if (existing) {
    throw Object.assign(
      new Error(`Designation code '${input.code}' already exists in this organization`),
      { statusCode: 409 },
    );
  }

  const [designation] = await db.insert(designations).values({
    ...input,
    code:      input.code.toUpperCase(),
    createdBy,
    updatedBy: createdBy,
  }).returning();

  return designation;
}

// ── Update ────────────────────────────────────────────────────
export async function updateDesignation(
  id:        string,
  input:     UpdateDesignationInput,
  updatedBy: string,
): Promise<Designation> {
  const designation = await getDesignationById(id);

  if (input.code) {
    const existing = await db.query.designations.findFirst({
      where: and(
        eq(designations.orgId, designation.orgId),
        eq(designations.code,  input.code.toUpperCase()),
        isNull(designations.deletedAt),
      ),
    });
    if (existing && existing.id !== id) {
      throw Object.assign(
        new Error(`Designation code '${input.code}' already exists in this organization`),
        { statusCode: 409 },
      );
    }
  }

  const [updated] = await db.update(designations)
    .set({
      ...input,
      code:      input.code ? input.code.toUpperCase() : undefined,
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(designations.id, id))
    .returning();

  return updated;
}

// ── Toggle status ─────────────────────────────────────────────
export async function toggleDesignationStatus(id: string, updatedBy: string): Promise<Designation> {
  const designation = await getDesignationById(id);
  const [updated]   = await db.update(designations)
    .set({ isActive: !designation.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(designations.id, id))
    .returning();
  return updated;
}

// ── Soft delete ───────────────────────────────────────────────
export async function deleteDesignation(id: string, deletedBy: string): Promise<void> {
  await getDesignationById(id);
  await db.update(designations)
    .set({ deletedAt: new Date(), deletedBy, isActive: false, updatedAt: new Date() })
    .where(eq(designations.id, id));
}