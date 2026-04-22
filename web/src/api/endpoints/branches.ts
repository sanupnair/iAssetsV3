import apiClient from '../client.js';
import type { Branch, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface CreateBranchInput {
  orgId:         string;
  name:          string;
  code:          string;
  address?:      string;
  city?:         string;
  state?:        string;
  country?:      string;
  pincode?:      string;
  phone?:        string;
  email?:        string;
  isHeadOffice?: boolean;
}

export const branchesApi = {
  list: async (query?: ListQuery & { orgId?: string }): Promise<PaginatedResponse<Branch>> => {
    const { data } = await apiClient.get('/branches', { params: query });
    return { data: data.data, meta: data.meta };
  },

  getById: async (id: string): Promise<Branch> => {
    const { data } = await apiClient.get(`/branches/${id}`);
    return data.data;
  },

  create: async (input: CreateBranchInput): Promise<Branch> => {
    const { data } = await apiClient.post('/branches', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreateBranchInput>): Promise<Branch> => {
    const { data } = await apiClient.patch(`/branches/${id}`, input);
    return data.data;
  },

  toggleStatus: async (id: string): Promise<Branch> => {
    const { data } = await apiClient.patch(`/branches/${id}/toggle-status`);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/branches/${id}`);
  },
};