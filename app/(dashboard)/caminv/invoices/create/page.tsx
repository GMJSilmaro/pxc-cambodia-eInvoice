import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InvoiceCreateForm } from '@/components/caminv/invoice-create-form';
import { InvoicePreview } from '@/components/caminv/invoice-preview';
import { InvoiceFormProvider } from '@/components/caminv/invoice-form-context';
import { DocumentTypeSelector } from '@/components/caminv/document-type-selector';
import {
  FileText,
  AlertCircle,
  Info
} from 'lucide-react';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';

async function getMerchants() {
  try {
    // Get current user and team
    const user = await getUser();
    if (!user) {
      return { merchants: [] };
    }

    const team = await getTeamForUser(user.id);
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

function FormSkeleton() {
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

async function CreateInvoiceForm() {
  const { merchants } = await getMerchants();
  
  if (merchants.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Merchants Connected</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You need to connect a CamInv merchant account before creating invoices.
            </p>
            <a 
              href="/caminv/merchants"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Connect Merchant Account
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <InvoiceCreateForm merchants={merchants} />;
}

export default function CreateInvoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create E-Invoice</h1>
        <p className="text-muted-foreground">
          Generate a new Cambodia E-Invoicing compliant document
        </p>
      </div>

      {/* Information Alerts */}
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>UBL 2.1 Compliance:</strong> All invoices are automatically generated in UBL 2.1 format 
            according to Cambodia tax requirements and validated before submission.
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Required Information:</strong> Ensure all customer details are accurate as they cannot 
            be modified after submission to CamInv.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Form */}
      <InvoiceFormProvider>
        {/* Invoice Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Types
            </CardTitle>
            <CardDescription>
              Choose the type of document you want to create
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentTypeSelector />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Invoice Form */}
          <div className="lg:col-span-2">
            <Suspense fallback={<FormSkeleton />}>
              <CreateInvoiceForm />
            </Suspense>
          </div>

          {/* Invoice Preview - Enhanced */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Live preview of your invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoicePreview />
            </CardContent>
          </Card>

          {/* Validation Status - Enhanced */}
          <Card>
            <CardHeader>
              <CardTitle>Validation</CardTitle>
              <CardDescription>
                UBL 2.1 compliance check
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Required fields</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">UBL structure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Cambodia GDT rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Tax calculations</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help & Documentation - Enhanced */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a 
                  href="#" 
                  className="block text-sm text-primary hover:underline"
                >
                  📖 Invoice Creation Guide
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-primary hover:underline"
                >
                  📋 UBL 2.1 Requirements
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-primary hover:underline"
                >
                  🇰🇭 Cambodia Tax Guidelines
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-primary hover:underline"
                >
                  ❓ Frequently Asked Questions
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </InvoiceFormProvider>
    </div>
  );
}
