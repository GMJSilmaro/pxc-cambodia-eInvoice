'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface StatusRefreshResult {
  success: boolean;
  status?: string;
  updated?: boolean;
  document?: any;
  localInvoice?: any;
  error?: string;
}

interface UseStatusRefreshOptions {
  onSuccess?: (result: StatusRefreshResult) => void;
  onError?: (error: string) => void;
}

export function useStatusRefresh(options: UseStatusRefreshOptions = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatus = async (
    documentId: string,
    merchantId: number,
    invoiceId?: number
  ): Promise<StatusRefreshResult> => {
    setIsRefreshing(true);
    
    try {
      const params = new URLSearchParams({
        merchant_id: merchantId.toString(),
      });
      
      if (invoiceId) {
        params.append('invoice_id', invoiceId.toString());
      }

      const response = await fetch(
        `/api/caminv/documents/${documentId}/status?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to refresh status');
      }

      if (result.success) {
        const message = result.updated 
          ? 'Status updated successfully' 
          : 'Status is up to date';
        
        toast.success(message, {
          description: `Current status: ${result.status || 'Unknown'}`,
        });

        options.onSuccess?.(result);
        return result;
      } else {
        throw new Error(result.error || 'Failed to refresh status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast.error('Failed to refresh status', {
        description: errorMessage,
      });

      options.onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsRefreshing(false);
    }
  };

  const bulkRefreshStatus = async (
    documentIds: string[],
    merchantId: number
  ): Promise<{ success: boolean; results?: any[]; error?: string }> => {
    setIsRefreshing(true);
    
    try {
      const response = await fetch(
        `/api/caminv/documents/bulk/status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            merchant_id: merchantId,
            document_ids: documentIds,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk refresh status');
      }

      if (result.success) {
        const successCount = result.results?.filter((r: any) => r.success).length || 0;
        const totalCount = result.results?.length || 0;
        
        toast.success(`Bulk status refresh completed`, {
          description: `${successCount}/${totalCount} documents updated successfully`,
        });

        options.onSuccess?.(result);
        return result;
      } else {
        throw new Error(result.error || 'Failed to bulk refresh status');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast.error('Failed to bulk refresh status', {
        description: errorMessage,
      });

      options.onError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    refreshStatus,
    bulkRefreshStatus,
    isRefreshing,
  };
}

// Hook for automatic status refresh with polling
export function useAutoStatusRefresh(
  documentId: string,
  merchantId: number,
  invoiceId?: number,
  options: {
    enabled?: boolean;
    interval?: number; // in milliseconds
    maxAttempts?: number;
    onStatusChange?: (newStatus: string) => void;
  } = {}
) {
  const [attempts, setAttempts] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  
  const {
    enabled = false,
    interval = 30000, // 30 seconds default
    maxAttempts = 20, // Stop after 20 attempts (10 minutes with 30s interval)
    onStatusChange,
  } = options;

  const { refreshStatus, isRefreshing } = useStatusRefresh({
    onSuccess: (result) => {
      if (result.status && result.status !== currentStatus) {
        setCurrentStatus(result.status);
        onStatusChange?.(result.status);
      }
      
      // Stop polling if status is final
      const finalStatuses = ['validated', 'validation_failed', 'accepted', 'rejected'];
      if (result.status && finalStatuses.includes(result.status.toLowerCase())) {
        setAttempts(maxAttempts); // Stop polling
      }
    },
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh logic with useEffect
  useEffect(() => {
    if (!enabled || attempts >= maxAttempts || isRefreshing) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start polling
    intervalRef.current = setInterval(() => {
      if (attempts < maxAttempts && !isRefreshing) {
        setAttempts(prev => prev + 1);
        refreshStatus(documentId, merchantId, invoiceId);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, attempts, maxAttempts, isRefreshing, interval, documentId, merchantId, invoiceId]);

  const startPolling = () => {
    setAttempts(0);
    setCurrentStatus(null);
  };

  const stopPolling = () => {
    setAttempts(maxAttempts);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const shouldPoll = enabled && attempts < maxAttempts && !isRefreshing;

  return {
    refreshStatus: () => refreshStatus(documentId, merchantId, invoiceId),
    startPolling,
    stopPolling,
    isRefreshing,
    currentStatus,
    attempts,
    shouldPoll,
  };
}
