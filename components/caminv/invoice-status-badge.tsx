"use client";

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusTooltip } from '@/components/ui/enhanced-tooltip';
import { ariaLabels, ariaDescriptions } from '@/lib/accessibility-utils';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Eye,
  Loader2,
  FileCheck,
  FileX,
  Mail
} from 'lucide-react';

interface InvoiceStatusBadgeProps {
  status: string;
  camInvStatus?: string;
  direction?: 'outgoing' | 'incoming';
  className?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
  invoiceNumber?: string;
  lastUpdated?: string;
  documentId?: string;
}

export function InvoiceStatusBadge({
  status,
  camInvStatus,
  direction = 'outgoing',
  className,
  showIcon = true,
  showTooltip = true,
  invoiceNumber,
  lastUpdated,
  documentId
}: InvoiceStatusBadgeProps) {
  const getStatusConfig = () => {
    const normalizedStatus = status.toLowerCase();
    const normalizedCamInvStatus = camInvStatus?.toLowerCase();

    // Handle different status combinations
    switch (normalizedStatus) {
      case 'draft':
        return {
          variant: 'secondary' as const,
          label: 'Draft',
          icon: Clock,
          description: 'Invoice is being prepared and not yet submitted',
          className: 'bg-gray-100 text-gray-700 border-gray-200'
        };

      case 'submitted':
        if (normalizedCamInvStatus === 'validated' || normalizedCamInvStatus === 'valid') {
          return {
            variant: 'default' as const,
            label: 'Validated',
            icon: FileCheck,
            description: 'Invoice has been submitted and validated by CamInv',
            className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
          };
        } else if (normalizedCamInvStatus === 'validation_failed' || normalizedCamInvStatus === 'invalid') {
          return {
            variant: 'destructive' as const,
            label: 'Validation Failed',
            icon: FileX,
            description: 'Invoice submission failed validation',
            className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
          };
        } else if (normalizedCamInvStatus === 'processing' || normalizedCamInvStatus === 'pending') {
          return {
            variant: 'outline' as const,
            label: 'Processing',
            icon: Loader2,
            description: 'Invoice submitted and being processed by CamInv',
            className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
          };
        } else if (normalizedCamInvStatus === 'accepted') {
          return {
            variant: 'default' as const,
            label: 'Accepted',
            icon: FileCheck,
            description: 'Invoice has been accepted by the recipient',
            className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
          };
        } else if (normalizedCamInvStatus === 'rejected') {
          return {
            variant: 'destructive' as const,
            label: 'Rejected',
            icon: FileX,
            description: 'Invoice has been rejected by the recipient',
            className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
          };
        } else {
          return {
            variant: 'outline' as const,
            label: 'Processing',
            icon: Loader2,
            description: 'Invoice submitted and being processed by CamInv',
            className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
          };
        }

      case 'validated':
        return {
          variant: 'default' as const,
          label: 'Validated',
          icon: FileCheck,
          description: 'Invoice has been validated by CamInv',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
        };

      case 'validation_failed':
        return {
          variant: 'destructive' as const,
          label: 'Validation Failed',
          icon: FileX,
          description: 'Invoice failed CamInv validation',
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
        };

      case 'sent':
        return {
          variant: 'default' as const,
          label: 'Sent',
          icon: Mail,
          description: 'Invoice has been sent to customer',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
        };

      case 'failed':
        return {
          variant: 'destructive' as const,
          label: 'Failed',
          icon: XCircle,
          description: 'Invoice processing failed',
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
        };

      case 'accepted':
        return {
          variant: 'default' as const,
          label: 'Accepted',
          icon: CheckCircle,
          description: 'Invoice has been accepted by the recipient',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
        };

      case 'rejected':
        return {
          variant: 'destructive' as const,
          label: 'Rejected',
          icon: XCircle,
          description: 'Invoice has been rejected by the recipient',
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
        };

      case 'processing':
        return {
          variant: 'outline' as const,
          label: 'Processing',
          icon: Loader2,
          description: 'Invoice is being processed by CamInv',
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
        };

      case 'pending':
        return {
          variant: 'outline' as const,
          label: 'Pending',
          icon: Clock,
          description: 'Invoice is pending processing',
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
        };

      case 'received':
        return {
          variant: 'secondary' as const,
          label: 'Received',
          icon: Eye,
          description: 'Invoice received and awaiting review',
          className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
        };

      default:
        return {
          variant: 'outline' as const,
          label: status.charAt(0).toUpperCase() + status.slice(1),
          icon: AlertTriangle,
          description: `Invoice status: ${status}`,
          className: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const badge = (
    <Badge
      variant={config.variant}
      className={`${config.className || ''} ${className || ''} transition-colors duration-200`}
      role="status"
      aria-label={
        invoiceNumber
          ? ariaLabels.invoiceStatus(config.label, invoiceNumber)
          : `Status: ${config.label}`
      }
      aria-describedby={showTooltip ? `status-description-${status}` : undefined}
    >
      {showIcon && (
        <Icon
          className={`h-3 w-3 mr-1 ${
            config.icon === Loader2 ? 'animate-spin' : ''
          }`}
          aria-hidden="true"
        />
      )}
      {config.label}
    </Badge>
  );

  if (showTooltip) {
    return (
      <StatusTooltip
        status={status}
        camInvStatus={camInvStatus}
        lastUpdated={lastUpdated}
        documentId={documentId}
      >
        {badge}
      </StatusTooltip>
    );
  }

  return badge;
}

// Helper function to get status priority for sorting
export function getStatusPriority(status: string, camInvStatus?: string): number {
  const normalizedStatus = status.toLowerCase();
  const normalizedCamInvStatus = camInvStatus?.toLowerCase();

  // Higher numbers = higher priority (more urgent/actionable)
  switch (normalizedStatus) {
    case 'failed':
    case 'validation_failed':
    case 'rejected':
      return 10; // Highest priority - needs attention

    case 'received':
    case 'pending':
      return 9; // High priority - needs action

    case 'draft':
      return 8; // Medium-high priority - needs completion

    case 'submitted':
      if (normalizedCamInvStatus === 'validation_failed') {
        return 10;
      } else if (normalizedCamInvStatus === 'validated') {
        return 5;
      } else {
        return 7; // Medium priority - processing
      }

    case 'validated':
      return 5; // Medium priority - can be sent

    case 'sent':
    case 'accepted':
      return 2; // Low priority - completed

    default:
      return 1; // Lowest priority
  }
}

// Helper function to check if status is actionable
export function isStatusActionable(status: string, direction: 'outgoing' | 'incoming'): boolean {
  const normalizedStatus = status.toLowerCase();

  if (direction === 'outgoing') {
    return ['draft', 'validated'].includes(normalizedStatus);
  } else {
    return ['received', 'pending'].includes(normalizedStatus);
  }
}
