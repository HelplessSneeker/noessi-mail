import { apiClient } from '@/lib/api-client';

export interface EmailAccount {
  id: string;
  email: string;
  provider: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailAccountData {
  email: string;
  provider: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export interface UpdateEmailAccountData {
  email?: string;
  provider?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

class EmailAccountService {
  async getEmailAccounts(): Promise<EmailAccount[]> {
    const response = await apiClient.get('/email-accounts');
    return response.data;
  }

  async getEmailAccount(id: string): Promise<EmailAccount> {
    const response = await apiClient.get(`/email-accounts/${id}`);
    return response.data;
  }

  async createEmailAccount(data: CreateEmailAccountData): Promise<EmailAccount> {
    const response = await apiClient.post('/email-accounts', data);
    return response.data;
  }

  async updateEmailAccount(id: string, data: UpdateEmailAccountData): Promise<EmailAccount> {
    const response = await apiClient.patch(`/email-accounts/${id}`, data);
    return response.data;
  }

  async deleteEmailAccount(id: string): Promise<void> {
    await apiClient.delete(`/email-accounts/${id}`);
  }
}

export const emailAccountService = new EmailAccountService();