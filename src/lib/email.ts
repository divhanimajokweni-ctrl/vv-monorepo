import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

// Exponential backoff delay
function getDelay(attempt: number): number {
  return BASE_DELAY * Math.pow(2, attempt - 1);
}

// Should retry based on error code
function shouldRetry(error: any): boolean {
  const retryableCodes = [429, 500, 502, 503, 504];
  return retryableCodes.includes(error?.statusCode || error?.code);
}

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Single email interface - using Resend types
export type EmailData = Parameters<Resend['emails']['send']>[0];

// Batch email interface - emails without attachments/scheduling
export type BatchEmailData = Omit<EmailData, 'attachments' | 'scheduled_at'>;

// Send single email with retries and idempotency
export async function sendEmail(
  emailData: EmailData,
  idempotencyKey: string,
  maxRetries: number = MAX_RETRIES
): Promise<{ success: boolean; data?: any; error?: string }> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await resend.emails.send(emailData, {
        idempotencyKey,
      });

      if (error) {
        if (shouldRetry(error)) {
          lastError = error;
          if (attempt < maxRetries) {
            await sleep(getDelay(attempt));
            continue;
          }
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      lastError = err;
      if (shouldRetry(err) && attempt < maxRetries) {
        await sleep(getDelay(attempt));
        continue;
      }
      return { success: false, error: (err as Error).message };
    }
  }

  return { success: false, error: lastError?.message || 'Max retries exceeded' };
}

// Send batch emails with retries and idempotency
export async function sendBatchEmails(
  emails: BatchEmailData[],
  idempotencyKey: string,
  maxRetries: number = MAX_RETRIES
): Promise<{ success: boolean; data?: any; error?: string }> {
  // Pre-validation
  if (emails.length > 100) {
    return { success: false, error: 'Batch size cannot exceed 100 emails' };
  }

  for (const email of emails) {
    if (!email.from || !email.to || !email.subject || (!email.html && !email.text)) {
      return { success: false, error: 'All emails must have required fields: from, to, subject, html/text' };
    }
    if (email.to.length > 50) {
      return { success: false, error: 'Individual email cannot have more than 50 recipients' };
    }
  }

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await resend.batch.send(emails as any, {
        idempotencyKey,
      });

      if (error) {
        if (shouldRetry(error)) {
          lastError = error;
          if (attempt < maxRetries) {
            await sleep(getDelay(attempt));
            continue;
          }
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      lastError = err;
      if (shouldRetry(err) && attempt < maxRetries) {
        await sleep(getDelay(attempt));
        continue;
      }
      return { success: false, error: (err as Error).message };
    }
  }

  return { success: false, error: lastError?.message || 'Max retries exceeded' };
}