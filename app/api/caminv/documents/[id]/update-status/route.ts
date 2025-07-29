import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvCoreService } from '@/lib/caminv/core-service';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';

// Validation schema for update document status request
const updateStatusSchema = z.object({
  merchant_id: z.number(),
  status: z.enum(['SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED']),
});

/**
 * PUT /api/caminv/documents/[id]/update-status
 * 
 * Update document status using CamInv API
 * Based on: https://doc-caminv.netlify.app/api-reference/update-document-status
 */
export async function PUT(
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

    const { id: documentId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { merchant_id, status } = validationResult.data;

    // Verify merchant belongs to user's team
    const merchant = await camInvMerchantService.getMerchantById(merchant_id);
    if (!merchant || merchant.teamId !== team.id) {
      return NextResponse.json({ error: 'Merchant not found or access denied' }, { status: 404 });
    }

    // Update document status using CamInv API
    const result = await camInvCoreService.updateDocumentStatus(
      merchant_id,
      documentId,
      status,
      user.id
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Document status updated successfully',
        data: result.data,
        merchant: {
          id: merchant.id,
          merchantId: merchant.merchantId,
          merchantName: merchant.merchantName,
        }
      });
    } else {
      return NextResponse.json(
        { 
          error: result.error?.message || 'Failed to update document status',
          success: false 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Failed to update document status:', error);
    return NextResponse.json(
      { error: 'Failed to update document status' },
      { status: 500 }
    );
  }
}
