/**
 * CamInv API Configuration
 * Centralized configuration management for CamInv integration
 */

export interface CamInvConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  serviceProviderName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get CamInv configuration from environment variables
 */
export function getCamInvConfig(): CamInvConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development' || nodeEnv !== 'production';
  const isProduction = nodeEnv === 'production';

  // API configuration
  const baseUrl = process.env.CAMBODIA_API_BASE_URL || 'https://sb-merchant.e-invoice.gov.kh';
  const clientId = process.env.CAMBODIA_CLIENT_ID || '';
  const clientSecret = process.env.CAMBODIA_CLIENT_SECRET || '';
  const serviceProviderName = process.env.CAMBODIA_SERVICE_PROVIDER_NAME || 'Pixel Pinnacle-WG';

  return {
    baseUrl,
    clientId,
    clientSecret,
    serviceProviderName,
    isDevelopment,
    isProduction,
  };
}

/**
 * Check if we're in development mode
 */
export function isDevelopmentMode(): boolean {
  const config = getCamInvConfig();
  return config.isDevelopment;
}

/**
 * Get OAuth redirect URL for the current environment
 */
export function getOAuthRedirectUrl(baseUrl?: string): string {
  const appBaseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3004';
  return `${appBaseUrl}/api/caminv/auth/callback`;
}

/**
 * Validate CamInv configuration
 */
export function validateCamInvConfig(): { valid: boolean; errors: string[] } {
  const config = getCamInvConfig();
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('CAMBODIA_API_BASE_URL is required');
  }

  if (!config.clientId) {
    errors.push('CAMBODIA_CLIENT_ID is required');
  }

  if (!config.clientSecret) {
    errors.push('CAMBODIA_CLIENT_SECRET is required');
  }

  if (!config.serviceProviderName) {
    errors.push('CAMBODIA_SERVICE_PROVIDER_NAME is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration status for debugging
 */
export function getConfigStatus(): {
  config: CamInvConfig;
  validation: { valid: boolean; errors: string[] };
  recommendations: string[];
} {
  const config = getCamInvConfig();
  const validation = validateCamInvConfig();
  const recommendations: string[] = [];

  // Provide recommendations based on current state
  if (config.isDevelopment) {
    recommendations.push('Consider enabling CAMINV_MOCK_API=true for development when CamInv API is unreachable (not needed)');
  }

  if (config.isProduction) {
    recommendations.push('Disable CAMINV_MOCK_API in production environment (not needed)');
  }

  if (config.isProduction) {
    recommendations.push('Disable CAMINV_DEV_MODE in production environment (not needed)');
  }

  if (!validation.valid) {
    recommendations.push('Fix configuration errors before proceeding');
  }

  return {
    config,
    validation,
    recommendations,
  };
}
