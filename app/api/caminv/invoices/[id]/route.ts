import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
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

    // Get invoice with line items
    const invoiceData = await camInvInvoiceService.getInvoiceWithLineItems(invoiceId);
    
    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Return safe invoice data with line items
    const safeInvoice = {
      id: invoiceData.invoice.id,
      invoiceUuid: invoiceData.invoice.invoiceUuid,
      invoiceNumber: invoiceData.invoice.invoiceNumber,
      invoiceType: invoiceData.invoice.invoiceType,
      status: invoiceData.invoice.status,
      direction: invoiceData.invoice.direction,
      customerName: invoiceData.invoice.customerName,
      customerTaxId: invoiceData.invoice.customerTaxId,
      customerEmail: invoiceData.invoice.customerEmail,
      customerAddress: invoiceData.invoice.customerAddress,
      issueDate: invoiceData.invoice.issueDate,
      dueDate: invoiceData.invoice.dueDate,
      currency: invoiceData.invoice.currency,
      subtotal: invoiceData.invoice.subtotal,
      taxAmount: invoiceData.invoice.taxAmount,
      totalAmount: invoiceData.invoice.totalAmount,
      camInvStatus: invoiceData.invoice.camInvStatus,
      submittedAt: invoiceData.invoice.submittedAt,
      sentAt: invoiceData.invoice.sentAt,
      acceptedAt: invoiceData.invoice.acceptedAt,
      rejectedAt: invoiceData.invoice.rejectedAt,
      rejectionReason: invoiceData.invoice.rejectionReason,
      createdAt: invoiceData.invoice.createdAt,
      updatedAt: invoiceData.invoice.updatedAt,
      lineItems: invoiceData.lineItems.map(item => ({
        id: item.id,
        lineNumber: item.lineNumber,
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
      })),
    };

    return NextResponse.json({ invoice: safeInvoice });
  } catch (error) {
    console.error('Failed to get invoice:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user and team
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 400 });
    }

    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get the request body
    const body = await request.json();

    // Validate required fields
    if (!body.merchantId || !body.invoiceNumber || !body.customerName || !body.issueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if invoice exists and is editable
    const existingInvoice = await camInvInvoiceService.getInvoiceById(invoiceId);
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (existingInvoice.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft invoices can be edited' }, { status: 400 });
    }

    // Update the invoice
    const updatedInvoice = await camInvInvoiceService.updateInvoice(invoiceId, {
      merchantId: parseInt(body.merchantId),
      invoiceNumber: body.invoiceNumber,
      invoiceType: body.invoiceType || 'commercial_invoice',
      customerName: body.customerName,
      customerEmail: body.customerEmail || null,
      customerTaxId: body.customerTaxId || null,
      customerAddress: body.customerAddress || null,
      issueDate: new Date(body.issueDate),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      currency: body.currency || 'KHR',
      subtotal: body.subtotal || 0,
      taxAmount: body.taxAmount || 0,
      totalAmount: body.totalAmount || 0,
      notes: body.notes || null,
    }, body.lineItems || []);

    return NextResponse.json({
      message: 'Invoice updated successfully',
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
      }
    });

  } catch (error) {
    console.error('Failed to update invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
