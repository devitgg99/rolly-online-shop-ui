/**
 * Secure logging utility that prevents sensitive data exposure
 * Only logs in development environment
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log info messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log error messages (sanitized in production)
   */
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error('[ERROR]', message, error);
    } else {
      // In production, only log message without sensitive details
      console.error('[ERROR]', message);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Sanitize sensitive data before logging
   */
  sanitize: (data: any): any => {
    if (!data) return data;

    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'backendToken', 'secret', 'apiKey', 'authorization'];

    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  },
};
