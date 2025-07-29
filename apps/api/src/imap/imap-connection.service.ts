import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as Imap from 'node-imap';
import { ImapConnectionConfig, ImapSecurity } from './dto/imap.dto';

@Injectable()
export class ImapConnectionService {
  private readonly logger = new Logger(ImapConnectionService.name);
  private connections = new Map<string, Imap>();

  /**
   * Creates a new IMAP connection with the provided configuration
   */
  private createConnection(config: ImapConnectionConfig): Imap {
    const imapConfig: any = {
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.security === ImapSecurity.TLS,
      tlsOptions: {
        rejectUnauthorized: false, // For self-signed certs in dev
      },
      connTimeout: config.connTimeout || 10000,
      authTimeout: config.authTimeout || 5000,
      socketTimeout: config.socketTimeout || 30000,
      keepalive: config.keepAlive !== false,
    };

    // Handle STARTTLS
    if (config.security === ImapSecurity.STARTTLS) {
      imapConfig.tls = false;
      imapConfig.autotls = 'required';
    }

    return new Imap(imapConfig);
  }

  /**
   * Tests IMAP connection without storing it
   */
  async testConnection(config: ImapConnectionConfig): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const connection = this.createConnection(config);
      let isResolved = false;

      const cleanup = () => {
        if (connection.state !== 'disconnected') {
          connection.end();
        }
      };

      connection.once('ready', () => {
        if (!isResolved) {
          isResolved = true;
          this.logger.log(`IMAP connection test successful for ${config.user}@${config.host}`);
          cleanup();
          resolve(true);
        }
      });

      connection.once('error', (err) => {
        if (!isResolved) {
          isResolved = true;
          this.logger.error(`IMAP connection test failed for ${config.user}@${config.host}:`, err.message);
          cleanup();
          reject(new BadRequestException(`IMAP connection failed: ${err.message}`));
        }
      });

      connection.once('end', () => {
        if (!isResolved) {
          isResolved = true;
          this.logger.warn(`IMAP connection ended unexpectedly for ${config.user}@${config.host}`);
          reject(new BadRequestException('IMAP connection ended unexpectedly'));
        }
      });

      // Set timeout
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          reject(new BadRequestException('IMAP connection timeout'));
        }
      }, config.connTimeout || 10000);

      connection.connect();
    });
  }

  /**
   * Gets or creates a connection for the given email account
   */
  async getConnection(accountId: string, config: ImapConnectionConfig): Promise<Imap> {
    const existingConnection = this.connections.get(accountId);

    // Check if existing connection is still valid
    if (existingConnection && existingConnection.state === 'authenticated') {
      return existingConnection;
    }

    // Clean up old connection if exists
    if (existingConnection) {
      this.closeConnection(accountId);
    }

    // Create new connection
    return this.createNewConnection(accountId, config);
  }

  /**
   * Creates a new authenticated connection
   */
  private async createNewConnection(accountId: string, config: ImapConnectionConfig): Promise<Imap> {
    return new Promise((resolve, reject) => {
      const connection = this.createConnection(config);
      let isResolved = false;

      const cleanup = () => {
        if (!isResolved && connection.state !== 'disconnected') {
          connection.end();
        }
      };

      connection.once('ready', () => {
        if (!isResolved) {
          isResolved = true;
          this.connections.set(accountId, connection);
          this.logger.log(`IMAP connection established for account ${accountId}`);
          
          // Set up connection event handlers
          this.setupConnectionHandlers(accountId, connection);
          resolve(connection);
        }
      });

      connection.once('error', (err) => {
        if (!isResolved) {
          isResolved = true;
          this.logger.error(`IMAP connection failed for account ${accountId}:`, err.message);
          cleanup();
          reject(new BadRequestException(`IMAP connection failed: ${err.message}`));
        }
      });

      connection.once('end', () => {
        if (!isResolved) {
          isResolved = true;
          this.logger.warn(`IMAP connection ended unexpectedly for account ${accountId}`);
          reject(new BadRequestException('IMAP connection ended unexpectedly'));
        }
      });

      // Set timeout
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          reject(new BadRequestException('IMAP connection timeout'));
        }
      }, config.connTimeout || 10000);

      connection.connect();
    });
  }

  /**
   * Sets up event handlers for an established connection
   */
  private setupConnectionHandlers(accountId: string, connection: Imap): void {
    connection.on('error', (err) => {
      this.logger.error(`IMAP connection error for account ${accountId}:`, err.message);
      this.connections.delete(accountId);
    });

    connection.on('end', () => {
      this.logger.log(`IMAP connection ended for account ${accountId}`);
      this.connections.delete(accountId);
    });

    connection.on('close', (hadError) => {
      this.logger.log(`IMAP connection closed for account ${accountId}${hadError ? ' with error' : ''}`);
      this.connections.delete(accountId);
    });
  }

  /**
   * Closes connection for a specific account
   */
  closeConnection(accountId: string): void {
    const connection = this.connections.get(accountId);
    if (connection) {
      if (connection.state !== 'disconnected') {
        connection.end();
      }
      this.connections.delete(accountId);
      this.logger.log(`IMAP connection closed for account ${accountId}`);
    }
  }

  /**
   * Closes all connections
   */
  closeAllConnections(): void {
    this.logger.log('Closing all IMAP connections');
    for (const [accountId, connection] of this.connections) {
      if (connection.state !== 'disconnected') {
        connection.end();
      }
    }
    this.connections.clear();
  }

  /**
   * Gets connection status for an account
   */
  getConnectionStatus(accountId: string): string {
    const connection = this.connections.get(accountId);
    return connection ? connection.state : 'disconnected';
  }

  /**
   * Gets all active connections count
   */
  getActiveConnectionsCount(): number {
    return this.connections.size;
  }
}