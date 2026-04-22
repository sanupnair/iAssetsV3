import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }       from '../../config/db.js';
import { branches } from '../../config/drizzle/schema/index.js';
import type { CreateBranchInput, UpdateBranchInput, ListBranchInput } from './branches.schema.js';
import type { PaginatedResult } from '../../types/index.js';

type Branch = typeof branches.$inferSelect;

// ── List ──────────────────────────────────────────────────────
export async function listBranches(
  input: ListBranchInput,
): Promise<PaginatedResult<Branch>> {
  const { page, limit, search, orgId, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(branches.deletedAt)];

  if (orgId)  conditions.push(eq(branches.orgId, orgId));
  if (status) conditions.push(eq(branches.isActive, status === 'active'));
  if (search) {
    conditions.push(
      or(
        ilike(branches.name,  `%${search}%`),
        ilike(branches.code,  `%${search}%`),
        ilike(branches.city,  `%${search}%`),
      )!,
    );
  }

  const where   = and(...conditions);
  const orderCol = {
    name:      branches.name,
    code:      branches.code,
    createdAt: branches.createdAt,
  }[sortBy];
  const orderFn = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(branches).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(branches).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

// ── Get by ID ─────────────────────────────────────────────────
export async function getBranchById(id: string): Promise<Branch> {
  const branch = await db.query.branches.findFirst({
    where: and(eq(branches.id, id), isNull(branches.deletedAt)),
  });
  if (!branch) throw Object.assign(new Error('Branch not found'), { statusCode: 404 });
  return branch;
}

// ── Create ────────────────────────────────────────────────────
export async function createBranch(
  input:     CreateBranchInput,
  createdBy: string,
): Promise<Branch> {
  // Check duplicate code within same org
  const existing = await db.query.branches.findFirst({
    where: and(
      eq(branches.orgId, input.orgId),
      eq(branches.code,  input.code.toUpperCase()),
      isNull(branches.deletedAt),
    ),
  });
  if (existing) {
    throw Object.assign(
      new Error(`Branch code '${input.code}' already exists in this organization`),
      { statusCode: 409 },
    );
  }

  // If this is head office, unset any existing head office
  if (input.isHeadOffice) {
    await db.update(branches)
      .set({ isHeadOffice: false, updatedAt: new Date() })
      .where(and(eq(branches.orgId, input.orgId), eq(branches.isHeadOffice, true)));
  }

  const [branch] = await db.insert(branches).values({
    ...input,
    code:      input.code.toUpperCase(),
    createdBy,
    updatedBy: createdBy,
  }).returning();

  return branch;
}

// ── Update ────────────────────────────────────────────────────
export async function updateBranch(
  id:        string,
  input:     UpdateBranchInput,
  updatedBy: string,
): Promise<Branch> {
  const branch = await getBranchById(id);

  if (input.code) {
    const existing = await db.query.branches.findFirst({
      where: and(
        eq(branches.orgId, branch.orgId),
        eq(branches.code,  input.code.toUpperCase()),
        isNull(branches.deletedAt),
      ),
    });
    if (existing && existing.id !== id) {
      throw Object.assign(
        new Error(`Branch code '${input.code}' already exists in this organization`),
        { statusCode: 409 },
      );
    }
  }

  // If setting as head office, unset existing
  if (input.isHeadOffice) {
    await db.update(branches)
      .set({ isHeadOffice: false, updatedAt: new Date() })
      .where(and(eq(branches.orgId, branch.orgId), eq(branches.isHeadOffice, true)));
  }

  const [updated] = await db.update(branches)
    .set({ ...input, code: input.code ? input.code.toUpperCase() : undefined, updatedBy, updatedAt: new Date() })
    .where(eq(branches.id, id))
    .returning();

  return updated;
}

// ── Toggle status ─────────────────────────────────────────────
export async function toggleBranchStatus(id: string, updatedBy: string): Promise<Branch> {
  const branch = await getBranchById(id);
  const [updated] = await db.update(branches)
    .set({ isActive: !branch.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(branches.id, id))
    .returning();
  return updated;
}

// ── Soft delete ───────────────────────────────────────────────
export async function deleteBranch(id: string, deletedBy: string): Promise<void> {
  await getBranchById(id);
  await db.update(branches)
    .set({ deletedAt: new Date(), deletedBy, isActive: false, updatedAt: new Date() })
    .where(eq(branches.id, id));
}