/**
 * Temporary credentials store for CamInv client credentials
 * Uses file-based storage in development to persist across Next.js recompilations
 * In production, this should be replaced with proper database storage
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
  configuredAt: Date;
}

// File-based storage for development to persist across Next.js recompilations
const CREDENTIALS_FILE = join(process.cwd(), '.tmp-credentials.json');

// In-memory cache
const credentialsCache = new Map<string, ClientCredentials>();

// Load credentials from file on startup
function loadCredentialsFromFile(): void {
  try {
    if (existsSync(CREDENTIALS_FILE)) {
      const data = readFileSync(CREDENTIALS_FILE, 'utf8');
      const stored = JSON.parse(data);

      // Convert date strings back to Date objects and check expiration
      const now = new Date();
      for (const [key, creds] of Object.entries(stored)) {
        const credentials = creds as any;
        credentials.configuredAt = new Date(credentials.configuredAt);

        // Only load non-expired credentials
        const expiryTime = new Date(credentials.configuredAt.getTime() + 60 * 60 * 1000);
        if (now <= expiryTime) {
          credentialsCache.set(key, credentials);
        }
      }
    }
  } catch (error) {
    console.warn('[CREDENTIALS] Failed to load credentials from file:', error);
  }
}

// Save credentials to file
function saveCredentialsToFile(): void {
  try {
    const data = Object.fromEntries(credentialsCache.entries());
    writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.warn('[CREDENTIALS] Failed to save credentials to file:', error);
  }
}

// Load credentials on module initialization
loadCredentialsFromFile();

/**
 * Store client credentials temporarily (keyed by user ID or session)
 */
export function storeClientCredentials(
  key: string,
  clientId: string,
  clientSecret: string
): void {
  console.log(`[CREDENTIALS] Storing credentials for key: ${key}`);
  const credentials = {
    clientId,
    clientSecret,
    configuredAt: new Date()
  };

  credentialsCache.set(key, credentials);
  saveCredentialsToFile();

  // Auto-cleanup after 1 hour for security
  setTimeout(() => {
    console.log(`[CREDENTIALS] Auto-cleanup for key: ${key}`);
    credentialsCache.delete(key);
    saveCredentialsToFile();
  }, 60 * 60 * 1000);
}

/**
 * Retrieve client credentials
 */
export function getClientCredentials(key: string): ClientCredentials | null {
  console.log(`[CREDENTIALS] Retrieving credentials for key: ${key}`);

  // Reload from file in case of server restart/recompilation
  loadCredentialsFromFile();

  const credentials = credentialsCache.get(key);

  if (!credentials) {
    console.log(`[CREDENTIALS] No credentials found for key: ${key}`);
    console.log(`[CREDENTIALS] Available keys:`, Array.from(credentialsCache.keys()));
    return null;
  }

  // Check if credentials are expired (1 hour)
  const now = new Date();
  const expiryTime = new Date(credentials.configuredAt.getTime() + 60 * 60 * 1000);

  if (now > expiryTime) {
    console.log(`[CREDENTIALS] Credentials expired for key: ${key}`);
    credentialsCache.delete(key);
    saveCredentialsToFile();
    return null;
  }

  console.log(`[CREDENTIALS] Successfully retrieved credentials for key: ${key}`);
  return credentials;
}

/**
 * Remove client credentials
 */
export function removeClientCredentials(key: string): void {
  console.log(`[CREDENTIALS] Removing credentials for key: ${key}`);
  credentialsCache.delete(key);
  saveCredentialsToFile();
}

/**
 * Get credentials key for a user (can be user ID, session ID, etc.)
 */
export function getCredentialsKey(userId: number): string {
  return `user_${userId}`;
}

/**
 * Clear all expired credentials (cleanup function)
 */
export function cleanupExpiredCredentials(): void {
  const now = new Date();
  let hasChanges = false;

  for (const [key, credentials] of credentialsCache.entries()) {
    const expiryTime = new Date(credentials.configuredAt.getTime() + 60 * 60 * 1000);

    if (now > expiryTime) {
      credentialsCache.delete(key);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    saveCredentialsToFile();
  }
}

/**
 * Clean up temporary credentials file
 */
export function cleanupCredentialsFile(): void {
  try {
    if (existsSync(CREDENTIALS_FILE)) {
      unlinkSync(CREDENTIALS_FILE);
      console.log('[CREDENTIALS] Cleaned up temporary credentials file');
    }
  } catch (error) {
    console.warn('[CREDENTIALS] Failed to cleanup credentials file:', error);
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupExpiredCredentials, 30 * 60 * 1000);

// Cleanup file on process exit
process.on('exit', cleanupCredentialsFile);
process.on('SIGINT', () => {
  cleanupCredentialsFile();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupCredentialsFile();
  process.exit(0);
});
