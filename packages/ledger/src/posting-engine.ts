import type { Database } from "@ubuntu/db/client";

export interface PostingResult {
  entryId: string;
  success: boolean;
}

export class PostingEngine {
  constructor(db: Database) {}
  async post(eventId: string, lines: unknown[]): Promise<PostingResult> {
    return { entryId: eventId, success: true };
  }
}