export interface SystemEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export type EventHandler = (payload: Record<string, unknown>) => void | Promise<void>;

export interface ServiceBusConfig {
  debug?: boolean;
}

class ServiceBus {
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

    const promises: Promise<void>[] = [];
    for (const handler of handlers) {
      try {
        const result = handler(event.payload);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error(`[ServiceBus] Error in handler for ${eventType}:`, error);
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  once(eventType: string, handler: EventHandler): void {
    const wrappedHandler = async (payload: Record<string, unknown>) => {
      this.off(eventType, wrappedHandler);
      await handler(payload);
    };
    this.on(eventType, wrappedHandler);
  }

  removeAllHandlers(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }

  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size ?? 0;
  }

  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export function createServiceBus(config?: ServiceBusConfig): ServiceBus {
  return new ServiceBus(config);
}

export const serviceBus = new ServiceBus();
