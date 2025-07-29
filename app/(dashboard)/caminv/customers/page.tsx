import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerProfileChecker } from '@/components/caminv/customer-profile-checker';
import { SectionHeader } from '@/components/ui/consistent-styling';
import {
  Users,
  Search,
  ArrowLeft,
  UserPlus,
  Building2,
  FileText,
  Settings
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
    }));

    return { merchants: safeMerchants };
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return { merchants: [] };
  }
}

function CustomerProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
      <div className="h-[300px] w-full bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

export default async function CustomerProfilePage() {
  const { merchants } = await getMerchants();
  const activeMerchant = merchants.find(m => m.isActive && m.registrationStatus === 'active');

  return (
    <div className="min-h-screen">
      <SectionHeader
        title="Customer Profiles"
        description="Verify and manage customer CamInv registration status"
        icon={<Users className="h-5 w-5 text-gray-600" />}
        backButton={
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/caminv">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href="/caminv/customers/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        }
      />

      <div className="container py-6 space-y-8">
        <Tabs defaultValue="verify" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="verify" className="gap-2">
              <Search className="h-4 w-4" />
              Verify Customer
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Manage Customers
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="verify" className="space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5 text-gray-600" />
                  Customer Verification
                </CardTitle>
                <CardDescription>
                  Check if a customer is registered with CamInv by their Endpoint ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<CustomerProfileSkeleton />}>
                  <div className="max-w-2xl mx-auto">
                    <CustomerProfileChecker 
                      merchantId={activeMerchant?.id}
                      trigger={
                        <Button className="w-full gap-2">
                          <Search className="h-4 w-4" />
                          Check Customer Profile
                        </Button>
                      }
                    />
                  </div>
                </Suspense>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-gray-600" />
                  Customer Registration Guide
                </CardTitle>
                <CardDescription>
                  Information about CamInv customer registration process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-gray-900">What is a CamInv Endpoint ID?</h3>
                  <p className="text-sm text-gray-600">
                    A CamInv Endpoint ID is a unique identifier assigned to businesses registered with the Cambodia E-Invoicing system.
                    It typically follows the format <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">KHUID00000000</code> where the digits are unique to each business.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-gray-900">How customers can register</h3>
                  <p className="text-sm text-gray-600">
                    Customers need to register with the Cambodia E-Invoicing system to receive electronic invoices. 
                    They can register through the official CamInv portal at <a href="https://e-invoice.gov.kh" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">e-invoice.gov.kh</a>.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 pl-2 space-y-1">
                    <li>Registration requires business identification documents</li>
                    <li>Tax Identification Number (TIN) is mandatory</li>
                    <li>Once registered, customers receive their Endpoint ID</li>
                    <li>Customers must share their Endpoint ID with suppliers</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-base font-semibold text-blue-800 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Customer Onboarding Assistance
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You can help your customers register with CamInv by providing them with the registration guide and directing them to the official CamInv portal.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 bg-white border-blue-200 text-blue-700 hover:bg-blue-100">
                    Download Registration Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5 text-gray-600" />
                  Customer Management
                </CardTitle>
                <CardDescription>
                  Manage your customer database and CamInv registration status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="p-3 bg-gray-50 rounded-full w-fit mx-auto mb-3">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Customer Management Coming Soon</h3>
                  <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                    We're working on a comprehensive customer management system that will allow you to store and manage your customers' CamInv registration status.
                  </p>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
