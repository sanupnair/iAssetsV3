import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }        from '../../config/db.js';
import { locations } from '../../config/drizzle/schema/index.js';
import type { CreateLocationInput, UpdateLocationInput, ListLocationInput } from './locations.schema.js';

type Location = typeof locations.$inferSelect;

export async function listLocations(input: ListLocationInput) {
  const { page, limit, search, orgId, branchId, status, sortBy, sortOrder } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(locations.deletedAt)];
  if (orgId)    conditions.push(eq(locations.orgId, orgId));
  if (branchId) conditions.push(eq(locations.branchId, branchId));
  if (status)   conditions.push(eq(locations.isActive, status === 'active'));
  if (search) {
    conditions.push(
      or(
        ilike(locations.name, `%${search}%`),
        ilike(locations.code, `%${search}%`),
      )!
    );
  }

  const where   = and(...conditions);
  const orderCol = sortBy === 'name' ? locations.name : locations.createdAt;
  const orderFn  = sortOrder === 'asc' ? asc : desc;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(locations).where(where).orderBy(orderFn(orderCol)).limit(limit).offset(offset),
    db.select({ total: count() }).from(locations).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { data, meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } };
}

export async function getLocationById(id: string): Promise<Location> {
  const loc = await db.query.locations.findFirst({
    where: and(eq(locations.id, id), isNull(locations.deletedAt)),
  });
  if (!loc) throw Object.assign(new Error('Location not found'), { statusCode: 404 });
  return loc;
}

export async function createLocation(input: CreateLocationInput, createdBy: string): Promise<Location> {
  const [loc] = await db.insert(locations).values({
    ...input,
    code: input.code?.toUpperCase(),
    createdBy,
    updatedBy: createdBy,
  }).returning();
  return loc;
}

export async function updateLocation(id: string, input: UpdateLocationInput, updatedBy: string): Promise<Location> {
  await getLocationById(id);
  const [updated] = await db.update(locations)
    .set({ ...input, code: input.code?.toUpperCase(), updatedBy, updatedAt: new Date() })
    .where(eq(locations.id, id))
    .returning();
  return updated;
}

export async function toggleLocationStatus(id: string, updatedBy: string): Promise<Location> {
  const loc = await getLocationById(id);
  const [updated] = await db.update(locations)
    .set({ isActive: !loc.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(locations.id, id))
    .returning();
  return updated;
}

export async function deleteLocation(id: string, deletedBy: string): Promise<void> {
  await getLocationById(id);
  await db.update(locations)
    .set({ deletedAt: new Date(), updatedBy: deletedBy, updatedAt: new Date() })
    .where(eq(locations.id, id));
}