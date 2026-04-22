import apiClient from '../client.js';
import type { Location, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface CreateLocationInput {
  orgId:            string;
  branchId?:        string;
  parentLocationId?: string;
  name:             string;
  code?:            string;
  type?:            string;
  description?:     string;
  floorNumber?:     number;
  capacity?:        number;
  areaSqft?:        number;
}

export const locationsApi = {
  list: async (query?: ListQuery & { orgId?: string; branchId?: string; status?: 'active' | 'inactive' }): Promise<PaginatedResponse<Location>> => {
    const { data } = await apiClient.get('/locations', { params: query });
    return { data: data.data, meta: data.meta };
  },
  getById: async (id: string): Promise<Location> => {
    const { data } = await apiClient.get(`/locations/${id}`);
    return data.data;
  },
  create: async (input: CreateLocationInput): Promise<Location> => {
    const { data } = await apiClient.post('/locations', input);
    return data.data;
  },
  update: async (id: string, input: Partial<CreateLocationInput>): Promise<Location> => {
    const { data } = await apiClient.patch(`/locations/${id}`, input);
    return data.data;
  },
  toggleStatus: async (id: string): Promise<Location> => {
    const { data } = await apiClient.patch(`/locations/${id}/toggle-status`);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/locations/${id}`);
  },
};