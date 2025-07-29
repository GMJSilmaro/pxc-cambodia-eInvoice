import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { CamInvApiClient } from '@/lib/caminv/api-client';
import { generateSecureToken } from '@/lib/caminv/encryption';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client_id from query parameters (passed from the frontend)
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.redirect(new URL('/caminv/merchants?error=missing-client-id', request.url));
    }

    // Generate state parameter for CSRF protection
    const state = generateSecureToken(32);

    // Construct redirect URI
    const redirectUri = new URL('/api/caminv/auth/callback', request.url).toString();

    // Create API client with the provided client ID (we'll need the secret later for token exchange)
    const apiClient = new CamInvApiClient(
      process.env.CAMBODIA_API_BASE_URL || 'https://sb-merchant.e-invoice.gov.kh',
      clientId,
      'placeholder' // We'll get the real secret from the stored credentials during callback
    );

    // Generate authorization URL
    const authUrl = apiClient.generateAuthUrl(redirectUri, state);

    // Store state and client_id in session/cookie for validation
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('caminv_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    response.cookies.set('caminv_client_id', clientId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('CamInv authorization error:', error);
    return NextResponse.redirect(new URL('/caminv/merchants?error=authorization-failed', request.url));
  }
}
