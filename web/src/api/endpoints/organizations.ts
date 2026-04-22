import apiClient from '../client.js';
import type { Organization, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface OrgQuery extends ListQuery {
  industry?: string;
}

export interface CreateOrgInput {
  name:        string;
  code:        string;
  legalName?:  string;
  industry?:   string;
  size?:       string;
  website?:    string;
  email?:      string;
  phone?:      string;
  address?:    string;
  city?:       string;
  state?:      string;
  country?:    string;
  pincode?:    string;
}

export const organizationsApi = {
  list: async (query?: OrgQuery): Promise<PaginatedResponse<Organization>> => {
    const { data } = await apiClient.get('/organizations', { params: query });
    return { data: data.data, meta: data.meta };
  },

  getById: async (id: string): Promise<Organization> => {
    const { data } = await apiClient.get(`/organizations/${id}`);
    return data.data;
  },

  create: async (input: CreateOrgInput): Promise<Organization> => {
    const { data } = await apiClient.post('/organizations', input);
    return data.data;
  },

  update: async (id: string, input: Partial<CreateOrgInput>): Promise<Organization> => {
    const { data } = await apiClient.patch(`/organizations/${id}`, input);
    return data.data;
  },

  toggleStatus: async (id: string): Promise<Organization> => {
    const { data } = await apiClient.patch(`/organizations/${id}/toggle-status`);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/organizations/${id}`);
  },
};