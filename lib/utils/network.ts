/**
 * Network utilities for handling connectivity issues and retries
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
}

export interface NetworkError extends Error {
  code?: string;
  isNetworkError: boolean;
  isTimeout: boolean;
  isDNSError: boolean;
  isConnectionRefused: boolean;
}

/**
 * Check if an error is a network connectivity issue
 */
export function isNetworkError(error: unknown): error is NetworkError {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  const isNetwork = 
    message.includes('fetch failed') ||
    message.includes('network error') ||
    message.includes('enotfound') ||
    message.includes('econnrefused') ||
    message.includes('timeout') ||
    message.includes('connection refused') ||
    message.includes('dns') ||
    message.includes('getaddrinfo');

  return isNetwork;
}

/**
 * Create a NetworkError with additional metadata
 */
export function createNetworkError(originalError: Error): NetworkError {
  const message = originalError.message.toLowerCase();
  
  const networkError = new Error(originalError.message) as NetworkError;
  networkError.name = 'NetworkError';
  networkError.isNetworkError = true;
  networkError.isTimeout = message.includes('timeout');
  networkError.isDNSError = message.includes('enotfound') || message.includes('dns');
  networkError.isConnectionRefused = message.includes('econnrefused') || message.includes('connection refused');
  networkError.stack = originalError.stack;
  
  return networkError;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = isNetworkError
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if this is the last attempt or if retry condition is not met
      if (attempt === maxRetries || !retryCondition(lastError)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      
      console.warn(`Network request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if a URL is reachable
 */
export async function checkConnectivity(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get user-friendly error message for network issues
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (!isNetworkError(error)) {
    return error instanceof Error ? error.message : 'An unknown error occurred';
  }
  
  const networkError = error as NetworkError;
  
  if (networkError.isDNSError) {
    return 'Unable to connect to the CamInv API. The service may be temporarily unavailable or there may be a network connectivity issue.';
  }
  
  if (networkError.isConnectionRefused) {
    return 'Connection to CamInv API was refused. The service may be down for maintenance.';
  }
  
  if (networkError.isTimeout) {
    return 'Request to CamInv API timed out. Please check your internet connection and try again.';
  }
  
  return 'Network error occurred while connecting to CamInv API. Please check your internet connection and try again.';
}
