import { apiClient } from '@/lib/api-client';
import { EmailAccount, CreateEmailAccountData, UpdateEmailAccountData } from '@noessi/types';

class EmailAccountService {
  async getEmailAccounts(): Promise<EmailAccount[]> {
    const response = await apiClient.get<{success: boolean, data: EmailAccount[]}>('/email-accounts');
    return response.data.data;
  }

  async getEmailAccount(id: string): Promise<EmailAccount> {
    const response = await apiClient.get<{success: boolean, data: EmailAccount}>(`/email-accounts/${id}`);
    return response.data.data;
  }

  async createEmailAccount(data: CreateEmailAccountData): Promise<EmailAccount> {
    const response = await apiClient.post<{success: boolean, data: EmailAccount}>('/email-accounts', data);
    return response.data.data;
  }

  async updateEmailAccount(id: string, data: UpdateEmailAccountData): Promise<EmailAccount> {
    const response = await apiClient.patch<{success: boolean, data: EmailAccount}>(`/email-accounts/${id}`, data);
    return response.data.data;
  }

  async deleteEmailAccount(id: string): Promise<void> {
    await apiClient.delete(`/email-accounts/${id}`);
  }
}

export const emailAccountService = new EmailAccountService();