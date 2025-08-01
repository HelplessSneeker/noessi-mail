'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth.service';
import { emailAccountService } from '@/services/email-account.service';
import { emailService } from '@/services/email.service';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import SyncProgress from '@/components/ui/sync-progress';
import { ArrowLeft, Plus, Trash2, Settings as SettingsIcon, RefreshCw, Zap, TestTube2, AlertCircle, CheckCircle, Edit3 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    provider: 'gmail',
    // IMAP specific fields
    imapHost: '',
    imapPort: 993,
    imapSecurity: 'tls',
    smtpHost: '',
    smtpPort: 587,
    smtpSecurity: 'starttls',
    password: ''
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [accountStats, setAccountStats] = useState<{[key: string]: any}>({});
  const [testingConnection, setTestingConnection] = useState<{[key: string]: boolean}>({});
  const [syncingAccounts, setSyncingAccounts] = useState<{[key: string]: boolean}>({});
  const [showSyncProgress, setShowSyncProgress] = useState<{[key: string]: boolean}>({});
  const [currentSyncAccount, setCurrentSyncAccount] = useState<string | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean }>({ message: '', type: 'info', show: false });
  const [confirmModal, setConfirmModal] = useState<{ 
    show: boolean; 
    title: string; 
    message: string; 
    type: 'warning' | 'danger'; 
    onConfirm: () => void; 
    confirmText?: string;
    cancelText?: string;
  }>({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'warning', 
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });
  const queryClient = useQueryClient();

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Confirmation modal function
  const showConfirmModal = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: 'warning' | 'danger' = 'warning',
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    setConfirmModal({
      show: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  // Provider configurations - determines the authentication flow and required fields
  // Gmail/Outlook: OAuth2 flow (redirects to provider for authorization)
  // IMAP: Manual configuration with server settings and password
  const providerConfigs = {
    gmail: {
      name: 'Gmail',
      authType: 'oauth2',
      description: 'Connect using your Google account',
      autoFillDomain: '@gmail.com'
    },
    outlook: {
      name: 'Outlook',
      authType: 'oauth2', 
      description: 'Connect using your Microsoft account',
      autoFillDomain: '@outlook.com'
    },
    imap: {
      name: 'IMAP/SMTP',
      authType: 'password',
      description: 'Connect using IMAP/SMTP server settings',
      commonConfigs: {
        gmail: {
          imapHost: 'imap.gmail.com',
          imapPort: 993,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587
        },
        outlook: {
          imapHost: 'outlook.office365.com',
          imapPort: 993,
          smtpHost: 'smtp-mail.outlook.com',
          smtpPort: 587
        },
        yahoo: {
          imapHost: 'imap.mail.yahoo.com',
          imapPort: 993,
          smtpHost: 'smtp.mail.yahoo.com',
          smtpPort: 587
        }
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  const { data: emailAccounts = [], isLoading } = useQuery({
    queryKey: ['emailAccounts'],
    queryFn: emailAccountService.getEmailAccounts,
    enabled: isMounted && authService.isAuthenticated(),
  });

  const addAccountMutation = useMutation({
    mutationFn: emailAccountService.createEmailAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailAccounts'] });
      setIsAddingAccount(false);
      setPasswordFocused(false);
      setFormData({ 
        email: '', 
        provider: 'gmail',
        imapHost: '',
        imapPort: 993,
        imapSecurity: 'tls',
        smtpHost: '',
        smtpPort: 587,
        smtpSecurity: 'starttls',
        password: ''
      });
      setFormErrors({});
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: emailAccountService.deleteEmailAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailAccounts'] });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ accountId, updateData }: { accountId: string; updateData: any }) => 
      emailService.updateEmailAccount(accountId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailAccounts'] });
      setEditingAccount(null);
      setPasswordFocused(false);
      setFormData({ 
        email: '', 
        provider: 'gmail',
        imapHost: '',
        imapPort: 993,
        imapSecurity: 'tls',
        smtpHost: '',
        smtpPort: 587,
        smtpSecurity: 'starttls',
        password: ''
      });
      setFormErrors({});
    },
  });

  const loadAccountStats = async (accountId: string) => {
    try {
      const stats = await emailService.getEmailAccountStats(accountId);
      setAccountStats(prev => ({ ...prev, [accountId]: stats }));
    } catch (error) {
      console.error('Failed to load account stats:', error);
    }
  };

  // Load stats for all accounts
  useEffect(() => {
    if (emailAccounts && emailAccounts.length > 0) {
      emailAccounts.forEach(account => {
        loadAccountStats(account.id);
      });
    }
  }, [emailAccounts]);

  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{tCommon('loading')}</p>
      </div>
    );
  }

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.email.trim()) {
      errors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('invalidEmail');
    }
    
    if (!formData.provider.trim()) {
      errors.provider = t('providerRequired');
    }
    
    // Provider-specific validation
    if (formData.provider === 'imap') {
      if (!formData.imapHost.trim()) {
        errors.imapHost = t('imapHostRequired');
      }
      if (!formData.imapPort || formData.imapPort < 1 || formData.imapPort > 65535) {
        errors.imapPort = t('imapPortInvalid');
      }
      if (!formData.smtpHost.trim()) {
        errors.smtpHost = t('smtpHostRequired');
      }
      if (!formData.smtpPort || formData.smtpPort < 1 || formData.smtpPort > 65535) {
        errors.smtpPort = t('smtpPortInvalid');
      }
      if (!formData.password.trim() && !editingAccount) {
        errors.password = t('passwordRequired');
      }
    }
    
    // Check if email already exists (exclude current account when editing)
    if (emailAccounts.some(account => 
      account.email.toLowerCase() === formData.email.toLowerCase() && 
      account.id !== editingAccount
    )) {
      errors.email = t('emailAlreadyExists');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      handleUpdateAccount(e);
      return;
    }

    if (validateForm()) {
      // Clean form data by removing empty strings for optional fields
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Always include required fields (email, provider)
        if (key === 'email' || key === 'provider') {
          acc[key] = value;
        }
        // For optional fields, only include if they have non-empty values
        else if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      addAccountMutation.mutate(cleanedData);
    }
  };

  const handleProviderChange = (provider: string) => {
    setFormData(prev => ({
      ...prev,
      provider,
      // Reset form when provider changes
      email: prev.email.includes('@') ? prev.email : '',
      imapHost: '',
      imapPort: 993,
      imapSecurity: 'tls',
      smtpHost: '',
      smtpPort: 587,
      smtpSecurity: 'starttls',
      password: ''
    }));
    setFormErrors({});
  };

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    
    // Auto-detect provider from email domain for IMAP configuration
    if (formData.provider === 'imap' && email.includes('@')) {
      const domain = email.split('@')[1]?.toLowerCase();
      const configs = providerConfigs.imap.commonConfigs;
      
      if (domain?.includes('gmail.com') && configs.gmail) {
        setFormData(prev => ({
          ...prev,
          email,
          ...configs.gmail
        }));
      } else if (domain?.includes('outlook.com') || domain?.includes('hotmail.com') || domain?.includes('live.com')) {
        setFormData(prev => ({
          ...prev,
          email,
          ...configs.outlook
        }));
      } else if (domain?.includes('yahoo.com') && configs.yahoo) {
        setFormData(prev => ({
          ...prev,
          email,
          ...configs.yahoo
        }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'provider') {
      handleProviderChange(value);
      return;
    }
    
    if (name === 'email') {
      handleEmailChange(value);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Port') ? parseInt(value) || 0 : value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOAuth2Connect = (provider: 'gmail' | 'outlook') => {
    // TODO: Implement OAuth2 flow
    // This would redirect to provider's OAuth2 authorization URL
    console.log(`Starting OAuth2 flow for ${provider}`);
    showToast(`OAuth2 connection for ${provider} is not yet implemented. This would normally redirect to ${provider}'s authorization page.`, 'info');
  };

  const handleDeleteAccount = (accountId: string) => {
    const account = emailAccounts.find(acc => acc.id === accountId);
    showConfirmModal(
      'Delete Email Account',
      `Are you sure you want to delete the email account "${account?.email}"? This action cannot be undone and will remove all associated emails.`,
      () => {
        deleteAccountMutation.mutate(accountId);
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      'danger',
      'Delete Account',
      'Cancel'
    );
  };

  const handleTestConnection = async (accountId: string) => {
    setTestingConnection(prev => ({ ...prev, [accountId]: true }));
    try {
      const result = await emailService.testEmailAccountConnection(accountId);
      if (result.success) {
        showToast('Connection successful!', 'success');
      } else {
        showToast(`Connection failed: ${result.message}`, 'error');
      }
    } catch (error: any) {
      showToast(`Connection test failed: ${error.message}`, 'error');
    } finally {
      setTestingConnection(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const handleFullResync = (accountId: string) => {
    const account = emailAccounts.find(acc => acc.id === accountId);
    showConfirmModal(
      'Full Re-sync',
      `This will sync ALL emails from ALL folders (including spam) for "${account?.email}". This may sync 1000+ emails. Continue?`,
      async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setSyncingAccounts(prev => ({ ...prev, [accountId]: true }));
        setCurrentSyncAccount(accountId);
        setShowSyncProgress(prev => ({ ...prev, [accountId]: true }));
        
        try {
          // Use the new WebSocket-based sync endpoint
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sync/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              emailAccountId: accountId,
              clearExisting: false, // Don't clear for full resync
              includeSpam: true,
              batchSize: 50,
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            showToast(`Full re-sync started with session ${result.data.sessionId}! Real-time progress available.`, 'success');
            queryClient.invalidateQueries({ queryKey: ['emails'] });
          } else {
            throw new Error(`Failed to start sync: ${response.statusText}`);
          }
        } catch (error: any) {
          showToast(`Full re-sync failed: ${error.message}`, 'error');
          setShowSyncProgress(prev => ({ ...prev, [accountId]: false }));
        } finally {
          setSyncingAccounts(prev => ({ ...prev, [accountId]: false }));
        }
      },
      'warning',
      'Start Full Re-sync',
      'Cancel'
    );
  };

  const handleClearAndResync = (accountId: string) => {
    const account = emailAccounts.find(acc => acc.id === accountId);
    showConfirmModal(
      'Clear and Re-sync',
      `⚠️ This will DELETE ALL existing emails for "${account?.email}" and sync ALL emails fresh from server. This action cannot be undone. Continue?`,
      async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setSyncingAccounts(prev => ({ ...prev, [accountId]: true }));
        setCurrentSyncAccount(accountId);
        setShowSyncProgress(prev => ({ ...prev, [accountId]: true }));
        
        try {
          // Use the new WebSocket-based sync endpoint with clear existing
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sync/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              emailAccountId: accountId,
              clearExisting: true, // Clear for fresh sync
              includeSpam: true,
              batchSize: 50,
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            showToast(`Clear and re-sync started with session ${result.data.sessionId}! Existing emails cleared, syncing fresh.`, 'success');
            queryClient.invalidateQueries({ queryKey: ['emails'] });
          } else {
            throw new Error(`Failed to start sync: ${response.statusText}`);
          }
        } catch (error: any) {
          showToast(`Clear and re-sync failed: ${error.message}`, 'error');
          setShowSyncProgress(prev => ({ ...prev, [accountId]: false }));
        } finally {
          setSyncingAccounts(prev => ({ ...prev, [accountId]: false }));
        }
      },
      'danger',
      'Delete & Re-sync',
      'Cancel'
    );
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount(account.id);
    setPasswordFocused(false);
    setFormData({
      email: account.email,
      provider: account.provider,
      imapHost: account.imapHost || '',
      imapPort: account.imapPort || 993,
      imapSecurity: account.imapSecurity || 'tls',
      smtpHost: account.smtpHost || '',
      smtpPort: account.smtpPort || 587,
      smtpSecurity: account.smtpSecurity || 'starttls',
      password: '' // Don't show existing password
    });
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && editingAccount) {
      // Clean form data by removing empty strings for optional fields
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Always include required fields (email, provider)
        if (key === 'email' || key === 'provider') {
          acc[key] = value;
        }
        // For optional fields, only include if they have non-empty values
        else if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      updateAccountMutation.mutate({ accountId: editingAccount, updateData: cleanedData });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <Navbar
        onLogout={() => {
          authService.logout();
          router.push('/login');
        }}
        onSettings={() => router.push('/settings')}
        onRefresh={() => window.location.reload()}
        onUserSettings={() => console.log('User settings')}
      />

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-3 sm:p-6 overflow-y-auto">
        <div className="h-full max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-4 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tCommon('back')}
              </Button>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{t('title')}</h1>
                <p className="text-sm text-gray-600">Manage your application preferences</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6">
            {/* Email Accounts Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden card-hover">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-medium text-gray-900">{t('emailAccounts')}</h2>
                    <p className="text-xs sm:text-sm text-gray-600">{t('emailAccountsDescription')}</p>
                  </div>
                  <Button
                    onClick={() => setIsAddingAccount(true)}
                    disabled={isAddingAccount}
                    className="flex items-center transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addAccount')}
                  </Button>
                </div>
              </div>

          <div className="divide-y divide-gray-200">
              {/* Add/Edit Account Form */}
              {(isAddingAccount || editingAccount) && (
                <div className="px-4 sm:px-6 py-4 bg-gray-50">
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('selectProvider')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(providerConfigs).map(([key, config]) => (
                        <div key={key} className="relative">
                          <input
                            type="radio"
                            id={`provider-${key}`}
                            name="provider"
                            value={key}
                            checked={formData.provider === key}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`provider-${key}`}
                            className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                              formData.provider === key
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                          >
                            <div className="text-sm font-medium">{config.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('emailAddress')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t('emailPlaceholder')}
                      required
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  {/* OAuth2 Providers (Gmail/Outlook) */}
                  {(formData.provider === 'gmail' || formData.provider === 'outlook') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-blue-800">
                            {t('oauthConnection')}
                          </h3>
                          <p className="text-sm text-blue-700 mt-1">
                            {t('oauthDescription', { provider: providerConfigs[formData.provider as keyof typeof providerConfigs].name })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IMAP Configuration */}
                  {formData.provider === 'imap' && (
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('imapSettings')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="imapHost" className="block text-sm font-medium text-gray-700 mb-1">
                              {t('imapHost')}
                            </label>
                            <input
                              type="text"
                              id="imapHost"
                              name="imapHost"
                              value={formData.imapHost}
                              onChange={handleInputChange}
                              placeholder="imap.example.com"
                              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                formErrors.imapHost ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {formErrors.imapHost && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.imapHost}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="imapPort" className="block text-sm font-medium text-gray-700 mb-1">
                              {t('imapPort')}
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                id="imapPort"
                                name="imapPort"
                                value={formData.imapPort}
                                onChange={handleInputChange}
                                placeholder="993"
                                className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  formErrors.imapPort ? 'border-red-300' : 'border-gray-300'
                                }`}
                              />
                              <select
                                name="imapSecurity"
                                value={formData.imapSecurity}
                                onChange={handleInputChange}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="tls">TLS</option>
                                <option value="starttls">STARTTLS</option>
                                <option value="none">None</option>
                              </select>
                            </div>
                            {formErrors.imapPort && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.imapPort}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('smtpSettings')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 mb-1">
                              {t('smtpHost')}
                            </label>
                            <input
                              type="text"
                              id="smtpHost"
                              name="smtpHost"
                              value={formData.smtpHost}
                              onChange={handleInputChange}
                              placeholder="smtp.example.com"
                              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                formErrors.smtpHost ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {formErrors.smtpHost && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.smtpHost}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 mb-1">
                              {t('smtpPort')}
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="number"
                                id="smtpPort"
                                name="smtpPort"
                                value={formData.smtpPort}
                                onChange={handleInputChange}
                                placeholder="587"
                                className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  formErrors.smtpPort ? 'border-red-300' : 'border-gray-300'
                                }`}
                              />
                              <select
                                name="smtpSecurity"
                                value={formData.smtpSecurity}
                                onChange={handleInputChange}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="starttls">STARTTLS</option>
                                <option value="tls">TLS</option>
                                <option value="none">None</option>
                              </select>
                            </div>
                            {formErrors.smtpPort && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.smtpPort}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('password')}
                        </label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          placeholder={
                            editingAccount && !passwordFocused && formData.password === '' 
                              ? '••••••••••••••••' 
                              : t('passwordPlaceholder')
                          }
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.password ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t">
                    {(formData.provider === 'gmail' || formData.provider === 'outlook') ? (
                      <Button
                        type="button"
                        onClick={() => handleOAuth2Connect(formData.provider as 'gmail' | 'outlook')}
                        disabled={!formData.email || addAccountMutation.isPending}
                        className="flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                        </svg>
                        {t('connectWith', { provider: providerConfigs[formData.provider as keyof typeof providerConfigs].name })}
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={addAccountMutation.isPending || updateAccountMutation.isPending}
                      >
                        {(addAccountMutation.isPending || updateAccountMutation.isPending) 
                          ? tCommon('loading') 
                          : editingAccount 
                            ? 'Update & Test Connection' 
                            : t('testAndSave')
                        }
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingAccount(false);
                        setEditingAccount(null);
                        setPasswordFocused(false);
                        setFormData({ 
                          email: '', 
                          provider: 'gmail',
                          imapHost: '',
                          imapPort: 993,
                          imapSecurity: 'tls',
                          smtpHost: '',
                          smtpPort: 587,
                          smtpSecurity: 'starttls',
                          password: ''
                        });
                        setFormErrors({});
                      }}
                    >
                      {tCommon('cancel')}
                    </Button>
                  </div>
                </form>
              </div>
            )}

              {/* Email Accounts List */}
              {emailAccounts.length === 0 && !isAddingAccount && !editingAccount ? (
                <div className="px-4 sm:px-6 py-8 text-center">
                  <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 hover:bg-blue-200 transition-colors">
                    <SettingsIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{t('noEmailAccounts')}</h3>
                  <p className="text-sm text-gray-500">{t('addFirstAccount')}</p>
                </div>
              ) : (
                emailAccounts.map((account) => {
                  const stats = accountStats[account.id];
                  const isTestingConn = testingConnection[account.id];
                  const isSyncing = syncingAccounts[account.id];
                  
                  return (
                    <div key={account.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="space-y-3">
                        {/* Account Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                                <span className="text-sm font-medium text-blue-600">
                                  {account.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{account.email}</h3>
                              <p className="text-xs sm:text-sm text-gray-500 capitalize">
                                {account.provider}
                                {account.imapHost && ` • ${account.imapHost}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Connected
                            </span>
                          </div>
                        </div>

                        {/* Email Stats */}
                        {stats && (
                          <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                            <div>
                              <div className="text-lg font-semibold text-blue-600">{stats.totalEmails}</div>
                              <div className="text-xs text-gray-500">Total Emails</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-orange-600">{stats.unreadEmails}</div>
                              <div className="text-xs text-gray-500">Unread</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-yellow-600">{stats.starredEmails}</div>
                              <div className="text-xs text-gray-500">Starred</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-purple-600">
                                {Object.keys(stats.folderStats || {}).length}
                              </div>
                              <div className="text-xs text-gray-500">Folders</div>
                            </div>
                          </div>
                        )}

                        {/* Folder Stats */}
                        {stats?.folderStats && Object.keys(stats.folderStats).length > 0 && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Folders: </span>
                            {Object.entries(stats.folderStats).map(([folder, folderData]: [string, any]) => (
                              <span key={folder} className="inline-block mr-3 mb-1">
                                <span className="font-medium">{folder}</span>
                                <span className="text-gray-500"> ({folderData.total} emails)</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Test Connection */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(account.id)}
                            disabled={isTestingConn || isSyncing}
                            className="flex items-center text-xs"
                          >
                            {isTestingConn ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <TestTube2 className="h-3 w-3 mr-1" />
                                Test Connection
                              </>
                            )}
                          </Button>

                          {/* Full Re-sync */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFullResync(account.id)}
                            disabled={isSyncing || isTestingConn}
                            className="flex items-center text-xs text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                          >
                            {isSyncing ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Full Re-sync
                              </>
                            )}
                          </Button>

                          {/* Clear and Re-sync */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClearAndResync(account.id)}
                            disabled={isSyncing || isTestingConn}
                            className="flex items-center text-xs text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Clear & Re-sync
                          </Button>

                          {/* Edit Account */}
                          {account.provider === 'imap' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAccount(account)}
                              disabled={editingAccount === account.id || isSyncing || isTestingConn}
                              className="flex items-center text-xs"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit Settings
                            </Button>
                          )}

                          {/* Delete Account */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
                            disabled={deleteAccountMutation.isPending || isSyncing || isTestingConn}
                            className="flex items-center text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors ml-auto"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
          </div>
            </div>

            {/* Additional Settings Sections can be added here */}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-sm transition-all duration-300 transform ${
          toast.show ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        } ${
          toast.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : toast.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              {toast.type === 'info' && (
                <AlertCircle className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
            ></div>

            {/* Center the modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                  confirmModal.type === 'danger' 
                    ? 'bg-red-100' 
                    : 'bg-yellow-100'
                }`}>
                  {confirmModal.type === 'danger' ? (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {confirmModal.title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {confirmModal.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    confirmModal.type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                  }`}
                  onClick={confirmModal.onConfirm}
                >
                  {confirmModal.confirmText}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                >
                  {confirmModal.cancelText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Progress Modal */}
      {currentSyncAccount && showSyncProgress[currentSyncAccount] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Email Sync Progress</h3>
              <button
                onClick={() => {
                  setShowSyncProgress(prev => ({ ...prev, [currentSyncAccount]: false }));
                  setCurrentSyncAccount(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <SyncProgress
              emailAccountId={currentSyncAccount}
              onComplete={() => {
                setShowSyncProgress(prev => ({ ...prev, [currentSyncAccount]: false }));
                setCurrentSyncAccount(null);
                queryClient.invalidateQueries({ queryKey: ['emails'] });
                showToast('Email sync completed successfully!', 'success');
              }}
              onError={(error) => {
                setShowSyncProgress(prev => ({ ...prev, [currentSyncAccount]: false }));
                setCurrentSyncAccount(null);
                showToast(`Sync failed: ${error.message || error}`, 'error');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}