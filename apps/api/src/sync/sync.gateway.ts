import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface SyncProgress {
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

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    credentials: true,
  },
  namespace: '/sync',
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SyncGateway.name);
  private activeSessions = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
    // Clean up any session tracking
    for (const [sessionId, socket] of this.activeSessions.entries()) {
      if (socket.id === client.id) {
        this.activeSessions.delete(sessionId);
        break;
      }
    }
  }

  /**
   * Register a client for a specific sync session
   */
  registerSession(sessionId: string, client: Socket) {
    this.activeSessions.set(sessionId, client);
    this.logger.log(`Registered client ${client.id} for sync session ${sessionId}`);
  }

  /**
   * Send progress update to a specific sync session
   */
  sendProgress(sessionId: string, progress: SyncProgress) {
    const client = this.activeSessions.get(sessionId);
    if (client && client.connected) {
      client.emit('sync-progress', progress);
    } else {
      // Also broadcast to all clients in case of reconnection
      this.server.emit('sync-progress', progress);
    }
  }

  /**
   * Send completion message to a specific sync session
   */
  sendCompletion(sessionId: string, result: any) {
    const client = this.activeSessions.get(sessionId);
    if (client && client.connected) {
      client.emit('sync-complete', result);
    } else {
      this.server.emit('sync-complete', result);
    }
    
    // Clean up session
    this.activeSessions.delete(sessionId);
  }

  /**
   * Send error message to a specific sync session
   */
  sendError(sessionId: string, error: any) {
    const client = this.activeSessions.get(sessionId);
    if (client && client.connected) {
      client.emit('sync-error', error);
    } else {
      this.server.emit('sync-error', error);
    }
    
    // Clean up session
    this.activeSessions.delete(sessionId);
  }
}