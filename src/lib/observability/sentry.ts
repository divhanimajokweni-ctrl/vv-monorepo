/**
 * Ubuntu Pools — Sentry Error Tracking
 * Captures and groups errors for faster debugging
 * 
 * Installation: npm install @sentry/nextjs
 * Set NEXT_PUBLIC_SENTRY_DSN in environment variables
 */

type SentryInstance = typeof import('@sentry/nextjs');

let sentryModule: SentryInstance | null = null;
let sentryInitialized = false;

const isSentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

async function getSentry(): Promise<SentryInstance | null> {
  if (!isSentryEnabled || sentryModule) {
    return sentryModule;
  }
  
  try {
    sentryModule = await import('@sentry/nextjs');
    return sentryModule;
  } catch {
    return null;
  }
}

export async function initializeSentry(): Promise<void> {
  if (sentryInitialized || !isSentryEnabled) {
    return;
  }

  const sentry = await getSentry();
  if (sentry) {
    sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    sentryInitialized = true;
  }
}

export async function captureException(error: Error, context?: Record<string, unknown>): Promise<void> {
  const sentry = await getSentry();
  
  if (sentry) {
    sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('[Error]', error.message, context);
  }
}

export async function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, unknown>
): Promise<void> {
  const sentry = await getSentry();
  
  if (sentry) {
    sentry.captureMessage(message, {
      level,
      ...context,
    });
  } else {
    console.log(`[${level}]`, message, context);
  }
}

export async function trackEvent(
  event: 'ledger_post_failed' | 'shield_triggered' | 'member_signup' | 'loan_approved' | 'contribution_received',
  data?: Record<string, unknown>
): Promise<void> {
  await captureMessage(`[EVENT] ${event}`, 'info', data);
}
