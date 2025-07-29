import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { camInvInvoiceService } from '@/lib/caminv/invoice-service';

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

    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get invoice data
    const invoiceData = await camInvInvoiceService.getInvoiceWithLineItems(invoiceId);
    
    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if UBL XML already exists
    let ublXml = invoiceData.invoice.ublXml;
    
    // If no UBL XML exists, generate it directly without validation for debugging
    if (!ublXml) {
      try {
        const { UBLGenerator } = await import('@/lib/caminv/ubl-generator');
        const { db } = await import('@/lib/db/index');
        const { camInvMerchants } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');

        const merchant = await db
          .select()
          .from(camInvMerchants)
          .where(eq(camInvMerchants.id, invoiceData.invoice.merchantId))
          .limit(1);

        if (merchant.length > 0) {
          ublXml = UBLGenerator.generateFromInvoiceRecord(
            invoiceData.invoice,
            invoiceData.lineItems,
            merchant[0]
          );
          console.log('Generated UBL XML (bypassing validation):', ublXml.substring(0, 1500));
        } else {
          return NextResponse.json(
            { error: 'Merchant not found' },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error('Failed to generate UBL XML:', error);
        return NextResponse.json(
          { error: 'Failed to generate UBL XML' },
          { status: 500 }
        );
      }
    }

    // Return the XML content with proper content type
    return new NextResponse(ublXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoice.invoiceNumber || invoiceId}.xml"`,
      },
    });

  } catch (error) {
    console.error('Error fetching UBL XML:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
