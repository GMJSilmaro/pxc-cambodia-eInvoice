import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvCoreService } from '@/lib/caminv/core-service';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const size = searchParams.get('size') ? parseInt(searchParams.get('size')!) : 20;
    const status = searchParams.get('status') || undefined;
    const documentType = searchParams.get('document_type') as 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | undefined;

    // Get all merchants for the team
    const merchants = await camInvMerchantService.getMerchantsForTeam(team.id);
    
    if (merchants.length === 0) {
      return NextResponse.json({ 
        incoming_invoices: [],
        total: 0,
        page,
        size,
        message: 'No merchants connected'
      });
    }

    // Fetch incoming documents for all merchants
    const allIncomingInvoices: any[] = [];
    
    for (const merchant of merchants) {
      try {
        const result = await camInvCoreService.getIncomingDocuments(
          merchant.id,
          {
            page,
            size,
            status,
            document_type: documentType,
          },
          user.id
        );

        if (result.success && result.data) {
          // Add merchant info to each invoice
          const invoicesWithMerchant = (result.data.documents || []).map((invoice: any) => ({
            ...invoice,
            merchant: {
              id: merchant.id,
              merchantId: merchant.merchantId,
              merchantName: merchant.merchantName,
            }
          }));
          
          allIncomingInvoices.push(...invoicesWithMerchant);
        }
      } catch (error) {
        console.error(`Failed to fetch incoming invoices for merchant ${merchant.id}:`, error);
        // Continue with other merchants even if one fails
      }
    }

    // Sort by creation date (most recent first)
    allIncomingInvoices.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Apply pagination to combined results
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedInvoices = allIncomingInvoices.slice(startIndex, endIndex);

    return NextResponse.json({
      incoming_invoices: paginatedInvoices,
      total: allIncomingInvoices.length,
      page,
      size,
      total_pages: Math.ceil(allIncomingInvoices.length / size),
    });

  } catch (error) {
    console.error('Failed to fetch incoming invoices:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve incoming invoices' },
      { status: 500 }
    );
  }
}
