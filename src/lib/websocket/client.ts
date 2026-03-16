/**
 * Ubuntu Pools — WebSocket Client Hook
 * Real-time collective pulse subscriptions
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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

export interface CommunityMetrics {
  totalContributions: number;
  activeMembers: number;
  trustCircles: number;
  governanceParticipation: number;
  collectiveProsperity: number;
}

interface UseCollectivePulseReturn {
  socket: Socket | null;
  isConnected: boolean;
  pulses: CollectivePulse[];
  metrics: CommunityMetrics;
  subscribeToCollective: () => void;
  subscribeToTrust: (userId: string) => void;
  subscribeToGovernance: () => void;
}

export function useCollectivePulse(): UseCollectivePulseReturn {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pulses, setPulses] = useState<CollectivePulse[]>([]);
  const [metrics, setMetrics] = useState<CommunityMetrics>({
    totalContributions: 0,
    activeMembers: 0,
    trustCircles: 0,
    governanceParticipation: 0,
    collectiveProsperity: 0,
  });

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('collective:init', (data: { pulses: CollectivePulse[]; metrics: CommunityMetrics }) => {
      setPulses(data.pulses);
      setMetrics(data.metrics);
    });

    socketInstance.on('pulse:new', (pulse: CollectivePulse) => {
      setPulses(prev => [...prev.slice(-49), pulse]);
    });

    socketInstance.on('metrics:update', (newMetrics: CommunityMetrics) => {
      setMetrics(newMetrics);
    });

    socketInstance.on('milestone:achieved', (pulse: CollectivePulse) => {
      setPulses(prev => [...prev.slice(-49), pulse]);
    });

    socketInstance.on('trust:flow', (pulse: CollectivePulse) => {
      setPulses(prev => [...prev.slice(-49), pulse]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      setSocket(socketRef.current);
    }
  }, []);

  const subscribeToCollective = useCallback(() => {
    socket?.emit('subscribe:collective');
  }, [socket]);

  const subscribeToTrust = useCallback((userId: string) => {
    socket?.emit('subscribe:trust', userId);
  }, [socket]);

  const subscribeToGovernance = useCallback(() => {
    socket?.emit('subscribe:governance');
  }, [socket]);

  return {
    socket,
    isConnected,
    pulses,
    metrics,
    subscribeToCollective,
    subscribeToTrust,
    subscribeToGovernance,
  };
}
