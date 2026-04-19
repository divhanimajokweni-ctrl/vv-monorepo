export interface SystemEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export type EventHandler = (payload: Record<string, unknown>) => void | Promise<void>;

export interface ServiceBusConfig {
  debug?: boolean;
}

export class ServiceBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private config: ServiceBusConfig;

  constructor(config: ServiceBusConfig = {}) {
    this.config = config;
  }

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    if (this.config.debug) {
      console.log(`[ServiceBus] Registered handler for: ${eventType}`);
    }

    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  async emit(eventType: string, payload: Record<string, unknown>): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) {
      if (this.config.debug) {
        console.log(`[ServiceBus] No handlers for: ${eventType}`);
      }
      return;
    }

    const event: SystemEvent = {
      type: eventType,
      payload,
      timestamp: new Date(),
    };

    if (this.config.debug) {
      console.log(`[ServiceBus] Emitting: ${eventType}`, payload);
    }

    await Promise.all(
      Array.from(handlers).map(handler => handler(event.payload))
    );
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const serviceBus = new ServiceBus();