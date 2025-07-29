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
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-spinner';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';
import { Email, emailService } from '@/services/email.service';

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const { data: emailStats, isLoading: isStatsLoading, error: statsError } = useQuery({
    queryKey: ['emailStats'],
    queryFn: emailService.getEmailStats,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: isMounted && authService.isAuthenticated(),
    refetchOnWindowFocus: false,
  });

  // Handle smooth transition from skeleton when data is loaded
  useEffect(() => {
    if (user && !isLoading) {
      setTimeout(() => {
        setShowSkeleton(false);
      }, 300);
    }
  }, [user, isLoading]);

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

  if (!isMounted || isLoading || showSkeleton) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate loading for demo purposes
    setTimeout(() => {
      setIsRefreshing(false);
      // In real app, this would refetch data
      console.log('Refreshed data');
    }, 2000);
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleUserSettings = () => {
    console.log('User settings clicked');
  };

  const handleFolderSelect = (folderId: string) => {
    if (folderId === selectedFolder) return;
    
    setIsTransitioning(true);
    
    // Fade out current content
    setTimeout(() => {
      setSelectedFolder(folderId);
      setSelectedEmail(null); // Clear selected email when changing folders
      setSearchQuery(''); // Clear search when changing folders
      setShowStats(true);
      console.log('Selected folder:', folderId);
      setIsTransitioning(false);
    }, 200);
  };

  const handleEmailSelect = (email: Email) => {
    if (selectedEmail?.id === email.id) return;
    
    setIsTransitioning(true);
    
    // Smooth transition to email view
    setTimeout(() => {
      setSelectedEmail(email);
      setShowStats(false);
      setIsTransitioning(false);
    }, 200);
  };

  const handleCloseEmail = () => {
    setIsTransitioning(true);
    
    // Smooth transition back to stats
    setTimeout(() => {
      setSelectedEmail(null);
      setShowStats(true);
      setIsTransitioning(false);
    }, 200);
  };

  // Use email stats from API
  const emailCounts = emailStats || {
    inbox: 0,
    sent: 0,
    spam: 0,
    deleted: 0,
    unread: 0,
    total: 0,
    starred: 0,
    drafts: 0,
  };

  return (
    <div className="flex h-screen flex-col">
      <LoadingOverlay 
        isVisible={logoutMutation.isPending} 
        text="Signing out..." 
        variant="dots"
      />
      
      {/* Connection Error Banner */}
      {statsError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center max-w-7xl mx-auto">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                Unable to connect to email server. Please check your email account settings.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-shrink-0">
        <Navbar
          onLogout={() => logoutMutation.mutate()}
          onSettings={handleSettings}
          onRefresh={handleRefresh}
          onUserSettings={handleUserSettings}
          isLoading={logoutMutation.isPending}
          isRefreshing={isRefreshing}
        />
      </div>
      
      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar 
            selectedFolder={selectedFolder}
            onFolderSelect={handleFolderSelect}
          />
        </div>
        
        <div className="flex-1 flex min-h-0">
          {/* Email List */}
          <div className="w-80 flex-shrink-0 hidden md:block border-r border-gray-200 bg-white">
            <EmailList 
              selectedFolder={selectedFolder}
              selectedEmail={selectedEmail}
              onEmailSelect={handleEmailSelect}
              isLoading={isRefreshing}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          
          {/* Mobile Email List - Shows when no email selected */}
          {!selectedEmail && (
            <div className="flex-1 md:hidden">
              <EmailList 
                selectedFolder={selectedFolder}
                selectedEmail={selectedEmail}
                onEmailSelect={handleEmailSelect}
                isLoading={isRefreshing}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
          )}
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`transition-all duration-300 ease-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {showStats && !selectedEmail ? (
                /* Stats Dashboard */
                <div className="flex-1 bg-gray-50 p-3 sm:p-6 overflow-y-auto scrollbar-thin">
                  <div className="h-full max-w-4xl mx-auto">
                    <div className="mb-6 sm:mb-8">
                      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">{t('title')}</h1>
                      <p className="text-sm text-gray-600 capitalize">{t('selectedFolder', { folder: selectedFolder })}</p>
                    </div>
                  
                  <div className="grid gap-4 sm:gap-6">
                    {/* Welcome Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-medium text-gray-900">Welcome back, {user.name || 'User'}!</h2>
                          <p className="text-xs sm:text-sm text-gray-600">Ready to manage your emails</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-md flex items-center justify-center hover:bg-blue-200 transition-colors">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h8a2 2 0 012 2v4M6 13h12" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-3 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">Inbox</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{emailCounts.inbox}</p>
                              {emailCounts.unread > 0 && (
                                <span className="text-xs sm:text-sm text-blue-600 font-medium">{emailCounts.unread} unread</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-md flex items-center justify-center hover:bg-green-200 transition-colors">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-3 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">Sent</p>
                            <p className="text-xl sm:text-2xl font-semibold text-gray-900">{emailCounts.sent}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 card-hover">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-md flex items-center justify-center hover:bg-purple-200 transition-colors">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-3 sm:ml-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">Total Emails</p>
                            <p className="text-xl sm:text-2xl font-semibold text-gray-900">{emailCounts.inbox + emailCounts.sent}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* User Information Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden card-hover">
                      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">{t('userInformation')}</h3>
                      </div>
                      <div className="px-4 sm:px-6 py-4">
                        <dl className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">{t('userEmail')}</dt>
                            <dd className="mt-1 text-sm text-gray-900 break-all">{user.email}</dd>
                          </div>
                          <div>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">{t('userName')}</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.name || t('nameNotSet')}</dd>
                          </div>
                          <div>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">{t('emailVerified')}</dt>
                            <dd className="mt-1">
                              <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                user.isEmailVerified 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}>
                                {user.isEmailVerified ? t('yes') : t('no')}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs sm:text-sm font-medium text-gray-500">{t('memberSince')}</dt>
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
    </div>
  );
}
