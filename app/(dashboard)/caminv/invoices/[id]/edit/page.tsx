import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InvoiceEditForm } from '@/components/caminv/invoice-edit-form';
import { InvoicePreview } from '@/components/caminv/invoice-preview';
import { InvoiceFormProvider } from '@/components/caminv/invoice-form-context';
import {
  FileText,
  AlertCircle,
  Info,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvInvoiceService } from '@/lib/caminv/invoice-service';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';

async function getInvoiceForEdit(id: string) {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return null;
    }

    // Get user's team
    const team = await getTeamForUser();
    if (!team) {
      return null;
    }

    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return null;
    }

    // Get invoice with line items
    const invoiceData = await camInvInvoiceService.getInvoiceWithLineItems(invoiceId);
    
    if (!invoiceData) {
      return null;
    }

    // Check if invoice is editable (only drafts can be edited)
    if (invoiceData.invoice.status !== 'draft') {
      return { error: 'Only draft invoices can be edited' };
    }

    // Get merchants for the team
    const merchants = await camInvMerchantService.getMerchantsForTeam(team.id);

    return {
      invoice: invoiceData.invoice,
      lineItems: invoiceData.lineItems,
      merchants: merchants.map(merchant => ({
        id: merchant.id,
        merchantName: merchant.merchantName,
        merchantId: merchant.merchantId,
        endpointId: merchant.endpointId,
        isActive: merchant.isActive,
        registrationStatus: merchant.registrationStatus,
      }))
    };
  } catch (error) {
    console.error('Error fetching invoice for edit:', error);
    return null;
  }
}

function EditFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function EditInvoiceForm({ id }: { id: string }) {
  const data = await getInvoiceForEdit(id);
  
  if (!data) {
    notFound();
  }

  if ('error' in data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Cannot Edit Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {data.error}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href={`/caminv/invoices/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoice
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.merchants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            No Merchant Account
          </CardTitle>
          <CardDescription>
            You need to connect a CamInv merchant account before editing invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Connect your CamInv merchant account to enable invoice editing functionality.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild>
              <Link href="/caminv/merchants">
                Connect Merchant Account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <InvoiceEditForm invoice={data.invoice} lineItems={data.lineItems} merchants={data.merchants} />;
}

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/caminv/invoices/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
          <p className="text-muted-foreground">
            Modify your draft invoice details
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Only draft invoices can be edited. Once submitted to CamInv, invoices cannot be modified.
        </AlertDescription>
      </Alert>

      {/* Main Form */}
      <InvoiceFormProvider>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<EditFormSkeleton />}>
              <EditInvoiceForm id={id} />
            </Suspense>
          </div>

          <div className="space-y-6">
            {/* Invoice Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Live preview of your invoice changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoicePreview />
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• All fields marked with * are required</li>
                  <li>• Customer TIN must be valid for Cambodia</li>
                  <li>• Line items must have positive quantities</li>
                  <li>• Tax rates should be in percentage (e.g., 10 for 10%)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </InvoiceFormProvider>
    </div>
  );
}
