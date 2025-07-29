'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadPDFButtonProps {
  invoiceId: number;
  invoiceNumber: string;
  documentId?: string | null;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  fullWidth?: boolean;
}

export function DownloadPDFButton({
  invoiceId,
  invoiceNumber,
  documentId,
  variant = 'outline',
  size = 'sm',
  className,
  fullWidth = true,
}: DownloadPDFButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!documentId) {
      toast.error('PDF Not Available', {
        description: 'This invoice has not been submitted to CamInv yet.',
      });
      return;
    }

    setIsDownloading(true);

    // Show loading toast
    toast.loading('Generating PDF...', { id: 'pdf-download' });

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

        toast.success('PDF Downloaded', {
          id: 'pdf-download',
          description: `Invoice ${invoiceNumber} has been downloaded successfully.`,
        });
      } else {
        const errorData = await response.json();
        toast.error('Download Failed', {
          id: 'pdf-download',
          description: errorData.error || 'Failed to download PDF. Please try again.',
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download Failed', {
        id: 'pdf-download',
        description: 'An unexpected error occurred while downloading.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownloadPDF}
      disabled={isDownloading || !documentId}
      className={`${fullWidth ? 'w-full justify-start' : ''} ${className || ''}`}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isDownloading ? 'Generating PDF...' : 'Download PDF'}
    </Button>
  );
}
