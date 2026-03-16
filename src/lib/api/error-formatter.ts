import { z } from "zod";

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
  statusCode: number;
}

export function formatZodError(error: z.ZodError): ApiError {
  return {
    error: "VALIDATION_ERROR",
    message: "Input validation failed",
    details: error.issues.map((e) => ({
      path: Array.from(e.path).map(String).join("."),
      message: e.message,
    })),
    statusCode: 400,
  };
}

export function formatApiError(
  error: string,
  message: string,
  statusCode: number = 500,
  details?: unknown
): ApiError {
  return {
    error,
    message,
    details,
    statusCode,
  };
}

export function formatNotFoundError(resource: string, id?: string): ApiError {
  return formatApiError(
    "NOT_FOUND",
    id ? `${resource} with id '${id}' not found` : `${resource} not found`,
    404
  );
}

export function formatUnauthorizedError(message: string = "Authentication required"): ApiError {
  return formatApiError("UNAUTHORIZED", message, 401);
}

export function formatForbiddenError(message: string = "Access denied"): ApiError {
  return formatApiError("FORBIDDEN", message, 403);
}

export function formatBadRequestError(message: string, details?: unknown): ApiError {
  return formatApiError("BAD_REQUEST", message, 400, details);
}

export function formatInternalError(message: string = "An unexpected error occurred"): ApiError {
  return formatApiError("INTERNAL_ERROR", message, 500);
}

export function formatConflictError(message: string, details?: unknown): ApiError {
  return formatApiError("CONFLICT", message, 409, details);
}

export function formatRateLimitError(message: string = "Too many requests"): ApiError {
  return formatApiError("RATE_LIMIT_EXCEEDED", message, 429);
}
