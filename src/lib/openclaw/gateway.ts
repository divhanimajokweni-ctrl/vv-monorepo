import type { BackboneState, BackboneAuditEntry } from '../backbone/controller';

export interface OpenClawNotification {
  type: 'SHIELD' | 'PROSPERITY' | 'EMERGENCY' | 'STABILITY' | 'MODE_CHANGE';
  mode: BackboneState['currentMode'];
  buffer: {
    current: number;
    target: number;
    healthRatio: number;
  };
  reasoning: string;
  riskFlags: string[];
  confidence: number;
  timestamp: string;
  auditEntry?: BackboneAuditEntry;
}

export class OpenClawGateway {
  private gatewayUrl: string;
  private apiKey: string;
  private enabled: boolean;

  constructor() {
    this.gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
    this.apiKey = process.env.OPENCLAW_API_KEY || '';
    this.enabled = process.env.OPENCLAW_ENABLED === 'true' && !!this.apiKey;
  }

  async notifyStateChange(notification: OpenClawNotification): Promise<boolean> {
    if (!this.enabled) {
      console.log('[OpenClaw] Notifications disabled. Notification:', notification.type);
      return false;
    }

    try {
      const endpoint = `${this.gatewayUrl}/api/skills/ubuntu-monitor/onStateChange`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          mode: notification.mode.toUpperCase(),
          buffer: notification.buffer.current,
          reason: notification.reasoning,
          riskFlags: notification.riskFlags,
          confidence: notification.confidence,
          timestamp: notification.timestamp,
        }),
      });

      if (!response.ok) {
        console.error('[OpenClaw] Failed to send notification:', response.statusText);
        return false;
      }

      console.log('[OpenClaw] Notification sent successfully:', notification.type);
      return true;
    } catch (error) {
      console.error('[OpenClaw] Gateway unreachable:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.enabled) {
      console.log('[OpenClaw] Message (disabled):', message);
      return false;
    }

    try {
      const endpoint = `${this.gatewayUrl}/api/channels/send`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          message,
          channel: 'whatsapp',
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[OpenClaw] Failed to send message:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async getSystemStatus(): Promise<{ connected: boolean; lastHeartbeat?: string }> {
    if (!this.enabled) {
      return { connected: false };
    }

    try {
      const response = await fetch(`${this.gatewayUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { connected: true, lastHeartbeat: data.lastHeartbeat };
      }
    } catch {
      return { connected: false };
    }

    return { connected: false };
  }

  async sendHeartbeat(status: 'healthy' | 'degraded' | 'critical', details?: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const emoji = status === 'healthy' ? '✅' : status === 'degraded' ? '⚠️' : '🚨';
    const message = `${emoji} *Backbone Heartbeat*\n\n` +
      `*Status:* ${status.toUpperCase()}${details ? `\n\n*Details:* ${details}` : ''}\n` +
      `_Timestamp: ${new Date().toISOString()}_`;

    return this.sendMessage(message);
  }

  async performSystemHandshake(
    stitchStatus: 'online' | 'offline' | 'degraded',
    lindiweStatus: 'ready' | 'busy' | 'unavailable'
  ): Promise<boolean> {
    if (!this.enabled) {
      console.log('[OpenClaw] Handshake (disabled):', { stitchStatus, lindiweStatus });
      return false;
    }

    const isHealthy = stitchStatus === 'online' && lindiweStatus === 'ready';
    
    if (isHealthy) {
      return this.sendHeartbeat('healthy', `Stitch: ${stitchStatus} | Lindiwe: ${lindiweStatus}`);
    } else if (stitchStatus === 'offline') {
      return this.sendMessage(
        `🚨 *CRITICAL: Backbone Disconnect*\n\n` +
        `Stitch API is offline. Lindiwe has lost her financial vision.\n\n` +
        `_Recommended: Pause Matchmaking to prevent failed transactions._`
      );
    } else {
      return this.sendHeartbeat('degraded', `Stitch: ${stitchStatus} | Lindiwe: ${lindiweStatus}`);
    }
  }

  async notifyPriorityAlert(alert: string): Promise<boolean> {
    if (!this.enabled) {
      console.log('[OpenClaw] Priority Alert (disabled):', alert);
      return false;
    }

    const message = `🚨 *PRIORITY ALERT*\n\n${alert}\n\n_Immediate attention required._`;
    return this.sendMessage(message);
  }
}

export const openClawGateway = new OpenClawGateway();
