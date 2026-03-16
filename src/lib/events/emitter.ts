/**
 * Ubuntu Pools — Phase 1: Event Emission Library
 *
 * Provides the append-only event emission interface.
 *
 * Governance Charter Compliance:
 *   - Events are ONLY appended, never updated or deleted.
 *   - Every emission validates the payload schema before writing.
 *   - Hash is computed deterministically before insert.
 *   - Sequence numbers are assigned atomically (DB-level uniqueness constraint).
 *   - Duplicate detection via hash uniqueness constraint.
 *   - All operations are transactional.
 *
 * Failure Modes:
 *   - Schema validation failure → EventValidationError (no DB write)
 *   - Hash collision → EventDuplicateError (idempotent, returns existing)
 *   - Sequence conflict → EventSequenceError (retry with new sequence)
 *   - DB error → EventEmissionError (wrapped with context)
 *
 * Usage:
 *   const emitter = new EventEmitter(db);
 *   const event = await emitter.emit({
 *     eventType: 'pool.created',
 *     actorId: '...',
 *     entityId: '...',
 *     entityType: 'pool',
 *     payload: { ... },
 *     occurredAt: new Date().toISOString(),
 *   });
 */

import { eq, and, max, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { events } from "@/db/schema";
import type { NewEvent, Event } from "@/db/schema";
import { computeEventHash } from "./hasher";
import {
  validateEventInput,
  validatePayloadForEventType,
  type CreateEventInput,
} from "./schemas";

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Base class for all event emission errors.
 * All errors include the original input for debugging.
 */
export class EventEmissionError extends Error {
  constructor(
    message: string,
    public readonly input: Partial<CreateEventInput>,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "EventEmissionError";
  }
}

/**
 * Thrown when the event input fails schema validation.
 * No DB write has occurred.
 */
export class EventValidationError extends EventEmissionError {
  constructor(
    public readonly validationErrors: Array<{ path: string; message: string }>,
    input: Partial<CreateEventInput>
  ) {
    super(
      `Event validation failed: ${validationErrors.map((e) => `${e.path}: ${e.message}`).join("; ")}`,
      input
    );
    this.name = "EventValidationError";
  }
}

/**
 * Thrown when an event with the same hash already exists.
 * This is an idempotency signal — the caller can treat this as success.
 */
export class EventDuplicateError extends EventEmissionError {
  constructor(
    public readonly existingEventId: string,
    public readonly hash: string,
    input: Partial<CreateEventInput>
  ) {
    super(
      `Duplicate event detected: hash ${hash} already exists as event ${existingEventId}`,
      input
    );
    this.name = "EventDuplicateError";
  }
}

/**
 * Thrown when the sequence number assignment fails (race condition).
 * The caller should retry.
 */
export class EventSequenceError extends EventEmissionError {
  constructor(
    public readonly entityId: string,
    public readonly attemptedSequenceNo: number,
    input: Partial<CreateEventInput>
  ) {
    super(
      `Sequence conflict for entity ${entityId} at sequence ${attemptedSequenceNo}. Retry required.`,
      input
    );
    this.name = "EventSequenceError";
  }
}

// =============================================================================
// RESULT TYPE
// =============================================================================

/**
 * Result of a successful event emission.
 */
export interface EmitResult {
  /** The persisted event */
  event: Event;
  /** Whether this was a new emission or a duplicate (idempotent) */
  wasNew: boolean;
}

// =============================================================================
// EVENT EMITTER
// =============================================================================

/**
 * EventEmitter: the sole interface for writing events to the event log.
 *
 * Design principles:
 *   1. Validate before write — schema errors never reach the DB.
 *   2. Hash before write — hash is computed from validated input.
 *   3. Sequence atomically — sequence_no assigned in a transaction.
 *   4. Idempotent — duplicate hashes return the existing event.
 *   5. No deletes, no updates — append only.
 */
export class EventEmitter {
  constructor(private readonly db: Database) {}

  /**
   * Emits a new event to the append-only event log.
   *
   * Steps:
   *   1. Validate input schema.
   *   2. Validate payload against event type schema.
   *   3. Acquire next sequence number for the entity (in transaction).
   *   4. Compute deterministic hash.
   *   5. Check for duplicate hash (idempotency).
   *   6. Insert event row.
   *   7. Return the persisted event.
   *
   * @param input - Event input (eventType, actorId, entityId, entityType, payload, occurredAt)
   * @returns EmitResult with the persisted event
   * @throws EventValidationError if input is invalid
   * @throws EventDuplicateError if hash already exists (idempotent)
   * @throws EventSequenceError if sequence conflict (retry)
   * @throws EventEmissionError for other DB errors
   */
  async emit(input: CreateEventInput): Promise<EmitResult> {
    // -------------------------------------------------------------------------
    // Step 1: Validate base input schema
    // -------------------------------------------------------------------------
    const inputValidation = validateEventInput(input);
    if (!inputValidation.success) {
      // Zod v4 uses .issues (path is PropertyKey[] which includes symbol)
      const errors = inputValidation.error.issues.map((e) => ({
        path: Array.from(e.path).map(String).join("."),
        message: e.message,
      }));
      throw new EventValidationError(errors, input);
    }

    const validInput = inputValidation.data;

    // -------------------------------------------------------------------------
    // Step 2: Validate payload against event type schema
    // -------------------------------------------------------------------------
    const payloadValidation = validatePayloadForEventType(
      validInput.eventType,
      validInput.payload
    );
    if (!payloadValidation.success) {
      // Zod v4 uses .issues (path is PropertyKey[] which includes symbol)
      const errors = payloadValidation.error.issues.map((e) => ({
        path: `payload.${Array.from(e.path).map(String).join(".")}`,
        message: e.message,
      }));
      throw new EventValidationError(errors, input);
    }

    // -------------------------------------------------------------------------
    // Steps 3–6: Execute in a serializable transaction
    // -------------------------------------------------------------------------
    try {
      return await this.db.transaction(async (tx) => {
        // Step 3: Get next sequence number for this entity
        const sequenceNo = await this.getNextSequenceNo(
          tx as unknown as Database,
          validInput.entityId
        );

        // Get the previous event's hash for chain linking
        const prevHash = await this.getPrevHash(
          tx as unknown as Database,
          validInput.entityId,
          sequenceNo
        );

        // Step 4: Compute deterministic hash
        const { hash } = computeEventHash({
          eventType: validInput.eventType,
          actorId: validInput.actorId,
          entityId: validInput.entityId,
          entityType: validInput.entityType,
          payload: validInput.payload as Record<string, unknown>,
          occurredAt: validInput.occurredAt,
          sequenceNo,
          prevHash,
        });

        // Step 5: Check for duplicate hash (idempotency)
        const existing = await tx
          .select()
          .from(events)
          .where(eq(events.hash, hash))
          .limit(1);

        if (existing.length > 0) {
          throw new EventDuplicateError(existing[0].id, hash, input);
        }

        // Step 6: Insert the event
        const newEvent: NewEvent = {
          eventType: validInput.eventType,
          actorId: validInput.actorId,
          entityId: validInput.entityId,
          entityType: validInput.entityType,
          payload: validInput.payload,
          occurredAt: new Date(validInput.occurredAt),
          sequenceNo,
          hash,
          prevHash,
          status: "pending",
        };

        const [inserted] = await tx
          .insert(events)
          .values(newEvent)
          .returning();

        if (!inserted) {
          throw new EventEmissionError(
            "Event insert returned no rows",
            input
          );
        }

        return { event: inserted, wasNew: true };
      });
    } catch (error) {
      // Re-throw our typed errors
      if (
        error instanceof EventValidationError ||
        error instanceof EventDuplicateError ||
        error instanceof EventSequenceError
      ) {
        throw error;
      }

      // Detect sequence conflict from DB unique constraint violation
      if (
        error instanceof Error &&
        error.message.includes("events_entity_sequence_unique")
      ) {
        throw new EventSequenceError(
          validInput.entityId,
          -1, // sequence not known at this point
          input
        );
      }

      // Wrap unknown DB errors
      throw new EventEmissionError(
        `Failed to emit event: ${error instanceof Error ? error.message : String(error)}`,
        input,
        error
      );
    }
  }

  /**
   * Emits multiple events in a single transaction.
   * All events succeed or all fail (atomic batch).
   *
   * Events are emitted in the order provided.
   * Each event's sequence number is assigned sequentially.
   *
   * @param inputs - Array of event inputs
   * @returns Array of EmitResults in the same order
   */
  async emitBatch(inputs: CreateEventInput[]): Promise<EmitResult[]> {
    if (inputs.length === 0) return [];

    const results: EmitResult[] = [];

    await this.db.transaction(async (tx) => {
      for (const input of inputs) {
        // Validate each input
        const inputValidation = validateEventInput(input);
        if (!inputValidation.success) {
          // Zod v4 uses .issues (path is PropertyKey[] which includes symbol)
          const errors = inputValidation.error.issues.map((e) => ({
            path: Array.from(e.path).map(String).join("."),
            message: e.message,
          }));
          throw new EventValidationError(errors, input);
        }

        const validInput = inputValidation.data;

        // Get next sequence number
        const sequenceNo = await this.getNextSequenceNo(
          tx as unknown as Database,
          validInput.entityId
        );

        // Get prev hash
        const prevHash = await this.getPrevHash(
          tx as unknown as Database,
          validInput.entityId,
          sequenceNo
        );

        // Compute hash
        const { hash } = computeEventHash({
          eventType: validInput.eventType,
          actorId: validInput.actorId,
          entityId: validInput.entityId,
          entityType: validInput.entityType,
          payload: validInput.payload as Record<string, unknown>,
          occurredAt: validInput.occurredAt,
          sequenceNo,
          prevHash,
        });

        // Insert
        const newEvent: NewEvent = {
          eventType: validInput.eventType,
          actorId: validInput.actorId,
          entityId: validInput.entityId,
          entityType: validInput.entityType,
          payload: validInput.payload,
          occurredAt: new Date(validInput.occurredAt),
          sequenceNo,
          hash,
          prevHash,
          status: "pending",
        };

        const [inserted] = await (tx as unknown as Database)
          .insert(events)
          .values(newEvent)
          .returning();

        if (!inserted) {
          throw new EventEmissionError("Batch event insert returned no rows", input);
        }

        results.push({ event: inserted, wasNew: true });
      }
    });

    return results;
  }

  /**
   * Transitions an event's status from 'pending' to 'posted' or 'failed'.
   *
   * This is the ONLY permitted mutation of an event row.
   * All other fields are immutable (enforced by DB trigger).
   *
   * @param eventId - UUID of the event to transition
   * @param newStatus - 'posted' or 'failed'
   * @throws EventEmissionError if the transition is invalid
   */
  async transitionStatus(
    eventId: string,
    newStatus: "posted" | "failed"
  ): Promise<Event> {
    const [existing] = await this.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existing) {
      throw new EventEmissionError(
        `Event ${eventId} not found`,
        { entityId: eventId }
      );
    }

    if (existing.status !== "pending") {
      throw new EventEmissionError(
        `Event ${eventId} is in status '${existing.status}' and cannot be transitioned to '${newStatus}'`,
        { entityId: eventId }
      );
    }

    const [updated] = await this.db
      .update(events)
      .set({ status: newStatus })
      .where(
        and(eq(events.id, eventId), eq(events.status, "pending"))
      )
      .returning();

    if (!updated) {
      throw new EventEmissionError(
        `Failed to transition event ${eventId} to '${newStatus}' — concurrent modification detected`,
        { entityId: eventId }
      );
    }

    return updated;
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Gets the next sequence number for an entity.
   * Returns 1 if this is the first event for the entity.
   *
   * IMPORTANT: Must be called within a transaction to prevent race conditions.
   * The DB unique constraint (entity_id, sequence_no) is the final guard.
   */
  private async getNextSequenceNo(
    tx: Database,
    entityId: string
  ): Promise<number> {
    const result = await tx
      .select({ maxSeq: max(events.sequenceNo) })
      .from(events)
      .where(eq(events.entityId, entityId));

    const currentMax = result[0]?.maxSeq ?? 0;
    return (currentMax as number) + 1;
  }

  /**
   * Gets the hash of the most recent event for an entity.
   * Returns null if this is the first event for the entity.
   *
   * IMPORTANT: Must be called within a transaction.
   */
  private async getPrevHash(
    tx: Database,
    entityId: string,
    nextSequenceNo: number
  ): Promise<string | null> {
    if (nextSequenceNo === 1) return null;

    const result = await tx
      .select({ hash: events.hash })
      .from(events)
      .where(
        and(
          eq(events.entityId, entityId),
          eq(events.sequenceNo, nextSequenceNo - 1)
        )
      )
      .limit(1);

    return result[0]?.hash ?? null;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Creates an EventEmitter instance bound to the given database.
 *
 * @param db - Drizzle database instance
 * @returns EventEmitter
 */
export function createEventEmitter(db: Database): EventEmitter {
  return new EventEmitter(db);
}
