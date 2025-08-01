import { Injectable, Logger } from '@nestjs/common';
import { ImapFolderInfo } from './dto/imap.dto';

export enum FolderType {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  SPAM = 'spam',
  TRASH = 'trash',
  ARCHIVE = 'archive',
  JUNK = 'junk',
  OTHER = 'other',
}

export interface FolderClassification {
  name: string;
  type: FolderType;
  confidence: number; // 0-1, higher = more confident
  isSpam: boolean;
}

@Injectable()
export class FolderDetectionService {
  private readonly logger = new Logger(FolderDetectionService.name);

  // Spam folder patterns based on common email providers
  private readonly SPAM_FOLDER_PATTERNS = [
    // Gmail
    { pattern: /^\[Gmail\]\/Spam$/i, confidence: 1.0 },
    
    // Yahoo
    { pattern: /^Bulk Mail$/i, confidence: 1.0 },
    
    // Outlook/Hotmail
    { pattern: /^Junk E?-?mail$/i, confidence: 1.0 },
    { pattern: /^Junk$/i, confidence: 0.9 },
    
    // Generic patterns
    { pattern: /^Spam$/i, confidence: 0.95 },
    { pattern: /^Junk Mail$/i, confidence: 0.95 },
    { pattern: /INBOX\.junk/i, confidence: 0.8 },
    
    // Common variations
    { pattern: /spam/i, confidence: 0.7 },
    { pattern: /junk/i, confidence: 0.7 },
    
    // IMAP Special-Use Extensions (RFC 6154)
    { pattern: /\\Junk/i, confidence: 1.0 },
    { pattern: /\\Spam/i, confidence: 1.0 },
  ];

  // Other folder type patterns
  private readonly FOLDER_TYPE_PATTERNS = {
    [FolderType.INBOX]: [
      { pattern: /^INBOX$/i, confidence: 1.0 },
      { pattern: /^Inbox$/i, confidence: 0.95 },
    ],
    [FolderType.SENT]: [
      { pattern: /^\[Gmail\]\/Sent Mail$/i, confidence: 1.0 },
      { pattern: /^Sent$/i, confidence: 0.9 },
      { pattern: /^Sent Mail$/i, confidence: 0.9 },
      { pattern: /^Sent Items$/i, confidence: 0.9 },
      { pattern: /\\Sent/i, confidence: 1.0 },
    ],
    [FolderType.DRAFTS]: [
      { pattern: /^\[Gmail\]\/Drafts$/i, confidence: 1.0 },
      { pattern: /^Drafts$/i, confidence: 0.9 },
      { pattern: /^Draft$/i, confidence: 0.8 },
      { pattern: /\\Drafts/i, confidence: 1.0 },
    ],
    [FolderType.TRASH]: [
      { pattern: /^\[Gmail\]\/Trash$/i, confidence: 1.0 },
      { pattern: /^Trash$/i, confidence: 0.9 },
      { pattern: /^Deleted Items$/i, confidence: 0.9 },
      { pattern: /^Deleted$/i, confidence: 0.8 },
      { pattern: /\\Trash/i, confidence: 1.0 },
    ],
    [FolderType.ARCHIVE]: [
      { pattern: /^\[Gmail\]\/All Mail$/i, confidence: 1.0 },
      { pattern: /^Archive$/i, confidence: 0.9 },
      { pattern: /^Archives$/i, confidence: 0.8 },
      { pattern: /\\Archive/i, confidence: 1.0 },
    ],
  };

  /**
   * Detects spam folders from a list of folders
   */
  detectSpamFolders(folders: ImapFolderInfo[]): string[] {
    const spamFolders: string[] = [];
    
    for (const folder of folders) {
      const classification = this.classifyFolder(folder.name);
      if (classification.isSpam && classification.confidence >= 0.7) {
        spamFolders.push(folder.name);
        this.logger.log(`Detected spam folder: ${folder.name} (confidence: ${classification.confidence})`);
      }
    }

    // If no spam folders found with high confidence, try with lower threshold
    if (spamFolders.length === 0) {
      for (const folder of folders) {
        const classification = this.classifyFolder(folder.name);
        if (classification.isSpam && classification.confidence >= 0.5) {
          spamFolders.push(folder.name);
          this.logger.log(`Detected potential spam folder: ${folder.name} (confidence: ${classification.confidence})`);
        }
      }
    }

    return spamFolders;
  }

  /**
   * Classifies a single folder by name
   */
  classifyFolder(folderName: string): FolderClassification {
    // Check for spam patterns first
    for (const { pattern, confidence } of this.SPAM_FOLDER_PATTERNS) {
      if (pattern.test(folderName)) {
        return {
          name: folderName,
          type: FolderType.SPAM,
          confidence,
          isSpam: true,
        };
      }
    }

    // Check other folder types
    for (const [type, patterns] of Object.entries(this.FOLDER_TYPE_PATTERNS)) {
      for (const { pattern, confidence } of patterns) {
        if (pattern.test(folderName)) {
          return {
            name: folderName,
            type: type as FolderType,
            confidence,
            isSpam: false,
          };
        }
      }
    }

    // No pattern matched - classify as other
    return {
      name: folderName,
      type: FolderType.OTHER,
      confidence: 0.1,
      isSpam: false,
    };
  }

  /**
   * Gets all folders of a specific type
   */
  getFoldersByType(folders: ImapFolderInfo[], type: FolderType): string[] {
    const matchingFolders: string[] = [];
    
    for (const folder of folders) {
      const classification = this.classifyFolder(folder.name);
      if (classification.type === type && classification.confidence >= 0.7) {
        matchingFolders.push(folder.name);
      }
    }

    return matchingFolders;
  }

  /**
   * Suggests folders to sync based on folder types
   */
  suggestFoldersToSync(folders: ImapFolderInfo[], includeSpam = true): {
    recommended: string[];
    spam: string[];
    other: string[];
  } {
    const recommended: string[] = [];
    const spam: string[] = [];
    const other: string[] = [];

    for (const folder of folders) {
      const classification = this.classifyFolder(folder.name);
      
      if (classification.isSpam) {
        spam.push(folder.name);
        if (includeSpam) {
          recommended.push(folder.name);
        }
      } else if (classification.type === FolderType.INBOX || 
                 classification.type === FolderType.SENT ||
                 classification.type === FolderType.DRAFTS) {
        recommended.push(folder.name);
      } else {
        other.push(folder.name);
      }
    }

    return { recommended, spam, other };
  }

  /**
   * Validates if a folder name is likely to be spam
   */
  isSpamFolder(folderName: string): boolean {
    const classification = this.classifyFolder(folderName);
    return classification.isSpam && classification.confidence >= 0.7;
  }

  /**
   * Gets folder recommendations with explanations
   */
  getFolderRecommendations(folders: ImapFolderInfo[]): {
    folder: string;
    type: FolderType;
    confidence: number;
    shouldSync: boolean;
    reason: string;
  }[] {
    return folders.map(folder => {
      const classification = this.classifyFolder(folder.name);
      
      let shouldSync = false;
      let reason = '';

      switch (classification.type) {
        case FolderType.INBOX:
          shouldSync = true;
          reason = 'Primary inbox folder';
          break;
        case FolderType.SENT:
          shouldSync = true;
          reason = 'Sent mail folder';
          break;
        case FolderType.DRAFTS:
          shouldSync = true;
          reason = 'Draft messages folder';
          break;
        case FolderType.SPAM:
          shouldSync = true;
          reason = 'Spam/junk folder - contains filtered emails';
          break;
        case FolderType.TRASH:
          shouldSync = false;
          reason = 'Deleted items - usually not needed';
          break;
        case FolderType.ARCHIVE:
          shouldSync = false;
          reason = 'Archive folder - contains all mail (may duplicate inbox)';
          break;
        default:
          shouldSync = classification.confidence < 0.5;
          reason = 'Unknown folder type - manual review recommended';
      }

      return {
        folder: folder.name,
        type: classification.type,
        confidence: classification.confidence,
        shouldSync,
        reason,
      };
    });
  }
}