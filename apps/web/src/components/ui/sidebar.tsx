'use client';

import * as React from "react"
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface EmailFolder {
  id: string
  name: string
  icon: React.ReactNode
  count?: number
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedFolder?: string
  onFolderSelect?: (folderId: string) => void
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, selectedFolder, onFolderSelect, ...props }, ref) => {
    const t = useTranslations('sidebar');
    const tEmail = useTranslations('email');
    
    const folders: EmailFolder[] = [
      {
        id: 'inbox',
        name: t('inbox'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h8a2 2 0 012 2v4M6 13h12" />
          </svg>
        ),
      },
      {
        id: 'sent',
        name: t('sent'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        ),
      },
      {
        id: 'spam',
        name: t('spam'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
      },
      {
        id: 'deleted',
        name: t('deleted'),
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
      },
    ]

    return (
      <div 
        ref={ref}
        className={cn(
          "w-64 bg-white border-r border-gray-200 h-full flex flex-col",
          className
        )}
        {...props}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('mail')}</h2>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {folders.map((folder, index) => (
              <li key={folder.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-11 px-3 rounded-md transition-colors",
                    "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    selectedFolder === folder.id && "bg-blue-50 text-blue-700 hover:bg-blue-100 border-r-2 border-blue-500"
                  )}
                  onClick={() => onFolderSelect?.(folder.id)}
                >
                  <span className={cn(
                    "mr-3 flex-shrink-0",
                    selectedFolder === folder.id ? "text-blue-600" : "text-gray-500"
                  )}>
                    {folder.icon}
                  </span>
                  <span className="flex-1 text-left font-medium">{folder.name}</span>
                  {folder.count !== undefined && (
                    <span className={cn(
                      "ml-auto text-xs px-2 py-1 rounded-full font-medium",
                      selectedFolder === folder.id 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-gray-100 text-gray-600"
                    )}>
                      {folder.count}
                    </span>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full justify-start h-10 px-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {tEmail('compose')}
          </Button>
        </div>
      </div>
    )
  }
)

Sidebar.displayName = "Sidebar"

export { Sidebar }
export type { EmailFolder, SidebarProps }