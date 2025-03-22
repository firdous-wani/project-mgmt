import crypto from 'crypto';

/**
 * Generates a secure random token for use in invitations, password resets, etc.
 * @param length The length of the token to generate (default: 32)
 * @returns A secure random token string
 */
export function generateToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length);
} 