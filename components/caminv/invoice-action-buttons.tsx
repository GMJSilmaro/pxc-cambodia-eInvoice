'use client';

import { Button } from '@/components/ui/button';
import { ExternalLink, Eye, Download, FileText, Send, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { UBLXMLDialog } from './ubl-xml-dialog';

interface InvoiceActionButtonsProps {
  verificationLink?: string | null;
  invoiceId: number;
  ublXml?: string | null;
  invoiceNumber: string;
}

export function InvoiceActionButtons({
  verificationLink,
  invoiceId,
  ublXml,
  invoiceNumber
}: InvoiceActionButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showUBLDialog, setShowUBLDialog] = useState(false);

  const handleVerificationClick = () => {
    if (verificationLink) {
      window.open(verificationLink, '_blank');
    }
  };

  const handleSendInvoice = async () => {
    setIsLoading('send');
    try {
      // TODO: Implement send invoice API call
      const response = await fetch(`/api/caminv/invoices/${invoiceId}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        // Show success message
        console.log('Invoice sent successfully');
      } else {
        console.error('Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handlePreview = () => {
    setIsLoading('preview');
    try {
      // Open preview in new window/tab
      window.open(`/caminv/invoices/${invoiceId}/preview`, '_blank');
    } catch (error) {
      console.error('Error opening preview:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleDownloadPDF = async () => {
    setIsLoading('download');
    try {
      const response = await fetch(`/api/caminv/invoices/${invoiceId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleViewUBL = () => {
    if (ublXml) {
      setShowUBLDialog(true);
    } else {
      console.log('No UBL XML available for this invoice');
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading('refresh');
    try {
      // Call the existing refresh API endpoint
      const response = await fetch(`/api/caminv/invoices/${invoiceId}/refresh`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        console.error('Failed to refresh status');
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="pt-4 border-t border-gray-100 space-y-3">
      <Button
        className="w-full bg-green-500 hover:bg-green-600 text-white"
        onClick={handleSendInvoice}
        disabled={isLoading === 'send'}
      >
        {isLoading === 'send' ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </>
        )}
      </Button>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handlePreview}
          disabled={isLoading === 'preview'}
        >
          <Eye className="h-4 w-4 mr-2" />
          {isLoading === 'preview' ? 'Loading...' : 'Preview'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleDownloadPDF}
          disabled={isLoading === 'download'}
        >
          <Download className="h-4 w-4 mr-2" />
          {isLoading === 'download' ? 'Loading...' : 'Download'}
        </Button>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleViewUBL}
        disabled={!ublXml}
      >
        <FileText className="h-4 w-4 mr-2" />
        View UBL XML
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleRefreshStatus}
        disabled={isLoading === 'refresh'}
      >
        {isLoading === 'refresh' ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
            Refreshing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </>
        )}
      </Button>

      {verificationLink && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={handleVerificationClick}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Verification Portal
        </Button>
      )}

      {/* UBL XML Dialog */}
      {ublXml && (
        <UBLXMLDialog
          isOpen={showUBLDialog}
          onClose={() => setShowUBLDialog(false)}
          ublXml={ublXml}
          invoiceNumber={invoiceNumber}
        />
      )}
    </div>
  );
}
