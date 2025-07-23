'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth.service';
import { emailAccountService, EmailAccount } from '@/services/email-account.service';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    provider: 'gmail'
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const queryClient = useQueryClient();

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
      setFormData({ email: '', provider: 'gmail' });
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
      addAccountMutation.mutate(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm(t('confirmDelete'))) {
      deleteAccountMutation.mutate(accountId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tCommon('back')}
              </Button>
              <div className="flex items-center">
                <SettingsIcon className="h-6 w-6 text-gray-500 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">{t('title')}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Email Accounts Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{t('emailAccounts')}</h2>
                <p className="text-sm text-gray-600">{t('emailAccountsDescription')}</p>
              </div>
              <Button
                onClick={() => setIsAddingAccount(true)}
                disabled={isAddingAccount}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addAccount')}
              </Button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Add Account Form */}
            {isAddingAccount && (
              <div className="px-6 py-4 bg-gray-50">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div>
                      <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('provider')}
                      </label>
                      <select
                        id="provider"
                        name="provider"
                        value={formData.provider}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.provider ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <option value="gmail">Gmail</option>
                        <option value="outlook">Outlook</option>
                        <option value="imap">IMAP</option>
                      </select>
                      {formErrors.provider && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.provider}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={addAccountMutation.isPending}
                    >
                      {addAccountMutation.isPending ? tCommon('loading') : tCommon('save')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingAccount(false);
                        setFormData({ email: '', provider: 'gmail' });
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
              <div className="px-6 py-8 text-center">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <SettingsIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">{t('noEmailAccounts')}</h3>
                <p className="text-sm text-gray-500">{t('addFirstAccount')}</p>
              </div>
            ) : (
              emailAccounts.map((account) => (
                <div key={account.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {account.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{account.email}</h3>
                        <p className="text-sm text-gray-500 capitalize">{account.provider}</p>
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
  );
}