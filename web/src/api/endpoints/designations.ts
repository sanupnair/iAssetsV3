import apiClient from '../client.js';
import type { Designation, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface CreateDesignationInput {
  orgId:         string;
  departmentId?: string;
  name:          string;
  code:          string;
  level?:        number;
  description?:  string;
}

export const designationsApi = {
  list: async (query?: ListQuery & { orgId?: string; departmentId?: string }): Promise<PaginatedResponse<Designation>> => {
    const { data } = await apiClient.get('/designations', { params: query });
    return { data: data.data, meta: data.meta };
  },

  getById: async (id: string): Promise<Designation> => {
    const { data } = await apiClient.get(`/designations/${id}`);
    return data.data;
  },

  create: async (input: CreateDesignationInput): Promise<Designation> => {
    const { data } = await apiClient.post('/designations', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreateDesignationInput>): Promise<Designation> => {
    const { data } = await apiClient.patch(`/designations/${id}`, input);
    return data.data;
  },

  toggleStatus: async (id: string): Promise<Designation> => {
    const { data } = await apiClient.patch(`/designations/${id}/toggle-status`);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/designations/${id}`);
  },
};