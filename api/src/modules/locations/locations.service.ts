import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }        from '../../config/db.js';
import { locations } from '../../config/drizzle/schema/index.js';
import type { CreateLocationInput, UpdateLocationInput, ListLocationInput } from './locations.schema.js';
import type { PaginatedResult } from '../../types/index.js';

type Location = typeof locations.$inferSelect;

// ── List ──────────────────────────────────────────────────────
export async function listLocations(
  input: ListLocationInput,
): Promise<PaginatedResult<Location>> {
  const { page, limit, search, orgId, branchId, parentId, type, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(locations.deletedAt)];

  if (orgId)    conditions.push(eq(locations.orgId,    orgId));
  if (branchId) conditions.push(eq(locations.branchId, branchId));
  if (parentId) conditions.push(eq(locations.parentId, parentId));
  if (type)     conditions.push(eq(locations.type,     type));
  if (status)   conditions.push(eq(locations.isActive, status === 'active'));
  if (search) {
    conditions.push(
      or(
        ilike(locations.name, `%${search}%`),
        ilike(locations.code, `%${search}%`),
      )!,
    );
  }

  const where    = and(...conditions);
  const orderCol = {
    name:      locations.name,
    code:      locations.code,
    type:      locations.type,
    createdAt: locations.createdAt,
  }[sortBy];
  const orderFn  = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(locations).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(locations).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

// ── Get tree (nested locations) ───────────────────────────────
export async function getLocationTree(orgId: string): Promise<Location[]> {
  return db.select()
    .from(locations)
    .where(and(
      eq(locations.orgId,    orgId),
      isNull(locations.parentId),
      isNull(locations.deletedAt),
      eq(locations.isActive, true),
    ))
    .orderBy(asc(locations.name));
}

// ── Get by ID ─────────────────────────────────────────────────
export async function getLocationById(id: string): Promise<Location> {
  const location = await db.query.locations.findFirst({
    where: and(eq(locations.id, id), isNull(locations.deletedAt)),
  });
  if (!location) throw Object.assign(new Error('Location not found'), { statusCode: 404 });
  return location;
}

// ── Create ────────────────────────────────────────────────────
export async function createLocation(
  input:     CreateLocationInput,
  createdBy: string,
): Promise<Location> {
  // Check duplicate code within org
  const existing = await db.query.locations.findFirst({
    where: and(
      eq(locations.orgId, input.orgId),
      eq(locations.code,  input.code.toUpperCase()),
      isNull(locations.deletedAt),
    ),
  });
  if (existing) {
    throw Object.assign(
      new Error(`Location code '${input.code}' already exists in this organization`),
      { statusCode: 409 },
    );
  }

  // Validate parentId belongs to same org
  if (input.parentId) {
    const parent = await db.query.locations.findFirst({
      where: and(eq(locations.id, input.parentId), eq(locations.orgId, input.orgId)),
    });
    if (!parent) {
      throw Object.assign(new Error('Parent location not found in this organization'), { statusCode: 400 });
    }
  }

  const [location] = await db.insert(locations).values({
    ...input,
    code:      input.code.toUpperCase(),
    createdBy,
    updatedBy: createdBy,
  }).returning();

  return location;
}

// ── Update ────────────────────────────────────────────────────
export async function updateLocation(
  id:        string,
  input:     UpdateLocationInput,
  updatedBy: string,
): Promise<Location> {
  const location = await getLocationById(id);

  if (input.code) {
    const existing = await db.query.locations.findFirst({
      where: and(
        eq(locations.orgId, location.orgId),
        eq(locations.code,  input.code.toUpperCase()),
        isNull(locations.deletedAt),
      ),
    });
    if (existing && existing.id !== id) {
      throw Object.assign(
        new Error(`Location code '${input.code}' already exists in this organization`),
        { statusCode: 409 },
      );
    }
  }

  // Prevent self-referencing parent
  if (input.parentId && input.parentId === id) {
    throw Object.assign(new Error('A location cannot be its own parent'), { statusCode: 400 });
  }

  const [updated] = await db.update(locations)
    .set({
      ...input,
      code:      input.code ? input.code.toUpperCase() : undefined,
      updatedBy,
      updatedAt: new Date(),
    })
    .where(eq(locations.id, id))
    .returning();

  return updated;
}

// ── Toggle status ─────────────────────────────────────────────
export async function toggleLocationStatus(id: string, updatedBy: string): Promise<Location> {
  const location = await getLocationById(id);
  const [updated] = await db.update(locations)
    .set({ isActive: !location.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(locations.id, id))
    .returning();
  return updated;
}

// ── Soft delete ───────────────────────────────────────────────
export async function deleteLocation(id: string, deletedBy: string): Promise<void> {
  await getLocationById(id);

  // Check if any child locations exist
  const children = await db.query.locations.findFirst({
    where: and(eq(locations.parentId, id), isNull(locations.deletedAt)),
  });
  if (children) {
    throw Object.assign(
      new Error('Cannot delete location with sub-locations. Remove children first.'),
      { statusCode: 400 },
    );
  }

  await db.update(locations)
    .set({ deletedAt: new Date(), deletedBy, isActive: false, updatedAt: new Date() })
    .where(eq(locations.id, id));
}