'use client';

import * as React from "react";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";
import { Email } from "@/lib/mock-emails";
import { Button } from "./button";
import { EmailViewerSkeleton } from "./dashboard-skeleton";

interface EmailViewerProps {
  email: Email | null;
  onClose?: () => void;
  className?: string;
  isLoading?: boolean;
}

export function EmailViewer({ email, onClose, className, isLoading = false }: EmailViewerProps) {
  const t = useTranslations('email');
  
  if (isLoading) {
    return <EmailViewerSkeleton />;
  }
  
  if (!email) {
    return (
      <div className={cn("flex flex-col h-full bg-gray-50 border-l border-gray-200 animate-fade-in", className)}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center animate-fade-in-up">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4 transition-all duration-300 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-500 mb-2 transition-colors">
              Select an email
            </h3>
            <p className="text-gray-400 transition-colors">
              Choose an email from the list to view its content
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">High Priority</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Low Priority</span>;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white border-l border-gray-200", className)}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 mb-2 pr-4">
              {email.subject}
            </h1>
            
            <div className="flex items-center gap-2 mb-3">
              {getPriorityBadge(email.priority)}
              {email.isStarred && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <svg className="w-3 h-3 mr-1 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  Starred
                </span>
              )}
              {email.hasAttachments && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Attachments
                </span>
              )}
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="font-medium w-12">{t('from')}:</span>
                <span>{email.from.name} &lt;{email.from.email}&gt;</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-12">{t('to')}:</span>
                <span>{email.to.map(recipient => `${recipient.name} <${recipient.email}>`).join(', ')}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-12">Date:</span>
                <span>{formatDate(email.date)}</span>
              </div>
            </div>
          </div>
          
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-4 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            {t('reply')}
          </Button>
          <Button variant="outline" size="sm" className="transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('replyAll')}
          </Button>
          <Button variant="outline" size="sm" className="transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {t('forward')}
          </Button>
          
          <div className="flex-1"></div>
          
          {email.folder !== 'deleted' && (
            <Button variant="outline" size="sm" className="transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          )}
        </div>
      </div>
      
      {/* Email content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="prose max-w-none">
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {email.body}
          </p>
        </div>
        
        {/* Attachments section */}
        {email.hasAttachments && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Attachments</h3>
            <div className="space-y-2">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">document.pdf</p>
                  <p className="text-xs text-gray-500">2.3 MB</p>
                </div>
                <Button variant="ghost" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}