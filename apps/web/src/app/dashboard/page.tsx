'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth.service';
import { Navbar } from '@/components/ui/navbar';
import { Sidebar } from '@/components/ui/sidebar';
import { EmailList } from '@/components/ui/email-list';
import { EmailViewer } from '@/components/ui/email-viewer';
import { Email, getEmailsByFolder } from '@/lib/mock-emails';

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showStats, setShowStats] = useState(true);
  
  useEffect(() => {
    setIsMounted(true);
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getMe,
    retry: false,
    enabled: isMounted && authService.isAuthenticated(),
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      router.push('/login');
    },
  });

  useEffect(() => {
    if (error) {
      router.push('/login');
    }
  }, [error, router]);

  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{tCommon('loading')}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSettings = () => {
    console.log('Settings clicked');
  };

  const handleUserSettings = () => {
    console.log('User settings clicked');
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolder(folderId);
    setSelectedEmail(null); // Clear selected email when changing folders
    console.log('Selected folder:', folderId);
  };

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    setShowStats(false); // Hide stats when viewing email
  };

  const handleCloseEmail = () => {
    setSelectedEmail(null);
    setShowStats(true); // Show stats when not viewing email
  };

  // Get folder email counts for stats
  const getEmailCounts = () => {
    const inboxEmails = getEmailsByFolder('inbox');
    const sentEmails = getEmailsByFolder('sent');
    const spamEmails = getEmailsByFolder('spam');
    const deletedEmails = getEmailsByFolder('deleted');
    
    return {
      inbox: inboxEmails.length,
      sent: sentEmails.length,
      spam: spamEmails.length,
      deleted: deletedEmails.length,
      unread: inboxEmails.filter(email => !email.isRead).length
    };
  };

  const emailCounts = getEmailCounts();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        onLogout={() => logoutMutation.mutate()}
        onSettings={handleSettings}
        onRefresh={handleRefresh}
        onUserSettings={handleUserSettings}
        isLoading={logoutMutation.isPending}
      />
      
      <div className="flex flex-1">
        <Sidebar 
          selectedFolder={selectedFolder}
          onFolderSelect={handleFolderSelect}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className="w-80 flex-shrink-0">
            <EmailList 
              selectedFolder={selectedFolder}
              selectedEmail={selectedEmail}
              onEmailSelect={handleEmailSelect}
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {showStats && !selectedEmail ? (
              /* Stats Dashboard */
              <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
                <div className="h-full max-w-4xl mx-auto">
                  <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('title')}</h1>
                    <p className="text-sm text-gray-600 capitalize">{t('selectedFolder', { folder: selectedFolder })}</p>
                  </div>
                  
                  <div className="grid gap-6">
                    {/* Welcome Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-lg font-medium text-gray-900">Welcome back, {user.name || 'User'}!</h2>
                          <p className="text-sm text-gray-600">Ready to manage your emails</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h8a2 2 0 012 2v4M6 13h12" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Inbox</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-semibold text-gray-900">{emailCounts.inbox}</p>
                              {emailCounts.unread > 0 && (
                                <span className="text-sm text-blue-600 font-medium">{emailCounts.unread} unread</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Sent</p>
                            <p className="text-2xl font-semibold text-gray-900">{emailCounts.sent}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Emails</p>
                            <p className="text-2xl font-semibold text-gray-900">{emailCounts.inbox + emailCounts.sent}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* User Information Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">{t('userInformation')}</h3>
                      </div>
                      <div className="px-6 py-4">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">{t('userEmail')}</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">{t('userName')}</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.name || t('nameNotSet')}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">{t('emailVerified')}</dt>
                            <dd className="mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.isEmailVerified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.isEmailVerified ? t('yes') : t('no')}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">{t('memberSince')}</dt>
                            <dd className="mt-1 text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Email Viewer */
              <EmailViewer 
                email={selectedEmail}
                onClose={handleCloseEmail}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
