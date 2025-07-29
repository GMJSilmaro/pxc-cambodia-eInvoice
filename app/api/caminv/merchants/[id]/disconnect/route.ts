import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 400 });
    }

    const { id } = await params;
    const merchantId = parseInt(id);
    if (isNaN(merchantId)) {
      return NextResponse.json({ error: 'Invalid merchant ID' }, { status: 400 });
    }

    // Verify merchant belongs to user's team
    const merchant = await camInvMerchantService.getMerchantById(merchantId);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    if (merchant.teamId !== team.id) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Disconnect the merchant
    const result = await camInvMerchantService.disconnectMerchant(merchantId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to disconnect merchant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Merchant disconnected successfully' 
    });

  } catch (error) {
    console.error('Error disconnecting merchant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
