// ── Common Status Types ───────────────────────────────────────
export type ActiveStatus = 'active' | 'inactive';

export type UserStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending'
  | 'offboarded';

export type Theme = 'light' | 'dark' | 'system';

export type SortOrder = 'asc' | 'desc';

// ── Common DB Record Fields ───────────────────────────────────
export interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletableRecord extends BaseRecord {
  deletedAt: Date | null;
  deletedBy: string | null;
}

export interface AuditableRecord extends SoftDeletableRecord {
  createdBy: string | null;
  updatedBy: string | null;
}

// ── Pagination ────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── API Response ──────────────────────────────────────────────
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: PaginatedResult<T>['meta'];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Auth ──────────────────────────────────────────────────────
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  orgId: string | null;
  orgName: string | null;
  roleCode: string;
  roleLevel: number;
  permissions: string[];
  avatarUrl: string | null;
  theme: Theme;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: TokenPair;
}

// ── List Query ────────────────────────────────────────────────
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}