import apiClient from '../client.js';
import type { Department, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface CreateDepartmentInput {
  orgId:              string;
  parentDepartmentId?: string;
  name:               string;
  code?:              string;
  description?:       string;
  email?:             string;
  phone?:             string;
}

export const departmentsApi = {
  list: async (query?: ListQuery & { orgId?: string; status?: 'active' | 'inactive' }): Promise<PaginatedResponse<Department>> => {
    const { data } = await apiClient.get('/departments', { params: query });
    return { data: data.data, meta: data.meta };
  },

  getById: async (id: string): Promise<Department> => {
    const { data } = await apiClient.get(`/departments/${id}`);
    return data.data;
  },

  create: async (input: CreateDepartmentInput): Promise<Department> => {
    const { data } = await apiClient.post('/departments', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreateDepartmentInput>): Promise<Department> => {
    const { data } = await apiClient.patch(`/departments/${id}`, input);
    return data.data;
  },

  toggleStatus: async (id: string): Promise<Department> => {
    const { data } = await apiClient.patch(`/departments/${id}/toggle-status`);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/departments/${id}`);
  },
};