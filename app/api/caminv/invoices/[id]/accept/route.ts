import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { camInvIncomingInvoiceService } from '@/lib/caminv/incoming-invoice-service';

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

    // Accept the invoice
    const result = await camInvIncomingInvoiceService.acceptInvoice(invoiceId, user.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Invoice accepted successfully',
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to accept invoice' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to accept invoice:', error);
    return NextResponse.json(
      { error: 'Failed to accept invoice' },
      { status: 500 }
    );
  }
}
