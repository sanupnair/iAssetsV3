import { eq, ilike, and, isNull, or, asc, desc, count } from 'drizzle-orm';
import { db }           from '../../config/db.js';
import { designations } from '../../config/drizzle/schema/index.js';
import type { CreateDesignationInput, UpdateDesignationInput, ListDesignationInput } from './designations.schema.js';

type Designation = typeof designations.$inferSelect;

export async function listDesignations(input: ListDesignationInput) {
  const { page, limit, search, orgId, status } = input;
  const offset = (page - 1) * limit;

  const conditions = [isNull(designations.deletedAt)];
  if (orgId)  conditions.push(eq(designations.orgId, orgId));
  if (status) conditions.push(eq(designations.isActive, status === 'active'));
  if (search) {
    conditions.push(
      or(
        ilike(designations.name,      `%${search}%`),
        ilike(designations.shortName, `%${search}%`),
        ilike(designations.grade,     `%${search}%`),
      )!
    );
  }

  const where = and(...conditions);

  const [data, [{ total }]] = await Promise.all([
    db.select().from(designations).where(where)
      .orderBy(asc(designations.level), asc(designations.name))
      .limit(limit).offset(offset),
    db.select({ total: count() }).from(designations).where(where),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { data, meta: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } };
}

export async function getDesignationById(id: string): Promise<Designation> {
  const d = await db.query.designations.findFirst({
    where: and(eq(designations.id, id), isNull(designations.deletedAt)),
  });
  if (!d) throw Object.assign(new Error('Designation not found'), { statusCode: 404 });
  return d;
}

export async function createDesignation(input: CreateDesignationInput, createdBy: string): Promise<Designation> {
  const [d] = await db.insert(designations).values({
    ...input,
    createdBy,
    updatedBy: createdBy,
  }).returning();
  return d;
}

export async function updateDesignation(id: string, input: UpdateDesignationInput, updatedBy: string): Promise<Designation> {
  await getDesignationById(id);
  const [updated] = await db.update(designations)
    .set({ ...input, updatedBy, updatedAt: new Date() })
    .where(eq(designations.id, id))
    .returning();
  return updated;
}

export async function toggleDesignationStatus(id: string, updatedBy: string): Promise<Designation> {
  const d = await getDesignationById(id);
  const [updated] = await db.update(designations)
    .set({ isActive: !d.isActive, updatedBy, updatedAt: new Date() })
    .where(eq(designations.id, id))
    .returning();
  return updated;
}

export async function deleteDesignation(id: string, deletedBy: string): Promise<void> {
  await getDesignationById(id);
  await db.update(designations)
    .set({ deletedAt: new Date(), updatedBy: deletedBy, updatedAt: new Date() })
    .where(eq(designations.id, id));
}