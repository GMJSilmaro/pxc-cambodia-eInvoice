/**
 * CamInv Error Handling and Logging Utilities
 */

export enum CamInvErrorCode {
  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // API Errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Invoice Errors
  INVALID_INVOICE_DATA = 'INVALID_INVOICE_DATA',
  INVOICE_NOT_FOUND = 'INVOICE_NOT_FOUND',
  INVOICE_ALREADY_SUBMITTED = 'INVOICE_ALREADY_SUBMITTED',
  INVOICE_VALIDATION_FAILED = 'INVOICE_VALIDATION_FAILED',
  INVALID_OPERATION = 'INVALID_OPERATION',
  
  // UBL XML Errors
  XML_GENERATION_FAILED = 'XML_GENERATION_FAILED',
  XML_VALIDATION_FAILED = 'XML_VALIDATION_FAILED',
  
  // Merchant Errors
  MERCHANT_NOT_FOUND = 'MERCHANT_NOT_FOUND',
  MERCHANT_NOT_ACTIVE = 'MERCHANT_NOT_ACTIVE',
  MERCHANT_CONNECTION_FAILED = 'MERCHANT_CONNECTION_FAILED',
  
  // System Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class CamInvError extends Error {
  public readonly code: CamInvErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    code: CamInvErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'CamInvError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export class CamInvLogger {
  private static instance: CamInvLogger;

  public static getInstance(): CamInvLogger {
    if (!CamInvLogger.instance) {
      CamInvLogger.instance = new CamInvLogger();
    }
    return CamInvLogger.instance;
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: 'CamInv',
      message,
      data,
    };

    // In production, you might want to send logs to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., CloudWatch, DataDog, etc.)
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${timestamp}] [${level.toUpperCase()}] [CamInv] ${message}`, data || '');
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | any) {
    this.log('error', message, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });
  }

  logApiCall(method: string, endpoint: string, duration: number, success: boolean, error?: any) {
    this.info(`API Call: ${method} ${endpoint}`, {
      duration,
      success,
      error: error ? (error instanceof Error ? error.message : error) : undefined,
    });
  }

  logInvoiceOperation(operation: string, invoiceId: string, merchantId: number, success: boolean, error?: any) {
    this.info(`Invoice Operation: ${operation}`, {
      invoiceId,
      merchantId,
      success,
      error: error ? (error instanceof Error ? error.message : error) : undefined,
    });
  }
}

export const logger = CamInvLogger.getInstance();

/**
 * Error handler utility functions
 */
export class CamInvErrorHandler {
  /**
   * Handle API errors and convert them to CamInvError
   */
  static handleApiError(error: any, context?: string): CamInvError {
    logger.error(`API Error${context ? ` in ${context}` : ''}`, error);

    if (error instanceof CamInvError) {
      return error;
    }

    // Handle fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new CamInvError(
        CamInvErrorCode.NETWORK_ERROR,
        'Network connection failed',
        503,
        { originalError: error.message }
      );
    }

    // Handle HTTP errors
    if (error.status) {
      switch (error.status) {
        case 401:
          return new CamInvError(
            CamInvErrorCode.UNAUTHORIZED,
            'Authentication failed',
            401,
            { originalError: error.message }
          );
        case 429:
          return new CamInvError(
            CamInvErrorCode.RATE_LIMIT_EXCEEDED,
            'Rate limit exceeded',
            429,
            { originalError: error.message }
          );
        default:
          return new CamInvError(
            CamInvErrorCode.API_ERROR,
            error.message || 'API request failed',
            error.status,
            { originalError: error.message }
          );
      }
    }

    // Handle database errors
    if (error.code && error.code.startsWith('23')) { // PostgreSQL constraint violations
      return new CamInvError(
        CamInvErrorCode.DATABASE_ERROR,
        'Database constraint violation',
        400,
        { originalError: error.message }
      );
    }

    // Default error
    return new CamInvError(
      CamInvErrorCode.UNKNOWN_ERROR,
      error.message || 'An unknown error occurred',
      500,
      { originalError: error.message }
    );
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(field: string, message: string): CamInvError {
    return new CamInvError(
      CamInvErrorCode.INVALID_INVOICE_DATA,
      `Validation failed for ${field}: ${message}`,
      400,
      { field, validationMessage: message }
    );
  }

  /**
   * Handle merchant errors
   */
  static handleMerchantError(merchantId: number, message: string): CamInvError {
    return new CamInvError(
      CamInvErrorCode.MERCHANT_NOT_ACTIVE,
      message,
      400,
      { merchantId }
    );
  }

  /**
   * Retry logic for API calls
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error instanceof CamInvError) {
          if ([
            CamInvErrorCode.UNAUTHORIZED,
            CamInvErrorCode.INVALID_CREDENTIALS,
            CamInvErrorCode.INVALID_INVOICE_DATA,
          ].includes(error.code)) {
            throw error;
          }
        }

        if (attempt < maxRetries) {
          logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }

    throw this.handleApiError(lastError, 'retry operation');
  }
}

/**
 * Async wrapper for error handling
 */
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw CamInvErrorHandler.handleApiError(error);
    }
  };
}

/**
 * Validation utilities
 */
export class CamInvValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateTaxId(taxId: string): boolean {
    // Cambodia tax ID validation (adjust based on actual format)
    return taxId && taxId.length >= 8 && taxId.length <= 20;
  }

  static validateAmount(amount: number): boolean {
    return amount > 0 && Number.isFinite(amount);
  }

  static validateCurrency(currency: string): boolean {
    const validCurrencies = ['KHR', 'USD'];
    return validCurrencies.includes(currency);
  }

  static validateInvoiceNumber(invoiceNumber: string): boolean {
    return invoiceNumber && invoiceNumber.trim().length > 0;
  }
}
