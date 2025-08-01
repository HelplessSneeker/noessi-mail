'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Email } from "@/services/email.service";

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

  const getFolderLabel = (email: Email) => {
    // Only show folder label if it's different from the standard folders or if we have the original folder name
    if (email.folderName && email.folderName !== 'INBOX') {
      // Show original folder name for non-standard folders
      return email.folderName;
    }
    
    // For spam folders, always show the label
    if (email.folder === 'spam') {
      return 'Spam';
    }
    
    return null;
  };

  const getFolderLabelColor = (folder: string) => {
    const folderLower = folder.toLowerCase();
    if (folderLower.includes('spam') || folderLower.includes('junk')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (folderLower.includes('sent')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (folderLower.includes('draft')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div
      className={cn(
        "border-b border-gray-100 p-5 cursor-pointer transition-all duration-200 ease-out relative email-item",
        "hover:bg-gray-50 hover:shadow-sm hover:border-gray-200",
        isSelected && "bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-100 transform scale-[1.01]",
        !email.isRead && !isSelected && "bg-white border-l-4 border-l-blue-500 hover:border-l-blue-600",
        !email.isRead && isSelected && "border-l-4 border-l-blue-600"
      )}
      onClick={() => onClick(email)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header with sender and date */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={cn(
                "font-semibold text-base truncate transition-colors duration-200",
                !email.isRead ? "text-gray-900" : "text-gray-700"
              )}>
                {email.folder === 'sent' ? `To: ${email.to[0]?.name || email.to[0]?.email}` : email.from.name}
              </span>
              {email.isStarred && (
                <svg className="w-4 h-4 text-yellow-400 fill-current transition-all duration-200 hover:scale-110 flex-shrink-0" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              )}
              {email.hasAttachments && (
                <svg className="w-4 h-4 text-gray-400 transition-all duration-200 hover:text-gray-600 hover:scale-110 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {email.priority !== 'normal' && (
                <div className={cn("w-2 h-2 rounded-full transition-all duration-200 hover:scale-125", getPriorityColor(email.priority))} />
              )}
              <span className="text-sm text-gray-500 whitespace-nowrap transition-colors duration-200">
                {formatDate(email.date)}
              </span>
            </div>
          </div>
          
          {/* Subject */}
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm block truncate transition-colors duration-200 leading-relaxed flex-1",
                !email.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"
              )}>
                {email.subject}
              </span>
              {getFolderLabel(email) && (
                <span className={cn(
                  "text-xs px-2 py-1 rounded border text-nowrap transition-all duration-200 hover:scale-105",
                  getFolderLabelColor(getFolderLabel(email)!)
                )}>
                  {getFolderLabel(email)}
                </span>
              )}
            </div>
          </div>
          
          {/* Preview */}
          <div className="text-sm text-gray-500 line-clamp-2 transition-colors duration-200 leading-relaxed">
            {truncateText(email.body, 100)}
          </div>
        </div>
        
        {/* Unread indicator */}
        {!email.isRead && (
          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0 transition-all duration-300 animate-pulse-soft hover:scale-125"></div>
        )}
      </div>
    </div>
  );
}