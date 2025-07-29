"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  User, 
  Building2, 
  MapPin, 
  Hash, 
  Globe, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface MerchantProfileDialogProps {
  merchant: {
    id: number;
    endpointId?: string;
    companyNameEn?: string;
    companyNameKh?: string;
    tin?: string;
    isActive: boolean;
  };
  trigger?: React.ReactNode;
}

interface MemberDetail {
  endpoint_id: string;
  company_name_en: string;
  company_name_kh: string;
  entity_type: string;
  entity_id: string;
  tin: string;
  country: string;
}

export function MerchantProfileDialog({ merchant, trigger }: MerchantProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemberDetail = async () => {
    if (!merchant.endpointId) {
      setError('No endpoint ID available for this merchant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/caminv/member-detail?endpoint_id=${merchant.endpointId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch member detail');
      }

      const data = await response.json();
      setMemberDetail(data.member);

    } catch (error) {
      console.error('Failed to fetch member detail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch member detail';
      setError(errorMessage);
      
      toast.error('Failed to Load Profile', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !memberDetail && !loading) {
      fetchMemberDetail();
    }
  };

  const getEntityTypeBadge = (entityType: string) => {
    switch (entityType) {
      case 'PRIVATE_SECTOR':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Building2 className="w-3 h-3 mr-1" />
            Private Sector
          </Badge>
        );
      case 'PUBLIC_SECTOR':
        return (
          <Badge variant="default" className="bg-green-500">
            <Globe className="w-3 h-3 mr-1" />
            Public Sector
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {entityType}
          </Badge>
        );
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <User className="h-4 w-4 mr-2" />
      View Profile
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Merchant Profile
          </DialogTitle>
          <DialogDescription>
            Detailed information from CamInv registry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading profile...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchMemberDetail}
                  className="ml-2"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {memberDetail && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{memberDetail.company_name_en}</h3>
                  {memberDetail.company_name_kh && (
                    <p className="text-lg text-muted-foreground mt-1">{memberDetail.company_name_kh}</p>
                  )}
                </div>
                {getEntityTypeBadge(memberDetail.entity_type)}
              </div>

              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    Endpoint ID
                  </div>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {memberDetail.endpoint_id}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    Entity ID
                  </div>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {memberDetail.entity_id}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    Tax ID (TIN)
                  </div>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {memberDetail.tin}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Country
                  </div>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {memberDetail.country}
                  </p>
                </div>
              </div>

              {/* Status Information */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium">CamInv Registration Status</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This merchant is successfully registered with Cambodia E-Invoicing system 
                  and can issue compliant e-invoices.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`https://sb-merchant.e-invoice.gov.kh/setting/company-profile`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on CamInv
                </Button>
                <Button variant="outline" onClick={fetchMemberDetail}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && !memberDetail && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No profile data available. Click retry to fetch from CamInv.
              </p>
              <Button variant="outline" onClick={fetchMemberDetail} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Profile
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
