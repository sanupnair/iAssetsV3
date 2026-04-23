import apiClient from '../client.js';
import type { User, PaginatedResponse, ListQuery } from '../../types/index.js';

export interface UserQuery extends ListQuery {
  orgId?:         string;
  departmentId?:  string;
  branchId?:      string;
  designationId?: string;
  status?:        'active' | 'inactive' | 'suspended' | 'offboarded';
}

export interface CreateUserInput {
  orgId:              string;
  firstName:          string;
  lastName?:          string;
  email:              string;
  username?:          string;
  employeeId?:        string;
  departmentId?:      string;
  designationId?:     string;
  branchId?:          string;
  locationId?:        string;
  reportingManagerId?: string;
  joiningDate?:       string;
  workEmail?:         string;
  workPhone?:         string;
  mobile?:            string;
  extension?:         string;
  timezone?:          string;
}

export const usersApi = {
  list: async (query?: UserQuery): Promise<PaginatedResponse<User>> => {
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
  update: async (id: string, input: Partial<CreateUserInput>): Promise<User> => {
    const { data } = await apiClient.patch(`/users/${id}`, input);
    return data.data;
  },
  toggleStatus: async (id: string): Promise<User> => {
    const { data } = await apiClient.patch(`/users/${id}/toggle-status`);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};