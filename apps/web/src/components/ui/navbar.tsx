'use client';

import { LogOut, Settings, RefreshCw, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './button';

interface NavbarProps {
  onLogout?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  onUserSettings?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

export function Navbar({ 
  onLogout, 
  onSettings, 
  onRefresh, 
  onUserSettings, 
  isLoading = false,
  isRefreshing = false
}: NavbarProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('navigation');
  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-default transition-colors">Noessi Mail</h1>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
              className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title={t('refresh')}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onUserSettings}
              className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title={tNav('userSettings')}
            >
              <User className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title={t('settings')}
            >
              <Settings className="h-4 w-4 transition-transform duration-200 hover:rotate-90 hover:scale-110" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-9 w-9 p-0 btn-animated transition-all duration-200 hover:bg-red-50 hover:text-red-600"
              title={t('logout')}
            >
              <LogOut className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
            </Button>
          </div>
      </div>
    </nav>
  );
}