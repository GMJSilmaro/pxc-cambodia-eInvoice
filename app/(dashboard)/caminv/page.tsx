import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CamInvSimpleCard } from '@/components/ui/caminv-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { StandardizedInvoiceTable } from '@/components/caminv/standardized-invoice-table';
import { MerchantStatusCard } from '@/components/caminv/merchant-status-card';
import { ActionableInsights } from '@/components/caminv/actionable-insights';
import { DashboardCharts } from '@/components/caminv/dashboard-charts';
import {
  ConsistentCard,
  DataCard,
  SectionHeader,
  EmptyState,
  LoadingState
} from '@/components/ui/consistent-styling';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/ui/responsive-layout';
import {
  DashboardStatsSkeleton,
  MerchantStatusSkeleton,
  RecentInvoicesSkeleton,
  ActionableInsightsSkeleton,
  QuickActionsSkeleton
} from '@/components/caminv/dashboard-skeleton';
import {
  FileText,
  Building2,
  AlertCircle,
  Clock,
  Plus,
  Eye,
  Settings,
  Activity,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';
import { camInvInvoiceService } from '@/lib/caminv/invoice-service';
import { designSystem, layout, spacing, textStyles } from '@/lib/design-system';

async function getMerchants() {
  try {
    // Get current user and team
    const user = await getUser();
    if (!user) {
      return { merchants: [] };
    }

    const team = await getTeamForUser();
    if (!team) {
      return { merchants: [] };
    }

    // Get merchants using the service directly
    const merchants = await camInvMerchantService.getMerchantsForTeam(team.id);

    // Remove sensitive data before sending to client
    const safeMerchants = merchants.map(merchant => ({
      id: merchant.id,
      merchantName: merchant.merchantName,
      merchantId: merchant.merchantId,
      companyNameEn: merchant.companyNameEn,
      companyNameKh: merchant.companyNameKh,
      tin: merchant.tin,
      endpointId: merchant.endpointId,
      mocId: merchant.mocId,
      registrationStatus: merchant.registrationStatus,
      isActive: merchant.isActive,
      city: merchant.city,
      country: merchant.country,
      businessType: merchant.businessType,
      phoneNumber: merchant.phoneNumber,
      email: merchant.email,
      createdAt: merchant.createdAt,
      lastSyncAt: merchant.lastSyncAt,
      // Don't send access tokens or other sensitive data
    }));

    return { merchants: safeMerchants };
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return { merchants: [] };
  }
}

async function getInvoiceStats() {
  try {
    // Get current user and team
    const user = await getUser();
    if (!user) {
      return {
        totalInvoices: 0,
        submittedInvoices: 0,
        pendingInvoices: 0,
        acceptedInvoices: 0,
        validatedInvoices: 0,
        failedInvoices: 0,
        successRate: 0,
        recentActivity: 0,
        recentInvoices: []
      };
    }

    const team = await getTeamForUser();
    if (!team) {
      return {
        totalInvoices: 0,
        submittedInvoices: 0,
        pendingInvoices: 0,
        acceptedInvoices: 0,
        validatedInvoices: 0,
        failedInvoices: 0,
        successRate: 0,
        recentActivity: 0,
        recentInvoices: []
      };
    }

    // Get invoices using the service directly
    const invoices = await camInvInvoiceService.getInvoicesForTeam(team.id, {
      limit: 10,
      offset: 0,
    });

    // Calculate stats from invoices
    const totalInvoices = invoices.length;
    const submittedInvoices = invoices.filter(inv => inv.status === 'submitted').length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'draft').length;
    const acceptedInvoices = invoices.filter(inv => inv.status === 'accepted').length;
    const validatedInvoices = invoices.filter(inv => inv.status === 'validated').length;
    const failedInvoices = invoices.filter(inv => inv.status === 'failed' || inv.status === 'validation_failed').length;

    // Calculate success rate
    const processedInvoices = submittedInvoices + acceptedInvoices + validatedInvoices + failedInvoices;
    const successfulInvoices = submittedInvoices + acceptedInvoices + validatedInvoices;
    const successRate = processedInvoices > 0 ? Math.round((successfulInvoices / processedInvoices) * 100) : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivityInvoices = invoices.filter(inv => new Date(inv.createdAt) >= sevenDaysAgo);
    const recentActivity = recentActivityInvoices.length;

    // Remove sensitive data from recent invoices
    const recentInvoices = invoices.slice(0, 3).map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      status: invoice.status,
      issueDate: invoice.issueDate,
    }));

    return {
      totalInvoices,
      submittedInvoices,
      pendingInvoices,
      acceptedInvoices,
      validatedInvoices,
      failedInvoices,
      successRate,
      recentActivity,
      recentInvoices
    };
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    return {
      totalInvoices: 0,
      submittedInvoices: 0,
      pendingInvoices: 0,
      acceptedInvoices: 0,
      validatedInvoices: 0,
      failedInvoices: 0,
      successRate: 0,
      recentActivity: 0,
      recentInvoices: []
    };
  }
}



async function DashboardStats() {
  const stats = await getInvoiceStats();

  return (
    <ResponsiveGrid
      cols={{ sm: 1, md: 2, lg: 4 }}
      gap="md"
    >
      <DataCard
        title="Total Documents"
        value={stats.totalInvoices}
        subtitle="All e-invoices and e-receipts created"
        icon={<FileText className="h-5 w-5 text-gray-600" />}
      />

      <DataCard
        title="Success Rate"
        value={`${stats.successRate}%`}
        subtitle="Validation success rate"
        icon={<TrendingUp className="h-5 w-5 text-gray-600" />}
        trend={{
          value: stats.successRate,
          label: "validation rate",
          direction: stats.successRate >= 90 ? 'up' : stats.successRate >= 70 ? 'neutral' : 'down'
        }}
      />

      <DataCard
        title="Pending"
        value={stats.pendingInvoices}
        subtitle="Awaiting submission"
        icon={<Clock className="h-5 w-5 text-gray-600" />}
      />

      <DataCard
        title="Recent Activity"
        value={stats.recentActivity}
        subtitle="Last 7 days"
        icon={<Activity className="h-5 w-5 text-gray-600" />}
      />
    </ResponsiveGrid>
  );
}

async function MerchantStatus() {
  const { merchants } = await getMerchants();

  // Calculate summary stats
  const activeMerchants = merchants.filter((m: any) => m.isActive && m.registrationStatus === 'active').length;
  const totalMerchants = merchants.length;
  const pendingMerchants = merchants.filter((m: any) => m.registrationStatus === 'pending').length;

  return (
    <CamInvSimpleCard>
      <div className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg border border-gray-200">
              <Building2 className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                CamInv Merchant Status
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Connected Cambodia E-Invoicing and E-Receipting accounts
              </p>
            </div>
          </div>
          {totalMerchants > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{activeMerchants} Active</span>
              </div>
              {pendingMerchants > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">{pendingMerchants} Pending</span>
                </div>
              )}
              <div className="text-gray-400">
                {totalMerchants} Total
              </div>
            </div>
          )}
        </div>
      </div>
        {merchants.length === 0 ? (
          <div className="text-center py-6">
            <div className="p-2.5 bg-yellow-50 rounded-full w-fit mx-auto mb-3 border border-yellow-200">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No Merchants Connected</h3>
            <p className="text-xs text-gray-600 mb-4 max-w-sm mx-auto leading-relaxed">
              Connect your CamInv merchant account to start issuing e-invoices and e-receipts and manage your Cambodia tax compliance
            </p>
            <Button asChild size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
              <a href="/caminv/merchants">
                <Plus className="h-3 w-3 mr-1.5" />
                Connect Merchant Account
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {merchants.map((merchant: any) => (
              <MerchantStatusCard key={merchant.id} merchant={merchant} />
            ))}
            {merchants.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Last updated: {new Date().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
    </CamInvSimpleCard>
  );
}

async function DashboardChartsWrapper() {
  const stats = await getInvoiceStats();

  return <DashboardCharts stats={stats} />;
}

async function DashboardInsights() {
  const stats = await getInvoiceStats();
  const { merchants } = await getMerchants();

  const hasActiveMerchant = merchants.some((m: any) => m.isActive && m.registrationStatus === 'active');

  return (
    <ActionableInsights
      stats={stats}
      merchantCount={merchants.length}
      hasActiveMerchant={hasActiveMerchant}
    />
  );
}

async function RecentInvoicesComponent() {
  try {
    // Get current user and team
    const user = await getUser();
    if (!user) {
      return <StandardizedInvoiceTable data={[]} variant="recent" />;
    }

    const team = await getTeamForUser();
    if (!team) {
      return <StandardizedInvoiceTable data={[]} variant="recent" />;
    }

    // Get recent invoices using the service
    const invoices = await camInvInvoiceService.getInvoicesForTeam(team.id, {
      limit: 4,
      offset: 0,
    });

    // Transform to standardized format
    const standardizedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      status: invoice.status,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString(),
      submittedAt: invoice.submittedAt?.toISOString(),
      camInvStatus: invoice.camInvStatus || undefined,
      invoiceType: invoice.invoiceType,
      merchantId: invoice.merchantId?.toString(),
      createdAt: invoice.createdAt?.toISOString(),
      customerId: invoice.customerId || undefined,
      customerCompanyNameKh: invoice.customerCompanyNameKh || undefined,
      customerCompanyNameEn: invoice.customerCompanyNameEn || undefined,
      supplierId: invoice.supplierId || undefined,
      supplierCompanyNameKh: invoice.supplierCompanyNameKh || undefined,
      supplierCompanyNameEn: invoice.supplierCompanyNameEn || undefined,
      documentId: invoice.documentId || undefined,
      createdBy: invoice.createdBy || undefined,
      verificationLink: invoice.verificationLink || undefined,
      direction: 'outgoing' as const,
    }));

    return (
      <StandardizedInvoiceTable
        data={standardizedInvoices}
        variant="recent"
        showSearch={false}
        showFilters={false}
        showPagination={false}
      />
    );
  } catch (error) {
    console.error('Error fetching recent invoices:', error);
    return <StandardizedInvoiceTable data={[]} variant="recent" />;
  }
}

export default function CamInvDashboard() {
  return (
    <div className="min-h-screen">
        {/* Enhanced Header Section */}
        <SectionHeader
          title="Cambodia E-Invoicing & E-Receipting"
          description="Manage your CamInv integration and e-invoice and e-receipt compliance dashboard"
          action={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button asChild className={designSystem.components.button.primary}>
                <a href="/caminv/invoices/create">
                  <Plus className={layout.responsive.icon.sm} />
                  <span className="ml-2">Create Document</span>
                </a>
              </Button>
              <Button variant="outline" asChild className={designSystem.components.button.outline}>
                <a href="/caminv/invoices">
                  <Eye className={layout.responsive.icon.sm} />
                  <span className="ml-2">View All Documents</span>
                </a>
              </Button>
            </div>
          }
          className={spacing.margin.section}
        />

        {/* Main Content Grid */}
        <div className={`grid ${spacing.grid.loose} lg:grid-cols-3 ${spacing.margin.section}`}>
          {/* Merchant Status - Takes 1 column */}
          <Suspense fallback={<MerchantStatusSkeleton />}>
            <MerchantStatus />
          </Suspense>

          {/* Recent Invoices - Takes 2 columns */}
          <div className="lg:col-span-2">
            <CamInvSimpleCard>
              <div className="pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold">
                      <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg border border-gray-200">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      </div>
                      <span className="truncate">Recent Documents</span>
                    </h3>
                    <p className="text-sm sm:text-base mt-1 sm:mt-2 text-gray-600">
                      Latest e-invoice and e-receipt activity and status updates
                    </p>
                  </div>
                  <Button variant="outline" size="lg" asChild className="border-gray-300 hover:bg-gray-50 flex-shrink-0">
                    <a href="/caminv/invoices">
                      <span className="hidden sm:inline">View All</span>
                      <span className="sm:hidden">All</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
                <Suspense fallback={<div className="h-32 sm:h-40 lg:h-48"><Skeleton className="h-full w-full rounded-lg" /></div>}>
                  <RecentInvoicesComponent />
                </Suspense>
            </CamInvSimpleCard>
          </div>
        </div>

        {/* Actionable Insights */}
        <div className={spacing.margin.section}>
          <h2 className={`${textStyles.heading.h2} ${spacing.margin.element}`}>Insights & Recommendations</h2>
          <Suspense fallback={<ActionableInsightsSkeleton />}>
            <DashboardInsights />
          </Suspense>
        </div>


   
    </div>
  );
}
