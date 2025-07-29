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

    // Submit the invoice
    const result = await camInvInvoiceService.submitInvoice(invoiceId, user.id);

    if (result.success) {
      // Extract detailed response information
      const camInvResponse = result.camInvResponse;
      const validDocuments = camInvResponse?.valid_documents || [];
      const failedDocuments = camInvResponse?.failed_documents || [];

      return NextResponse.json({
        success: true,
        message: 'Invoice submitted successfully',
        invoice: result.invoice,
        camInvResponse: {
          valid_documents: validDocuments,
          failed_documents: failedDocuments,
          total_documents: validDocuments.length + failedDocuments.length,
          submission_status: validDocuments.length > 0 ? 'success' : 'failed'
        },
        // Include verification link if available
        verificationLink: validDocuments[0]?.verification_link,
        documentId: validDocuments[0]?.document_id,
      });
    } else {
      return NextResponse.json(
        {
          error: result.error || 'Failed to submit invoice',
          success: false,
          submission_status: 'failed'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Failed to submit invoice:', error);
    return NextResponse.json(
      { error: 'Failed to submit invoice' },
      { status: 500 }
    );
  }
}
