import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StandardizedInvoiceTable } from '@/components/caminv/standardized-invoice-table';
import { EnhancedInvoiceDashboard } from '@/components/caminv/enhanced-invoice-dashboard';
import { 
  FileText, 
  Download,
  Filter,
  Info
} from 'lucide-react';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';
import { Alert, AlertDescription } from '@/components/ui/alert';

async function IncomingInvoicesContent() {
  const user = await getUser();
  
  if (!user) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please sign in to view incoming invoices.
        </AlertDescription>
      </Alert>
    );
  }

  const team = await getTeamForUser(user.id);
  
  if (!team) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No team found. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  // Get merchants to check if any are connected
  const merchants = await camInvMerchantService.getMerchantsForTeam(team.id);

  if (merchants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incoming Invoices</CardTitle>
          <CardDescription>
            Invoices received from other businesses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No merchants connected. Please connect a merchant account first to receive invoices.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StandardizedInvoiceTable
        data={[]}
        variant="full"
        title="Incoming Invoices"
        description="Invoices received from other businesses"
        showSearch={true}
        showFilters={true}
        showPagination={true}
        pageSize={25}
      />

      {/* Alternative enhanced dashboard view */}
      <EnhancedInvoiceDashboard
        direction="incoming"
        className="mt-6"
      />
    </div>
  );
}

function IncomingInvoicesLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incoming Invoices</CardTitle>
        <CardDescription>
          Invoices received from other businesses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IncomingInvoicesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incoming Invoices</h1>
          <p className="text-muted-foreground">
            Manage invoices received from other businesses
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Received
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Awaiting action
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accepted
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Suspense fallback={<IncomingInvoicesLoading />}>
        <IncomingInvoicesContent />
      </Suspense>
    </div>
  );
}
