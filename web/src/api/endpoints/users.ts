import apiClient from '../client.js';
import type { User, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface CreateUserInput {
  orgId?:              string;
  employeeId?:         string;
  firstName:           string;
  lastName:            string;
  email:               string;
  username:            string;
  password:            string;
  roleId:              string;
  departmentId?:       string;
  designationId?:      string;
  branchId?:           string;
  locationId?:         string;
  reportingManagerId?: string;
  joiningDate?:        string;
  workEmail?:          string;
  workPhone?:          string;
  mobile?:             string;
  mustChangePassword?: boolean;
}

export const usersApi = {
  list: async (query?: ListQuery & { orgId?: string; departmentId?: string; branchId?: string }): Promise<PaginatedResponse<User>> => {
    const { data } = await apiClient.get('/users', { params: query });
    return { data: data.data, meta: data.meta };
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.data;
  },

  create: async (input: CreateUserInput): Promise<User> => {
    const { data } = await apiClient.post('/users', input);
    return data.data;
  },

  update: async (id: string, input: Partial<Omit<CreateUserInput, 'password' | 'email' | 'username'>>): Promise<User> => {
    const { data } = await apiClient.patch(`/users/${id}`, input);
    return data.data;
  },

  updateStatus: async (id: string, status: 'active' | 'inactive' | 'suspended'): Promise<User> => {
    const { data } = await apiClient.patch(`/users/${id}/status`, { status });
    return data.data;
  },

  resetPassword: async (id: string, newPassword: string, mustChangePassword = true): Promise<void> => {
    await apiClient.post(`/users/${id}/reset-password`, { newPassword, mustChangePassword });
  },

  assignRole: async (id: string, roleId: string): Promise<User> => {
    const { data } = await apiClient.post(`/users/${id}/assign-role`, { roleId });
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};