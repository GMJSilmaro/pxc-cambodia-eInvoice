import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvCoreService } from '@/lib/caminv/core-service';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';

// Validation schema for send document request
const sendDocumentSchema = z.object({
  merchant_id: z.number(),
  customer_email: z.string().email(),
  message: z.string().optional(),
});

/**
 * POST /api/caminv/documents/[id]/send
 * 
 * Send document to customer using CamInv Send Document API
 * Based on: https://doc-caminv.netlify.app/api-reference/send-document
 */
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
    const team = await getTeamForUser(user.id);
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const { id: documentId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = sendDocumentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { merchant_id, customer_email, message } = validationResult.data;

    // Verify merchant belongs to user's team
    const merchant = await camInvMerchantService.getMerchantById(merchant_id);
    if (!merchant || merchant.teamId !== team.id) {
      return NextResponse.json({ error: 'Merchant not found or access denied' }, { status: 404 });
    }

    // Send document using CamInv API
    const result = await camInvCoreService.sendDocument(
      merchant_id,
      documentId,
      customer_email,
      message,
      user.id
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Document sent successfully',
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
          error: result.error?.message || 'Failed to send document',
          success: false 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Failed to send document:', error);
    return NextResponse.json(
      { error: 'Failed to send document' },
      { status: 500 }
    );
  }
}
