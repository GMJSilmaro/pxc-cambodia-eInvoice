import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';
import { z } from 'zod';
import { isNetworkError, getNetworkErrorMessage } from '@/lib/utils/network';

const configureRedirectUrlsSchema = z.object({
  redirect_urls: z.array(z.string().url()).min(1),
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
    const validationResult = configureRedirectUrlsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { redirect_urls } = validationResult.data;

    try {
      // Configure redirect URLs
      const success = await camInvMerchantService.configureRedirectUrls(redirect_urls);

      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Redirect URLs configured successfully',
          configured_urls: redirect_urls,
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to configure redirect URLs' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Failed to configure redirect URLs:', error);

      // Handle network errors gracefully
      if (isNetworkError(error)) {
        const networkMessage = getNetworkErrorMessage(error);

        return NextResponse.json({
          success: false,
          error: networkMessage,
          network_error: true,
          suggestion: 'Please use the new client credentials configuration flow instead.'
        }, { status: 503 });
      }

      return NextResponse.json(
        { error: 'Failed to configure redirect URLs' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to configure redirect URLs:', error);
    return NextResponse.json(
      { error: 'Failed to configure redirect URLs' },
      { status: 500 }
    );
  }
}
