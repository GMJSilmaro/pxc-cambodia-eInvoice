"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Loader2, 
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface TaxpayerValidationProps {
  customerName?: string;
  customerTaxId?: string;
  onValidationResult?: (isValid: boolean, data?: any) => void;
  className?: string;
}

interface ValidationState {
  status: 'idle' | 'loading' | 'valid' | 'invalid' | 'error';
  message?: string;
  lastValidated?: {
    single_id: string;
    tin: string;
    company_name_en: string;
    company_name_kh: string;
  };
}

export function TaxpayerValidation({ 
  customerName, 
  customerTaxId, 
  onValidationResult,
  className 
}: TaxpayerValidationProps) {
  const [validation, setValidation] = useState<ValidationState>({ status: 'idle' });
  const [singleId, setSingleId] = useState('');
  const [companyNameKh, setCompanyNameKh] = useState('');

  const validateTaxpayer = async () => {
    if (!customerName?.trim() || !customerTaxId?.trim() || !singleId.trim() || !companyNameKh.trim()) {
      toast.error('Please fill in all required fields for validation');
      return;
    }

    setValidation({ status: 'loading' });

    try {
      const response = await fetch('/api/caminv/validate-taxpayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          single_id: singleId,
          tin: customerTaxId || '',
          company_name_en: customerName || '',
          company_name_kh: companyNameKh,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed');
      }

      const isValid = data.is_valid;
      const newValidation: ValidationState = {
        status: isValid ? 'valid' : 'invalid',
        message: data.message,
        lastValidated: {
          single_id: singleId,
          tin: customerTaxId || '',
          company_name_en: customerName || '',
          company_name_kh: companyNameKh,
        }
      };

      setValidation(newValidation);
      onValidationResult?.(isValid, data);

      if (isValid) {
        toast.success('Customer is registered with CamInv', {
          description: 'This customer can receive e-invoices directly through CamInv.',
        });
      } else {
        toast.warning('Customer is not registered with CamInv', {
          description: 'You can still create the invoice, but it cannot be sent directly through CamInv.',
        });
      }

    } catch (error) {
      console.error('Taxpayer validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      
      setValidation({ 
        status: 'error', 
        message: errorMessage 
      });

      toast.error('Validation Error', {
        description: errorMessage,
      });

      onValidationResult?.(false);
    }
  };

  const getStatusBadge = () => {
    switch (validation.status) {
      case 'valid':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            CamInv Registered
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            Not Registered
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Validation Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const shouldShowValidationFields = customerName?.trim() && customerTaxId?.trim();

  return (
    <div className={className}>
      {/* Information Alert */}
      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>CamInv Registration Check:</strong> Verify if your customer is registered with CamInv 
          to enable direct e-invoice delivery. This is optional but recommended.
        </AlertDescription>
      </Alert>

      {shouldShowValidationFields && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">CamInv Registration Validation</h4>
            {getStatusBadge()}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="singleId">Single ID *</Label>
              <Input
                id="singleId"
                value={singleId}
                onChange={(e) => setSingleId(e.target.value)}
                placeholder="Customer's Single ID"
                disabled={validation.status === 'loading'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyNameKh">Company Name (Khmer) *</Label>
              <Input
                id="companyNameKh"
                value={companyNameKh}
                onChange={(e) => setCompanyNameKh(e.target.value)}
                placeholder="ឈ្មោះក្រុមហ៊ុន"
                disabled={validation.status === 'loading'}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={validateTaxpayer}
            disabled={validation.status === 'loading' || !singleId.trim() || !companyNameKh.trim()}
            className="w-full bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
          >
            {validation.status === 'loading' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {validation.status === 'loading' ? 'Validating...' : 'Validate with CamInv'}
          </Button>

          {validation.message && (
            <Alert variant={validation.status === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{validation.message}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {!shouldShowValidationFields && (
        <div className="p-4 border rounded-lg bg-muted/10 text-center">
          <p className="text-sm text-muted-foreground">
            Enter customer name and tax ID above to enable CamInv registration validation
          </p>
        </div>
      )}
    </div>
  );
}
