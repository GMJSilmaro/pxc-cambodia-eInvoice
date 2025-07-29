import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvInvoiceService } from '@/lib/caminv/invoice-service';

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

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    // Get submitted invoices for billing reference
    const invoices = await camInvInvoiceService.getSubmittedInvoicesForReference(
      team.id,
      merchantId ? parseInt(merchantId) : undefined
    );

    return NextResponse.json({
      success: true,
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceUuid: invoice.invoiceUuid,
        issueDate: invoice.issueDate,
        customerName: invoice.customerName,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        status: invoice.status,
        camInvStatus: invoice.camInvStatus,
      }))
    });

  } catch (error) {
    console.error('Error fetching submitted invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submitted invoices' },
      { status: 500 }
    );
  }
}
