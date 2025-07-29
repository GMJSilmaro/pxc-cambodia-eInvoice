"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InvoiceStatusBadge, getStatusPriority, isStatusActionable } from './invoice-status-badge';
import { SendToCustomerDialog } from './send-to-customer-dialog';
import { BulkStatusRefreshButton } from './status-refresh-button';
import {
  FileText,
  MoreHorizontal,
  ExternalLink,
  Download,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Filter,
  SortAsc,
  Trash2,
  Edit,
  Play,
  Pause
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerId?: string;
  customerCompanyNameKh?: string;
  customerCompanyNameEn?: string;
  amount: number;
  currency: string;
  status: string;
  camInvStatus?: string;
  direction: 'outgoing' | 'incoming';
  documentId?: string;
  verificationLink?: string;
  createdAt: string;
  submittedAt?: string;
  sentAt?: string;
  invoiceType?: string;
  createdBy?: string;
}

interface EnhancedInvoiceDashboardProps {
  className?: string;
  direction?: 'outgoing' | 'incoming' | 'all';
  showFilters?: boolean;
}

export function EnhancedInvoiceDashboard({ 
  className,
  direction = 'all',
  showFilters = true
}: EnhancedInvoiceDashboardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'amount'>('status');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [merchantId, setMerchantId] = useState<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/caminv/invoices');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invoices');
      }

      const data = await response.json();
      let fetchedInvoices = data.invoices || [];

      // Set merchant ID from the first invoice if available
      if (fetchedInvoices.length > 0 && fetchedInvoices[0].merchantId) {
        setMerchantId(fetchedInvoices[0].merchantId);
      }

      // Filter by direction if specified
      if (direction !== 'all') {
        fetchedInvoices = fetchedInvoices.filter((inv: any) => inv.direction === direction);
      }

      // Ensure proper typing for direction field
      fetchedInvoices = fetchedInvoices.map((inv: any) => ({
        ...inv,
        direction: inv.direction as 'outgoing' | 'incoming',
        amount: inv.amount || parseFloat(inv.totalAmount || '0'),
      }));

      setInvoices(fetchedInvoices);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [direction]);

  // Auto-refresh for invoices that need status updates
  useEffect(() => {
    if (!autoRefreshEnabled || !merchantId) {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
      return;
    }

    // Check if there are any invoices that need status updates
    const processingInvoices = invoices.filter(invoice => {
      const processingStatuses = ['submitted', 'processing', 'pending'];
      return (
        invoice.documentId &&
        (processingStatuses.includes(invoice.status.toLowerCase()) ||
         (invoice.camInvStatus && processingStatuses.includes(invoice.camInvStatus.toLowerCase())))
      );
    });

    if (processingInvoices.length > 0) {
      // Set up auto-refresh every 30 seconds
      autoRefreshIntervalRef.current = setInterval(() => {
        console.log(`Auto-refreshing status for ${processingInvoices.length} processing invoices`);
        fetchInvoices();
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, merchantId, invoices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (invoice: Invoice) => {
    setActionLoading(invoice.id);

    try {
      const response = await fetch(`/api/caminv/invoices/${invoice.id}/submit`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();

        if (data.verificationLink) {
          toast.success('Invoice Submitted Successfully!', {
            description: 'Your invoice has been submitted and validated.',
            duration: 7000,
            action: {
              label: 'View Verification',
              onClick: () => window.open(data.verificationLink, '_blank'),
            },
          });
        } else {
          toast.success('Invoice Submitted Successfully!', {
            description: 'Your invoice is being processed by CamInv.',
            duration: 5000,
          });
        }

        fetchInvoices(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error('Submission Failed', {
          description: errorData.error || 'Failed to submit invoice',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error('Submission Failed', {
        description: 'An unexpected error occurred.',
        duration: 5000,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/caminv/invoices/${invoice.id}/pdf`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('PDF Downloaded', {
          description: `Invoice ${invoice.invoiceNumber} has been downloaded.`,
        });
      } else {
        toast.error('Download Failed', {
          description: 'Failed to download PDF. Please try again.',
        });
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download Failed', {
        description: 'An unexpected error occurred while downloading.',
      });
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(invoice.id);

    try {
      const response = await fetch(`/api/caminv/invoices/${invoice.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Invoice Deleted', {
          description: `Invoice ${invoice.invoiceNumber} has been deleted.`,
        });
        fetchInvoices(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error('Delete Failed', {
          description: errorData.error || 'Failed to delete invoice',
        });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Delete Failed', {
        description: 'An unexpected error occurred while deleting.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const sortedAndFilteredInvoices = invoices
    .filter(invoice => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'actionable') {
        return isStatusActionable(invoice.status, invoice.direction);
      }
      return invoice.status.toLowerCase() === filterStatus.toLowerCase();
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'status':
          return getStatusPriority(b.status, b.camInvStatus) - getStatusPriority(a.status, a.camInvStatus);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'amount':
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

  const formatAmount = (amount: number | undefined, currency: string) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `${amount.toFixed(2)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActionButtons = (invoice: Invoice) => {
    const buttons = [];

    // Submit button for draft invoices
    if (invoice.status === 'draft' && invoice.direction === 'outgoing') {
      buttons.push(
        <Tooltip key="submit">
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={() => handleSubmit(invoice)}
              disabled={actionLoading === invoice.id}
            >
              {actionLoading === invoice.id ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit
            </Button>
          </TooltipTrigger>
          <TooltipContent>Submit invoice to CamInv</TooltipContent>
        </Tooltip>
      );
    }

    // Send to customer button for validated invoices
    if ((invoice.status === 'submitted' || invoice.status === 'validated') &&
        invoice.direction === 'outgoing' &&
        invoice.documentId) {
      buttons.push(
        <SendToCustomerDialog
          key="send"
          invoice={{
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            status: invoice.status,
            documentId: invoice.documentId,
          }}
          trigger={
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          }
        />
      );
    }

    // Verification link button
    if (invoice.verificationLink) {
      buttons.push(
        <Tooltip key="verify">
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(invoice.verificationLink, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Verify
            </Button>
          </TooltipTrigger>
          <TooltipContent>View CamInv verification</TooltipContent>
        </Tooltip>
      );
    }

    // Always add dropdown menu with additional actions
    buttons.push(
      <DropdownMenu key="more">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/caminv/invoices/${invoice.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          {invoice.verificationLink && (
            <DropdownMenuItem asChild>
              <a
                href={invoice.verificationLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="mr-2 h-4 w-4" />
                CamInv Verification
              </a>
            </DropdownMenuItem>
          )}
          {invoice.status === 'draft' && (
            <>
              <DropdownMenuItem asChild>
                <a href={`/caminv/invoices/${invoice.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Invoice
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(invoice)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Invoice
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );

    return buttons;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Invoice Dashboard</CardTitle>
          <CardDescription>Loading invoices...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Invoice Dashboard</CardTitle>
          <CardDescription>Error loading invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchInvoices} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoice Dashboard</CardTitle>
            <CardDescription>
              {direction === 'all' ? 'All invoices' :
               direction === 'outgoing' ? 'Outgoing invoices' : 'Incoming invoices'}
              ({sortedAndFilteredInvoices.length} of {invoices.length})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showFilters && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus('actionable')}>
                      Needs Action
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus('draft')}>
                      Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus('submitted')}>
                      Submitted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus('validated')}>
                      Validated
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SortAsc className="h-4 w-4 mr-2" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy('status')}>
                      By Status Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('date')}>
                      By Date
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('amount')}>
                      By Amount
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {/* Bulk Status Refresh Button */}
            {merchantId && (
              <BulkStatusRefreshButton
                invoices={sortedAndFilteredInvoices}
                merchantId={merchantId}
                onStatusUpdate={fetchInvoices}
              />
            )}

            {/* Auto-refresh toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  variant={autoRefreshEnabled ? "default" : "outline"}
                  size="sm"
                >
                  {autoRefreshEnabled ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Auto
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {autoRefreshEnabled ? "Disable auto-refresh" : "Enable auto-refresh"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={fetchInvoices} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh invoice list</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
      <CardContent>
        {sortedAndFilteredInvoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filterStatus === 'all' ? 'No invoices found' : `No ${filterStatus} invoices found`}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[40px] font-medium text-xs text-gray-700">#</TableHead>
                  <TableHead className="w-[120px] font-medium text-xs text-gray-700">Invoice #</TableHead>
                  <TableHead className="font-medium text-xs text-gray-700">Customer</TableHead>
                  <TableHead className="w-[100px] font-medium text-xs text-gray-700">Customer ID</TableHead>
                  <TableHead className="w-[80px] font-medium text-xs text-gray-700">Type</TableHead>
                  <TableHead className="w-[80px] font-medium text-xs text-gray-700">Source</TableHead>
                  <TableHead className="w-[100px] text-right font-medium text-xs text-gray-700">Amount</TableHead>
                  <TableHead className="w-[100px] font-medium text-xs text-gray-700">Status</TableHead>
                  <TableHead className="w-[80px] text-right font-medium text-xs text-gray-700">Date</TableHead>
                  <TableHead className="w-[120px] font-medium text-xs text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredInvoices.map((invoice, index) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-2 text-center">
                      <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col gap-0.5">
                        <a
                          href={`/caminv/invoices/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-xs font-medium"
                        >
                          {invoice.invoiceNumber}
                        </a>
                        <span className="text-[10px] text-gray-500">
                          Created {formatDate(invoice.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 bg-gray-100 border border-gray-200">
                          <AvatarFallback className="text-xs text-gray-700">
                            {invoice.customerName
                              .split(' ')
                              .map(part => part[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                            {invoice.customerName}
                          </span>
                          {invoice.customerEmail && (
                            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
                              {invoice.customerEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {invoice.documentId ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="font-mono text-xs text-gray-600">
                                {invoice.documentId.substring(0, 8)}...
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">{invoice.documentId}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {invoice.invoiceType?.replace('_', ' ') || 'Invoice'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant={invoice.createdBy === 'API_INTEGRATION' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {invoice.createdBy === 'API_INTEGRATION' ? 'API' : 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-medium text-xs text-gray-900">
                          {formatAmount(invoice.amount, invoice.currency)}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Tax: {((invoice.amount || 0) * 0.1).toFixed(2)} {invoice.currency}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <InvoiceStatusBadge
                        status={invoice.status}
                        camInvStatus={invoice.camInvStatus}
                        direction={invoice.direction}
                        showTooltip={false}
                      />
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs text-gray-900">
                          {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(invoice.createdAt).getFullYear()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        {getActionButtons(invoice).map((button, buttonIndex) => (
                          <div key={buttonIndex}>
                            {button}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
