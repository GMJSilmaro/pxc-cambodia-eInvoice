'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, X } from 'lucide-react';
import { useState } from 'react';

interface UBLXMLDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ublXml: string;
  invoiceNumber: string;
}

export function UBLXMLDialog({ isOpen, onClose, ublXml, invoiceNumber }: UBLXMLDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ublXml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy XML:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([ublXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}_UBL.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-6xl lg:max-w-7xl max-h-[90vh] flex flex-col p-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            UBL XML - {invoiceNumber}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8"
            >
              {copied ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8"
            >
              <Download className="h-3 w-3 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 pt-0 min-h-0">
          <ScrollArea className="h-full w-full rounded-lg border bg-gray-50">
            <div className="p-4">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                {ublXml}
              </pre>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
