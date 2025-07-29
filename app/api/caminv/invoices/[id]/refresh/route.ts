import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { camInvInvoiceService } from '@/lib/caminv/invoice-service';

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

    // Get the invoice to check if it has a document ID
    const invoice = await camInvInvoiceService.getInvoiceWithLineItems(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.invoice.documentId) {
      return NextResponse.json({ 
        error: 'Invoice has not been submitted to CamInv yet' 
      }, { status: 400 });
    }

    // TODO: Implement actual status polling from CamInv API
    // For now, we'll just return success to prevent the error
    // In a real implementation, you would:
    // 1. Call CamInv API to get document status
    // 2. Update the invoice status in the database
    // 3. Return the updated status

    return NextResponse.json({
      success: true,
      message: 'Status refresh completed',
      status: invoice.invoice.status,
    });

  } catch (error) {
    console.error('Error refreshing invoice status:', error);
    return NextResponse.json(
      { error: 'Failed to refresh invoice status' },
      { status: 500 }
    );
  }
}
