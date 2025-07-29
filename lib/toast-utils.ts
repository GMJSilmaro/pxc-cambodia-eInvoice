import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

// Enhanced success toast with better styling
export function showSuccessToast(
  title: string, 
  description?: string, 
  options: ToastOptions = {}
) {
  return toast.success(title, {
    description,
    duration: options.duration || 4000,
    action: options.action,
    dismissible: options.dismissible !== false,
    className: 'border-green-200 bg-green-50',
    style: {
      borderLeft: '4px solid #10b981',
    },
    icon: CheckCircle,
  });
}

// Enhanced error toast with actionable solutions
export function showErrorToast(
  title: string, 
  description?: string, 
  options: ToastOptions & { 
    retry?: () => void;
    support?: boolean;
  } = {}
) {
  const actions: any = {};
  
  if (options.retry) {
    actions.action = {
      label: 'Retry',
      onClick: options.retry,
    };
  } else if (options.support) {
    actions.action = {
      label: 'Get Help',
      onClick: () => window.open('/support', '_blank'),
    };
  } else if (options.action) {
    actions.action = options.action;
  }

  return toast.error(title, {
    description,
    duration: options.duration || 6000,
    dismissible: options.dismissible !== false,
    className: 'border-red-200 bg-red-50',
    style: {
      borderLeft: '4px solid #ef4444',
    },
    icon: XCircle,
    ...actions,
  });
}

// Warning toast for important notices
export function showWarningToast(
  title: string, 
  description?: string, 
  options: ToastOptions = {}
) {
  return toast.warning(title, {
    description,
    duration: options.duration || 5000,
    action: options.action,
    dismissible: options.dismissible !== false,
    className: 'border-yellow-200 bg-yellow-50',
    style: {
      borderLeft: '4px solid #f59e0b',
    },
    icon: AlertTriangle,
  });
}

// Info toast for general information
export function showInfoToast(
  title: string, 
  description?: string, 
  options: ToastOptions = {}
) {
  return toast.info(title, {
    description,
    duration: options.duration || 4000,
    action: options.action,
    dismissible: options.dismissible !== false,
    className: 'border-blue-200 bg-blue-50',
    style: {
      borderLeft: '4px solid #3b82f6',
    },
    icon: Info,
  });
}

// Loading toast for async operations
export function showLoadingToast(
  title: string, 
  description?: string,
  options: { id?: string } = {}
) {
  return toast.loading(title, {
    description,
    id: options.id,
    dismissible: false,
    className: 'border-gray-200 bg-gray-50',
  });
}

// Update loading toast to success
export function updateToastToSuccess(
  id: string | number,
  title: string,
  description?: string,
  options: ToastOptions = {}
) {
  return toast.success(title, {
    id,
    description,
    duration: options.duration || 4000,
    action: options.action,
    className: 'border-green-200 bg-green-50',
    style: {
      borderLeft: '4px solid #10b981',
    },
    icon: CheckCircle,
  });
}

// Update loading toast to error
export function updateToastToError(
  id: string | number,
  title: string,
  description?: string,
  options: ToastOptions & { retry?: () => void } = {}
) {
  const actions: any = {};
  
  if (options.retry) {
    actions.action = {
      label: 'Retry',
      onClick: options.retry,
    };
  } else if (options.action) {
    actions.action = options.action;
  }

  return toast.error(title, {
    id,
    description,
    duration: options.duration || 6000,
    className: 'border-red-200 bg-red-50',
    style: {
      borderLeft: '4px solid #ef4444',
    },
    icon: XCircle,
    ...actions,
  });
}

// CamInv specific toasts
export const camInvToasts = {
  invoiceSubmitted: (invoiceNumber: string, verificationLink?: string) => {
    return showSuccessToast(
      'Invoice Submitted Successfully',
      `Invoice ${invoiceNumber} has been submitted to CamInv and is being processed.`,
      {
        duration: 7000,
        action: verificationLink ? {
          label: 'View Verification',
          onClick: () => window.open(verificationLink, '_blank'),
        } : undefined,
      }
    );
  },

  invoiceValidated: (invoiceNumber: string, verificationLink?: string) => {
    return showSuccessToast(
      'Invoice Validated',
      `Invoice ${invoiceNumber} has been successfully validated by CamInv.`,
      {
        duration: 5000,
        action: verificationLink ? {
          label: 'View Certificate',
          onClick: () => window.open(verificationLink, '_blank'),
        } : undefined,
      }
    );
  },

  invoiceValidationFailed: (invoiceNumber: string, reason?: string) => {
    return showErrorToast(
      'Invoice Validation Failed',
      reason || `Invoice ${invoiceNumber} failed CamInv validation. Please review and resubmit.`,
      {
        duration: 8000,
        support: true,
      }
    );
  },

  statusRefreshed: (status: string, updated: boolean) => {
    if (updated) {
      return showInfoToast(
        'Status Updated',
        `Current status: ${status}`,
        { duration: 3000 }
      );
    } else {
      return showInfoToast(
        'Status Checked',
        `Status is up to date: ${status}`,
        { duration: 2000 }
      );
    }
  },

  connectionError: (retry?: () => void) => {
    return showErrorToast(
      'Connection Error',
      'Unable to connect to CamInv services. Please check your internet connection.',
      {
        duration: 6000,
        retry,
      }
    );
  },

  merchantConnected: (merchantName: string) => {
    return showSuccessToast(
      'Merchant Connected',
      `Successfully connected to CamInv as ${merchantName}.`,
      { duration: 4000 }
    );
  },

  merchantDisconnected: () => {
    return showInfoToast(
      'Merchant Disconnected',
      'Your CamInv connection has been removed.',
      { duration: 3000 }
    );
  },
};

// Dismiss all toasts
export function dismissAllToasts() {
  toast.dismiss();
}

// Dismiss specific toast
export function dismissToast(id: string | number) {
  toast.dismiss(id);
}

// Enhanced error handling with actionable solutions
export interface ErrorSolution {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  link?: {
    label: string;
    href: string;
  };
}

export interface EnhancedError {
  title: string;
  message: string;
  code?: string;
  solutions?: ErrorSolution[];
  technical?: string;
  reportable?: boolean;
}

export function showEnhancedError(error: EnhancedError, options: ToastOptions = {}) {
  const primarySolution = error.solutions?.[0];

  return showErrorToast(
    error.title,
    error.message,
    {
      duration: 8000,
      action: primarySolution?.action ? {
        label: primarySolution.action.label,
        onClick: primarySolution.action.onClick,
      } : error.reportable ? {
        label: 'Report Issue',
        onClick: () => window.open('/support', '_blank'),
      } : undefined,
      ...options,
    }
  );
}

// Common CamInv error scenarios with solutions
export const camInvErrors = {
  connectionFailed: (): EnhancedError => ({
    title: 'Connection Failed',
    message: 'Unable to connect to CamInv services.',
    code: 'CAMINV_CONNECTION_ERROR',
    solutions: [
      {
        title: 'Check Internet Connection',
        description: 'Ensure you have a stable internet connection and try again.',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        }
      },
      {
        title: 'Service Status',
        description: 'Check if CamInv services are currently available.',
        link: {
          label: 'Check Status',
          href: 'https://status.caminv.gov.kh'
        }
      }
    ],
    reportable: true
  }),

  validationFailed: (details?: string): EnhancedError => ({
    title: 'Invoice Validation Failed',
    message: details || 'Your invoice failed CamInv validation requirements.',
    code: 'CAMINV_VALIDATION_ERROR',
    solutions: [
      {
        title: 'Review Invoice Data',
        description: 'Check all required fields are completed with valid information.',
        action: {
          label: 'Edit Invoice',
          onClick: () => window.history.back(),
        }
      },
      {
        title: 'Validation Guide',
        description: 'Review the CamInv validation requirements and common issues.',
        link: {
          label: 'View Guide',
          href: '/help/validation'
        }
      }
    ],
    technical: details,
    reportable: false
  }),

  authenticationExpired: (): EnhancedError => ({
    title: 'Authentication Expired',
    message: 'Your CamInv connection has expired and needs to be renewed.',
    code: 'CAMINV_AUTH_EXPIRED',
    solutions: [
      {
        title: 'Reconnect to CamInv',
        description: 'Re-authorize your connection to CamInv to continue.',
        action: {
          label: 'Reconnect',
          onClick: () => window.location.href = '/caminv/merchants',
        }
      }
    ],
    reportable: false
  }),

  insufficientPermissions: (): EnhancedError => ({
    title: 'Insufficient Permissions',
    message: 'Your account does not have permission to perform this action.',
    code: 'CAMINV_PERMISSION_ERROR',
    solutions: [
      {
        title: 'Contact Administrator',
        description: 'Ask your team administrator to grant you the necessary permissions.',
      },
      {
        title: 'Permission Guide',
        description: 'Learn about different permission levels and requirements.',
        link: {
          label: 'View Guide',
          href: '/help/permissions'
        }
      }
    ],
    reportable: false
  }),

  rateLimitExceeded: (): EnhancedError => ({
    title: 'Rate Limit Exceeded',
    message: 'Too many requests have been made. Please wait before trying again.',
    code: 'CAMINV_RATE_LIMIT',
    solutions: [
      {
        title: 'Wait and Retry',
        description: 'Wait a few minutes before attempting the action again.',
        action: {
          label: 'Retry in 5 minutes',
          onClick: () => setTimeout(() => window.location.reload(), 300000),
        }
      }
    ],
    reportable: false
  }),

  documentNotFound: (documentId?: string): EnhancedError => ({
    title: 'Document Not Found',
    message: documentId
      ? `Document ${documentId} could not be found in CamInv.`
      : 'The requested document could not be found.',
    code: 'CAMINV_DOCUMENT_NOT_FOUND',
    solutions: [
      {
        title: 'Check Document ID',
        description: 'Verify the document ID is correct and the document exists.',
      },
      {
        title: 'Refresh Status',
        description: 'The document might still be processing. Try refreshing the status.',
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload(),
        }
      }
    ],
    technical: documentId ? `Document ID: ${documentId}` : undefined,
    reportable: true
  })
};
