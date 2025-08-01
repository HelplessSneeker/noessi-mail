'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface SyncProgress {
  sessionId: string;
  emailAccountId: string;
  currentFolder: string;
  foldersProcessed: number;
  totalFolders: number;
  emailsProcessed: number;
  totalEmails: number;
  currentFolderProgress: number;
  overallProgress: number;
  status: 'starting' | 'syncing' | 'completed' | 'error';
  message: string;
  errors?: string[];
}

interface SyncProgressProps {
  emailAccountId: string;
  onComplete?: (result: any) => void;
  onError?: (error: any) => void;
}

export default function SyncProgress({ emailAccountId, onComplete, onError }: SyncProgressProps) {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sync`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to sync WebSocket');
    });

    newSocket.on('sync-progress', (progressData: SyncProgress) => {
      console.log('Sync progress:', progressData);
      setProgress(progressData);
    });

    newSocket.on('sync-complete', (result: any) => {
      console.log('Sync completed:', result);
      setIsActive(false);
      onComplete?.(result);
    });

    newSocket.on('sync-error', (error: any) => {
      console.error('Sync error:', error);
      setIsActive(false);
      onError?.(error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [onComplete, onError]);

  const startSync = async () => {
    if (!socket) return;

    try {
      setIsActive(true);
      setProgress(null);

      // Start sync via API
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sync/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          emailAccountId,
          clearExisting: true,
          includeSpam: true,
          batchSize: 50,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start sync: ${response.statusText}`);
      }

      const result = await response.json();
      setSessionId(result.data.sessionId);

    } catch (error) {
      console.error('Failed to start sync:', error);
      setIsActive(false);
      onError?.(error);
    }
  };

  const cancelSync = async () => {
    if (!sessionId) return;

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sync/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setIsActive(false);
      setProgress(null);
      setSessionId(null);

    } catch (error) {
      console.error('Failed to cancel sync:', error);
    }
  };

  if (!isActive && !progress) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Email Sync</h3>
        <p className="text-gray-600 mb-4">
          Start a complete email synchronization. This will sync all emails from all folders.
        </p>
        <button
          onClick={startSync}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Complete Sync
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Email Sync Progress</h3>
        {isActive && (
          <button
            onClick={cancelSync}
            className="px-3 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {progress && (
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              progress.status === 'starting' ? 'bg-yellow-500' :
              progress.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
              progress.status === 'completed' ? 'bg-green-500' :
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {progress.status === 'starting' ? 'Starting...' :
               progress.status === 'syncing' ? 'Syncing...' :
               progress.status === 'completed' ? 'Completed!' :
               'Error'}
            </span>
          </div>

          {/* Current message */}
          <p className="text-sm text-gray-600">{progress.message}</p>

          {/* Overall progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Overall Progress</span>
              <span>{progress.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Current folder progress */}
          {progress.currentFolderProgress > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Current Folder: {progress.currentFolder}</span>
                <span>{progress.currentFolderProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-green-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress.currentFolderProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Emails: </span>
              <span className="font-medium">
                {progress.emailsProcessed.toLocaleString()}
                {progress.totalEmails > 0 && ` / ${progress.totalEmails.toLocaleString()}`}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Folders: </span>
              <span className="font-medium">
                {progress.foldersProcessed} / {progress.totalFolders}
              </span>
            </div>
          </div>

          {/* Errors */}
          {progress.errors && progress.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
              <ul className="text-xs text-red-700 space-y-1">
                {progress.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}