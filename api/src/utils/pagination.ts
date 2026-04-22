export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
}

// ── Separate interface — no index signature conflict ──────────
export interface QueryParams {
  page: number;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  status?: string;
}

// ── Parse pagination from query string ────────────────────────
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page   = Math.max(1, parseInt(String(query.page  ?? 1), 10));
  const limit  = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ── Parse sort from query string ──────────────────────────────
export function parseSort(
  query: Record<string, unknown>,
  allowedFields: string[],
  defaultField = 'created_at'
): SortParams {
  const rawSortBy    = String(query.sortBy    ?? defaultField);
  const rawSortOrder = String(query.sortOrder ?? 'desc').toLowerCase();

  const sortBy    = allowedFields.includes(rawSortBy) ? rawSortBy : defaultField;
  const sortOrder = rawSortOrder === 'asc' ? 'asc' : 'desc';

  return { sortBy, sortOrder };
}

// ── Parse search from query string ────────────────────────────
export function parseSearch(query: Record<string, unknown>): string | undefined {
  const search = String(query.search ?? '').trim();
  return search.length > 0 ? `%${search}%` : undefined;
}

// ── Parse all query params together ───────────────────────────
export function parseQueryParams(
  query: Record<string, unknown>,
  allowedSortFields: string[],
  defaultSortField = 'created_at'
): QueryParams {
  const { page, limit, offset } = parsePagination(query);
  const { sortBy, sortOrder }   = parseSort(query, allowedSortFields, defaultSortField);
  const search                  = parseSearch(query);
  const status                  = query.status ? String(query.status) : undefined;

  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder,
    search,
    status,
  };
}