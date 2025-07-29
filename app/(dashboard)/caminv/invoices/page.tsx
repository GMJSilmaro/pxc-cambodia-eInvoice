import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StandardizedInvoiceTable } from '@/components/caminv/standardized-invoice-table';
import { PageHeader, commonActions } from '@/components/caminv/page-header';
import { OverviewCards } from '@/components/caminv/overview-cards';
import { ResponsiveGrid } from '@/components/ui/responsive-layout';
import { FileText, BarChart3 } from 'lucide-react';
import { camInvInvoiceService } from '@/lib/caminv/invoice-service';
import { getUser, getTeamForUser } from '@/lib/db/queries';

interface SearchParams {
  status?: string;
  direction?: 'outgoing' | 'incoming';
  page?: string;
  limit?: string;
}

async function getInvoices(searchParams: SearchParams) {
  try {
    const user = await getUser();
    if (!user) return { invoices: [] };

    const team = await getTeamForUser();
    if (!team) return { invoices: [] };

    const limit = parseInt(searchParams.limit || '20');
    const offset = searchParams.page ? ((parseInt(searchParams.page) - 1) * limit) : 0;

    const invoices = await camInvInvoiceService.getInvoicesForTeam(team.id, {
      status: searchParams.status || undefined,
      direction: searchParams.direction,
      limit,
      offset,
    });

    const safeInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceUuid: invoice.invoiceUuid,
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      status: invoice.status,
      direction: invoice.direction as 'outgoing' | 'incoming',
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail || undefined,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString(),
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      camInvStatus: invoice.camInvStatus || undefined,
      submittedAt: invoice.submittedAt?.toISOString(),
      sentAt: invoice.sentAt?.toISOString(),
      acceptedAt: invoice.acceptedAt?.toISOString(),
      rejectedAt: invoice.rejectedAt?.toISOString(),
      rejectionReason: invoice.rejectionReason,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    }));

    return { invoices: safeInvoices };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { invoices: [] };
  }
}

async function InvoiceStatsWithOverview() {
  const { invoices } = await getInvoices({});

  const stats = {
    total: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    validated: invoices.filter(inv => inv.camInvStatus === 'validated').length,
    rejected: invoices.filter(inv => inv.camInvStatus === 'rejected').length,
  };

  return <OverviewCards stats={stats} />;
}

async function InvoiceCountBadge({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { invoices } = await getInvoices(params);

  return (
    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
      {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'}
    </Badge>
  );
}



async function InvoicesList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { invoices } = await getInvoices(params);

  return (
    <StandardizedInvoiceTable
      data={invoices}
      variant="full"
      showSearch={true}
      showFilters={true}
      showPagination={true}
      pageSize={25}
    />
  );
}

function StatsLoadingSkeleton() {
  return (
    <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4 }} gap="md">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-gradient-to-br from-white to-gray-50/30 border border-gray-200 shadow-sm animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <Skeleton className="h-4 w-24 bg-gray-200" />
            <div className="p-2 bg-gray-200 rounded-lg">
              <Skeleton className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2 bg-gray-200" />
            <Skeleton className="h-3 w-20 bg-gray-200" />
          </CardContent>
        </Card>
      ))}
    </ResponsiveGrid>
  );
}



function TableLoadingSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-white to-slate-50/30 border border-slate-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <Skeleton className="h-6 w-40 bg-white/20" />
            <Skeleton className="h-4 w-64 bg-white/10 mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50/50 animate-pulse">
              <Skeleton className="h-4 w-24 bg-gray-200" />
              <Skeleton className="h-4 w-32 bg-gray-200" />
              <Skeleton className="h-4 w-20 bg-gray-200" />
              <Skeleton className="h-4 w-16 bg-gray-200" />
              <Skeleton className="h-4 w-24 bg-gray-200" />
              <Skeleton className="h-4 w-20 bg-gray-200" />
              <Skeleton className="h-4 w-16 bg-gray-200" />
              <Skeleton className="h-8 w-8 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div className="space-y-8 p-6">
      {/* Page Header */}
      <PageHeader
        title="E-Invoices"
        description="Manage your Cambodia E-Invoicing documents and submissions"
        icon={<FileText className="h-6 w-6" />}
        actions={[
          commonActions.createInvoice
        ]}
      />

      {/* Overview Section */}
      <Suspense fallback={<StatsLoadingSkeleton />}>
        <InvoiceStatsWithOverview />
      </Suspense>

      {/* Invoice Management Table */}
      <Suspense fallback={<TableLoadingSkeleton />}>
        <InvoicesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
