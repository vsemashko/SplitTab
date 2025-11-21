import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { verifyAccessToken } from '../utils/jwt';

export class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();

    logger.info('Socket.IO server initialized');
    return this.io;
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware() {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyAccessToken(token as string);
        socket.data.userId = decoded.userId;
        socket.data.email = decoded.email;

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      logger.info(`User ${userId} connected via Socket.IO (${socket.id})`);

      // Track user socket
      this.addUserSocket(userId, socket.id);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User ${userId} disconnected (${socket.id})`);
        this.removeUserSocket(userId, socket.id);
      });

      // Handle joining group rooms
      socket.on('join:group', (groupId: string) => {
        socket.join(`group:${groupId}`);
        logger.debug(`User ${userId} joined group room: ${groupId}`);
      });

      // Handle leaving group rooms
      socket.on('leave:group', (groupId: string) => {
        socket.leave(`group:${groupId}`);
        logger.debug(`User ${userId} left group room: ${groupId}`);
      });

      // Send connection success
      socket.emit('connected', {
        message: 'Connected to SplitTab real-time server',
        userId,
      });
    });
  }

  /**
   * Add user socket to tracking
   */
  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  /**
   * Remove user socket from tracking
   */
  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Emit notification to user
   */
  emitToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
    logger.debug(`Emitted ${event} to user ${userId}`);
  }

  /**
   * Emit to group
   */
  emitToGroup(groupId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(`group:${groupId}`).emit(event, data);
    logger.debug(`Emitted ${event} to group ${groupId}`);
  }

  /**
   * Emit to all connected clients
   */
  emitToAll(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
    logger.debug(`Emitted ${event} to all users`);
  }

  /**
   * Send new notification to user
   */
  sendNotification(userId: string, notification: any) {
    this.emitToUser(userId, 'notification:new', notification);
  }

  /**
   * Send receipt update to user
   */
  sendReceiptUpdate(userId: string, receipt: any) {
    this.emitToUser(userId, 'receipt:updated', receipt);
  }

  /**
   * Send expense update to group
   */
  sendExpenseUpdate(groupId: string, expense: any) {
    this.emitToGroup(groupId, 'expense:updated', expense);
  }

  /**
   * Send settlement update to group
   */
  sendSettlementUpdate(groupId: string, settlement: any) {
    this.emitToGroup(groupId, 'settlement:updated', settlement);
  }

  /**
   * Get server instance
   */
  getIO(): Server | null {
    return this.io;
  }
}

export const socketService = new SocketService();
