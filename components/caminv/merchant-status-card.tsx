"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CustomerProfileChecker } from './customer-profile-checker';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  MapPin,
  Hash,
  Globe,
  Phone,
  Mail,
  FileText,
  Flag,
  Search,
  Users
} from 'lucide-react';

interface MerchantStatusCardProps {
  merchant: {
    id: number;
    merchantName: string;
    endpointId?: string;
    merchantId: string;
    isActive: boolean;
    registrationStatus: string;
    companyNameEn?: string;
    companyNameKh?: string;
    tin?: string;
    city?: string;
    country?: string;
    businessType?: string;
    mocId?: string;
    phoneNumber?: string;
    email?: string;
    lastSyncAt?: string;
    createdAt: string;
  };
}

function getStatusBadge(status: string, isActive: boolean) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 gap-1 px-1.5 py-0.5 text-xs font-medium">
        <XCircle className="w-3 h-3" />
        Disconnected
      </Badge>
    );
  }

  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 gap-1 px-1.5 py-0.5 text-xs font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Active
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 gap-1 px-1.5 py-0.5 text-xs font-medium">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    case 'suspended':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 gap-1 px-1.5 py-0.5 text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          Suspended
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 gap-1 px-1.5 py-0.5 text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          Unknown
        </Badge>
      );
  }
}

export function MerchantStatusCard({ merchant }: MerchantStatusCardProps) {
  const handleSync = async () => {
    try {
      // Implement sync functionality
      console.log('Syncing merchant:', merchant.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const isActiveAndConnected = merchant.isActive && merchant.registrationStatus === 'active';

  return (
    <Card className={`bg-white border border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-sm ${
      isActiveAndConnected
        ? 'hover:border-green-200'
        : ''
    }`}>
      <CardContent className="p-3">
        <div className="space-y-2.5">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <div className={`p-1.5 rounded-lg border ${
                isActiveAndConnected
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-100 border-gray-200'
              }`}>
                <Building2 className={`h-4 w-4 ${
                  isActiveAndConnected
                    ? 'text-green-600'
                    : 'text-gray-600'
                }`} />
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm text-gray-900 leading-tight">
                    {merchant.merchantName}
                  </h4>
                  {getStatusBadge(merchant.registrationStatus, merchant.isActive)}
                </div>

                {/* Company Names */}
                <div className="space-y-0.5">
                  {merchant.companyNameEn && merchant.companyNameEn !== merchant.merchantName && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      EN: {merchant.companyNameEn}
                    </p>
                  )}
                  {merchant.companyNameKh && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      KH: {merchant.companyNameKh}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={!merchant.isActive}
                    className="h-6 w-6 p-0 bg-white hover:bg-gray-50 border-gray-300 transition-colors duration-200"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sync merchant data</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-6 w-6 p-0 bg-white hover:bg-gray-50 border-gray-300 transition-colors duration-200"
                  >
                    <a href={`/caminv/merchants`}>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Manage merchant</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-1.5">
            {/* Primary Identifiers */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Hash className="h-3 w-3 text-gray-500" />
              <span className="font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-200 text-xs">
                {merchant.endpointId || merchant.merchantId}
              </span>
            </div>

            {/* Business Information Grid */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {merchant.tin && (
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  <FileText className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">TIN:</span>
                  <span className="font-mono text-gray-900">{merchant.tin}</span>
                </div>
              )}

              {merchant.mocId && (
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  <Hash className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">MOC:</span>
                  <span className="font-mono text-gray-900">{merchant.mocId}</span>
                </div>
              )}

              {merchant.businessType && (
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  <Building2 className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-900">{merchant.businessType}</span>
                </div>
              )}

              {merchant.country && (
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  <Flag className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">Country:</span>
                  <span className="text-gray-900">{merchant.country}</span>
                </div>
              )}

              {merchant.city && (
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">City:</span>
                  <span className="text-gray-900">{merchant.city}</span>
                </div>
              )}

              {merchant.phoneNumber && (
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="text-gray-900">{merchant.phoneNumber}</span>
                </div>
              )}
            </div>

            {/* Contact Information */}
            {merchant.email && (
              <div className="flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200">
                <Mail className="h-3 w-3 text-blue-500" />
                <span className="text-blue-600">Email:</span>
                <span className="text-blue-900">{merchant.email}</span>
              </div>
            )}

            {/* Customer Profile Checker */}
            <div className="flex items-center justify-between gap-1.5 bg-blue-50 px-2 py-1.5 rounded border border-blue-200">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-700">Customer Verification</span>
              </div>
              <CustomerProfileChecker
                merchantId={merchant.id}
                trigger={
                  <Button variant="ghost" size="sm" className="h-6 px-2 py-0 text-xs text-blue-700 hover:bg-blue-100">
                    <Search className="h-3 w-3 mr-1" />
                    Check Customer
                  </Button>
                }
              />
            </div>

            {/* Footer */}
            <div className="pt-1 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Connected: {new Date(merchant.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit'
                  })}
                </span>
                {merchant.lastSyncAt && (
                  <span>
                    Last sync: {new Date(merchant.lastSyncAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: '2-digit'
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
