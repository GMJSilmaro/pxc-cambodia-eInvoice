import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getTeamForUser } from '@/lib/db/queries';
import { camInvInvoiceService, type CreateInvoiceRequest } from '@/lib/caminv/invoice-service';
import { z } from 'zod';

// Validation schema for creating invoices
const createInvoiceSchema = z.object({
  merchantId: z.number(),
  invoiceNumber: z.string().min(1),
  invoiceType: z.enum(['invoice', 'credit_note', 'debit_note']),
  issueDate: z.string().transform(str => new Date(str)),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  currency: z.string().min(3).max(3),
  customerName: z.string().min(1),
  customerTaxId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().optional(),
  lineItems: z.array(z.object({
    itemName: z.string().min(1),
    itemDescription: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100),
  })).min(1),
  originalInvoiceId: z.number().optional(),
});

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
    const status = searchParams.get('status');
    const direction = searchParams.get('direction') as 'outgoing' | 'incoming' | undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Get invoices for the team
    const invoices = await camInvInvoiceService.getInvoicesForTeam(team.id, {
      status: status || undefined,
      direction,
      limit,
      offset,
    });

    // Remove sensitive data before sending to client
    const safeInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceUuid: invoice.invoiceUuid,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      status: invoice.status,
      direction: invoice.direction,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      camInvStatus: invoice.camInvStatus,
      submittedAt: invoice.submittedAt,
      sentAt: invoice.sentAt,
      acceptedAt: invoice.acceptedAt,
      rejectedAt: invoice.rejectedAt,
      rejectionReason: invoice.rejectionReason,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      // Don't send UBL XML or sensitive data
    }));

    return NextResponse.json({ invoices: safeInvoices });
  } catch (error) {
    console.error('Failed to get invoices:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    // Validate request body
    const validationResult = createInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const invoiceRequest: CreateInvoiceRequest = validationResult.data;

    // Create the invoice
    const invoice = await camInvInvoiceService.createInvoice(
      team.id,
      invoiceRequest,
      user.id
    );

    // Return safe invoice data
    const safeInvoice = {
      id: invoice.id,
      invoiceUuid: invoice.invoiceUuid,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      status: invoice.status,
      direction: invoice.direction,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    return NextResponse.json({ invoice: safeInvoice }, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
