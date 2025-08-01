import { Injectable } from '@nestjs/common';

export interface SyncProgress {
  accountId: string;
  isActive: boolean;
  currentFolder: string;
  foldersProcessed: number;
  totalFolders: number;
  emailsProcessed: number;
  totalEmails: number;
  status: 'starting' | 'syncing' | 'completed' | 'error';
  message: string;
  startTime: Date;
  endTime?: Date;
}

@Injectable()
export class ProgressTrackerService {
  private activeProgress = new Map<string, SyncProgress>();

  startProgress(accountId: string, totalFolders: number = 0): void {
    this.activeProgress.set(accountId, {
      accountId,
      isActive: true,
      currentFolder: 'Initializing...',
      foldersProcessed: 0,
      totalFolders,
      emailsProcessed: 0,
      totalEmails: 0,
      status: 'starting',
      message: 'Starting email synchronization...',
      startTime: new Date(),
    });
  }

  updateProgress(accountId: string, updates: Partial<SyncProgress>): void {
    const current = this.activeProgress.get(accountId);
    if (current) {
      this.activeProgress.set(accountId, { ...current, ...updates });
    }
  }

  completeProgress(accountId: string, message: string = 'Sync completed successfully'): void {
    const current = this.activeProgress.get(accountId);
    if (current) {
      this.activeProgress.set(accountId, {
        ...current,
        isActive: false,
        status: 'completed',
        message,
        endTime: new Date(),
      });
      
      // Clean up after 30 seconds
      setTimeout(() => {
        this.activeProgress.delete(accountId);
      }, 30000);
    }
  }

  errorProgress(accountId: string, error: string): void {
    const current = this.activeProgress.get(accountId);
    if (current) {
      this.activeProgress.set(accountId, {
        ...current,
        isActive: false,
        status: 'error',
        message: `Sync failed: ${error}`,
        endTime: new Date(),
      });
      
      // Clean up after 60 seconds on error
      setTimeout(() => {
        this.activeProgress.delete(accountId);
      }, 60000);
    }
  }

  getProgress(accountId: string): SyncProgress | null {
    return this.activeProgress.get(accountId) || null;
  }

  isActive(accountId: string): boolean {
    const progress = this.activeProgress.get(accountId);
    return progress?.isActive || false;
  }
}