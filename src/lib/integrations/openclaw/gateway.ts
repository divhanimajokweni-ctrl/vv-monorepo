import { createHmac } from "crypto";
import { io, Socket } from "socket.io-client";

export interface OpenClawConfig {
  gatewayUrl: string;
  apiKey: string;
  enabled: boolean;
  /** HMAC signing secret for request integrity. Falls back to apiKey if not set. */
  signingSecret?: string;
}

export interface OpenClawNotification {
  type: "SHIELD" | "PROSPERITY" | "EMERGENCY" | "STABILITY" | "MODE_CHANGE";
  mode: "prosperity" | "expansion" | "stability" | "shield" | "emergency";
  buffer: {
    current: number;
    target: number;
    healthRatio: number;
  };
  reasoning: string;
  riskFlags: string[];
  confidence: number;
  timestamp: string;
}

export class OpenClawGateway {
  private gatewayUrl: string;
  private apiKey: string;
  private enabled: boolean;
  private signingSecret: string;
  private socket: Socket | null = null;
  private connected = false;

  constructor(config: OpenClawConfig) {
    this.gatewayUrl = config.gatewayUrl;
    this.apiKey = config.apiKey;
    this.enabled = config.enabled;
    this.signingSecret = config.signingSecret || config.apiKey;
  }

  private signPayload(data: Record<string, unknown>): Record<string, unknown> {
    const timestamp = Date.now().toString();
    const body = JSON.stringify(data);
    const payload = `${timestamp}.${body}`;
    const signature = createHmac("sha256", this.signingSecret)
      .update(payload)
      .digest("hex");
    return { ...data, _signature: signature, _timestamp: timestamp };
  }

  private ensureConnected(): boolean {
    if (!this.enabled) return false;
    if (this.socket?.connected) return true;

    if (!this.socket) {
      this.socket = io(this.gatewayUrl, {
        auth: { apiKey: this.apiKey },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        this.connected = true;
        console.log("[OpenClaw] WebSocket connected");
      });

      this.socket.on("disconnect", () => {
        this.connected = false;
        console.log("[OpenClaw] WebSocket disconnected");
      });

      this.socket.on("connect_error", (err) => {
        this.connected = false;
        console.error("[OpenClaw] Connection error:", err.message);
      });
    }

    return this.socket.connected;
  }

  static fromEnv(): OpenClawGateway {
    return new OpenClawGateway({
      gatewayUrl: process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789",
      apiKey: process.env.OPENCLAW_API_KEY || "",
      enabled: process.env.OPENCLAW_ENABLED === "true",
      signingSecret: process.env.OPENCLAW_SIGNING_SECRET || undefined,
    });
  }

  async notifyStateChange(notification: OpenClawNotification): Promise<boolean> {
    if (!this.enabled) {
      console.log("[OpenClaw] Notifications disabled. Notification:", notification.type);
      return false;
    }

    try {
      if (!this.ensureConnected() || !this.socket) {
        console.error("[OpenClaw] Not connected, cannot send notification");
        return false;
      }

      const data = this.signPayload({
        mode: notification.mode.toUpperCase(),
        buffer: notification.buffer.current,
        reason: notification.reasoning,
        riskFlags: notification.riskFlags,
        confidence: notification.confidence,
        timestamp: notification.timestamp,
      });

      this.socket.emit("stateChange", data);
      console.log("[OpenClaw] Notification sent successfully:", notification.type);
      return true;
    } catch (error) {
      console.error(
        "[OpenClaw] Gateway unreachable:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.enabled) {
      console.log("[OpenClaw] Message (disabled):", message);
      return false;
    }

    try {
      if (!this.ensureConnected() || !this.socket) {
        return false;
      }

      const data = this.signPayload({
        message,
        channel: "whatsapp",
      });

      this.socket.emit("message", data);
      return true;
    } catch (error) {
      console.error(
        "[OpenClaw] Failed to send message:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }

  async getSystemStatus(): Promise<{ connected: boolean; lastHeartbeat?: string }> {
    if (!this.enabled) {
      return { connected: false };
    }

    try {
      if (!this.ensureConnected() || !this.socket) {
        return { connected: false };
      }

      const response = await this.socket.emitWithAck("getHealth");
      return { connected: true, lastHeartbeat: response?.lastHeartbeat };
    } catch {
      return { connected: false };
    }
  }

  async sendHeartbeat(
    status: "healthy" | "degraded" | "critical",
    details?: string
  ): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const emoji = status === "healthy" ? "✅" : status === "degraded" ? "⚠️" : "🚨";
    const message =
      `${emoji} *Backbone Heartbeat*\n\n` +
      `*Status:* ${status.toUpperCase()}${details ? `\n\n*Details:* ${details}` : ""}\n` +
      `_Timestamp: ${new Date().toISOString()}_`;

    return this.sendMessage(message);
  }

  async performSystemHandshake(
    stitchStatus: "online" | "offline" | "degraded",
    lindiweStatus: "ready" | "busy" | "unavailable"
  ): Promise<boolean> {
    if (!this.enabled) {
      console.log("[OpenClaw] Handshake (disabled):", { stitchStatus, lindiweStatus });
      return false;
    }

    const isHealthy = stitchStatus === "online" && lindiweStatus === "ready";

    if (isHealthy) {
      return this.sendHeartbeat("healthy", `Stitch: ${stitchStatus} | Lindiwe: ${lindiweStatus}`);
    } else if (stitchStatus === "offline") {
      return this.sendMessage(
        `🚨 *CRITICAL: Backbone Disconnect*\n\n` +
          `Stitch API is offline. Lindiwe has lost her financial vision.\n\n` +
          `_Recommended: Pause Matchmaking to prevent failed transactions._`
      );
    } else {
      return this.sendHeartbeat("degraded", `Stitch: ${stitchStatus} | Lindiwe: ${lindiweStatus}`);
    }
  }

  async notifyPriorityAlert(alert: string): Promise<boolean> {
    if (!this.enabled) {
      console.log("[OpenClaw] Priority Alert (disabled):", alert);
      return false;
    }

    const message = `🚨 *PRIORITY ALERT*\n\n${alert}\n\n_Immediate attention required._`;
    return this.sendMessage(message);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log("[OpenClaw] Disconnected");
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

let openClawInstance: OpenClawGateway | null = null;

export function createOpenClawGateway(config?: Partial<OpenClawConfig>): OpenClawGateway {
  const finalConfig: OpenClawConfig = {
    gatewayUrl: config?.gatewayUrl || process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789",
    apiKey: config?.apiKey || process.env.OPENCLAW_API_KEY || "",
    enabled: config?.enabled ?? process.env.OPENCLAW_ENABLED === "true",
    signingSecret: config?.signingSecret || process.env.OPENCLAW_SIGNING_SECRET || undefined,
  };
  return new OpenClawGateway(finalConfig);
}

export function initializeOpenClaw(config?: Partial<OpenClawConfig>): OpenClawGateway {
  openClawInstance = createOpenClawGateway(config);
  return openClawInstance;
}

export function getOpenClawGateway(): OpenClawGateway {
  if (!openClawInstance) {
    openClawInstance = OpenClawGateway.fromEnv();
  }
  return openClawInstance;
}

export const openClawGateway = getOpenClawGateway();
