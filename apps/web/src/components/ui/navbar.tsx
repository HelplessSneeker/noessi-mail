'use client';

import { LogOut, Settings, RefreshCw, User } from 'lucide-react';
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
  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Noessi Mail</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 w-9 p-0"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onUserSettings}
              className="h-9 w-9 p-0"
              title="User Settings"
            >
              <User className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="h-9 w-9 p-0"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="h-9 w-9 p-0"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}