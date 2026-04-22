import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }            from '../../config/db.js';
import { organizations } from '../../config/drizzle/schema/index.js';
import type { CreateOrgInput, UpdateOrgInput, ListOrgInput } from './organizations.schema.js';
import type { PaginatedResult } from '../../types/index.js';

type Org = typeof organizations.$inferSelect;

export async function listOrgs(input: ListOrgInput): Promise<PaginatedResult<Org>> {
  const { page, limit, search, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(organizations.deletedAt)];

  if (status) conditions.push(eq(organizations.isActive, status === 'active'));
  if (search) {
    conditions.push(
      or(
        ilike(organizations.name,       `%${search}%`),
        ilike(organizations.shortCode,  `%${search}%`),
        ilike(organizations.primaryEmail, `%${search}%`),
      )!,
    );
  }

  const where    = and(...conditions);
  const orderCol = {
    name:      organizations.name,
    code:      organizations.shortCode,
    createdAt: organizations.createdAt,
  }[sortBy] ?? organizations.createdAt;
  const orderFn = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(organizations).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(organizations).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

export async function getOrgById(id: string): Promise<Org> {
  const org = await db.query.organizations.findFirst({
    where: and(eq(organizations.id, id), isNull(organizations.deletedAt)),
  });
  if (!org) throw Object.assign(new Error('Organization not found'), { statusCode: 404 });
  return org;
}

export async function createOrg(input: CreateOrgInput, createdBy: string): Promise<Org> {
  if (input.shortCode) {
    const existing = await db.query.organizations.findFirst({
      where: and(eq(organizations.shortCode, input.shortCode.toUpperCase()), isNull(organizations.deletedAt)),
    });
    if (existing) throw Object.assign(new Error(`Code '${input.shortCode}' already exists`), { statusCode: 409 });
  }

  const [org] = await db.insert(organizations).values({
    ...input,
    shortCode: input.shortCode ? input.shortCode.toUpperCase() : null,
    createdBy,
    updatedBy: createdBy,
  }).returning();
  return org;
}

export async function updateOrg(id: string, input: UpdateOrgInput, updatedBy: string): Promise<Org> {
  await getOrgById(id);
  const [updated] = await db.update(organizations)
    .set({ ...input, shortCode: input.shortCode?.toUpperCase(), updatedBy, updatedAt: new Date() })
    .where(eq(organizations.id, id))
    .returning();
  return updated;
}

export async function toggleOrgStatus(id: string, updatedBy: string): Promise<Org> {
  const org = await getOrgById(id);
  const [updated] = await db.update(organizations)
    .set({ isActive: !org.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(organizations.id, id))
    .returning();
  return updated;
}

export async function deleteOrg(id: string, deletedBy: string): Promise<void> {
  await getOrgById(id);
  await db.update(organizations)
    .set({ deletedAt: new Date(), updatedBy: deletedBy, updatedAt: new Date() })
    .where(eq(organizations.id, id));
}