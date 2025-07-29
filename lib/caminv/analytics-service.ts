import { db } from '@/lib/db/drizzle';
import { invoices } from '@/lib/db/schema';
import { eq, and, gte, desc, sql, count } from 'drizzle-orm';

export interface InvoiceStatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface InvoiceStatusTrend {
  date: string;
  draft: number;
  submitted: number;
  validated: number;
  accepted: number;
  rejected: number;
  total: number;
}

export interface InvoiceAnalytics {
  totalInvoices: number;
  successRate: number;
  pendingCount: number;
  statusDistribution: InvoiceStatusDistribution[];
  statusTrends: InvoiceStatusTrend[];
  camInvVsInternal: {
    camInvManaged: number;
    internalOnly: number;
  };
  sourceDistribution: {
    api: number;
    manual: number;
  };
}

// Status color mapping for semantic color coding
const STATUS_COLORS = {
  draft: '#6B7280', // gray
  submitted: '#F59E0B', // yellow
  processing: '#F59E0B', // yellow
  pending: '#F59E0B', // yellow
  validated: '#10B981', // green
  accepted: '#10B981', // green
  completed: '#10B981', // green
  rejected: '#EF4444', // red
  failed: '#EF4444', // red
  cancelled: '#6B7280', // gray
} as const;

/**
 * Get comprehensive invoice analytics for dashboard
 */
export async function getInvoiceAnalytics(teamId: number): Promise<InvoiceAnalytics> {
  try {
    // Get all invoices for the team
    const allInvoices = await db
      .select({
        id: invoices.id,
        status: invoices.status,
        createdAt: invoices.createdAt,
        documentId: invoices.documentId,
        createdBy: invoices.createdBy,
        camInvStatus: invoices.camInvStatus,
      })
      .from(invoices)
      .where(eq(invoices.teamId, teamId))
      .orderBy(desc(invoices.createdAt));

    const totalInvoices = allInvoices.length;

    // Calculate status distribution
    const statusCounts = allInvoices.reduce((acc, invoice) => {
      const status = invoice.status.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution: InvoiceStatusDistribution[] = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalInvoices > 0 ? Math.round((count / totalInvoices) * 100) : 0,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280',
    }));

    // Calculate success rate (validated + accepted / total)
    const successfulStatuses = ['validated', 'accepted', 'completed'];
    const successfulCount = allInvoices.filter(invoice => 
      successfulStatuses.includes(invoice.status.toLowerCase())
    ).length;
    const successRate = totalInvoices > 0 ? Math.round((successfulCount / totalInvoices) * 100) : 0;

    // Calculate pending count
    const pendingStatuses = ['submitted', 'processing', 'pending'];
    const pendingCount = allInvoices.filter(invoice => 
      pendingStatuses.includes(invoice.status.toLowerCase())
    ).length;

    // Calculate CamInv vs Internal distribution
    const camInvManaged = allInvoices.filter(invoice => invoice.documentId).length;
    const internalOnly = totalInvoices - camInvManaged;

    // Calculate source distribution
    const apiCreated = allInvoices.filter(invoice => invoice.createdBy === 'API_INTEGRATION').length;
    const manualCreated = totalInvoices - apiCreated;

    // Calculate status trends for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvoices = allInvoices.filter(invoice => 
      new Date(invoice.createdAt) >= thirtyDaysAgo
    );

    // Group by date for trends
    const trendData = recentInvoices.reduce((acc, invoice) => {
      const date = new Date(invoice.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          draft: 0,
          submitted: 0,
          validated: 0,
          accepted: 0,
          rejected: 0,
          total: 0,
        };
      }
      
      const status = invoice.status.toLowerCase();
      acc[date].total += 1;
      
      if (status === 'draft') acc[date].draft += 1;
      else if (['submitted', 'processing', 'pending'].includes(status)) acc[date].submitted += 1;
      else if (status === 'validated') acc[date].validated += 1;
      else if (['accepted', 'completed'].includes(status)) acc[date].accepted += 1;
      else if (['rejected', 'failed'].includes(status)) acc[date].rejected += 1;
      
      return acc;
    }, {} as Record<string, InvoiceStatusTrend>);

    const statusTrends = Object.values(trendData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      totalInvoices,
      successRate,
      pendingCount,
      statusDistribution,
      statusTrends,
      camInvVsInternal: {
        camInvManaged,
        internalOnly,
      },
      sourceDistribution: {
        api: apiCreated,
        manual: manualCreated,
      },
    };

  } catch (error) {
    console.error('Error fetching invoice analytics:', error);
    
    // Return empty analytics on error
    return {
      totalInvoices: 0,
      successRate: 0,
      pendingCount: 0,
      statusDistribution: [],
      statusTrends: [],
      camInvVsInternal: {
        camInvManaged: 0,
        internalOnly: 0,
      },
      sourceDistribution: {
        api: 0,
        manual: 0,
      },
    };
  }
}

/**
 * Get invoice status summary for quick stats
 */
export async function getInvoiceStatusSummary(teamId: number) {
  try {
    const result = await db
      .select({
        status: invoices.status,
        count: count(),
      })
      .from(invoices)
      .where(eq(invoices.teamId, teamId))
      .groupBy(invoices.status);

    return result.reduce((acc, { status, count }) => {
      acc[status.toLowerCase()] = count;
      return acc;
    }, {} as Record<string, number>);

  } catch (error) {
    console.error('Error fetching invoice status summary:', error);
    return {};
  }
}
