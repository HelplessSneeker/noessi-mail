import { Injectable, Logger } from '@nestjs/common';

export type StandardFolder = 'inbox' | 'sent' | 'deleted' | 'spam';

export interface FolderMapping {
  originalFolder: string;
  standardFolder: StandardFolder;
  confidence: number;
  reason: string;
}

@Injectable()
export class SmartFolderMapperService {
  private readonly logger = new Logger(SmartFolderMapperService.name);

  /**
   * Maps any IMAP folder name to one of the 4 standard folders
   * This is the ULTIMATE folder mapping that handles all known patterns
   */
  mapToStandardFolder(originalFolderName: string, fromAddress?: string, toAddresses?: string[]): FolderMapping {
    const folder = originalFolderName.trim();
    
    // First, check for SPAM folders (highest priority for spam detection)
    const spamMapping = this.checkSpamFolder(folder);
    if (spamMapping.confidence >= 0.7) {
      return spamMapping;
    }

    // Check for DELETED/TRASH folders
    const deletedMapping = this.checkDeletedFolder(folder);
    if (deletedMapping.confidence >= 0.7) {
      return deletedMapping;
    }

    // Check for SENT folders  
    const sentMapping = this.checkSentFolder(folder, fromAddress, toAddresses);
    if (sentMapping.confidence >= 0.7) {
      return sentMapping;
    }

    // Check for INBOX folders
    const inboxMapping = this.checkInboxFolder(folder);
    if (inboxMapping.confidence >= 0.7) {
      return inboxMapping;
    }

    // If no high-confidence match, use heuristics
    return this.applyHeuristics(folder, fromAddress, toAddresses);
  }

  private checkSpamFolder(folder: string): FolderMapping {
    const spamPatterns = [
      // Gmail
      { pattern: /^\[Gmail\]\/Spam$/i, confidence: 1.0, reason: 'Gmail spam folder' },
      { pattern: /^\[Google Mail\]\/Spam$/i, confidence: 1.0, reason: 'Google Mail spam folder' },
      
      // Yahoo
      { pattern: /^Bulk Mail$/i, confidence: 1.0, reason: 'Yahoo bulk mail folder' },
      { pattern: /^Bulk$/i, confidence: 0.9, reason: 'Bulk mail folder' },
      
      // Outlook/Hotmail
      { pattern: /^Junk E?-?mail$/i, confidence: 1.0, reason: 'Outlook junk folder' },
      { pattern: /^Junk$/i, confidence: 0.95, reason: 'Junk folder' },
      { pattern: /^Junk E-mail$/i, confidence: 1.0, reason: 'Junk E-mail folder' },
      
      // Generic spam patterns
      { pattern: /^Spam$/i, confidence: 0.98, reason: 'Generic spam folder' },
      { pattern: /^Junk Mail$/i, confidence: 0.95, reason: 'Junk Mail folder' },
      { pattern: /^Quarantine$/i, confidence: 0.9, reason: 'Quarantine folder' },
      
      // IMAP Extensions
      { pattern: /\\Junk/i, confidence: 1.0, reason: 'IMAP Junk flag' },
      { pattern: /\\Spam/i, confidence: 1.0, reason: 'IMAP Spam flag' },
      
      // Provider-specific patterns
      { pattern: /INBOX\.spam/i, confidence: 0.9, reason: 'IMAP spam subfolder' },
      { pattern: /INBOX\.junk/i, confidence: 0.9, reason: 'IMAP junk subfolder' },
      
      // Partial matches (lower confidence)
      { pattern: /spam/i, confidence: 0.8, reason: 'Contains "spam"' },
      { pattern: /junk/i, confidence: 0.8, reason: 'Contains "junk"' },
      { pattern: /unsolicited/i, confidence: 0.7, reason: 'Unsolicited mail folder' },
    ];

    for (const { pattern, confidence, reason } of spamPatterns) {
      if (pattern.test(folder)) {
        return {
          originalFolder: folder,
          standardFolder: 'spam',
          confidence,
          reason,
        };
      }
    }

    return { originalFolder: folder, standardFolder: 'spam', confidence: 0, reason: '' };
  }

  private checkDeletedFolder(folder: string): FolderMapping {
    const deletedPatterns = [
      // Gmail
      { pattern: /^\[Gmail\]\/Trash$/i, confidence: 1.0, reason: 'Gmail trash folder' },
      { pattern: /^\[Google Mail\]\/Trash$/i, confidence: 1.0, reason: 'Google Mail trash folder' },
      
      // Outlook/Exchange
      { pattern: /^Deleted Items$/i, confidence: 1.0, reason: 'Outlook deleted items' },
      { pattern: /^Deleted$/i, confidence: 0.9, reason: 'Deleted folder' },
      
      // Generic trash patterns
      { pattern: /^Trash$/i, confidence: 0.98, reason: 'Generic trash folder' },
      { pattern: /^Bin$/i, confidence: 0.9, reason: 'Bin folder' },
      { pattern: /^Recycle Bin$/i, confidence: 0.9, reason: 'Recycle bin folder' },
      
      // IMAP Extensions
      { pattern: /\\Trash/i, confidence: 1.0, reason: 'IMAP Trash flag' },
      { pattern: /\\Deleted/i, confidence: 1.0, reason: 'IMAP Deleted flag' },
      
      // Partial matches
      { pattern: /trash/i, confidence: 0.8, reason: 'Contains "trash"' },
      { pattern: /deleted/i, confidence: 0.8, reason: 'Contains "deleted"' },
      { pattern: /remove/i, confidence: 0.7, reason: 'Contains "remove"' },
    ];

    for (const { pattern, confidence, reason } of deletedPatterns) {
      if (pattern.test(folder)) {
        return {
          originalFolder: folder,
          standardFolder: 'deleted',
          confidence,
          reason,
        };
      }
    }

    return { originalFolder: folder, standardFolder: 'deleted', confidence: 0, reason: '' };
  }

  private checkSentFolder(folder: string, fromAddress?: string, toAddresses?: string[]): FolderMapping {
    const sentPatterns = [
      // Gmail
      { pattern: /^\[Gmail\]\/Sent Mail$/i, confidence: 1.0, reason: 'Gmail sent mail folder' },
      { pattern: /^\[Google Mail\]\/Sent Mail$/i, confidence: 1.0, reason: 'Google Mail sent folder' },
      
      // Outlook/Exchange
      { pattern: /^Sent Items$/i, confidence: 1.0, reason: 'Outlook sent items' },
      { pattern: /^Sent$/i, confidence: 0.95, reason: 'Generic sent folder' },
      { pattern: /^Sent Mail$/i, confidence: 0.95, reason: 'Sent mail folder' },
      
      // Other variations
      { pattern: /^Outbox$/i, confidence: 0.9, reason: 'Outbox folder' },
      { pattern: /^Out$/i, confidence: 0.8, reason: 'Out folder' },
      
      // IMAP Extensions
      { pattern: /\\Sent/i, confidence: 1.0, reason: 'IMAP Sent flag' },
      
      // Partial matches
      { pattern: /sent/i, confidence: 0.8, reason: 'Contains "sent"' },
      { pattern: /outgoing/i, confidence: 0.7, reason: 'Contains "outgoing"' },
    ];

    for (const { pattern, confidence, reason } of sentPatterns) {
      if (pattern.test(folder)) {
        return {
          originalFolder: folder,
          standardFolder: 'sent',
          confidence,
          reason,
        };
      }
    }

    return { originalFolder: folder, standardFolder: 'sent', confidence: 0, reason: '' };
  }

  private checkInboxFolder(folder: string): FolderMapping {
    const inboxPatterns = [
      { pattern: /^INBOX$/i, confidence: 1.0, reason: 'Standard INBOX' },
      { pattern: /^Inbox$/i, confidence: 0.98, reason: 'Inbox folder' },
      { pattern: /^In$/i, confidence: 0.8, reason: 'In folder' },
      { pattern: /^Incoming$/i, confidence: 0.9, reason: 'Incoming folder' },
      { pattern: /^Mail$/i, confidence: 0.7, reason: 'Generic mail folder' },
    ];

    for (const { pattern, confidence, reason } of inboxPatterns) {
      if (pattern.test(folder)) {
        return {
          originalFolder: folder,
          standardFolder: 'inbox',
          confidence,
          reason,
        };
      }
    }

    return { originalFolder: folder, standardFolder: 'inbox', confidence: 0, reason: '' };
  }

  private applyHeuristics(folder: string, fromAddress?: string, toAddresses?: string[]): FolderMapping {
    // Unknown folder - apply heuristics to best guess the category

    // Check for common folder types that should map to inbox
    const inboxHeuristics = [
      /important/i,
      /priority/i,
      /flagged/i,
      /starred/i,
      /archive/i,
      /personal/i,
      /work/i,
      /business/i,
      /newsletter/i,
      /notification/i,
      /social/i,
      /promotion/i,
      /update/i,
      /receipt/i,
      /invoice/i,
    ];

    for (const pattern of inboxHeuristics) {
      if (pattern.test(folder)) {
        return {
          originalFolder: folder,
          standardFolder: 'inbox',
          confidence: 0.6,
          reason: `Heuristic: "${folder}" likely contains inbox-type emails`,
        };
      }
    }

    // Check for folder names that suggest spam/junk
    const spamHeuristics = [
      /unwanted/i,
      /blocked/i,
      /filter/i,
      /quarantine/i,
      /suspicious/i,
    ];

    for (const pattern of spamHeuristics) {
      if (pattern.test(folder)) {
        return {
          originalFolder: folder,
          standardFolder: 'spam',
          confidence: 0.6,
          reason: `Heuristic: "${folder}" likely contains spam emails`,
        };
      }
    }

    // Check for drafts or similar (treat as inbox for now)
    if (/draft/i.test(folder) || /template/i.test(folder)) {
      return {
        originalFolder: folder,
        standardFolder: 'inbox',
        confidence: 0.5,
        reason: `Heuristic: "${folder}" contains draft emails, mapping to inbox`,
      };
    }

    // Conservative default: unknown folders stay as-is with very low confidence
    // This prevents spam folders from being accidentally mapped to inbox
    const folderLower = folder.toLowerCase();
    
    // If it looks like it could be spam-related, map to spam with low confidence
    if (folderLower.includes('bulk') || folderLower.includes('promo') || 
        folderLower.includes('ad') || folderLower.includes('marketing')) {
      return {
        originalFolder: folder,
        standardFolder: 'spam',
        confidence: 0.4,
        reason: `Conservative: "${folder}" likely promotional/bulk, mapped to spam`,
      };
    }
    
    // Default: unknown folders go to inbox with very low confidence
    return {
      originalFolder: folder,
      standardFolder: 'inbox',
      confidence: 0.2,
      reason: `Conservative default: Unknown folder "${folder}" mapped to inbox with low confidence`,
    };
  }

  /**
   * Maps multiple folders and provides statistics
   */
  mapMultipleFolders(folderNames: string[]): {
    mappings: FolderMapping[];
    stats: {
      inbox: number;
      sent: number;
      deleted: number;
      spam: number;
      highConfidence: number;
      lowConfidence: number;
    };
  } {
    const mappings = folderNames.map(folder => this.mapToStandardFolder(folder));
    
    const stats = {
      inbox: mappings.filter(m => m.standardFolder === 'inbox').length,
      sent: mappings.filter(m => m.standardFolder === 'sent').length,
      deleted: mappings.filter(m => m.standardFolder === 'deleted').length,
      spam: mappings.filter(m => m.standardFolder === 'spam').length,
      highConfidence: mappings.filter(m => m.confidence >= 0.8).length,
      lowConfidence: mappings.filter(m => m.confidence < 0.6).length,
    };

    // Log mapping results
    this.logger.log(`Mapped ${folderNames.length} folders: ${stats.inbox} inbox, ${stats.sent} sent, ${stats.deleted} deleted, ${stats.spam} spam`);
    
    if (stats.lowConfidence > 0) {
      this.logger.warn(`${stats.lowConfidence} folders mapped with low confidence - manual review recommended`);
      mappings.filter(m => m.confidence < 0.6).forEach(m => {
        this.logger.warn(`Low confidence: ${m.originalFolder} -> ${m.standardFolder} (${m.confidence.toFixed(2)}) - ${m.reason}`);
      });
    }

    return { mappings, stats };
  }
}