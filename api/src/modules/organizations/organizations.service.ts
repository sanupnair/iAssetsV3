import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }           from '../../config/db.js';
import { organizations } from '../../config/drizzle/schema/index.js';
import type { CreateOrgInput, UpdateOrgInput, ListOrgInput } from './organizations.schema.js';
import type { PaginatedResult } from '../../types/index.js';

type Org = typeof organizations.$inferSelect;

// ── List ──────────────────────────────────────────────────────
export async function listOrgs(
  input: ListOrgInput,
): Promise<PaginatedResult<Org>> {
  const { page, limit, search, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(organizations.deletedAt)];

  if (search) {
    conditions.push(
      or(
        ilike(organizations.name, `%${search}%`),
        ilike(organizations.code, `%${search}%`),
        ilike(organizations.email, `%${search}%`),
      )!,
    );
  }

  if (status) {
    conditions.push(eq(organizations.isActive, status === 'active'));
  }

  const where = and(...conditions);

  const orderCol = {
    name:      organizations.name,
    code:      organizations.code,
    createdAt: organizations.createdAt,
  }[sortBy];

  const orderFn = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select()
      .from(organizations)
      .where(where)
      .orderBy(orderFn(orderCol))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() })
      .from(organizations)
      .where(where),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ── Get by ID ─────────────────────────────────────────────────
export async function getOrgById(id: string): Promise<Org> {
  const org = await db.query.organizations.findFirst({
    where: and(
      eq(organizations.id, id),
      isNull(organizations.deletedAt),
    ),
  });

  if (!org) throw Object.assign(new Error('Organization not found'), { statusCode: 404 });
  return org;
}

// ── Create ────────────────────────────────────────────────────
export async function createOrg(
  input:     CreateOrgInput,
  createdBy: string,
): Promise<Org> {
  // Check duplicate code
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.code, input.code.toUpperCase()),
  });
  if (existing) {
    throw Object.assign(
      new Error(`Organization code '${input.code}' already exists`),
      { statusCode: 409 },
    );
  }

  const [org] = await db.insert(organizations).values({
    ...input,
    code:      input.code.toUpperCase(),
    createdBy,
    updatedBy: createdBy,
  }).returning();

  return org;
}

// ── Update ────────────────────────────────────────────────────
export async function updateOrg(
  id:        string,
  input:     UpdateOrgInput,
  updatedBy: string,
): Promise<Org> {
  await getOrgById(id); // ensures exists

  if (input.code) {
    const existing = await db.query.organizations.findFirst({
      where: and(
        eq(organizations.code, input.code.toUpperCase()),
        isNull(organizations.deletedAt),
      ),
    });
    if (existing && existing.id !== id) {
      throw Object.assign(
        new Error(`Organization code '${input.code}' already exists`),
        { statusCode: 409 },
      );
    }
  }

  const [updated] = await db.update(organizations)
    .set({
      ...input,
      code:      input.code ? input.code.toUpperCase() : undefined,
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, id))
    .returning();

  return updated;
}

// ── Toggle status ─────────────────────────────────────────────
export async function toggleOrgStatus(
  id:        string,
  updatedBy: string,
): Promise<Org> {
  const org = await getOrgById(id);

  const [updated] = await db.update(organizations)
    .set({
      isActive:  !org.isActive,
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, id))
    .returning();

  return updated;
}

// ── Soft delete ───────────────────────────────────────────────
export async function deleteOrg(
  id:        string,
  deletedBy: string,
): Promise<void> {
  await getOrgById(id);

  await db.update(organizations)
    .set({
      deletedAt: new Date(),
      deletedBy,
      isActive:  false,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, id));
}