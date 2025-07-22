'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getMe,
    retry: false,
    enabled: authService.isAuthenticated(),
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
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
        
        <div className="flex justify-center">
          <Button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
