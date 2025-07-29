import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvCoreService } from '@/lib/caminv/core-service';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';
import { camInvInvoiceService } from '@/lib/caminv/invoice-service';

export async function GET(
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
    const team = await getTeamForUser(user.id);
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const { id } = await params;
    const documentId = id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchant_id');

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    // Verify merchant belongs to user's team
    const merchant = await camInvMerchantService.getMerchantById(parseInt(merchantId));
    if (!merchant || merchant.teamId !== team.id) {
      return NextResponse.json({ error: 'Merchant not found or access denied' }, { status: 404 });
    }

    // Get document details
    const result = await camInvCoreService.getDocumentById(
      parseInt(merchantId),
      documentId,
      user.id
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        document: result.data,
        merchant: {
          id: merchant.id,
          merchantId: merchant.merchantId,
          merchantName: merchant.merchantName,
        }
      });
    } else {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to retrieve document details' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Failed to get document details:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document details' },
      { status: 500 }
    );
  }
}
