'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { Navbar } from '@/components/ui/navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
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
        <p>Loading...</p>
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        onLogout={() => logoutMutation.mutate()}
        onSettings={handleSettings}
        onRefresh={handleRefresh}
        onUserSettings={handleUserSettings}
        isLoading={logoutMutation.isPending}
      />
      
      <div className="flex flex-1 flex-col items-center justify-center p-24">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-gray-600">This is a protected route</p>
          </div>
          
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">User Information</h2>
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.name || 'Not set'}</p>
              <p><strong>Email Verified:</strong> {user.isEmailVerified ? 'Yes' : 'No'}</p>
              <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
