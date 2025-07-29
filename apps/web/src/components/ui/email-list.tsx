'use client';

import * as React from "react";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";
import { Email, emailService } from "@/services/email.service";
import { useQuery } from '@tanstack/react-query';
import { EmailItem } from "./email-item";
import { LoadingSpinner } from "./loading-spinner";
import { Button } from "./button";

interface EmailListProps {
  selectedFolder: string;
  selectedEmail?: Email | null;
  onEmailSelect: (email: Email) => void;
  className?: string;
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function EmailList({ selectedFolder, selectedEmail, onEmailSelect, className, isLoading = false, searchQuery = '', onSearchChange }: EmailListProps) {
  const t = useTranslations('email');
  const tSidebar = useTranslations('sidebar');
  const [animatingEmails, setAnimatingEmails] = React.useState<Set<string>>(new Set());
  
  const { data: emailsData, isLoading: isEmailsLoading, error: emailsError } = useQuery({
    queryKey: ['emails', selectedFolder, searchQuery],
    queryFn: () => emailService.getEmails({ 
      folder: selectedFolder, 
      search: searchQuery || undefined,
      limit: 100 
    }),
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const emails = emailsData?.emails?.map(emailService.transformToFrontendEmail) || [];

  const handleEmailClick = (email: Email) => {
    if (selectedEmail?.id === email.id) return;
    
    setAnimatingEmails(prev => new Set(prev).add(email.id));
    
    // Brief delay for selection animation
    setTimeout(() => {
      onEmailSelect(email);
      setAnimatingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(email.id);
        return newSet;
      });
    }, 150);
  };
  
  const getFolderDisplayName = (folder: string) => {
    switch (folder) {
      case 'inbox': return tSidebar('inbox');
      case 'sent': return tSidebar('sent');
      case 'spam': return tSidebar('spam');
      case 'deleted': return tSidebar('deleted');
      default: return folder;
    }
  };

  const getUnreadCount = (emails: Email[]) => {
    return emails.filter(email => !email.isRead).length;
  };

  const unreadCount = getUnreadCount(emails);
  const showLoading = isLoading || isEmailsLoading;

  if (showLoading) {
    return (
      <div className={cn("flex flex-col h-full bg-white", className)}>
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {getFolderDisplayName(selectedFolder)}
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner variant="dots" size="lg" />
        </div>
      </div>
    );
  }

  if (emailsError) {
    return (
      <div className={cn("flex flex-col h-full bg-white", className)}>
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {getFolderDisplayName(selectedFolder)}
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-500 mb-4">Unable to fetch emails. Please check your email account connection.</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="mx-auto"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!emails.length) {
    return (
      <div className={cn("flex flex-col h-full bg-white", className)}>
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {getFolderDisplayName(selectedFolder)}
            </h2>
            <span className="text-sm text-gray-500">0 emails</span>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h8a2 2 0 012 2v4M6 13h12" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('noEmails')}
            </h3>
            <p className="text-gray-500">
              {selectedFolder === 'inbox' ? 'Your inbox is empty' : `No emails in ${getFolderDisplayName(selectedFolder).toLowerCase()}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white", className)}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {getFolderDisplayName(selectedFolder)}
          </h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
            <span className="text-sm text-gray-500">{emails.length} emails</span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          {selectedFolder !== 'deleted' && (
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark all read
            </button>
          )}
        </div>
        
        {/* Search Input */}
        {onSearchChange && (
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner 
              size="lg" 
              variant="dots" 
              text="Loading emails..."
            />
          </div>
        ) : (
          emails.map((email: Email) => (
            <div 
              key={email.id} 
              className={`transition-colors ${
                animatingEmails.has(email.id) ? 'bg-blue-50' : ''
              }`}
            >
              <EmailItem
                email={email}
                isSelected={selectedEmail?.id === email.id}
                onClick={handleEmailClick}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}