/**
 * Phone number utilities for Cambodia (+855)
 */

export const CAMBODIA_CODE = "+855";

/**
 * Format phone number to include Cambodia prefix
 * Accepts: 12345678, 012345678, 855012345678, +855012345678
 * Returns: +855012345678
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove + if exists
  cleaned = cleaned.replace('+', '');
  
  // Remove 855 prefix if exists
  if (cleaned.startsWith('855')) {
    cleaned = cleaned.substring(3);
  }
  
  // Remove leading 0 if exists
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Add Cambodia code
  return `${CAMBODIA_CODE}${cleaned}`;
}

/**
 * Validate Cambodia phone number
 * Valid formats:
 * - 12345678 (8-9 digits)
 * - 012345678 (starts with 0)
 * - 85512345678 (starts with 855)
 * - +85512345678 (starts with +855)
 */
export function isValidCambodiaPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's 8-9 digits (local)
  if (/^\d{8,9}$/.test(cleaned)) {
    return true;
  }
  
  // Check if it's 9-10 digits starting with 0
  if (/^0\d{8,9}$/.test(cleaned)) {
    return true;
  }
  
  // Check if it's 11-12 digits starting with 855
  if (/^855\d{8,9}$/.test(cleaned)) {
    return true;
  }
  
  return false;
}

/**
 * Display phone number in a nice format
 * +855012345678 -> +855 12 345 678
 */
export function displayPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('855')) {
    const local = cleaned.substring(3);
    return `+855 ${local.substring(0, 2)} ${local.substring(2, 5)} ${local.substring(5)}`;
  }
  
  return phone;
}

/**
 * Check if input is email or phone number
 */
export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

export function isPhoneNumber(input: string): boolean {
  return /^\+?[\d\s-()]+$/.test(input);
}
