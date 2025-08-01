'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SyncProgress {
  accountId: string;
  isActive: boolean;
  currentFolder: string;
  foldersProcessed: number;
  totalFolders: number;
  emailsProcessed: number;
  totalEmails: number;
  status: 'starting' | 'syncing' | 'completed' | 'error';
  message: string;
  startTime: string;
  endTime?: string;
}

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailAccountId: string;
  title: string;
}

export default function ProgressModal({ isOpen, onClose, emailAccountId, title }: ProgressModalProps) {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && emailAccountId) {
      setIsPolling(true);
      pollProgress();
      
      // Start time update interval for smooth duration display
      intervalRef.current = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    } else {
      setIsPolling(false);
      setProgress(null);
      
      // Clear time interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, emailAccountId]);

  const pollProgress = async () => {
    if (!emailAccountId) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/email-accounts/${emailAccountId}/sync-progress`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          setProgress(result.data);
          
          // Continue polling if sync is active
          if (result.data.isActive && isPolling) {
            setTimeout(pollProgress, 1000); // Poll every second
          } else if (!result.data.isActive) {
            // Sync completed or failed, stop polling after a short delay
            setTimeout(() => setIsPolling(false), 3000);
          }
        } else {
          // No sync in progress
          setProgress(null);
          if (isPolling) {
            setTimeout(pollProgress, 2000); // Check again in 2 seconds
          }
        }
      }
    } catch (error) {
      console.error('Error polling progress:', error);
      if (isPolling) {
        setTimeout(pollProgress, 3000); // Retry in 3 seconds on error
      }
    }
  };

  const formatDuration = useCallback((startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : currentTime;
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${Math.max(0, duration)}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  }, [currentTime]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={progress?.isActive}
          >
            ✕
          </button>
        </div>

        {!progress ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Starting sync...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                progress.status === 'starting' ? 'bg-yellow-500' :
                progress.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
                progress.status === 'completed' ? 'bg-green-500' :
                'bg-red-500'
              }`} />
              <span className="text-sm font-medium capitalize">{progress.status}</span>
              <span className="text-xs text-gray-500 ml-auto">
                {formatDuration(progress.startTime, progress.endTime)}
              </span>
            </div>

            {/* Message */}
            <p className="text-sm text-gray-600">{progress.message}</p>

            {/* Progress Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-500 text-xs">Emails Processed</div>
                <div className="font-semibold text-lg">
                  {progress.emailsProcessed.toLocaleString()}
                  {progress.totalEmails > 0 && (
                    <span className="text-sm text-gray-500">
                      /{progress.totalEmails.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-gray-500 text-xs">Folders</div>
                <div className="font-semibold text-lg">
                  {progress.foldersProcessed}
                  {progress.totalFolders > 0 && (
                    <span className="text-sm text-gray-500">/{progress.totalFolders}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Current folder */}
            {progress.currentFolder && progress.isActive && (
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-blue-600 text-xs font-medium">Current Folder</div>
                <div className="text-blue-800">{progress.currentFolder}</div>
              </div>
            )}

            {/* Close button */}
            {!progress.isActive && (
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {progress.status === 'completed' ? 'Done' : 'Close'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}