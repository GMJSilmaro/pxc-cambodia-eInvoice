"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Send, 
  Shield, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { ProgressIndicator, StatusIndicator } from '@/components/ui/interactive-card';
import { cn } from '@/lib/utils';

interface InvoiceSubmissionProgressProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    camInvStatus?: string;
    documentId?: string;
    verificationLink?: string;
    submittedAt?: string;
    validatedAt?: string;
  };
  className?: string;
}

const submissionSteps = [
  'Preparing Invoice',
  'Validating Data',
  'Submitting to CamInv',
  'Processing',
  'Validation Complete'
];

export function InvoiceSubmissionProgress({ 
  invoice, 
  className 
}: InvoiceSubmissionProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Determine current step based on invoice status
  useEffect(() => {
    const status = invoice.status.toLowerCase();
    const camInvStatus = invoice.camInvStatus?.toLowerCase();

    if (status === 'draft') {
      setCurrentStep(0);
      setProgress(0);
    } else if (status === 'submitted' && !camInvStatus) {
      setCurrentStep(2);
      setProgress(50);
    } else if (status === 'submitted' && camInvStatus === 'processing') {
      setCurrentStep(3);
      setProgress(75);
    } else if (status === 'validated' || camInvStatus === 'validated') {
      setCurrentStep(4);
      setProgress(100);
    } else if (status === 'validation_failed' || camInvStatus === 'validation_failed') {
      setCurrentStep(3);
      setProgress(75);
    }
  }, [invoice.status, invoice.camInvStatus]);

  const getStatusConfig = () => {
    const status = invoice.status.toLowerCase();
    const camInvStatus = invoice.camInvStatus?.toLowerCase();

    if (status === 'validated' || camInvStatus === 'validated') {
      return {
        variant: 'success' as const,
        icon: CheckCircle,
        title: 'Validation Complete',
        description: 'Your invoice has been successfully validated by CamInv',
        color: 'text-green-600'
      };
    } else if (status === 'validation_failed' || camInvStatus === 'validation_failed') {
      return {
        variant: 'error' as const,
        icon: AlertCircle,
        title: 'Validation Failed',
        description: 'Your invoice failed CamInv validation and needs to be reviewed',
        color: 'text-red-600'
      };
    } else if (status === 'submitted') {
      return {
        variant: 'loading' as const,
        icon: Loader2,
        title: 'Processing',
        description: 'Your invoice is being processed by CamInv',
        color: 'text-blue-600'
      };
    } else {
      return {
        variant: 'info' as const,
        icon: FileText,
        title: 'Draft',
        description: 'Invoice is ready to be submitted to CamInv',
        color: 'text-gray-600'
      };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card className={cn("bg-white border border-gray-200 shadow-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <statusConfig.icon className={cn("h-5 w-5", statusConfig.color)} />
              Submission Progress
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Track your invoice through the CamInv validation process
            </CardDescription>
          </div>
          <StatusIndicator 
            status={statusConfig.variant}
            text={statusConfig.title}
            pulse={statusConfig.variant === 'loading'}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
            style={{
              background: 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)'
            }}
          />
        </div>

        {/* Step Indicator */}
        <ProgressIndicator 
          steps={submissionSteps}
          currentStep={currentStep}
        />

        {/* Status Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <statusConfig.icon className={cn("h-4 w-4", statusConfig.color)} />
            <span className="font-medium text-gray-900">{statusConfig.title}</span>
          </div>
          <p className="text-sm text-gray-600">{statusConfig.description}</p>
          
          {/* Additional Details */}
          <div className="grid gap-2 text-xs">
            {invoice.submittedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted:</span>
                <span className="text-gray-700">
                  {new Date(invoice.submittedAt).toLocaleString()}
                </span>
              </div>
            )}
            {invoice.documentId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Document ID:</span>
                <span className="font-mono text-gray-700">{invoice.documentId}</span>
              </div>
            )}
            {invoice.validatedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Validated:</span>
                <span className="text-gray-700">
                  {new Date(invoice.validatedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {invoice.verificationLink && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(invoice.verificationLink, '_blank')}
              className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Verification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for table rows
export function CompactSubmissionProgress({ 
  status, 
  camInvStatus 
}: { 
  status: string; 
  camInvStatus?: string; 
}) {
  const getProgressValue = () => {
    const normalizedStatus = status.toLowerCase();
    const normalizedCamInvStatus = camInvStatus?.toLowerCase();

    if (normalizedStatus === 'validated' || normalizedCamInvStatus === 'validated') {
      return 100;
    } else if (normalizedStatus === 'submitted') {
      return normalizedCamInvStatus === 'processing' ? 75 : 50;
    } else {
      return 0;
    }
  };

  const getStatusColor = () => {
    const normalizedStatus = status.toLowerCase();
    const normalizedCamInvStatus = camInvStatus?.toLowerCase();

    if (normalizedStatus === 'validated' || normalizedCamInvStatus === 'validated') {
      return 'bg-green-500';
    } else if (normalizedStatus === 'validation_failed' || normalizedCamInvStatus === 'validation_failed') {
      return 'bg-red-500';
    } else if (normalizedStatus === 'submitted') {
      return 'bg-blue-500';
    } else {
      return 'bg-gray-300';
    }
  };

  const progressValue = getProgressValue();
  const statusColor = getStatusColor();

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-16">
        <div
          className={cn("h-2 rounded-full transition-all duration-500", statusColor)}
          style={{ width: `${progressValue}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{progressValue}%</span>
    </div>
  );
}
