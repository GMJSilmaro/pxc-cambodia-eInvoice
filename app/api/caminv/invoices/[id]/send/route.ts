import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { eInvoices, camInvMerchants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { camInvCoreService } from '@/lib/caminv/core-service';

// Validation schema for send invoice request
const sendInvoiceSchema = z.object({
  customerEmail: z.string().email().optional(),
  message: z.string().optional(),
});

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

    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Parse request body (optional)
    let requestData = { customerEmail: undefined, message: undefined };
    try {
      const body = await request.json();
      const validationResult = sendInvoiceSchema.safeParse(body);
      if (validationResult.success) {
        requestData = validationResult.data;
      }
    } catch (error) {
      // No body or invalid JSON - use defaults
    }

    // Get the invoice with document ID
    const invoice = await db
      .select({
        id: eInvoices.id,
        documentId: eInvoices.documentId,
        invoiceNumber: eInvoices.invoiceNumber,
        status: eInvoices.status,
        merchantId: eInvoices.merchantId,
        customerEmail: eInvoices.customerEmail,
      })
      .from(eInvoices)
      .where(eq(eInvoices.id, invoiceId))
      .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceData = invoice[0];

    if (!invoiceData.documentId) {
      return NextResponse.json({
        error: 'Invoice must be submitted to CamInv before it can be sent'
      }, { status: 400 });
    }

    // Get merchant credentials
    const merchant = await db
      .select({
        accessToken: camInvMerchants.accessToken,
      })
      .from(camInvMerchants)
      .where(eq(camInvMerchants.id, invoiceData.merchantId))
      .limit(1);

    if (merchant.length === 0 || !merchant[0].accessToken) {
      return NextResponse.json({
        error: 'Merchant not connected to CamInv'
      }, { status: 400 });
    }

    // Send document using CamInv API following their documentation exactly
    const sendResponse = await camInvCoreService.sendDocument(
      invoiceData.merchantId,
      invoiceData.documentId,
      requestData.customerEmail || invoiceData.customerEmail || '', // Use request email or invoice email
      requestData.message, // message from request
      user.id
    );

    if (sendResponse.success) {
      // Update invoice status
      await db
        .update(eInvoices)
        .set({
          status: 'sent',
          sentAt: new Date(),
          camInvResponse: sendResponse.data,
          updatedAt: new Date(),
        })
        .where(eq(eInvoices.id, invoiceId));

      return NextResponse.json({
        success: true,
        message: 'Invoice sent successfully to customer',
        documentId: invoiceData.documentId,
        camInvResponse: sendResponse.data,
      });
    } else {
      return NextResponse.json(
        {
          error: sendResponse.error || 'Failed to send invoice',
          success: false,
          documentId: invoiceData.documentId
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to send invoice:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    );
  }
}
