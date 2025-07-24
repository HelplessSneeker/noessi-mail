'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth.service';
import { emailAccountService } from '@/services/email-account.service';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import { ArrowLeft, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';

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
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const queryClient = useQueryClient();

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
      if (!formData.password.trim()) {
        errors.password = t('passwordRequired');
      }
    }
    
    // Check if email already exists
    if (emailAccounts.some(account => account.email.toLowerCase() === formData.email.toLowerCase())) {
      errors.email = t('emailAlreadyExists');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    alert(`OAuth2 connection for ${provider} is not yet implemented. This would normally redirect to ${provider}'s authorization page.`);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm(t('confirmDelete'))) {
      deleteAccountMutation.mutate(accountId);
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
              {/* Add Account Form */}
              {isAddingAccount && (
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
                          placeholder={t('passwordPlaceholder')}
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
                        disabled={addAccountMutation.isPending}
                      >
                        {addAccountMutation.isPending ? tCommon('loading') : t('testAndSave')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingAccount(false);
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
              {emailAccounts.length === 0 && !isAddingAccount ? (
                <div className="px-4 sm:px-6 py-8 text-center">
                  <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 hover:bg-blue-200 transition-colors">
                    <SettingsIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{t('noEmailAccounts')}</h3>
                  <p className="text-sm text-gray-500">{t('addFirstAccount')}</p>
                </div>
              ) : (
                emailAccounts.map((account) => (
                  <div key={account.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
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
                          <p className="text-xs sm:text-sm text-gray-500 capitalize">{account.provider}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t('connected')}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id)}
                          disabled={deleteAccountMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
          </div>
            </div>

            {/* Additional Settings Sections can be added here */}
          </div>
        </div>
      </div>
    </div>
  );
}