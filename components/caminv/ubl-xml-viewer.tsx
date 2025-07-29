"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Code, Copy, Download, Loader2, FileText, CheckCircle, X } from 'lucide-react';

interface UBLXMLViewerProps {
  xml?: string;
  invoiceId?: number;
  invoiceNumber?: string;
}

// Helper function to format XML with proper indentation
function formatXML(xml: string): string {
  try {
    const PADDING = '  '; // 2 spaces for indentation
    const reg = /(>)(<)(\/*)/g;
    let formatted = xml.replace(reg, '$1\n$2$3');

    let pad = 0;
    return formatted.split('\n').map((line) => {
      let indent = 0;
      if (line.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (line.match(/^<\/\w/) && pad > 0) {
        pad -= 1;
      } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      const padding = PADDING.repeat(pad);
      pad += indent;
      return padding + line;
    }).join('\n');
  } catch (error) {
    // If formatting fails, return original XML
    return xml;
  }
}

export function UBLXMLViewer({ xml, invoiceId, invoiceNumber }: UBLXMLViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [xmlContent, setXmlContent] = useState(xml || '');
  const [isLoading, setIsLoading] = useState(false);

  const fetchXML = async () => {
    if (!xml && invoiceId) {
      setIsLoading(true);
      try {
        // Show loading toast
        toast.loading('Loading XML content...', { id: 'xml-loading' });

        // Fetch XML from API
        const response = await fetch(`/api/caminv/invoices/${invoiceId}/xml`);
        if (response.ok) {
          const data = await response.text();
          setXmlContent(data);
          toast.success('XML content loaded successfully', { id: 'xml-loading' });
        } else {
          toast.error('Failed to fetch UBL XML', { id: 'xml-loading' });
        }
      } catch (error) {
        console.error('Failed to fetch XML:', error);
        toast.error('Failed to fetch UBL XML', { id: 'xml-loading' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const copyToClipboard = async () => {
    if (!xmlContent) {
      toast.error('No XML content to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(xmlContent);
      toast.success('UBL XML copied to clipboard successfully!', {
        description: 'You can now paste the XML content anywhere.',
        icon: <CheckCircle className="h-4 w-4" />
      });
    } catch (error) {
      toast.error('Failed to copy XML to clipboard', {
        description: 'Please try again or manually select and copy the text.'
      });
    }
  };

  const downloadXML = () => {
    if (!xmlContent) {
      toast.error('No XML content to download');
      return;
    }

    try {
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber || invoiceId || 'document'}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('UBL XML file downloaded successfully!', {
        description: `File saved as: invoice-${invoiceNumber || invoiceId || 'document'}.xml`,
        icon: <FileText className="h-4 w-4" />
      });
    } catch (error) {
      toast.error('Failed to download XML file', {
        description: 'Please try again.'
      });
    }
  };

  const XMLSkeleton = () => (
    <div className="space-y-3 p-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2 ml-4" />
        <Skeleton className="h-4 w-2/3 ml-8" />
        <Skeleton className="h-4 w-1/3 ml-8" />
        <Skeleton className="h-4 w-1/2 ml-4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2 ml-4" />
        <Skeleton className="h-4 w-3/4 ml-8" />
        <Skeleton className="h-4 w-1/4 ml-8" />
        <Skeleton className="h-4 w-1/2 ml-4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3 ml-4" />
        <Skeleton className="h-4 w-1/3 ml-8" />
        <Skeleton className="h-4 w-3/4 ml-8" />
        <Skeleton className="h-4 w-1/2 ml-4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5 ml-4" />
        <Skeleton className="h-4 w-1/2 ml-8" />
        <Skeleton className="h-4 w-2/3 ml-8" />
        <Skeleton className="h-4 w-1/3 ml-4" />
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
          onClick={fetchXML}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading XML...
            </>
          ) : (
            <>
              <Code className="h-4 w-4 mr-2" />
              View UBL XML
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[95vw] sm:max-w-6xl lg:max-w-7xl max-h-[90vh] flex flex-col p-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Code className="h-5 w-5" />
                )}
                UBL XML Document
              </DialogTitle>
              <DialogDescription>
                {isLoading
                  ? "Generating UBL 2.1 XML for Cambodia E-Invoicing compliance..."
                  : "Generated UBL 2.1 XML for Cambodia E-Invoicing compliance"
                }
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col p-6 pt-0 min-h-0">
          <div className="flex gap-3 flex-shrink-0 pb-4">
            <Button
              variant="outline"
              size="default"
              onClick={copyToClipboard}
              disabled={isLoading || !xmlContent}
              className="hover:bg-green-50 hover:border-green-200 hover:text-green-700 disabled:opacity-50"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={downloadXML}
              disabled={isLoading || !xmlContent}
              className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download XML
            </Button>
          </div>

          <ScrollArea className="flex-1 rounded-lg border bg-slate-50 dark:bg-slate-900">
            <div className="p-8">
              {isLoading ? (
                <XMLSkeleton />
              ) : xmlContent ? (
                <pre className="text-sm font-mono leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre">
                  <code className="language-xml">
                    {formatXML(xmlContent)}
                  </code>
                </pre>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No XML content available</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
