'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Email } from "@/lib/mock-emails";

interface EmailItemProps {
  email: Email;
  isSelected: boolean;
  onClick: (email: Email) => void;
}

export function EmailItem({ email, isSelected, onClick }: EmailItemProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'low': return 'text-gray-400';
      default: return 'text-blue-600';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={cn(
        "border-b border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors relative",
        isSelected && "bg-blue-100 border-blue-300 shadow-sm ring-2 ring-blue-200",
        !email.isRead && !isSelected && "bg-white border-l-4 border-l-blue-500",
        !email.isRead && isSelected && "border-l-4 border-l-blue-600"
      )}
      onClick={() => onClick(email)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header with sender and date */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-medium text-sm truncate",
                !email.isRead ? "text-gray-900" : "text-gray-700"
              )}>
                {email.folder === 'sent' ? `To: ${email.to[0]?.name || email.to[0]?.email}` : email.from.name}
              </span>
              {email.isStarred && (
                <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              )}
              {email.hasAttachments && (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2">
              {email.priority !== 'normal' && (
                <div className={cn("w-2 h-2 rounded-full", getPriorityColor(email.priority))} />
              )}
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDate(email.date)}
              </span>
            </div>
          </div>
          
          {/* Subject */}
          <div className="mb-1">
            <span className={cn(
              "text-sm block truncate",
              !email.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"
            )}>
              {email.subject}
            </span>
          </div>
          
          {/* Preview */}
          <div className="text-xs text-gray-500 line-clamp-2">
            {truncateText(email.body, 120)}
          </div>
        </div>
        
        {/* Unread indicator */}
        {!email.isRead && (
          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
        )}
      </div>
    </div>
  );
}