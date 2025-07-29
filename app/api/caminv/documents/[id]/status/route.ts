import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvCoreService } from '@/lib/caminv/core-service';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';
import { camInvInvoiceService } from '@/lib/caminv/invoice-service';
import { db } from '@/lib/db';
import { eInvoices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/caminv/documents/[id]/status
 * 
 * Polls CamInv for the latest document status and updates the local database.
 * This endpoint provides a way to manually refresh document status when webhooks
 * fail or are delayed.
 * 
 * Query Parameters:
 * - merchant_id: Required. The merchant ID to use for authentication
 * - invoice_id: Optional. The local invoice ID to update (if different from document ID)
 * 
 * Returns:
 * - success: boolean
 * - status: Current document status from CamInv
 * - updated: boolean indicating if local record was updated
 * - document: Document details from CamInv
 */
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
    const invoiceId = searchParams.get('invoice_id');

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    // Verify merchant belongs to user's team
    const merchant = await camInvMerchantService.getMerchantById(parseInt(merchantId));
    if (!merchant || merchant.teamId !== team.id) {
      return NextResponse.json({ error: 'Merchant not found or access denied' }, { status: 404 });
    }

    // Get document details from CamInv
    const result = await camInvCoreService.getDocumentById(
      parseInt(merchantId),
      documentId,
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error?.message || 'Failed to retrieve document status from CamInv',
          success: false 
        },
        { status: 400 }
      );
    }

    const document = result.data;
    let updated = false;
    let localInvoice = null;

    // Try to find and update the local invoice record
    try {
      // First try to find by document ID
      let invoices = await db
        .select()
        .from(eInvoices)
        .where(eq(eInvoices.documentId, documentId))
        .limit(1);

      // If not found by document ID and invoice_id is provided, try by invoice ID
      if (invoices.length === 0 && invoiceId) {
        invoices = await db
          .select()
          .from(eInvoices)
          .where(eq(eInvoices.id, parseInt(invoiceId)))
          .limit(1);
      }

      if (invoices.length > 0) {
        localInvoice = invoices[0];
        
        // Map CamInv status to internal status
        const camInvStatus = document.status?.toLowerCase();
        let internalStatus = localInvoice.status;
        
        // Update status based on CamInv response
        if (camInvStatus === 'validated' || camInvStatus === 'valid') {
          internalStatus = 'validated';
        } else if (camInvStatus === 'validation_failed' || camInvStatus === 'invalid') {
          internalStatus = 'validation_failed';
        } else if (camInvStatus === 'rejected') {
          internalStatus = 'rejected';
        } else if (camInvStatus === 'accepted') {
          internalStatus = 'accepted';
        } else if (camInvStatus === 'processing' || camInvStatus === 'pending') {
          internalStatus = 'submitted'; // Keep as submitted while processing
        }

        // Only update if status has changed
        if (internalStatus !== localInvoice.status || camInvStatus !== localInvoice.camInvStatus) {
          await db
            .update(eInvoices)
            .set({
              status: internalStatus,
              camInvStatus: camInvStatus,
              camInvResponse: {
                ...localInvoice.camInvResponse,
                latest_status_check: new Date().toISOString(),
                document_details: document
              },
              ...(internalStatus === 'validated' && { validatedAt: new Date() }),
              ...(internalStatus === 'accepted' && { acceptedAt: new Date() }),
              ...(internalStatus === 'rejected' && { rejectedAt: new Date() }),
              updatedAt: new Date(),
            })
            .where(eq(eInvoices.id, localInvoice.id));

          updated = true;

          // Log the status update using the invoice service
          await camInvInvoiceService.logAuditEvent(
            team.id,
            user.id,
            'INVOICE_STATUS_REFRESHED',
            'invoice',
            localInvoice.id,
            {
              documentId,
              previousStatus: localInvoice.status,
              newStatus: internalStatus,
              camInvStatus: camInvStatus,
              source: 'manual_refresh'
            }
          );
        }
      }
    } catch (dbError) {
      console.error('Error updating local invoice record:', dbError);
      // Continue execution - we can still return the CamInv status even if local update fails
    }

    return NextResponse.json({
      success: true,
      status: document.status,
      updated,
      document: {
        id: document.id || documentId,
        status: document.status,
        validation_status: document.validation_status,
        created_at: document.created_at,
        updated_at: document.updated_at,
        verification_link: document.verification_link,
        // Include other relevant fields from CamInv response
        ...document
      },
      merchant: {
        id: merchant.id,
        merchantId: merchant.merchantId,
        merchantName: merchant.merchantName,
      },
      localInvoice: localInvoice ? {
        id: localInvoice.id,
        invoiceNumber: localInvoice.invoiceNumber,
        status: localInvoice.status,
        camInvStatus: localInvoice.camInvStatus,
        updatedAt: localInvoice.updatedAt,
      } : null
    });

  } catch (error) {
    console.error('Failed to refresh document status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refresh document status',
        success: false 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/caminv/documents/[id]/status
 * 
 * Bulk status refresh for multiple documents.
 * Useful for refreshing status of all processing documents.
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

    const body = await request.json();
    const { merchant_id, document_ids } = body;

    if (!merchant_id) {
      return NextResponse.json({ error: 'Merchant ID is required' }, { status: 400 });
    }

    if (!document_ids || !Array.isArray(document_ids)) {
      return NextResponse.json({ error: 'Document IDs array is required' }, { status: 400 });
    }

    // Verify merchant belongs to user's team
    const merchant = await camInvMerchantService.getMerchantById(merchant_id);
    if (!merchant || merchant.teamId !== team.id) {
      return NextResponse.json({ error: 'Merchant not found or access denied' }, { status: 404 });
    }

    const results = [];

    // Process each document ID
    for (const documentId of document_ids) {
      try {
        const result = await camInvCoreService.getDocumentById(
          merchant_id,
          documentId,
          user.id
        );

        if (result.success) {
          results.push({
            documentId,
            success: true,
            status: result.data.status,
            document: result.data
          });
        } else {
          results.push({
            documentId,
            success: false,
            error: result.error?.message || 'Failed to retrieve status'
          });
        }
      } catch (error) {
        results.push({
          documentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      merchant: {
        id: merchant.id,
        merchantId: merchant.merchantId,
        merchantName: merchant.merchantName,
      }
    });

  } catch (error) {
    console.error('Failed to bulk refresh document status:', error);
    return NextResponse.json(
      { error: 'Failed to bulk refresh document status' },
      { status: 500 }
    );
  }
}
