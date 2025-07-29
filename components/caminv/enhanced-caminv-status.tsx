"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ExternalLink,
  Copy,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  Hash,
  Building2,
  Eye,
  Mail,
  Loader2
} from 'lucide-react';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { StatusRefreshButton } from './status-refresh-button';
import { DownloadPDFButton } from './download-pdf-button';
import { UBLXMLViewer } from './ubl-xml-viewer';
import { SendToCustomerDialog } from './send-to-customer-dialog';
import { toast } from 'sonner';



interface EnhancedCamInvStatusProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    camInvStatus?: string;
    documentId?: string;
    verificationLink?: string;
    submittedAt?: string;
    sentAt?: string;
    camInvResponse?: any;
    direction: 'outgoing' | 'incoming';
    customerName?: string;
    customerEmail?: string;
  };
  merchantId?: number;
  className?: string;
}

export function EnhancedCamInvStatus({ invoice, merchantId, className }: EnhancedCamInvStatusProps) {
  const [isOpeningVerification, setIsOpeningVerification] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`, {
      duration: 2000,
    });
  };

  const handleVerificationClick = async (url: string) => {
    setIsOpeningVerification(true);
    toast.loading('Opening verification...', { id: 'verification-open' });

    try {
      window.open(url, '_blank');
      toast.success('Verification opened', { id: 'verification-open' });
    } catch (error) {
      toast.error('Failed to open verification', { id: 'verification-open' });
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => setIsOpeningVerification(false), 1000);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = () => {
    const status = invoice.status.toLowerCase();
    const camInvStatus = invoice.camInvStatus?.toLowerCase();

    if (status === 'validated' || camInvStatus === 'validated') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (status === 'failed' || status === 'validation_failed') {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else if (status === 'submitted') {
      return <Clock className="h-5 w-5 text-blue-600" />;
    } else if (status === 'draft') {
      return <FileText className="h-5 w-5 text-gray-600" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getValidationDetails = () => {
    if (!invoice.camInvResponse) return null;

    const response = invoice.camInvResponse;
    const validDocs = response.valid_documents || [];
    const failedDocs = response.failed_documents || [];
    const validationResult = response.validation_result;

    return {
      validDocs,
      failedDocs,
      validationResult,
      totalDocs: validDocs.length + failedDocs.length,
    };
  };

  const validationDetails = getValidationDetails();

  return (
    <Card className={`bg-white border border-gray-200 shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gray-100 rounded-lg">
                {getStatusIcon()}
              </div>
              CamInv Status
            </CardTitle>
            <CardDescription className="text-sm mt-2 text-gray-600">
              Cambodia E-Invoice system integration status and actions
            </CardDescription>
          </div>
          {invoice.documentId && merchantId && (
            <StatusRefreshButton
              invoice={invoice}
              merchantId={merchantId}
              onStatusUpdate={(_, updated) => {
                if (updated) {
                  // Trigger a page refresh or state update
                  window.location.reload();
                }
              }}
              variant="outline"
              size="sm"
              showLabel={false}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        {/* Primary Status - Enhanced */}
        <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Current Status</span>
            <InvoiceStatusBadge
              status={invoice.status}
              camInvStatus={invoice.camInvStatus}
              direction={invoice.direction}
            />
          </div>

          {/* Quick Status Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Invoice Status</p>
              <p className="font-medium text-gray-900 capitalize">{invoice.status.replace('_', ' ')}</p>
            </div>
            {invoice.camInvStatus && (
              <div>
                <p className="text-gray-500 mb-1">CamInv Status</p>
                <p className="font-medium text-gray-900 capitalize">{invoice.camInvStatus.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Document Information - Enhanced */}
        {invoice.documentId && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-lg font-semibold flex items-center gap-3 mb-4 text-blue-900">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Hash className="h-4 w-4 text-blue-600" />
              </div>
              Document Information
            </h4>

            <div className="space-y-4">
              {/* Document ID */}
              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">CamInv Document ID</p>
                    <code className="text-sm bg-gray-100 px-3 py-1.5 rounded font-mono text-gray-900 block">
                      {invoice.documentId}
                    </code>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(invoice.documentId!, 'Document ID')}
                        className="ml-3"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy Document ID</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Verification Link */}
              {invoice.verificationLink && (
                <div className="bg-white p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Official Verification</p>
                      <p className="text-xs text-gray-500 mb-3">
                        View this invoice on the official CamInv verification portal
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleVerificationClick(invoice.verificationLink!)}
                      disabled={isOpeningVerification}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isOpeningVerification ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      {isOpeningVerification ? 'Opening...' : 'Open Verification Portal'}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(invoice.verificationLink!, 'Verification Link')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Verification Link</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CamInv Status Details */}
        {invoice.camInvStatus && (
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border">
            <h4 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Building2 className="h-4 w-4 text-gray-600" />
              </div>
              Processing Details
            </h4>

            <div className="grid gap-3">
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <span className="text-sm font-medium text-gray-600">CamInv Status:</span>
                <Badge variant="outline" className="text-xs font-medium">
                  {invoice.camInvStatus.toUpperCase()}
                </Badge>
              </div>

              {invoice.camInvResponse?.latest_status && (
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-600">Latest Status:</span>
                  <Badge variant="outline" className="text-xs font-medium">
                    {invoice.camInvResponse.latest_status.toUpperCase()}
                  </Badge>
                </div>
              )}

              {invoice.camInvResponse?.status_updated_at && (
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {formatDate(invoice.camInvResponse.status_updated_at)}
                  </span>
                </div>
              )}

              {invoice.camInvResponse?.latest_status_check && (
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm font-medium text-gray-600">Last Checked:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {formatDate(invoice.camInvResponse.latest_status_check)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Information */}
        {(invoice.submittedAt || validationDetails?.validationResult?.validated_at || invoice.sentAt) && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-lg font-semibold flex items-center gap-3 mb-4 text-green-900">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              Processing Timeline
            </h4>

            <div className="space-y-3">
              {invoice.submittedAt && (
                <div className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                  <span className="text-sm font-medium text-gray-600">Submitted to CamInv:</span>
                  <span className="font-mono text-sm text-gray-900">{formatDate(invoice.submittedAt)}</span>
                </div>
              )}

              {validationDetails?.validationResult?.validated_at && (
                <div className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                  <span className="text-sm font-medium text-gray-600">Validated by CamInv:</span>
                  <span className="font-mono text-sm text-gray-900">
                    {formatDate(validationDetails.validationResult.validated_at)}
                  </span>
                </div>
              )}

              {invoice.sentAt && (
                <div className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                  <span className="text-sm font-medium text-gray-600">Sent to Customer:</span>
                  <span className="font-mono text-sm text-gray-900">{formatDate(invoice.sentAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions Section - Enhanced */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
          <h4 className="text-lg font-semibold flex items-center gap-3 mb-4 text-purple-900">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Eye className="h-4 w-4 text-purple-600" />
            </div>
            Available Actions
          </h4>

          <div className="grid gap-3">
            {/* Download PDF Button */}
            <DownloadPDFButton
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              documentId={invoice.documentId}
            />

            {/* View UBL XML Button */}
            <UBLXMLViewer
              xml={undefined} // Will fetch from API
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
            />

            {/* Send to Customer - for submitted/validated outgoing invoices */}
            {(invoice.status === 'submitted' || invoice.status === 'validated') &&
             invoice.direction === 'outgoing' &&
             invoice.documentId && (
              <SendToCustomerDialog
                invoice={{
                  id: invoice.id,
                  invoiceNumber: invoice.invoiceNumber,
                  customerName: invoice.customerName || 'Customer',
                  customerEmail: invoice.customerEmail,
                  status: invoice.status,
                  documentId: invoice.documentId,
                }}
                trigger={
                  <Button variant="outline" size="default" className="w-full justify-start bg-white hover:bg-purple-50 border-purple-200">
                    <Mail className="h-4 w-4 mr-2" />
                    Send to Customer
                  </Button>
                }
              />
            )}
          </div>
        </div>



        {/* Technical Details (for debugging) */}
        {invoice.camInvResponse && (
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border">
            <h4 className="text-lg font-semibold flex items-center gap-3 mb-4 text-gray-900">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Info className="h-4 w-4 text-gray-600" />
              </div>
              Technical Details
            </h4>
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium mb-2">
                View Raw CamInv Response
              </summary>
              <div className="mt-3 p-3 bg-gray-100 rounded border">
                <pre className="text-xs overflow-auto max-h-40 text-gray-800">
                  {JSON.stringify(invoice.camInvResponse, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* No CamInv Data - Enhanced */}
        {!invoice.documentId && !invoice.camInvResponse && invoice.status === 'draft' && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200 text-center">
            <div className="p-3 bg-yellow-100 rounded-full w-fit mx-auto mb-4">
              <Info className="h-6 w-6 text-yellow-600" />
            </div>
            <h4 className="text-lg font-semibold text-yellow-900 mb-2">
              Not Yet Submitted to CamInv
            </h4>
            <p className="text-yellow-800 mb-4">
              This invoice is still in draft status. Submit it to CamInv to see detailed status information,
              verification links, and processing timeline.
            </p>
            <div className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded border border-yellow-200">
              <strong>Next Steps:</strong> Complete the invoice details and submit to CamInv for validation and processing.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
