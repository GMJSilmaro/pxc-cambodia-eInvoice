"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  HelpCircle, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Inline help text component
interface InlineHelpProps {
  children: React.ReactNode;
  variant?: 'info' | 'tip' | 'warning' | 'success';
  className?: string;
  dismissible?: boolean;
}

export function InlineHelp({ 
  children, 
  variant = 'info', 
  className,
  dismissible = false 
}: InlineHelpProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const variantConfig = {
    info: {
      icon: Info,
      className: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-600'
    },
    tip: {
      icon: Lightbulb,
      className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-orange-50 border-orange-200 text-orange-800',
      iconColor: 'text-orange-600'
    },
    success: {
      icon: CheckCircle,
      className: 'bg-green-50 border-green-200 text-green-800',
      iconColor: 'text-green-600'
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Alert className={cn(config.className, className)}>
      <Icon className={cn('h-4 w-4', config.iconColor)} />
      <AlertDescription className="flex items-start justify-between">
        <div className="flex-1">{children}</div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="ml-2 h-auto p-1 hover:bg-black/10"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Expandable help section
interface ExpandableHelpProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

export function ExpandableHelp({ 
  title, 
  children, 
  defaultExpanded = false,
  variant = 'default',
  className 
}: ExpandableHelpProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (variant === 'compact') {
    return (
      <div className={cn('border border-gray-200 rounded-lg', className)}>
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between p-3 h-auto font-normal"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </Button>
        
        {isExpanded && (
          <div className="px-3 pb-3 text-sm text-gray-600 border-t border-gray-200">
            <div className="pt-3">{children}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('bg-gray-50 border-gray-200', className)}>
      <CardHeader 
        className="cursor-pointer pb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-gray-500" />
            {title}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// Step-by-step guide component
interface GuideStep {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  completed?: boolean;
}

interface StepGuideProps {
  title: string;
  steps: GuideStep[];
  currentStep?: number;
  className?: string;
}

export function StepGuide({ 
  title, 
  steps, 
  currentStep = 0,
  className 
}: StepGuideProps) {
  return (
    <Card className={cn('bg-blue-50 border-blue-200', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Lightbulb className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={cn(
              'flex gap-3 p-3 rounded-lg transition-colors',
              index === currentStep && 'bg-blue-100 border border-blue-300',
              step.completed && 'bg-green-50 border border-green-200',
              index < currentStep && !step.completed && 'opacity-60'
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {step.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-medium',
                  index === currentStep 
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 text-gray-500'
                )}>
                  {index + 1}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'font-medium text-sm',
                step.completed ? 'text-green-900' : 'text-gray-900'
              )}>
                {step.title}
              </h4>
              <p className={cn(
                'text-sm mt-1',
                step.completed ? 'text-green-700' : 'text-gray-600'
              )}>
                {step.description}
              </p>
              
              {step.action && index === currentStep && (
                <Button
                  size="sm"
                  onClick={step.action.onClick}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {step.action.label}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Quick tips component
interface QuickTip {
  title: string;
  description: string;
  link?: {
    label: string;
    href: string;
  };
}

interface QuickTipsProps {
  tips: QuickTip[];
  title?: string;
  className?: string;
}

export function QuickTips({ 
  tips, 
  title = "Quick Tips",
  className 
}: QuickTipsProps) {
  return (
    <Card className={cn('bg-yellow-50 border-yellow-200', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-yellow-900 text-base">
          <Lightbulb className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip, index) => (
          <div key={index} className="space-y-1">
            <h4 className="font-medium text-sm text-yellow-900">{tip.title}</h4>
            <p className="text-sm text-yellow-800">{tip.description}</p>
            {tip.link && (
              <a
                href={tip.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-yellow-700 hover:text-yellow-900 underline"
              >
                {tip.link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Context-aware help for specific CamInv features
export const camInvHelp = {
  invoiceSubmission: {
    title: "Submitting Invoices to CamInv",
    steps: [
      {
        title: "Complete Invoice Details",
        description: "Ensure all required fields are filled with accurate information including customer details, line items, and tax calculations."
      },
      {
        title: "Validate Data",
        description: "Review the invoice for completeness and accuracy. Check that tax calculations are correct and customer information is valid."
      },
      {
        title: "Submit to CamInv",
        description: "Click the Submit button to send your invoice to the Cambodia E-Invoice system for validation."
      },
      {
        title: "Monitor Status",
        description: "Track the validation progress and wait for CamInv to process your invoice. You'll receive status updates automatically."
      },
      {
        title: "Download Certificate",
        description: "Once validated, download the official verification certificate and share it with your customer if needed."
      }
    ]
  },

  merchantConnection: {
    title: "Connecting to CamInv",
    tips: [
      {
        title: "OAuth Authorization",
        description: "Use the secure OAuth flow to connect your business to CamInv. This ensures your credentials are protected.",
        link: {
          label: "Learn about OAuth security",
          href: "https://doc-caminv.netlify.app/oauth"
        }
      },
      {
        title: "Business Verification",
        description: "Ensure your business is registered with the Cambodia tax authorities before attempting to connect.",
      },
      {
        title: "Redirect URLs",
        description: "Configure your redirect URLs in the settings to ensure the OAuth flow works correctly."
      }
    ]
  },

  statusCodes: {
    title: "Understanding Invoice Status",
    tips: [
      {
        title: "Draft",
        description: "Invoice is being prepared and has not been submitted to CamInv yet."
      },
      {
        title: "Submitted",
        description: "Invoice has been sent to CamInv and is awaiting validation."
      },
      {
        title: "Validated",
        description: "Invoice has been successfully validated by CamInv and is compliant."
      },
      {
        title: "Validation Failed",
        description: "Invoice failed CamInv validation and needs to be corrected before resubmission."
      }
    ]
  }
};
