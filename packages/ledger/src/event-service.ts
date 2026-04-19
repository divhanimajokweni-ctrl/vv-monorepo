export interface EventService {
  emit(eventType: string, payload: unknown): Promise<void>;
}

export class LedgerEventService implements EventService {
  async emit(eventType: string, payload: unknown): Promise<void> {
    console.log(`Event: ${eventType}`, payload);
  }
}

export const eventService = new LedgerEventService();