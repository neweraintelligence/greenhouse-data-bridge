/**
 * Debug logging utility
 * Only logs in development mode to keep production console clean
 */

const isDev = import.meta.env.DEV;

export const debug = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },

  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },

  // Always log errors (even in production) but with structured format
  criticalError: (context: string, error: unknown) => {
    console.error(`[${context}]`, error);
  },
};
