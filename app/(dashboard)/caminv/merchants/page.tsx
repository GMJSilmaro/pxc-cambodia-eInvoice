import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CamInvGlassCard, CamInvHoverCard } from '@/components/ui/caminv-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MerchantConnectionButton } from '@/components/caminv/merchant-connection-button';
import { MerchantCard } from '@/components/caminv/merchant-card';

import {
  Building2,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Shield
} from 'lucide-react';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvMerchantService } from '@/lib/caminv/merchant-service';

interface MerchantsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

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
      merchantId: merchant.merchantId,
      merchantName: merchant.merchantName,
      companyNameEn: merchant.companyNameEn,
      companyNameKh: merchant.companyNameKh,
      tin: merchant.tin,
      endpointId: merchant.endpointId,
      mocId: merchant.mocId,
      registrationStatus: merchant.registrationStatus,
      isActive: merchant.isActive,
      city: merchant.city,
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

function MerchantListSkeleton() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 mb-2" />
                <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
              </div>
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="p-2 sm:p-3">
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 mb-1 sm:mb-2" />
                    <Skeleton className="h-4 sm:h-5 w-20 sm:w-24" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 sm:h-12 w-full rounded-lg" />
              <Skeleton className="h-8 sm:h-10 w-24 sm:w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getStatusBadge(status: string, isActive: boolean) {
  if (!isActive) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
        <XCircle className="w-3 h-3 mr-1" />
        Disconnected
      </Badge>
    );
  }

  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'suspended':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Suspended
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
          Unknown
        </Badge>
      );
  }
}

function SuccessAlert({ message }: { message: string }) {
  return (
    <Alert className="border-green-200 bg-green-50 mb-4 sm:mb-6">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800 leading-relaxed">
        <strong className="font-semibold">Success!</strong>
        <span className="ml-2">{message}</span>
      </AlertDescription>
    </Alert>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert className="border-red-200 bg-red-50 mb-4 sm:mb-6">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800 leading-relaxed">
        <strong className="font-semibold">Error:</strong>
        <span className="ml-2">{message}</span>
      </AlertDescription>
    </Alert>
  );
}

async function MerchantsList() {
  const { merchants } = await getMerchants();
  
  if (merchants.length === 0) {
    return (
      <CamInvGlassCard>
        <div className="text-center py-16">
          <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto mb-6">
            <Building2 className="h-16 w-16 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Merchants Connected</h3>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
            Connect your CamInv merchant account to start issuing compliant e-invoices
            for Cambodia tax requirements and streamline your business operations.
          </p>
          <MerchantConnectionButton />
        </div>
      </CamInvGlassCard>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
      {merchants.map((merchant: any) => (
        <CamInvHoverCard key={merchant.id} className="relative">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl text-gray-900 mb-1 sm:mb-2 truncate">{merchant.merchantName}</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  <span className="font-medium">Endpoint ID:</span> {merchant.endpointId || merchant.merchantId}
                </CardDescription>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(merchant.registrationStatus, merchant.isActive)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="group">
                  <div className="p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Company (EN)</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{merchant.companyNameEn || 'N/A'}</p>
                  </div>
                </div>
                <div className="group">
                  <div className="p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">TIN</p>
                    <p className="font-semibold text-gray-900 font-mono text-sm sm:text-base">{merchant.tin || 'N/A'}</p>
                  </div>
                </div>
                <div className="group">
                  <div className="p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">City</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{merchant.city || 'N/A'}</p>
                  </div>
                </div>
                <div className="group">
                  <div className="p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Last Sync</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      {merchant.lastSyncAt
                        ? new Date(merchant.lastSyncAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {merchant.companyNameKh && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700 mb-1">Company (Khmer)</p>
                  <p className="font-semibold text-blue-900">{merchant.companyNameKh}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <MerchantCard merchant={merchant} />
              </div>
            </div>
          </CardContent>
        </CamInvHoverCard>
      ))}

      {/* Add New Merchant Card - Enhanced */}
      <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors duration-200 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto mb-6">
              <Plus className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Another Merchant</h3>
            <p className="text-gray-600 text-base mb-6 max-w-sm mx-auto">
              Connect additional CamInv merchant accounts to manage multiple businesses
            </p>
            <MerchantConnectionButton variant="outline" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function MerchantsPage({ searchParams }: MerchantsPageProps) {
  const params = await searchParams;
  const success = params.success as string;
  const error = params.error as string;

  return (
    <div className="min-h-screen">
      <div>

        {/* Enhanced Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Title Section */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-100 rounded-xl shadow-sm">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-1 sm:mb-2">
                    CamInv Merchants
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600">
                    Manage your Cambodia E-Invoicing merchant account connections and integrations
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-3 lg:flex-col lg:items-end">
              <MerchantConnectionButton />
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success === 'connected' && (
          <SuccessAlert message="Your CamInv merchant account has been successfully connected! You can now start issuing compliant e-invoices." />
        )}
        {success === 'merchant-disconnected' && (
          <SuccessAlert message="Merchant account has been successfully disconnected. All access tokens have been revoked and the connection has been terminated." />
        )}
        {error && (
          <ErrorAlert message={decodeURIComponent(error)} />
        )}

        {/* Information Alert - Enhanced */}
        <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6 sm:mb-8">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 leading-relaxed">
            <strong className="font-semibold">Important:</strong>
            <span className="ml-2">Each merchant account requires OAuth2 authorization with CamInv. Ensure your redirect URLs are properly configured before connecting.</span>
          </AlertDescription>
        </Alert>

        {/* Connection Requirements - Enhanced */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm mb-6 sm:mb-8">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl">
              <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <span className="truncate">Connection Requirements</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
              Prerequisites for connecting CamInv merchant accounts to ensure compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="group">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-green-50 transition-colors">
                  <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-green-900 mb-1 text-sm sm:text-base">Valid CamInv Account</h4>
                    <p className="text-xs sm:text-sm text-green-700 leading-relaxed">
                      Active merchant account with Cambodia E-Invoicing system
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Business Registration</h4>
                    <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                      Valid TIN and Ministry of Commerce registration
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-purple-50 transition-colors">
                  <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-purple-900 mb-1 text-sm sm:text-base">OAuth2 Authorization</h4>
                    <p className="text-xs sm:text-sm text-purple-700 leading-relaxed">
                      Secure connection via CamInv OAuth2 flow
                    </p>
                  </div>
                </div>
              </div>
              <div className="group">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-orange-50 transition-colors">
                  <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-orange-900 mb-1 text-sm sm:text-base">API Access</h4>
                    <p className="text-xs sm:text-sm text-orange-700 leading-relaxed">
                      Document submission and management capabilities
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Merchants List */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Connected Merchants</h2>
          <Suspense fallback={<MerchantListSkeleton />}>
            <MerchantsList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
