import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { camInvIncomingInvoiceService } from '@/lib/caminv/incoming-invoice-service';
import { z } from 'zod';

const rejectInvoiceSchema = z.object({
  reason: z.string().min(1),
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

    const body = await request.json();
    
    // Validate request body
    const validationResult = rejectInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { reason } = validationResult.data;

    // Reject the invoice
    const result = await camInvIncomingInvoiceService.rejectInvoice(invoiceId, reason, user.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Invoice rejected successfully',
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to reject invoice' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to reject invoice:', error);
    return NextResponse.json(
      { error: 'Failed to reject invoice' },
      { status: 500 }
    );
  }
}
