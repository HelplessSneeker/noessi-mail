const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface EmailListParams {
  folder?: string;
  page?: number;
  limit?: number;
  search?: string;
  unreadOnly?: boolean;
  starredOnly?: boolean;
}

export interface EmailResponse {
  id: string;
  messageId: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  isDraft: boolean;
  sentAt?: string;
  receivedAt: string;
  folderName?: string;
  threadId?: string;
  inReplyTo?: string;
  references: string[];
  attachments?: any;
  size?: number;
  labels: string[];
  emailAccountId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailListResponse {
  emails: EmailResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface EmailStats {
  total: number;
  unread: number;
  starred: number;
  inbox: number;
  sent: number;
  drafts: number;
  spam: number;
  deleted: number;
}

// Transform API email response to frontend email interface
export interface Email {
  id: string;
  from: {
    name: string;
    email: string;
  };
  to: {
    name: string;
    email: string;
  }[];
  subject: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  folder: 'inbox' | 'sent' | 'spam' | 'deleted';
  priority: 'low' | 'normal' | 'high';
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const emailService = {
  async getEmails(params: EmailListParams = {}): Promise<EmailListResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/emails?${searchParams}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }

    const result = await response.json();
    return result.data;
  },

  async getEmailById(id: string): Promise<EmailResponse> {
    const response = await fetch(`${API_BASE_URL}/emails/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email');
    }

    const result = await response.json();
    return result.data;
  },

  async getEmailStats(): Promise<EmailStats> {
    const response = await fetch(`${API_BASE_URL}/emails/stats`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email stats');
    }

    const result = await response.json();
    return result.data;
  },

  async markAsRead(id: string): Promise<EmailResponse> {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark email as read');
    }

    const result = await response.json();
    return result.data;
  },

  async markAsUnread(id: string): Promise<EmailResponse> {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/unread`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to mark email as unread');
    }

    const result = await response.json();
    return result.data;
  },

  async toggleStar(id: string): Promise<EmailResponse> {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/star`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle star');
    }

    const result = await response.json();
    return result.data;
  },

  async deleteEmail(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/emails/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete email');
    }
  },

  // Transform API response to frontend Email interface
  transformToFrontendEmail(apiEmail: EmailResponse): Email {
    const getFolder = (folderName?: string): 'inbox' | 'sent' | 'spam' | 'deleted' => {
      if (apiEmail.isDeleted) return 'deleted';
      if (!folderName) return 'inbox';
      
      const folder = folderName.toLowerCase();
      if (['inbox'].includes(folder)) return 'inbox';
      if (['sent', 'sent mail'].includes(folder)) return 'sent';
      if (['spam', 'junk'].includes(folder)) return 'spam';
      return 'inbox';
    };

    const getPriority = (isImportant?: boolean): 'low' | 'normal' | 'high' => {
      return isImportant ? 'high' : 'normal';
    };

    return {
      id: apiEmail.id,
      from: {
        name: apiEmail.fromName || apiEmail.fromAddress,
        email: apiEmail.fromAddress,
      },
      to: apiEmail.toAddresses.map(addr => ({
        name: addr,
        email: addr,
      })),
      subject: apiEmail.subject || '(no subject)',
      body: apiEmail.bodyHtml || apiEmail.body || '',
      date: new Date(apiEmail.receivedAt || apiEmail.sentAt || apiEmail.createdAt),
      isRead: apiEmail.isRead,
      isStarred: apiEmail.isStarred,
      hasAttachments: Boolean(apiEmail.attachments && Array.isArray(apiEmail.attachments) && apiEmail.attachments.length > 0),
      folder: getFolder(apiEmail.folderName),
      priority: getPriority(apiEmail.isImportant),
    };
  },

  // Get emails in the legacy format for backward compatibility
  async getEmailsByFolder(folder: string): Promise<Email[]> {
    const params: EmailListParams = { folder, limit: 100 };
    const response = await this.getEmails(params);
    return response.emails.map(this.transformToFrontendEmail);
  },

  // Get single email by ID in legacy format
  async getEmailById_Legacy(id: string): Promise<Email | undefined> {
    try {
      const apiEmail = await this.getEmailById(id);
      return this.transformToFrontendEmail(apiEmail);
    } catch (error) {
      return undefined;
    }
  },
};