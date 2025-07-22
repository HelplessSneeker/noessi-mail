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
}

export function Navbar({ 
  onLogout, 
  onSettings, 
  onRefresh, 
  onUserSettings, 
  isLoading = false 
}: NavbarProps) {
  const t = useTranslations('common');
  const tNav = useTranslations('navigation');
  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Noessi Mail</h1>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 w-9 p-0"
              title={t('refresh')}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onUserSettings}
              className="h-9 w-9 p-0"
              title={tNav('userSettings')}
            >
              <User className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="h-9 w-9 p-0"
              title={t('settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-9 w-9 p-0"
              title={t('logout')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
      </div>
    </nav>
  );
}