import { Injectable, Logger } from '@nestjs/common';
import { simpleParser, ParsedMail } from 'mailparser';
import * as Imap from 'node-imap';
import { ImapMessageInfo } from './dto/imap.dto';

export interface ParsedEmailData {
  messageId: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  sentAt?: Date;
  receivedAt: Date;
  attachments?: any[];
  size: number;
  inReplyTo?: string;
  references: string[];
  threadId?: string;
}

@Injectable()
export class EmailParserService {
  private readonly logger = new Logger(EmailParserService.name);

  /**
   * Parses raw email buffer into structured data
   */
  async parseEmail(buffer: Buffer, messageInfo: ImapMessageInfo): Promise<ParsedEmailData> {
    try {
      const parsed: ParsedMail = await simpleParser(buffer);
      
      return {
        messageId: this.extractMessageId(parsed.messageId || messageInfo.messageId),
        subject: parsed.subject || undefined,
        body: parsed.text || undefined,
        bodyHtml: parsed.html || undefined,
        fromAddress: this.extractEmailAddress(parsed.from),
        fromName: this.extractFromName(parsed.from),
        toAddresses: this.extractEmailAddresses(parsed.to),
        ccAddresses: this.extractEmailAddresses(parsed.cc),
        bccAddresses: this.extractEmailAddresses(parsed.bcc),
        sentAt: parsed.date || undefined,
        receivedAt: messageInfo.date,
        attachments: this.parseAttachments(parsed.attachments),
        size: messageInfo.size,
        inReplyTo: this.extractMessageId(parsed.inReplyTo),
        references: this.extractReferences(parsed.references),
        threadId: this.generateThreadId(parsed),
      };
    } catch (error) {
      this.logger.error(`Failed to parse email ${messageInfo.messageId}:`, error.message);
      
      // Return basic structure with available data
      return {
        messageId: messageInfo.messageId,
        subject: messageInfo.subject,
        body: undefined,
        bodyHtml: undefined,
        fromAddress: messageInfo.from?.[0] || 'unknown@unknown.com',
        fromName: undefined,
        toAddresses: messageInfo.to || [],
        ccAddresses: messageInfo.cc || [],
        bccAddresses: messageInfo.bcc || [],
        sentAt: messageInfo.date,
        receivedAt: messageInfo.date,
        attachments: [],
        size: messageInfo.size,
        inReplyTo: undefined,
        references: [],
        threadId: undefined,
      };
    }
  }

  /**
   * Parses IMAP message attributes into structured info
   */
  parseMessageInfo(attrs: any, uid: number): ImapMessageInfo {
    const envelope = attrs.envelope || {};
    const bodyStructure = attrs.struct || attrs.bodystructure;
    
    return {
      uid,
      messageId: this.extractMessageId(attrs['message-id'] || envelope.messageId),
      subject: envelope.subject || undefined,
      from: this.parseAddressList(envelope.from),
      to: this.parseAddressList(envelope.to),
      cc: this.parseAddressList(envelope.cc),
      bcc: this.parseAddressList(envelope.bcc),
      date: envelope.date ? new Date(envelope.date) : new Date(),
      flags: attrs.flags || [],
      size: attrs.size || 0,
      bodyStructure,
      envelope,
    };
  }

  /**
   * Extracts and normalizes Message-ID
   */
  private extractMessageId(messageId?: string): string {
    if (!messageId) {
      return `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Remove < > brackets if present
    return messageId.replace(/^<|>$/g, '');
  }

  /**
   * Extracts primary email address from address object/string
   */
  private extractEmailAddress(addressField: any): string {
    if (!addressField) return 'unknown@unknown.com';
    
    if (typeof addressField === 'string') {
      const match = addressField.match(/<(.+?)>/);
      return match ? match[1] : addressField;
    }
    
    if (addressField.value && addressField.value.length > 0) {
      return addressField.value[0].address || 'unknown@unknown.com';
    }
    
    return 'unknown@unknown.com';
  }

  /**
   * Extracts sender name from address field
   */
  private extractFromName(addressField: any): string | undefined {
    if (!addressField) return undefined;
    
    if (addressField.value && addressField.value.length > 0) {
      return addressField.value[0].name || undefined;
    }
    
    return undefined;
  }

  /**
   * Extracts array of email addresses from address field
   */
  private extractEmailAddresses(addressField: any): string[] {
    if (!addressField) return [];
    
    if (addressField.value && Array.isArray(addressField.value)) {
      return addressField.value.map(addr => addr.address).filter(Boolean);
    }
    
    return [];
  }

  /**
   * Parses IMAP address list
   */
  private parseAddressList(addresses: any[]): string[] {
    if (!Array.isArray(addresses)) return [];
    
    return addresses.map(addr => {
      if (addr.mailbox && addr.host) {
        return `${addr.mailbox}@${addr.host}`;
      }
      return addr.address || '';
    }).filter(Boolean);
  }

  /**
   * Extracts references for email threading
   */
  private extractReferences(references: any): string[] {
    if (!references) return [];
    
    if (typeof references === 'string') {
      return references
        .split(/\s+/)
        .map(ref => ref.replace(/^<|>$/g, ''))
        .filter(Boolean);
    }
    
    if (Array.isArray(references)) {
      return references
        .map(ref => ref.replace(/^<|>$/g, ''))
        .filter(Boolean);
    }
    
    return [];
  }

  /**
   * Generates thread ID for email threading
   */
  private generateThreadId(parsed: ParsedMail): string | undefined {
    // Use In-Reply-To as primary thread identifier
    if (parsed.inReplyTo) {
      return this.extractMessageId(parsed.inReplyTo);
    }
    
    // Use first reference as thread ID
    if (parsed.references && Array.isArray(parsed.references) && parsed.references.length > 0) {
      return this.extractMessageId(parsed.references[0]);
    }
    
    // Use subject-based threading as fallback
    if (parsed.subject) {
      const cleanSubject = parsed.subject.replace(/^(Re:|Fwd:|Fw:)\s*/gi, '').trim();
      if (cleanSubject) {
        return `thread-${Buffer.from(cleanSubject).toString('base64').substr(0, 16)}`;
      }
    }
    
    return undefined;
  }

  /**
   * Parses email attachments
   */
  private parseAttachments(attachments: any[]): any[] {
    if (!Array.isArray(attachments)) return [];
    
    return attachments.map(attachment => ({
      filename: attachment.filename || 'unnamed',
      contentType: attachment.contentType || 'application/octet-stream',
      size: attachment.size || 0,
      contentId: attachment.cid || undefined,
      contentDisposition: attachment.contentDisposition || 'attachment',
      checksum: attachment.checksum || undefined,
    }));
  }

  /**
   * Determines if message has attachments from body structure
   */
  hasAttachments(bodyStructure: any): boolean {
    if (!bodyStructure) return false;
    
    // Recursive function to check for attachments
    const checkPart = (part: any): boolean => {
      if (!part) return false;
      
      // Check if this part is an attachment
      if (part.disposition && part.disposition.type === 'attachment') {
        return true;
      }
      
      // Check if this part has a filename (likely attachment)
      if (part.disposition && part.disposition.params && part.disposition.params.filename) {
        return true;
      }
      
      // Recursively check child parts
      if (Array.isArray(part)) {
        return part.some(checkPart);
      }
      
      return false;
    };
    
    return checkPart(bodyStructure);
  }
}