import apiClient from '../client.js';
import type { Role, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface RoleQuery extends ListQuery {
  orgId?:  string;
  status?: 'active' | 'inactive';
}

export interface CreateRoleInput {
  orgId:          string;
  name:           string;
  code?:          string;
  description?:   string;
  color?:         string;
  icon?:          string;
  level?:         number;
  canApprove?:    boolean;
  canManageUsers?: boolean;
  isDefault?:     boolean;
}

export const rolesApi = {
  list: async (query?: RoleQuery): Promise<PaginatedResponse<Role>> => {
    const { data } = await apiClient.get('/roles', { params: query });
    return { data: data.data, meta: data.meta };
  },
  create: async (input: CreateRoleInput): Promise<Role> => {
    const { data } = await apiClient.post('/roles', input);
    return data.data;
  },
  update: async (id: string, input: Partial<CreateRoleInput>): Promise<Role> => {
    const { data } = await apiClient.patch(`/roles/${id}`, input);
    return data.data;
  },
  toggleStatus: async (id: string): Promise<Role> => {
    const { data } = await apiClient.patch(`/roles/${id}/toggle-status`);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },
};