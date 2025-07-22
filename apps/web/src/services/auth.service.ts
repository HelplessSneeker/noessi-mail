import { apiClient } from '@/lib/api-client';
import { LoginDto, RegisterDto, AuthResponse } from '@noessi/types';

export const authService = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    try {
      authService.saveTokens(response.data);
    } catch (error) {
      console.warn('Failed to save tokens to localStorage:', error);
    }
    return response.data;
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    try {
      authService.saveTokens(response.data);
    } catch (error) {
      console.warn('Failed to save tokens to localStorage:', error);
    }
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      authService.clearTokens();
    }
  },

  async getMe() {
    const response = await apiClient.post('/auth/me');
    return response.data.user;
  },

  saveTokens(data: AuthResponse) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
  },

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  isAuthenticated() {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('accessToken');
    }
    return false;
  },
};
