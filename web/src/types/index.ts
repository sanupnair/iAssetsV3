// ── Auth ──────────────────────────────────────────────────────
export interface AuthUser {
  id:                 string;
  email:              string;
  username:           string;
  firstName:          string;
  lastName:           string;
  displayName:        string;
  orgId:              string | null;
  orgName:            string | null;
  roleCode:           string;
  roleLevel:          number;
  permissions:        string[];
  avatarUrl:          string | null;
  theme:              'light' | 'dark' | 'system';
  mustChangePassword: boolean;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

export interface LoginResponse {
  user:   AuthUser;
  tokens: TokenPair;
}

// ── API ───────────────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data:    T;
  meta?:   PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── Common ────────────────────────────────────────────────────
export interface ListQuery {
  page?:      number;
  limit?:     number;
  search?:    string;
  status?:    string;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
}

// ── Organization ──────────────────────────────────────────────
export interface Organization {
  id:                    string;
  name:                  string;
  legalName:             string | null;
  shortCode:             string | null;
  logoUrl:               string | null;
  website:               string | null;
  description:           string | null;
  gstin:                 string | null;
  pan:                   string | null;
  cin:                   string | null;
  primaryEmail:          string | null;
  primaryPhone:          string | null;
  supportEmail:          string | null;
  supportPhone:          string | null;
  addressLine1:          string | null;
  addressLine2:          string | null;
  city:                  string | null;
  state:                 string | null;
  country:               string | null;
  pincode:               string | null;
  timezone:              string | null;
  currencyCode:          string | null;
  currencySymbol:        string | null;
  isActive:              boolean;
  isVerified:            boolean;
  createdAt:             string;
  updatedAt:             string;
}
// ── Branch ────────────────────────────────────────────────────
export interface Branch {
  id:           string;
  orgId:        string;
  name:         string;
  code:         string | null;
  branchType:   string | null;
  description:  string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  pincode:      string | null;
  phone:        string | null;
  email:        string | null;
  gstin:        string | null;
  isHq:         boolean;
  isActive:     boolean;
  createdAt:    string;
  updatedAt:    string;
}
// ── Location ──────────────────────────────────────────────────
export interface Location {
  id:               string;
  orgId:            string;
  branchId:         string | null;
  parentLocationId: string | null;
  name:             string;
  code:             string | null;
  type:             string | null;
  description:      string | null;
  floorNumber:      number | null;
  capacity:         number | null;
  areaSqft:         number | null;
  isActive:         boolean;
  createdAt:        string;
  updatedAt:        string;
}
// ── Department ────────────────────────────────────────────────
export interface Department {
  id:                 string;
  orgId:              string;
  parentDepartmentId: string | null;
  name:               string;
  code:               string | null;
  description:        string | null;
  email:              string | null;
  phone:              string | null;
  isActive:           boolean;
  createdAt:          string;
  updatedAt:          string;
}

// ── Designation ───────────────────────────────────────────────
export interface Designation {
  id:           string;
  orgId:        string;
  name:         string;
  shortName:    string | null;
  description:  string | null;
  level:        number | null;
  grade:        string | null;
  category:     string | null;
  canApprove:   boolean;
  isHodLevel:   boolean;
  isManagement: boolean;
  isActive:     boolean;
  createdAt:    string;
  updatedAt:    string;
}

// ── Role ──────────────────────────────────────────────────────
export interface Role {
  id:             string;
  orgId:          string;
  name:           string;
  code:           string | null;
  description:    string | null;
  color:          string | null;
  icon:           string | null;
  level:          number | null;
  isSystem:       boolean;
  isDefault:      boolean;
  canApprove:     boolean;
  canManageUsers: boolean;
  isActive:       boolean;
  createdAt:      string;
  updatedAt:      string;
}

export interface Permission {
  id:          string;
  module:      string;
  code:        string;
  name:        string;
  description: string | null;
}

// ── User ──────────────────────────────────────────────────────
export interface User {
  id:                  string;
  orgId:               string | null;
  employeeId:          string | null;
  firstName:           string;
  lastName:            string;
  displayName:         string | null;
  email:               string;
  username:            string;
  departmentId:        string | null;
  designationId:       string | null;
  branchId:            string | null;
  locationId:          string | null;
  reportingManagerId:  string | null;
  joiningDate:         string | null;
  workEmail:           string | null;
  workPhone:           string | null;
  mobile:              string | null;
  avatarUrl:           string | null;
  status:              'active' | 'inactive' | 'suspended' | 'pending';
  isActive:            boolean;
  lastLoginAt:         string | null;
  timezone:            string;
  theme:               string;
  mustChangePassword:  boolean;
  roleCode:            string | null;
  roleName:            string | null;
  roleLevel:           number | null;
  departmentName:      string | null;
  designationName:     string | null;
  branchName:          string | null;
  createdAt:           string;
  updatedAt:           string;
}