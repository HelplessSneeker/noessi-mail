import { apiClient } from '@/lib/api-client';
import { LoginDto, RegisterDto, AuthResponse } from '@noessi/types';

export const authService = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<{success: boolean, data: AuthResponse}>('/auth/register', data);
    try {
      authService.saveTokens(response.data.data);
    } catch (error) {
      console.warn('Failed to save tokens to localStorage:', error);
    }
    return response.data.data;
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<{success: boolean, data: AuthResponse}>('/auth/login', data);
    try {
      authService.saveTokens(response.data.data);
    } catch (error) {
      console.warn('Failed to save tokens to localStorage:', error);
    }
    return response.data.data;
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
    return response.data.data.user;
  },

  saveTokens(data: AuthResponse) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Also set cookies for server-side authentication checking
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=900; SameSite=Lax`; // 15 minutes
      document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=604800; SameSite=Lax`; // 7 days
    }
  },

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Also clear cookies
      document.cookie = 'accessToken=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
    }
  },

  isAuthenticated() {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('accessToken');
    }
    return false;
  },
};
