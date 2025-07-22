'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth.service';
import { Navbar } from '@/components/ui/navbar';
import { Sidebar } from '@/components/ui/sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  
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
    console.log('Selected folder:', folderId);
  };

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
        
        <div className="flex-1 flex flex-col items-center justify-center p-24">
          <div className="w-full max-w-2xl space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold">{t('title')}</h1>
              <p className="mt-2 text-gray-600">{t('selectedFolder', { folder: selectedFolder })}</p>
            </div>
            
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">{t('userInformation')}</h2>
              <div className="space-y-2">
                <p><strong>{t('userId')}:</strong> {user.id}</p>
                <p><strong>{t('userEmail')}:</strong> {user.email}</p>
                <p><strong>{t('userName')}:</strong> {user.name || t('nameNotSet')}</p>
                <p><strong>{t('emailVerified')}:</strong> {user.isEmailVerified ? t('yes') : t('no')}</p>
                <p><strong>{t('memberSince')}:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
