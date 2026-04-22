import apiClient from '../client.js';
import type { Organization, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface OrgQuery extends ListQuery {
  status?: 'active' | 'inactive';
}

export interface CreateOrgInput {
  name:          string;
  legalName?:    string;
  shortCode?:    string;
  website?:      string;
  description?:  string;
  primaryEmail?: string;
  primaryPhone?: string;
  supportEmail?: string;
  supportPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?:         string;
  state?:        string;
  country?:      string;
  pincode?:      string;
  gstin?:        string;
  pan?:          string;
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