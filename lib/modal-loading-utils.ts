/**
 * Utility functions to replace Sonner toast notifications with modal loading system
 * This provides a migration path from toast-based notifications to modal-based ones
 */

import { useActionLoading } from '@/components/providers/modal-loading-provider';
import { ProgressStep } from '@/components/ui/modal-loading';
import { toast } from 'sonner';

// Predefined progress steps for CamInv operations
export const CamInvProgressSteps = {
  invoiceSubmission: [
    {
      id: 'validate',
      title: 'Validating Document Data',
      description: 'Checking invoice data for completeness and accuracy',
      percentage: 20,
      status: 'pending' as const,
    },
    {
      id: 'transform',
      title: 'Transforming to UBL XML',
      description: 'Converting invoice data to UBL XML format',
      percentage: 40,
      status: 'pending' as const,
    },
    {
      id: 'submit',
      title: 'Submitting to CamInv API',
      description: 'Sending document to CamInv for processing',
      percentage: 70,
      status: 'pending' as const,
    },
    {
      id: 'process',
      title: 'Processing Validation',
      description: 'CamInv is validating the submitted document',
      percentage: 90,
      status: 'pending' as const,
    },
    {
      id: 'finalize',
      title: 'Finalizing Submission',
      description: 'Completing submission and generating verification',
      percentage: 100,
      status: 'pending' as const,
    },
  ] as ProgressStep[],

  invoiceCreation: [
    {
      id: 'validate',
      title: 'Validating Form Data',
      description: 'Checking all required fields and line items',
      percentage: 25,
      status: 'pending' as const,
    },
    {
      id: 'create',
      title: 'Creating Invoice Record',
      description: 'Saving invoice data to database',
      percentage: 60,
      status: 'pending' as const,
    },
    {
      id: 'generate',
      title: 'Generating Preview',
      description: 'Creating invoice preview and calculations',
      percentage: 85,
      status: 'pending' as const,
    },
    {
      id: 'complete',
      title: 'Finalizing Invoice',
      description: 'Invoice created successfully',
      percentage: 100,
      status: 'pending' as const,
    },
  ] as ProgressStep[],

  statusRefresh: [
    {
      id: 'connect',
      title: 'Connecting to CamInv',
      description: 'Establishing secure connection',
      percentage: 30,
      status: 'pending' as const,
    },
    {
      id: 'fetch',
      title: 'Fetching Latest Status',
      description: 'Retrieving current document status',
      percentage: 70,
      status: 'pending' as const,
    },
    {
      id: 'update',
      title: 'Updating Local Records',
      description: 'Synchronizing status with local database',
      percentage: 100,
      status: 'pending' as const,
    },
  ] as ProgressStep[],
};

// Migration utilities for common toast patterns
export function useModalToastMigration() {
  const modalLoading = useActionLoading();

  // Replace toast.success calls
  const showSuccess = (title: string, description?: string, autoClose = true) => {
    modalLoading.showSuccess(title, description, autoClose);
  };

  // Replace toast.error calls
  const showError = (title: string, description?: string) => {
    modalLoading.showError(title, description);
  };

  // Replace toast.warning calls
  const showWarning = (title: string, description?: string) => {
    modalLoading.showWarning(title, description);
  };

  // Replace toast.loading + toast.success/error pattern
  const executeWithLoading = async <T,>(
    action: () => Promise<T>,
    loadingTitle: string,
    loadingDescription?: string,
    successTitle?: string,
    successDescription?: string
  ): Promise<T> => {
    return modalLoading.executeWithLoading(
      action,
      loadingTitle,
      loadingDescription,
      successTitle,
      successDescription
    );
  };

  // Replace complex toast patterns with progress
  const executeWithProgress = async <T,>(
    action: (updateProgress: (progress: number) => void) => Promise<T>,
    loadingTitle: string,
    loadingDescription?: string,
    successTitle?: string,
    successDescription?: string
  ): Promise<T> => {
    return modalLoading.executeWithProgress(
      action,
      loadingTitle,
      loadingDescription,
      successTitle,
      successDescription
    );
  };

  // Enhanced execution with progress steps and hybrid notifications
  const executeWithSteps = async <T,>(
    action: (stepController: {
      activateStep: (stepId: string) => void;
      completeStep: (stepId: string) => void;
      errorStep: (stepId: string) => void;
    }) => Promise<T>,
    steps: ProgressStep[],
    loadingTitle: string,
    loadingDescription?: string,
    successTitle?: string,
    successDescription?: string,
    showToastOnSuccess = true
  ): Promise<T> => {
    try {
      modalLoading.showLoading(loadingTitle, loadingDescription);
      modalLoading.setProgressSteps(steps);

      const stepController = {
        activateStep: modalLoading.activateStep,
        completeStep: modalLoading.completeStep,
        errorStep: modalLoading.errorStep,
      };

      const result = await action(stepController);

      if (successTitle) {
        modalLoading.showSuccess(
          successTitle,
          successDescription || 'Operation completed successfully'
        );

        // Show toast notification after modal success (hybrid approach)
        if (showToastOnSuccess) {
          setTimeout(() => {
            toast.success(successTitle, {
              description: successDescription || 'Operation completed successfully',
              duration: 5000,
            });
          }, 2500); // Show toast after modal auto-closes
        }
      } else {
        modalLoading.close();
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      modalLoading.showError('Operation Failed', errorMessage);
      throw error;
    }
  };

  return {
    showSuccess,
    showError,
    showWarning,
    executeWithLoading,
    executeWithProgress,
    executeWithSteps,
    close: modalLoading.close,
  };
}

// CamInv specific modal loading patterns (replacing camInvToasts)
export function useCamInvModalLoading() {
  const modalLoading = useActionLoading();

  const invoiceSubmitted = (invoiceNumber: string, verificationLink?: string) => {
    modalLoading.showSuccess(
      'Invoice Submitted Successfully',
      `Invoice ${invoiceNumber} has been submitted to CamInv and is being processed.`
    );
  };

  const invoiceValidated = (invoiceNumber: string, verificationLink?: string) => {
    modalLoading.showSuccess(
      'Invoice Validated',
      `Invoice ${invoiceNumber} has been successfully validated by CamInv.`
    );
  };

  const invoiceValidationFailed = (invoiceNumber: string, reason?: string) => {
    modalLoading.showError(
      'Invoice Validation Failed',
      reason || `Invoice ${invoiceNumber} failed CamInv validation. Please review and resubmit.`
    );
  };

  const statusRefreshed = (status: string, updated: boolean) => {
    if (updated) {
      modalLoading.showSuccess(
        'Status Updated',
        `Current status: ${status}`
      );
    } else {
      modalLoading.showSuccess(
        'Status Checked',
        `Status is up to date: ${status}`
      );
    }
  };

  const connectionError = () => {
    modalLoading.showError(
      'Connection Error',
      'Unable to connect to CamInv services. Please check your internet connection.'
    );
  };

  const merchantConnected = (merchantName: string) => {
    modalLoading.showSuccess(
      'Merchant Connected',
      `Successfully connected to CamInv as ${merchantName}.`
    );
  };

  const merchantDisconnected = () => {
    modalLoading.showSuccess(
      'Merchant Disconnected',
      'Your CamInv connection has been removed.'
    );
  };

  return {
    invoiceSubmitted,
    invoiceValidated,
    invoiceValidationFailed,
    statusRefreshed,
    connectionError,
    merchantConnected,
    merchantDisconnected,
  };
}

// Common action patterns for different operations
export const ModalLoadingPatterns = {
  // Invoice operations
  createInvoice: {
    loading: 'Creating Invoice...',
    loadingDesc: 'Generating invoice and preparing for submission',
    success: 'Invoice Created Successfully!',
    successDesc: 'Your invoice has been created and is ready for submission',
  },
  
  submitInvoice: {
    loading: 'Submitting to CamInv...',
    loadingDesc: 'Sending invoice to CamInv for validation and processing',
    success: 'Invoice Submitted Successfully!',
    successDesc: 'Your invoice has been submitted to CamInv and is being processed',
  },
  
  saveInvoice: {
    loading: 'Saving Invoice...',
    loadingDesc: 'Saving your invoice as a draft',
    success: 'Invoice Saved!',
    successDesc: 'Your invoice has been saved as a draft',
  },

  // Document operations
  downloadPDF: {
    loading: 'Generating PDF...',
    loadingDesc: 'Creating PDF document for download',
    success: 'PDF Downloaded!',
    successDesc: 'Your PDF has been generated and downloaded',
  },

  sendToCustomer: {
    loading: 'Sending to Customer...',
    loadingDesc: 'Sending invoice document to customer email',
    success: 'Sent to Customer!',
    successDesc: 'Invoice has been successfully sent to customer',
  },

  // Status operations
  refreshStatus: {
    loading: 'Refreshing Status...',
    loadingDesc: 'Checking latest status from CamInv',
    success: 'Status Updated!',
    successDesc: 'Invoice status has been refreshed',
  },

  // Merchant operations
  connectMerchant: {
    loading: 'Connecting Merchant...',
    loadingDesc: 'Establishing connection with CamInv',
    success: 'Merchant Connected!',
    successDesc: 'Successfully connected to CamInv merchant account',
  },

  disconnectMerchant: {
    loading: 'Disconnecting Merchant...',
    loadingDesc: 'Removing CamInv connection',
    success: 'Merchant Disconnected!',
    successDesc: 'CamInv connection has been removed',
  },

  // Validation operations
  validateTaxpayer: {
    loading: 'Validating Taxpayer...',
    loadingDesc: 'Checking taxpayer information with CamInv',
    success: 'Taxpayer Validated!',
    successDesc: 'Taxpayer information is valid',
  },
};
