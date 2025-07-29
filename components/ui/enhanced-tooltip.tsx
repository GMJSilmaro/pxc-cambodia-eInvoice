"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { Info, HelpCircle, AlertTriangle, CheckCircle } from "lucide-react";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    variant?: 'default' | 'info' | 'warning' | 'success' | 'error';
  }
>(({ className, sideOffset = 4, variant = 'default', ...props }, ref) => {
  const variantClasses = {
    default: "bg-gray-900 text-gray-50 border-gray-800",
    info: "bg-blue-900 text-blue-50 border-blue-800",
    warning: "bg-yellow-900 text-yellow-50 border-yellow-800",
    success: "bg-green-900 text-green-50 border-green-800",
    error: "bg-red-900 text-red-50 border-red-800"
  };

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Enhanced tooltip with icon and better accessibility
interface EnhancedTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'success' | 'error';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  showIcon?: boolean;
  disabled?: boolean;
  className?: string;
}

export function EnhancedTooltip({
  children,
  content,
  variant = 'default',
  side = 'top',
  align = 'center',
  delayDuration = 300,
  showIcon = false,
  disabled = false,
  className
}: EnhancedTooltipProps) {
  const getIcon = () => {
    switch (variant) {
      case 'info':
        return <Info className="h-3 w-3 mr-1" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'error':
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      default:
        return <HelpCircle className="h-3 w-3 mr-1" />;
    }
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <TooltipRoot delayDuration={delayDuration}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          variant={variant}
          className={className}
        >
          <div className="flex items-center">
            {showIcon && getIcon()}
            {content}
          </div>
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}

// Status tooltip for complex status indicators
interface StatusTooltipProps {
  status: string;
  camInvStatus?: string;
  children: React.ReactNode;
  lastUpdated?: string;
  documentId?: string;
}

export function StatusTooltip({
  status,
  camInvStatus,
  children,
  lastUpdated,
  documentId
}: StatusTooltipProps) {
  const getStatusDescription = () => {
    const normalizedStatus = status.toLowerCase();
    const normalizedCamInvStatus = camInvStatus?.toLowerCase();

    if (normalizedStatus === 'draft') {
      return 'Invoice is being prepared and has not been submitted to CamInv yet.';
    } else if (normalizedStatus === 'submitted') {
      if (normalizedCamInvStatus === 'validated') {
        return 'Invoice has been successfully validated by CamInv and is compliant.';
      } else if (normalizedCamInvStatus === 'validation_failed') {
        return 'Invoice failed CamInv validation and needs to be corrected.';
      } else if (normalizedCamInvStatus === 'processing') {
        return 'Invoice is currently being processed by CamInv validation system.';
      } else {
        return 'Invoice has been submitted to CamInv and is awaiting processing.';
      }
    } else if (normalizedStatus === 'validated') {
      return 'Invoice has been successfully validated and is compliant with Cambodia E-Invoice requirements.';
    } else if (normalizedStatus === 'validation_failed') {
      return 'Invoice failed validation and requires corrections before resubmission.';
    } else {
      return `Current status: ${status}`;
    }
  };

  const getVariant = (): 'success' | 'error' | 'warning' | 'info' => {
    const normalizedStatus = status.toLowerCase();
    const normalizedCamInvStatus = camInvStatus?.toLowerCase();

    if (normalizedStatus === 'validated' || normalizedCamInvStatus === 'validated') {
      return 'success';
    } else if (normalizedStatus === 'validation_failed' || normalizedCamInvStatus === 'validation_failed') {
      return 'error';
    } else if (normalizedStatus === 'submitted') {
      return 'info';
    } else {
      return 'warning';
    }
  };

  const tooltipContent = (
    <div className="space-y-2 max-w-xs">
      <div className="font-medium">{getStatusDescription()}</div>
      {camInvStatus && camInvStatus !== status && (
        <div className="text-xs opacity-90">
          CamInv Status: {camInvStatus}
        </div>
      )}
      {documentId && (
        <div className="text-xs opacity-90 font-mono">
          Document ID: {documentId}
        </div>
      )}
      {lastUpdated && (
        <div className="text-xs opacity-90">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );

  return (
    <EnhancedTooltip
      content={tooltipContent}
      variant={getVariant()}
      showIcon
      delayDuration={200}
    >
      {children}
    </EnhancedTooltip>
  );
}

// Help tooltip for form fields and complex UI elements
interface HelpTooltipProps {
  title: string;
  description: string;
  example?: string;
  children?: React.ReactNode;
  className?: string;
}

export function HelpTooltip({
  title,
  description,
  example,
  children,
  className
}: HelpTooltipProps) {
  const tooltipContent = (
    <div className="space-y-2 max-w-sm">
      <div className="font-medium">{title}</div>
      <div className="text-sm">{description}</div>
      {example && (
        <div className="text-xs bg-black/20 rounded px-2 py-1 font-mono">
          Example: {example}
        </div>
      )}
    </div>
  );

  const trigger = children || (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition-colors",
        className
      )}
      aria-label={`Help: ${title}`}
    >
      <HelpCircle className="h-3 w-3" />
    </button>
  );

  return (
    <EnhancedTooltip
      content={tooltipContent}
      variant="info"
      showIcon
      delayDuration={200}
    >
      {trigger}
    </EnhancedTooltip>
  );
}

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };
