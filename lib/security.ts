/**
 * Security utility functions
 */

/**
 * Sanitize error messages to prevent information disclosure
 */
export function sanitizeError(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    // In development, show full error for debugging
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // In production, return generic error messages
  if (error instanceof Error) {
    // Only return safe error messages
    const safeErrors = [
      'Invalid credentials',
      'Unauthorized',
      'Not found',
      'Bad request',
      'Validation failed',
    ];

    if (safeErrors.some(safe => error.message.toLowerCase().includes(safe.toLowerCase()))) {
      return error.message;
    }
  }

  // Default generic message for production
  return 'An error occurred. Please try again later.';
}

/**
 * Validate and sanitize file uploads
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only image files are allowed (JPEG, PNG, WebP, GIF)' };
  }

  return { valid: true };
}

/**
 * Generate a secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

/**
 * Check if request is from a trusted origin (CORS helper)
 */
export function isTrustedOrigin(origin: string): boolean {
  const trustedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXTAUTH_URL,
  ].filter(Boolean);

  return trustedOrigins.includes(origin);
}

/**
 * Sanitize user input to prevent XSS
 * Note: React already escapes values, this is for extra safety
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  strong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    feedback.push('Add special characters');
  }

  return {
    strong: score >= 4,
    score,
    feedback,
  };
}
