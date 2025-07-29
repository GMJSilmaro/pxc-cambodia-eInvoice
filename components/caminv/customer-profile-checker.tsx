"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  User, 
  Building2, 
  MapPin, 
  Hash, 
  Globe, 
  Phone,
  Mail,
  FileText,
  Flag,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerProfile {
  endpoint_id: string;
  company_name_en: string;
  company_name_kh?: string;
  entity_type: string;
  entity_id: string;
  tin: string;
  country: string;
  city?: string;
  phone_number?: string;
  email?: string;
  business_type?: string;
  is_registered: boolean;
}

interface CustomerProfileCheckerProps {
  merchantId?: number;
  trigger?: React.ReactNode;
}

export function CustomerProfileChecker({ merchantId, trigger }: CustomerProfileCheckerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a CamInv Endpoint ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCustomerProfile(null);

    try {
      const response = await fetch('/api/caminv/customer-profile/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpointId: searchQuery.trim(),
          merchantId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check customer profile');
      }

      setCustomerProfile(data.profile);
      
      if (data.profile.is_registered) {
        toast.success('Customer found in CamInv registry');
      } else {
        toast.warning('Customer not found in CamInv registry');
      }
    } catch (error) {
      console.error('Customer profile check failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to check customer profile');
      toast.error('Failed to check customer profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getRegistrationBadge = (isRegistered: boolean) => {
    if (isRegistered) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 px-2 py-1 text-xs">
          <CheckCircle2 className="w-3 h-3" />
          Registered
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 px-2 py-1 text-xs">
          <XCircle className="w-3 h-3" />
          Not Registered
        </Badge>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            Check Customer Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Customer Profile Checker
          </DialogTitle>
          <DialogDescription>
            Check if a customer is registered with CamInv by their Endpoint ID
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-2">
            <Label htmlFor="endpointId">CamInv Endpoint ID</Label>
            <div className="flex gap-2">
              <Input
                id="endpointId"
                placeholder="e.g., KHUID00001324"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="font-mono"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isLoading || !searchQuery.trim()}
                className="px-4"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Customer Profile Results */}
          {customerProfile && (
            <Card className="bg-gray-50 border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Customer Profile
                  </CardTitle>
                  {getRegistrationBadge(customerProfile.is_registered)}
                </div>
                <CardDescription className="text-sm text-gray-600">
                  CamInv registry information for {customerProfile.endpoint_id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Company Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    Company Information
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 min-w-[80px]">English:</span>
                      <span className="font-medium text-gray-900">{customerProfile.company_name_en}</span>
                    </div>
                    {customerProfile.company_name_kh && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 min-w-[80px]">Khmer:</span>
                        <span className="font-medium text-gray-900">{customerProfile.company_name_kh}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Business Details */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    Business Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">Endpoint ID:</span>
                      <span className="font-mono text-gray-900">{customerProfile.endpoint_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">TIN:</span>
                      <span className="font-mono text-gray-900">{customerProfile.tin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">Entity Type:</span>
                      <span className="text-gray-900">{customerProfile.entity_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">Entity ID:</span>
                      <span className="font-mono text-gray-900">{customerProfile.entity_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">Country:</span>
                      <span className="text-gray-900">{customerProfile.country}</span>
                    </div>
                    {customerProfile.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">City:</span>
                        <span className="text-gray-900">{customerProfile.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                {(customerProfile.phone_number || customerProfile.email) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-600" />
                        Contact Information
                      </h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {customerProfile.phone_number && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">Phone:</span>
                            <span className="text-gray-900">{customerProfile.phone_number}</span>
                          </div>
                        )}
                        {customerProfile.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">Email:</span>
                            <span className="text-gray-900">{customerProfile.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Registration Status */}
                <Separator />
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">CamInv Registration Status</span>
                    {getRegistrationBadge(customerProfile.is_registered)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {customerProfile.is_registered 
                      ? 'This customer is registered with CamInv and can receive e-invoices.'
                      : 'This customer is not registered with CamInv. They may not be able to receive e-invoices.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
