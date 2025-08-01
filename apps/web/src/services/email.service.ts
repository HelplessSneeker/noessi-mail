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

export interface EnhancedSyncOptions {
  folders?: string[];
  includeSpam?: boolean;
  includeInbox?: boolean;
  limit?: number | null;
  strategy?: 'parallel' | 'sequential';
  continueOnError?: boolean;
  maxConcurrency?: number;
  fetchBody?: boolean;
  fetchAttachments?: boolean;
}

export interface MultiSyncResult {
  totalFolders: number;
  syncedFolders: string[];
  failedFolders: { folder: string; error: string }[];
  totalMessages: number;
  syncedMessages: number;
  errors: string[];
  duration: number;
  folderResults: {
    [folderName: string]: {
      syncedCount: number;
      totalMessages: number;
      errors: string[];
    };
  };
}

export interface FolderRecommendation {
  folder: string;
  type: string;
  confidence: number;
  shouldSync: boolean;
  reason: string;
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
  folderName?: string; // Original IMAP folder name
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
  // Backend stores original IMAP folder names, frontend maps them for display
  // SIMPLIFIED: Only separate sent/spam/deleted from inbox - everything else goes to inbox
  transformToFrontendEmail(apiEmail: EmailResponse): Email {
    const getFolder = (folderName?: string): 'inbox' | 'sent' | 'spam' | 'deleted' => {
      // First check if email is marked as deleted in database
      if (apiEmail.isDeleted) return 'deleted';
      
      // If no folder name, default to inbox
      if (!folderName) return 'inbox';
      
      const folder = folderName.toLowerCase();
      
      // SENT FOLDERS - Only emails you sent
      if (folder.includes('[gmail]/sent') || 
          folder.includes('[google mail]/sent') ||
          folder === 'sent items' ||
          folder === 'sent mail' ||
          folder === 'sent' ||
          folder === 'outbox') {
        return 'sent';
      }
      
      // SPAM/JUNK FOLDERS - Only confirmed spam folders
      if (folder.includes('[gmail]/spam') || 
          folder.includes('[google mail]/spam') ||
          folder === 'bulk mail' ||
          folder === 'junk e-mail' ||
          folder === 'junk' ||
          folder === 'spam') {
        return 'spam';
      }
      
      // TRASH/DELETED FOLDERS - Only trash folders
      if (folder.includes('[gmail]/trash') ||
          folder.includes('[google mail]/trash') ||
          folder === 'deleted items' ||
          folder === 'trash' ||
          folder === 'bin') {
        return 'deleted';
      }
      
      // EVERYTHING ELSE GOES TO INBOX
      // This includes: INBOX, Archive, Important, Personal folders, Work folders, etc.
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
      folderName: apiEmail.folderName, // Preserve original IMAP folder name
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

  // Enhanced multi-folder sync with spam detection
  async syncMultipleFolders(emailAccountId: string, options: EnhancedSyncOptions = {}): Promise<MultiSyncResult> {
    const response = await fetch(`${API_BASE_URL}/imap/sync-multi/${emailAccountId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to sync multiple folders');
    }

    const result = await response.json();
    return result.data;
  },

  // Get folder recommendations for syncing
  async getFolderRecommendations(emailAccountId: string): Promise<FolderRecommendation[]> {
    const response = await fetch(`${API_BASE_URL}/imap/recommendations/${emailAccountId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get folder recommendations');
    }

    const result = await response.json();
    return result.data;
  },

  // Detect spam folders for an email account
  async detectSpamFolders(emailAccountId: string): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/imap/spam-folders/${emailAccountId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to detect spam folders');
    }

    const result = await response.json();
    return result.data;
  },

  // Get IMAP folders for an email account
  async getImapFolders(emailAccountId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/imap/folders/${emailAccountId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get IMAP folders');
    }

    const result = await response.json();
    return result.data;
  },

  // Sync emails from IMAP (legacy single folder sync)
  async syncImapEmails(emailAccountId: string, options: { folder?: string; limit?: number } = {}): Promise<{ syncedCount: number; totalMessages: number }> {
    const response = await fetch(`${API_BASE_URL}/imap/sync/${emailAccountId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to sync IMAP emails');
    }

    const result = await response.json();
    return result.data;
  },

  // Email Account Management Functions

  // Test IMAP connection for existing account
  async testEmailAccountConnection(emailAccountId: string): Promise<{ success: boolean; message: string; accountId: string; email: string }> {
    const response = await fetch(`${API_BASE_URL}/email-accounts/${emailAccountId}/test-connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to test connection');
    }

    const result = await response.json();
    // Handle both wrapped and unwrapped responses
    return result.data || result;
  },

  // Get email statistics for an account
  async getEmailAccountStats(emailAccountId: string): Promise<{
    accountId: string;
    email: string;
    totalEmails: number;
    unreadEmails: number;
    starredEmails: number;
    folderStats: Record<string, { total: number; unread: number; starred: number }>;
    lastUpdated: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/email-accounts/${emailAccountId}/stats`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get email account stats');
    }

    const result = await response.json();
    return result.data;
  },

  // Trigger full re-sync (keeps existing emails)
  async triggerFullResync(emailAccountId: string, options: EnhancedSyncOptions = {}): Promise<{
    success: boolean;
    message: string;
    accountId: string;
    email: string;
    syncResult?: MultiSyncResult;
    error?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/email-accounts/${emailAccountId}/resync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to trigger full re-sync');
    }

    const result = await response.json();
    // Handle both wrapped and unwrapped responses
    return result.data || result;
  },

  // Clear all emails and trigger fresh sync
  async clearAndResync(emailAccountId: string, options: EnhancedSyncOptions = {}): Promise<{
    success: boolean;
    message: string;
    accountId: string;
    email: string;
    deletedEmails?: number;
    syncResult?: MultiSyncResult;
    error?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/email-accounts/${emailAccountId}/clear-and-resync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to clear and re-sync');
    }

    const result = await response.json();
    // Handle both wrapped and unwrapped responses
    return result.data || result;
  },

  // Get email accounts
  async getEmailAccounts(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/email-accounts`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get email accounts');
    }

    const result = await response.json();
    return result.data;
  },

  // Update email account
  async updateEmailAccount(accountId: string, updateData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/email-accounts/${accountId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error('Failed to update email account');
    }

    const result = await response.json();
    return result.data;
  },
};