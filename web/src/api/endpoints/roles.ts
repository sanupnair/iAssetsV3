import apiClient from '../client.js';
import type { Role, Permission, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface CreateRoleInput {
  orgId?:       string;
  name:         string;
  code:         string;
  description?: string;
  level?:       number;
  permissions:  string[];
}

export const rolesApi = {
  listPermissions: async (): Promise<Permission[]> => {
    const { data } = await apiClient.get('/roles/permissions');
    return data.data;
  },

  list: async (query?: ListQuery & { orgId?: string }): Promise<PaginatedResponse<Role>> => {
    const { data } = await apiClient.get('/roles', { params: query });
    return { data: data.data, meta: data.meta };
  },

  getById: async (id: string): Promise<Role> => {
    const { data } = await apiClient.get(`/roles/${id}`);
    return data.data;
  },

  create: async (input: CreateRoleInput): Promise<Role> => {
    const { data } = await apiClient.post('/roles', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreateRoleInput>): Promise<Role> => {
    const { data } = await apiClient.patch(`/roles/${id}`, input);
    return data.data;
  },

  assignPermissions: async (id: string, permissions: string[]): Promise<Role> => {
    const { data } = await apiClient.put(`/roles/${id}/permissions`, { permissions });
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