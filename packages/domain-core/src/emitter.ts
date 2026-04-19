export type EventListener = (event: unknown) => void | Promise<void>;

export interface EventEmitter {
  on(event: string, listener: EventListener): void;
  off(event: string, listener: EventListener): void;
  emit(event: string, data: unknown): Promise<void>;
}

export function createEventEmitter(): EventEmitter {
  const listeners: Map<string, EventListener[]> = new Map();

  return {
    on(event: string, listener: EventListener): void {
      const list = listeners.get(event) || [];
      list.push(listener);
      listeners.set(event, list);
    },
    off(event: string, listener: EventListener): void {
      const list = listeners.get(event) || [];
      const idx = list.indexOf(listener);
      if (idx >= 0) list.splice(idx, 1);
      listeners.set(event, list);
    },
    async emit(event: string, data: unknown): Promise<void> {
      const list = listeners.get(event) || [];
      await Promise.all(list.map(l => l(data)));
    },
  };
}

export class SimpleEventEmitter implements EventEmitter {
  private listeners: Map<string, EventListener[]> = new Map();

  on(event: string, listener: EventListener): void {
    const list = this.listeners.get(event) || [];
    list.push(listener);
    this.listeners.set(event, list);
  }

  off(event: string, listener: EventListener): void {
    const list = this.listeners.get(event) || [];
    const idx = list.indexOf(listener);
    if (idx >= 0) list.splice(idx, 1);
    this.listeners.set(event, list);
  }

  async emit(event: string, data: unknown): Promise<void> {
    const list = this.listeners.get(event) || [];
    await Promise.all(list.map(l => l(data)));
  }
}