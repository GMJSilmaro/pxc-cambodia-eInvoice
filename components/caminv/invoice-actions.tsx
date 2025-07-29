"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Send,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Mail
} from 'lucide-react';
import { SendToCustomerDialog } from './send-to-customer-dialog';
import { InteractiveButton } from '@/components/ui/interactive-card';
import { useModalToastMigration, useCamInvModalLoading, ModalLoadingPatterns, CamInvProgressSteps } from '@/lib/modal-loading-utils';
import { toast } from 'sonner';

interface InvoiceActionsProps {
  invoice: {
    id: number;
    status: string;
    direction: 'outgoing' | 'incoming';
    invoiceNumber?: string;
    customerName?: string;
    customerEmail?: string;
    documentId?: string;
    verificationLink?: string;
  };
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const modalLoading = useModalToastMigration();
  const camInvModal = useCamInvModalLoading();

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      await modalLoading.executeWithSteps(
        async (stepController) => {
          // Step 1: Validate document
          stepController.activateStep('validate');
          await new Promise(resolve => setTimeout(resolve, 800)); // Simulate validation
          stepController.completeStep('validate');

          // Step 2: Transform to UBL XML
          stepController.activateStep('transform');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate transformation
          stepController.completeStep('transform');

          // Step 3: Submit to CamInv
          stepController.activateStep('submit');
          const response = await fetch(`/api/caminv/invoices/${invoice.id}/submit`, {
            method: 'POST',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit invoice to CamInv');
          }

          stepController.completeStep('submit');

          // Step 4: Process validation
          stepController.activateStep('process');
          const data = await response.json();
          await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate processing
          stepController.completeStep('process');

          // Step 5: Finalize submission
          stepController.activateStep('finalize');
          await new Promise(resolve => setTimeout(resolve, 800)); // Simulate finalization
          stepController.completeStep('finalize');

          // Smooth page refresh with delay to show success
          setTimeout(() => {
            window.location.reload();
          }, 1500);

          return data;
        },
        CamInvProgressSteps.invoiceSubmission,
        'Submitting Invoice to CamInv',
        'Processing your invoice submission with enhanced validation',
        'Invoice Submitted Successfully!',
        'Your invoice has been submitted to CamInv and is being processed',
        true // Show toast notification
      );
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/caminv/invoices/${invoice.id}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Invoice Accepted', {
          description: 'The incoming invoice has been accepted successfully.',
          duration: 5000,
        });
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error('Accept Failed', {
          description: errorData.error || 'Failed to accept the invoice',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Accept failed:', error);
      toast.error('Accept Failed', {
        description: 'An unexpected error occurred while accepting the invoice.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/caminv/invoices/${invoice.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast.success('Invoice Rejected', {
          description: 'The incoming invoice has been rejected successfully.',
          duration: 5000,
        });
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error('Reject Failed', {
          description: errorData.error || 'Failed to reject the invoice',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Reject failed:', error);
      toast.error('Reject Failed', {
        description: 'An unexpected error occurred while rejecting the invoice.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadXML = async () => {
    try {
      const response = await fetch(`/api/caminv/invoices/${invoice.id}/xml`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber || invoice.id}.xml`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {invoice.status === 'draft' && invoice.direction === 'outgoing' && (
        <InteractiveButton
          onClick={handleSubmit}
          disabled={isLoading}
          loading={isLoading}
          variant="primary"
          icon={<Send className="h-4 w-4" />}
          loadingText="Submitting..."
          className="shadow-sm"
        >
          Submit
        </InteractiveButton>
      )}

      {invoice.status === 'submitted' && invoice.direction === 'outgoing' && (
        <>
          <SendToCustomerDialog
            invoice={{
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id}`,
              customerName: invoice.customerName || 'Customer',
              customerEmail: invoice.customerEmail,
              status: invoice.status,
              documentId: invoice.documentId,
            }}
          />
          {invoice.verificationLink && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(invoice.verificationLink, '_blank')}
              className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Verification
            </Button>
          )}
        </>
      )}

      {invoice.status === 'received' && invoice.direction === 'incoming' && (
        <>
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isLoading}
            className="bg-white hover:bg-red-50 border-red-200 text-red-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Reject
          </Button>
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-lg">
          <DropdownMenuItem className="text-gray-700 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadXML} className="text-gray-700 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4" />
            Download UBL XML
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
