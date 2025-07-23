'use client';

import * as React from "react";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";
import { Email, getEmailsByFolder } from "@/lib/mock-emails";
import { EmailItem } from "./email-item";

interface EmailListProps {
  selectedFolder: string;
  selectedEmail?: Email | null;
  onEmailSelect: (email: Email) => void;
  className?: string;
}

export function EmailList({ selectedFolder, selectedEmail, onEmailSelect, className }: EmailListProps) {
  const t = useTranslations('email');
  const tSidebar = useTranslations('sidebar');
  
  const emails = getEmailsByFolder(selectedFolder);
  
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
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          {selectedFolder !== 'deleted' && (
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark all read
            </button>
          )}
        </div>
      </div>
      
      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {emails.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            isSelected={selectedEmail?.id === email.id}
            onClick={onEmailSelect}
          />
        ))}
      </div>
    </div>
  );
}