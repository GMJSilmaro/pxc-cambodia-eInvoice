import { NextRequest, NextResponse } from 'next/server';
import { camInvWebhookService, type WebhookEvent } from '@/lib/caminv/webhook-service';



export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    
    // Get webhook signature from headers
    const signature = request.headers.get('x-caminv-signature');
    const timestamp = request.headers.get('x-caminv-timestamp');
    
    // TODO: Implement signature verification when CamInv provides webhook signing
    // For now, we'll process all webhooks but log them for security monitoring
    console.log('[WEBHOOK] Received CamInv webhook:', {
      signature,
      timestamp,
      bodyLength: body.length
    });

    // Parse the webhook payload
    let event: WebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('[WEBHOOK] Invalid JSON payload:', error);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    console.log('[WEBHOOK] Processing event:', event.type, event);

    // Process the webhook event using the service
    const result = await camInvWebhookService.processWebhookEvent(event);

    if (result.success) {
      return NextResponse.json({
        success: true,
        processed: event.type,
        message: result.message
      });
    } else {
      return NextResponse.json({
        error: result.message || 'Processing failed',
        event_type: event.type
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification (if required by CamInv)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    // Return the challenge for webhook verification
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    message: 'CamInv Webhook Endpoint',
    status: 'active'
  });
}
