import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getTeamForUser } from '@/lib/db/queries';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const team = await getTeamForUser(user.id);
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Get merchants for the team
    const merchants = await camInvMerchantService.getMerchantsForTeam(team.id);
    
    // Remove sensitive data before sending to client
    const safeMerchants = merchants.map(merchant => ({
      id: merchant.id,
      merchantId: merchant.merchantId,
      merchantName: merchant.merchantName,
      isActive: merchant.isActive,
      registrationStatus: merchant.registrationStatus,
      lastSyncAt: merchant.lastSyncAt,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
      // Don't send tokens to client
    }));

    return NextResponse.json({ merchants: safeMerchants });
  } catch (error) {
    console.error('Failed to get merchants:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve merchants' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('id');

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 });
    }

    // Disconnect the merchant
    const success = await camInvMerchantService.disconnectMerchant(
      parseInt(merchantId),
      user.id
    );

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to disconnect merchant' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to disconnect merchant:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect merchant' },
      { status: 500 }
    );
  }
}
