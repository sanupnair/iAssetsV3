import apiClient, { tokenStorage } from '../client.js';
import type { LoginResponse, AuthUser } from '../../types/index.js';

export const authApi = {
  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/login', { identifier, password });
    return data.data;
  },

  refresh: async (refreshToken: string) => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken });
    return data.data;
  },

  logout: async () => {
    const refreshToken = tokenStorage.getRefresh();
    await apiClient.post('/auth/logout', { refreshToken });
  },

  me: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};