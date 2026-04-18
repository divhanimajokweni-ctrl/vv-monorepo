import { logger } from "@ubuntu/observability";

export async function bootstrapWorker(): Promise<void> {
  logger.info("worker_bootstrap_started");

  // Register queues / consumers here.
  // Keep this process side-effect driven and explicit.

  logger.info("worker_bootstrap_completed");
}
