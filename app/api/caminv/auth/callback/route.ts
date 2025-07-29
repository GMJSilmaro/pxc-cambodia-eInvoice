import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';
import { getClientCredentials, getCredentialsKey, removeClientCredentials } from '@/lib/caminv/credentials-store';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Get user's team
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.redirect(new URL('/caminv/merchants?error=no-team', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    // According to CamInv documentation, the callback receives 'authToken' not 'code'
    const authToken = searchParams.get('authToken');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Authorization failed';
      return NextResponse.redirect(
        new URL(`/caminv/merchants?error=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    // Validate authToken (as per CamInv documentation)
    if (!authToken) {
      return NextResponse.redirect(
        new URL('/caminv/merchants?error=missing-auth-token', request.url)
      );
    }

    // Get stored client credentials
    const credentialsKey = getCredentialsKey(user.id);
    const credentials = getClientCredentials(credentialsKey);

    if (!credentials) {
      return NextResponse.redirect(
        new URL('/caminv/merchants?error=credentials-expired', request.url)
      );
    }

    // Construct redirect URI (must match the one used in authorization request)
    const redirectUri = new URL('/api/caminv/auth/callback', request.url).toString();

    // Connect the merchant with stored credentials using authToken
    console.log('[OAUTH CALLBACK] Starting token exchange with authToken:', authToken.substring(0, 50) + '...');
    console.log('[OAUTH CALLBACK] Using credentials for client ID:', credentials.clientId);
    console.log('[OAUTH CALLBACK] Redirect URI:', redirectUri);

    const result = await camInvMerchantService.connectMerchantWithCredentials(
      team.id,
      authToken,
      redirectUri,
      credentials.clientId,
      credentials.clientSecret,
      user.id
    );

    console.log('[OAUTH CALLBACK] Merchant connection result:', { success: result.success, error: result.error });

    // Clean up stored credentials after use
    removeClientCredentials(credentialsKey);

    if (result.success) {
      return NextResponse.redirect(
        new URL('/caminv/merchants?success=connected', request.url)
      );
    } else {
      return NextResponse.redirect(
        new URL(`/caminv/merchants?error=${encodeURIComponent(result.error || 'Connection failed')}`, request.url)
      );
    }
  } catch (error) {
    console.error('CamInv OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/caminv/merchants?error=callback-error', request.url)
    );
  }
}
