import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { z } from 'zod';
import { CamInvApiClient } from '@/lib/caminv/api-client';
import { isNetworkError, getNetworkErrorMessage, retryWithBackoff } from '@/lib/utils/network';
import { storeClientCredentials, getCredentialsKey } from '@/lib/caminv/credentials-store';

const clientCredentialsSchema = z.object({
  clientId: z.string().min(10, 'Client ID must be at least 10 characters'),
  clientSecret: z.string().min(20, 'Client Secret must be at least 20 characters'),
  redirectUrls: z.array(z.string().url()).min(1, 'At least one redirect URL is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = clientCredentialsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { clientId, clientSecret, redirectUrls } = validationResult.data;

    try {
      // Create API client with provided credentials
      const apiClient = new CamInvApiClient(
        process.env.CAMBODIA_API_BASE_URL || 'https://sb-merchant.e-invoice.gov.kh',
        clientId,
        clientSecret
      );

      // Test the credentials by configuring redirect URLs with retry logic
      const configureWithRetry = async () => {
        return await apiClient.configureRedirectUrls(redirectUrls);
      };

      await retryWithBackoff(configureWithRetry, {
        maxRetries: 2,
        baseDelay: 1000,
        retryCondition: (error) => isNetworkError(error)
      });

      // Store credentials temporarily for the OAuth flow
      const credentialsKey = getCredentialsKey(user.id);
      storeClientCredentials(credentialsKey, clientId, clientSecret);

      return NextResponse.json({
        success: true,
        message: 'Client credentials validated and redirect URLs configured successfully',
        configured_urls: redirectUrls,
        credentials_valid: true
      });

    } catch (error) {
      console.error('Failed to configure client credentials:', error);
      
      // Handle API errors (invalid credentials, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid client credentials. Please check your Client ID and Client Secret.',
          credentials_invalid: true
        }, { status: 401 });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to validate credentials or configure redirect URLs',
        details: errorMessage
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Client credentials configuration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
