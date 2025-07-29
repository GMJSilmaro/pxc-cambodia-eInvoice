import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { eInvoices, camInvMerchants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { CamInvApiClient } from '@/lib/caminv/api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const team = await getTeamForUser(user.id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get invoice with merchant information
    const invoice = await db
      .select({
        invoice: eInvoices,
        merchant: camInvMerchants,
      })
      .from(eInvoices)
      .leftJoin(camInvMerchants, eq(eInvoices.merchantId, camInvMerchants.id))
      .where(
        and(
          eq(eInvoices.id, invoiceId),
          eq(eInvoices.teamId, team.id)
        )
      )
      .limit(1);

    if (invoice.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const { invoice: invoiceData, merchant } = invoice[0];

    // Check if invoice has a document ID (required for PDF download)
    if (!invoiceData.documentId) {
      return NextResponse.json(
        { error: 'Invoice has not been submitted to CamInv yet' },
        { status: 400 }
      );
    }

    // Check if merchant is connected
    if (!merchant || !merchant.accessToken) {
      return NextResponse.json(
        { error: 'Merchant not connected to CamInv' },
        { status: 400 }
      );
    }

    // Create CamInv API client
    const apiClient = new CamInvApiClient(
      process.env.CAMBODIA_API_BASE_URL || 'https://sb-merchant.e-invoice.gov.kh',
      merchant.clientId || process.env.CAMBODIA_CLIENT_ID!,
      merchant.clientSecret || process.env.CAMBODIA_CLIENT_SECRET!
    );

    try {
      // Download PDF from CamInv API
      const pdfResponse = await apiClient.downloadDocumentPDF(
        merchant.accessToken,
        invoiceData.documentId
      );

      // Return the PDF as a blob
      return new NextResponse(pdfResponse, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
          'Cache-Control': 'no-cache',
        },
      });

    } catch (camInvError: any) {
      console.error('CamInv PDF download error:', camInvError);
      
      // Handle specific CamInv API errors
      if (camInvError.message?.includes('404')) {
        return NextResponse.json(
          { error: 'PDF not found in CamInv system' },
          { status: 404 }
        );
      }
      
      if (camInvError.message?.includes('401') || camInvError.message?.includes('403')) {
        return NextResponse.json(
          { error: 'Access denied. Please reconnect your CamInv account.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to download PDF from CamInv',
          details: camInvError.message 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('PDF download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
