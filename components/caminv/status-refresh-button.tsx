'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useStatusRefresh } from '@/hooks/use-status-refresh';
import { InteractiveButton } from '@/components/ui/interactive-card';
import { cn } from '@/lib/utils';

interface StatusRefreshButtonProps {
  documentId?: string;
  merchantId?: number;
  invoiceId?: number;
  invoice?: {
    id: number;
    status: string;
    camInvStatus?: string;
    documentId?: string;
  };
  onStatusUpdate?: (newStatus: string, updated: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

export function StatusRefreshButton({
  documentId,
  merchantId,
  invoiceId,
  invoice,
  onStatusUpdate,
  variant = 'outline',
  size = 'sm',
  className,
  showLabel = true,
  disabled = false,
}: StatusRefreshButtonProps) {
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Use invoice data if provided, otherwise use individual props
  const finalDocumentId = documentId || invoice?.documentId;
  const finalInvoiceId = invoiceId || invoice?.id;
  const currentStatus = invoice?.status || 'unknown';
  const camInvStatus = invoice?.camInvStatus;

  const { refreshStatus, isRefreshing } = useStatusRefresh({
    onSuccess: (result) => {
      setLastRefreshTime(new Date());
      if (result.status) {
        onStatusUpdate?.(result.status, result.updated || false);
      }
    },
  });

  const handleRefresh = async () => {
    if (!finalDocumentId || !merchantId) {
      console.error('Missing required props for status refresh');
      return;
    }

    await refreshStatus(finalDocumentId, merchantId, finalInvoiceId);
  };

  // Determine if refresh is needed based on status
  const needsRefresh = () => {
    const processingStatuses = ['submitted', 'processing', 'pending'];
    return processingStatuses.includes(currentStatus.toLowerCase()) || 
           (camInvStatus && processingStatuses.includes(camInvStatus.toLowerCase()));
  };

  // Get appropriate icon based on status and state
  const getIcon = () => {
    if (isRefreshing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (needsRefresh()) {
      return <RefreshCw className="h-4 w-4" />;
    }
    
    const finalStatuses = ['validated', 'accepted'];
    const errorStatuses = ['validation_failed', 'rejected', 'failed'];
    
    if (finalStatuses.includes(currentStatus.toLowerCase()) || 
        (camInvStatus && finalStatuses.includes(camInvStatus.toLowerCase()))) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    if (errorStatuses.includes(currentStatus.toLowerCase()) || 
        (camInvStatus && errorStatuses.includes(camInvStatus.toLowerCase()))) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    
    return <Clock className="h-4 w-4 text-yellow-600" />;
  };

  // Get button text based on status
  const getButtonText = () => {
    if (isRefreshing) {
      return 'Refreshing...';
    }
    
    if (needsRefresh()) {
      return 'Refresh Status';
    }
    
    return 'Check Status';
  };

  // Determine if button should be disabled
  const isDisabled = disabled || 
                    isRefreshing || 
                    !finalDocumentId || 
                    !merchantId;

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleRefresh}
        disabled={isDisabled}
        className={cn(
          'flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700',
          needsRefresh() && 'border-gray-300 hover:border-gray-400',
          className
        )}
      >
        {getIcon()}
        {showLabel && getButtonText()}
      </Button>

      {lastRefreshTime && (
        <p className="text-xs text-gray-500">
          Last checked: {lastRefreshTime.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

// Bulk refresh button for multiple invoices
interface BulkStatusRefreshButtonProps {
  invoices: Array<{
    id: number;
    documentId?: string;
    status: string;
    camInvStatus?: string;
  }>;
  merchantId: number;
  onStatusUpdate?: () => void;
  className?: string;
}

export function BulkStatusRefreshButton({
  invoices,
  merchantId,
  onStatusUpdate,
  className,
}: BulkStatusRefreshButtonProps) {
  const { bulkRefreshStatus, isRefreshing } = useStatusRefresh({
    onSuccess: () => {
      onStatusUpdate?.();
    },
  });

  const handleBulkRefresh = async () => {
    const documentIds = invoices
      .filter(invoice => invoice.documentId)
      .map(invoice => invoice.documentId!);

    if (documentIds.length === 0) {
      return;
    }

    await bulkRefreshStatus(documentIds, merchantId);
  };

  // Count invoices that need refresh
  const needsRefreshCount = invoices.filter(invoice => {
    const processingStatuses = ['submitted', 'processing', 'pending'];
    return processingStatuses.includes(invoice.status.toLowerCase()) || 
           (invoice.camInvStatus && processingStatuses.includes(invoice.camInvStatus.toLowerCase()));
  }).length;

  if (needsRefreshCount === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBulkRefresh}
      disabled={isRefreshing}
      className={cn('flex items-center gap-2', className)}
    >
      {isRefreshing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Refresh All ({needsRefreshCount})
    </Button>
  );
}
