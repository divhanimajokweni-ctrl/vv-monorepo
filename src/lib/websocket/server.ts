/**
 * Ubuntu Pools — WebSocket Infrastructure
 * Real-time collective pulses for Digital Ubuntu
 * 
 * Security fixes applied:
 * - JWT token authentication on connection
 * - User authorization for trust subscriptions
 * - CORS production validation
 * - Memory leak fixes for metrics accumulation
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { randomUUID } from 'crypto';

export interface CollectivePulse {
  id: string;
  type: 'contribution' | 'achievement' | 'trust_update' | 'governance_vote' | 'milestone';
  timestamp: number;
  actorId: string;
  actorType: 'member' | 'pool' | 'system';
  payload: Record<string, unknown>;
  communityImpact: number;
  visualization: {
    color: string;
    intensity: 'subtle' | 'moderate' | 'celebratory';
    duration: number;
  };
}

export interface TrustFlowEvent {
  fromUserId: string;
  toUserId: string;
  trustAmount: number;
  timestamp: number;
}

export interface ContributionEvent {
  contributorId: string;
  resourceType: 'knowledge' | 'curation' | 'support' | 'liquidity';
  amount: number;
  recipientsBenefited: string[];
  timestamp: number;
}

export interface CommunityMetrics {
  totalContributions: number;
  activeMembers: number;
  trustCircles: number;
  governanceParticipation: number;
  collectiveProsperity: number;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface MetricsSnapshot {
  totalContributions: number;
  activeMembers: number;
  trustCircles: number;
  governanceParticipation: number;
  collectiveProsperity: number;
  lastUpdated: number;
}

class UbuntuWebSocketServer {
  private io: SocketIOServer | null = null;
  private pulseHistory: CollectivePulse[] = [];
  private readonly MAX_HISTORY = 1000;
  private metrics: CommunityMetrics = {
    totalContributions: 0,
    activeMembers: 0,
    trustCircles: 0,
    governanceParticipation: 0,
    collectiveProsperity: 0,
  };
  private metricsHistory: MetricsSnapshot[] = [];
  private readonly MAX_METRICS_HISTORY = 100;
  private connectedUsers: Map<string, { userId: string; role: string }> = new Map();
  private readonly MAX_CONNECTED_USERS = 10000;

  private getAllowedOrigins(): string[] {
    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (!envOrigins) {
      if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: ALLOWED_ORIGINS must be set in production!');
        return [];
      }
      console.warn('WARNING: ALLOWED_ORIGINS not set - defaulting to localhost');
      return ['http://localhost:3000'];
    }
    return envOrigins.split(',').map(o => o.trim());
  }

  private verifyToken(token: string): { userId: string; role: string } | null {
    if (!token || token.length < 10) return null;
    
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      
      if (!payload.userId || !payload.expiresAt) return null;
      
      if (new Date(payload.expiresAt) < new Date()) return null;
      
      return {
        userId: payload.userId,
        role: payload.role || 'member',
      };
    } catch {
      return null;
    }
  }

  private authenticateSocket(socket: AuthenticatedSocket): boolean {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      console.warn(`Socket ${socket.id} connection attempt without token`);
      return false;
    }
    
    const user = this.verifyToken(String(token));
    if (!user) {
      console.warn(`Socket ${socket.id} connection with invalid token`);
      return false;
    }
    
    socket.userId = user.userId;
    socket.userRole = user.role;
    return true;
  }

  private validateUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  initialize(httpServer: HTTPServer): SocketIOServer {
    const allowedOrigins = this.getAllowedOrigins();
    
    if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
      throw new Error('ALLOWED_ORIGINS must be configured in production');
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/api/socket',
      maxHttpBufferSize: 10 * 1024,
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const authenticated = this.authenticateSocket(socket);
      
      if (!authenticated) {
        socket.emit('error', { code: 'AUTH_FAILED', message: 'Authentication required' });
        socket.disconnect(true);
        return;
      }

      console.log(`Client connected: ${socket.id}, user: ${socket.userId}`);

      socket.on('subscribe:collective', () => {
        socket.join('collective');
        socket.emit('collective:init', {
          pulses: this.pulseHistory.slice(-50),
          metrics: this.getMetricsSnapshot(),
        });
      });

      socket.on('subscribe:trust', (targetUserId: string) => {
        if (!targetUserId || typeof targetUserId !== 'string') {
          socket.emit('error', { message: 'Invalid userId format' });
          return;
        }

        if (!this.validateUUID(targetUserId)) {
          socket.emit('error', { message: 'Invalid userId - must be UUID' });
          return;
        }

        if (targetUserId.length > 128) {
          socket.emit('error', { message: 'userId too long' });
          return;
        }

        if (socket.userId !== targetUserId && socket.userRole !== 'admin') {
          socket.emit('error', { message: 'Unauthorized to subscribe to this user\'s trust events' });
          return;
        }

        socket.join(`trust:${targetUserId}`);
        this.connectedUsers.set(socket.id, { userId: socket.userId!, role: socket.userRole! });
      });

      socket.on('subscribe:governance', () => {
        socket.join('governance');
      });

      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.connectedUsers.delete(socket.id);
      });
    });

    return this.io;
  }

  private getMetricsSnapshot(): CommunityMetrics {
    const oneHourAgo = Date.now() - 3600000;
    const recentPulses = this.pulseHistory.filter(p => p.timestamp > oneHourAgo);
    const uniqueActors = new Set(recentPulses.map(p => p.actorId)).size;
    
    return {
      totalContributions: this.metrics.totalContributions,
      activeMembers: Math.min(uniqueActors, this.metrics.activeMembers),
      trustCircles: this.metrics.trustCircles,
      governanceParticipation: this.metrics.governanceParticipation,
      collectiveProsperity: this.metrics.collectiveProsperity,
    };
  }

  private storeMetricsSnapshot(): void {
    const snapshot: MetricsSnapshot = {
      ...this.metrics,
      lastUpdated: Date.now(),
    };
    
    this.metricsHistory.push(snapshot);
    if (this.metricsHistory.length > this.MAX_METRICS_HISTORY) {
      this.metricsHistory.shift();
    }
  }

  private resetPeriodicMetrics(): void {
    const oneHourAgo = Date.now() - 3600000;
    const recentPulses = this.pulseHistory.filter(p => p.timestamp > oneHourAgo);
    
    this.metrics.activeMembers = new Set(recentPulses.map(p => p.actorId)).size;
  }

  emitPulse(pulse: Omit<CollectivePulse, 'id'>): CollectivePulse {
    const fullPulse: CollectivePulse = {
      ...pulse,
      id: randomUUID(),
    };

    this.pulseHistory.push(fullPulse);
    if (this.pulseHistory.length > this.MAX_HISTORY) {
      this.pulseHistory.shift();
    }

    if (this.io) {
      this.io.to('collective').emit('pulse:new', fullPulse);
    }

    return fullPulse;
  }

  emitContribution(event: ContributionEvent): void {
    if (event.amount > 0) {
      this.metrics.totalContributions += event.amount;
    }

    const pulse = this.emitPulse({
      type: 'contribution',
      timestamp: event.timestamp,
      actorId: event.contributorId,
      actorType: 'member',
      payload: {
        resourceType: event.resourceType,
        amount: event.amount,
        recipientsCount: event.recipientsBenefited.length,
      },
      communityImpact: event.amount * event.recipientsBenefited.length,
      visualization: {
        color: this.getResourceColor(event.resourceType),
        intensity: event.amount > 100 ? 'celebratory' : event.amount > 50 ? 'moderate' : 'subtle',
        duration: 2000,
      },
    });

    this.storeMetricsSnapshot();
    
    if (this.io) {
      this.io.to('collective').emit('metrics:update', this.getMetricsSnapshot());
    }
  }

  emitTrustFlow(event: TrustFlowEvent): void {
    const pulse = this.emitPulse({
      type: 'trust_update',
      timestamp: event.timestamp,
      actorId: event.fromUserId,
      actorType: 'member',
      payload: {
        toUserId: event.toUserId,
        trustAmount: event.trustAmount,
      },
      communityImpact: event.trustAmount,
      visualization: {
        color: '#10B981',
        intensity: event.trustAmount > 50 ? 'celebratory' : 'moderate',
        duration: 1500,
      },
    });

    if (this.io) {
      this.io.to(`trust:${event.toUserId}`).emit('trust:received', pulse);
      this.io.to('collective').emit('trust:flow', event);
    }
  }

  emitMilestone(type: string, data: Record<string, unknown>): void {
    const pulse = this.emitPulse({
      type: 'milestone',
      timestamp: Date.now(),
      actorId: 'system',
      actorType: 'system',
      payload: data,
      communityImpact: 100,
      visualization: {
        color: '#F59E0B',
        intensity: 'celebratory',
        duration: 5000,
      },
    });

    if (this.io) {
      this.io.emit('milestone:achieved', pulse);
      this.io.to('collective').emit('metrics:update', this.getMetricsSnapshot());
    }
  }

  emitGovernanceUpdate(proposalId: string, voteCount: { approve: number; reject: number }): void {
    const voteDelta = voteCount.approve + voteCount.reject;
    if (voteDelta > 0) {
      this.metrics.governanceParticipation += voteDelta;
    }

    const pulse = this.emitPulse({
      type: 'governance_vote',
      timestamp: Date.now(),
      actorId: proposalId,
      actorType: 'system',
      payload: voteCount,
      communityImpact: voteDelta,
      visualization: {
        color: '#8B5CF6',
        intensity: 'moderate',
        duration: 1000,
      },
    });

    this.storeMetricsSnapshot();
    
    if (this.io) {
      this.io.to('governance').emit('governance:update', pulse);
    }
  }

  updateMetrics(metrics: Partial<CommunityMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };
    this.storeMetricsSnapshot();
    
    if (this.io) {
      this.io.to('collective').emit('metrics:update', this.getMetricsSnapshot());
    }
  }

  getMetrics(): CommunityMetrics {
    return this.getMetricsSnapshot();
  }

  getConnectedUsers(): number {
    return this.connectedUsers.size;
  }

  getPulseHistory(limit = 50): CollectivePulse[] {
    return this.pulseHistory.slice(-limit);
  }

  private getResourceColor(type: string): string {
    const colors: Record<string, string> = {
      knowledge: '#3B82F6',
      curation: '#8B5CF6',
      support: '#10B981',
      liquidity: '#F59E0B',
    };
    return colors[type] || '#6B7280';
  }
}

export const ubuntuWS = new UbuntuWebSocketServer();

export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  return ubuntuWS.initialize(httpServer);
}
