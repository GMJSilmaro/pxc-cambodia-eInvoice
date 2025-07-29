import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { CamInvCard, CamInvSimpleCard } from '@/components/ui/caminv-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator} from '@/components/ui/separator';

import { InvoiceStatusBadge } from '@/components/caminv/invoice-status-badge';
import { InvoiceActionButtons } from '@/components/caminv/invoice-action-buttons';
import { EnhancedStatusTimeline } from '@/components/caminv/enhanced-status-timeline';
import { CopyButton } from '@/components/caminv/copy-button';
import {
  FileText,
  User,
  Calendar,
  Edit,
  ArrowLeft,
  Share2,
  Building2,
  Clock,
} from 'lucide-react';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { camInvInvoiceService } from '@/lib/caminv/invoice-service';
import { getPrimaryMerchantForTeam } from '@/lib/caminv/team-merchant-helper';



async function getInvoice(id: string) {
  try {
    // Get current user
    const user = await getUser();
    if (!user) {
      return null;
    }

    // Get user's team
    const team = await getTeamForUser();
    if (!team) {
      return null;
    }

    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return null;
    }

    // Get invoice with line items using the service directly
    const invoiceData = await camInvInvoiceService.getInvoiceWithLineItems(invoiceId);

    if (!invoiceData) {
      return null;
    }

    // Get primary merchant for the team
    const merchantId = await getPrimaryMerchantForTeam(team.id);

    // Remove sensitive data before sending to client
    const safeInvoice = {
      id: invoiceData.invoice.id,
      invoiceUuid: invoiceData.invoice.invoiceUuid,
      invoiceNumber: invoiceData.invoice.invoiceNumber,
      invoiceType: invoiceData.invoice.invoiceType,
      status: invoiceData.invoice.status,
      direction: invoiceData.invoice.direction,
      customerName: invoiceData.invoice.customerName,
      customerEmail: invoiceData.invoice.customerEmail,
      customerTaxId: invoiceData.invoice.customerTaxId,
      customerAddress: invoiceData.invoice.customerAddress,
      // Enhanced CamInv API fields
      customerId: invoiceData.invoice.customerId,
      customerCompanyNameKh: invoiceData.invoice.customerCompanyNameKh,
      customerCompanyNameEn: invoiceData.invoice.customerCompanyNameEn,
      supplierId: invoiceData.invoice.supplierId,
      supplierCompanyNameKh: invoiceData.invoice.supplierCompanyNameKh,
      supplierCompanyNameEn: invoiceData.invoice.supplierCompanyNameEn,
      createdBy: invoiceData.invoice.createdBy,
      issueDate: invoiceData.invoice.issueDate,
      dueDate: invoiceData.invoice.dueDate,
      currency: invoiceData.invoice.currency,
      subtotal: invoiceData.invoice.subtotal,
      taxAmount: invoiceData.invoice.taxAmount,
      totalAmount: invoiceData.invoice.totalAmount,
      camInvStatus: invoiceData.invoice.camInvStatus,
      documentId: invoiceData.invoice.documentId,
      verificationLink: invoiceData.invoice.verificationLink,
      ublXml: invoiceData.invoice.ublXml,
      camInvResponse: invoiceData.invoice.camInvResponse,
      submittedAt: invoiceData.invoice.submittedAt,
      sentAt: invoiceData.invoice.sentAt,
      acceptedAt: invoiceData.invoice.acceptedAt,
      rejectedAt: invoiceData.invoice.rejectedAt,
      rejectionReason: invoiceData.invoice.rejectionReason,
      createdAt: invoiceData.invoice.createdAt,
      updatedAt: invoiceData.invoice.updatedAt,
      lineItems: invoiceData.lineItems.map(item => ({
        id: item.id,
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        lineTotal: item.lineTotal,
      })),
    };

    return {
      invoice: safeInvoice,
      merchantId
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}



function InvoiceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Invoice Header Card Skeleton */}
          <CamInvCard>
            <div className="grid gap-6 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </CamInvCard>

          {/* Key Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CamInvSimpleCard key={i}>
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-6 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </CamInvSimpleCard>
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Invoice Details Skeleton */}
            <CamInvCard>
              <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            </CamInvCard>

            {/* Invoice Items Skeleton */}
            <CamInvCard>
              <Skeleton className="h-[400px] w-full rounded-2xl" />
            </CamInvCard>


          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-8">
            <CamInvCard>
              <Skeleton className="h-[200px] w-full" />
            </CamInvCard>

            <CamInvCard>
              <Skeleton className="h-[300px] w-full" />
            </CamInvCard>
          </div>
        </div>
      </div>
    </div>
  );
}

async function InvoiceDetail({ id }: { id: string }) {
  const data = await getInvoice(id);
  
  if (!data) {
    notFound();
  }
  
  const { invoice } = data;
  
  return (
    <div className="min-h-screen">
      <div>

        {/* Modern Header */}
        <div className="mb-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Button asChild variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 -ml-2">
              <Link href="/caminv/invoices" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Invoices
              </Link>
            </Button>
          </div>

          {/* Modern Invoice Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Dark Navy Header */}
            <div className="bg-slate-800 text-white p-8 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                      Document No.: {invoice.invoiceNumber}
                    </h1>
                    <p className="text-slate-300">
                      Created {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  {invoice.status === 'draft' && (
                    <Button asChild variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                      <Link href={`/caminv/invoices/${invoice.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Invoice Details Section */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Invoice Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                      <p className="font-mono text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Issue Date</p>
                      <p className="text-gray-900">
                        {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    {invoice.dueDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Due Date</p>
                        <p className="text-gray-900">
                          {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Currency</p>
                      <p className="text-gray-900">{invoice.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Type</p>
                      <p className="text-gray-900 capitalize">{invoice.invoiceType.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Billed To */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Billed to</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Customer</p>
                      <p className="font-semibold text-gray-900">{invoice.customerName}</p>
                    </div>
                    {invoice.customerCompanyNameEn && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Company</p>
                        <p className="text-gray-900">{invoice.customerCompanyNameEn}</p>
                      </div>
                    )}
                    {invoice.customerEmail && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="text-gray-900">{invoice.customerEmail}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                      <p className="text-lg font-semibold text-gray-900">{invoice.totalAmount} {invoice.currency}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">

            {/* Client Details Card - Moved to main content */}
            <CamInvCard
              title="Client Details"
              description="Customer information and contact details"
              icon={<User className="h-6 w-6 text-white" />}
            >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {invoice.customerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{invoice.customerName}</h4>
                    {invoice.customerEmail && (
                      <p className="text-xs text-gray-600">{invoice.customerEmail}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {invoice.customerCompanyNameEn && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Company (EN)</p>
                      <p className="text-sm text-gray-900">{invoice.customerCompanyNameEn}</p>
                    </div>
                  )}

                  {invoice.customerCompanyNameKh && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Company (KH)</p>
                      <p className="text-sm text-gray-900">{invoice.customerCompanyNameKh}</p>
                    </div>
                  )}

                  {invoice.customerId && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Customer ID</p>
                      <p className="font-mono text-sm text-gray-900">{invoice.customerId}</p>
                    </div>
                  )}

                  {invoice.customerTaxId && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Tax ID</p>
                      <p className="font-mono text-sm text-gray-900">{invoice.customerTaxId}</p>
                    </div>
                  )}

                  {invoice.customerAddress && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Address</p>
                      <p className="text-sm text-gray-900">{invoice.customerAddress}</p>
                    </div>
                  )}

                  {invoice.direction && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Direction</p>
                      <p className="text-sm text-gray-900 capitalize">{invoice.direction}</p>
                    </div>
                  )}

                  {invoice.createdBy && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Created By</p>
                      <p className="text-sm text-gray-900">{invoice.createdBy}</p>
                    </div>
                  )}
                </div>
            </CamInvCard>

            {/* Unified Invoice Details */}
            <CamInvCard
              title="Invoice Items"
              description="Detailed breakdown of invoice line items"
              icon={<FileText className="h-6 w-6 text-white" />}
            >
                {/* Line Items Section */}
                <div className="mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 text-sm font-medium text-gray-600 uppercase tracking-wider">Description</th>
                          <th className="text-center py-3 text-sm font-medium text-gray-600 uppercase tracking-wider">Qty</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600 uppercase tracking-wider">Tax Amount</th>
                          <th className="text-right py-3 text-sm font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoice.lineItems && invoice.lineItems.length > 0 ? (
                          invoice.lineItems.map((item: any, index: number) => (
                            <tr key={item.id || index} className="hover:bg-gray-50">
                              <td className="py-4">
                                <div>
                                  <p className="font-medium text-gray-900">{item.itemName || item.description || 'Service Item'}</p>
                                  {item.itemDescription && (
                                    <p className="text-sm text-gray-600 mt-1">{item.itemDescription}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 text-center text-gray-900">{item.quantity || '1'}</td>
                              <td className="py-4 text-right text-gray-900">{item.unitPrice || item.rate || '0.00'}</td>
                              <td className="py-4 text-right font-medium text-gray-900">
                                {item.lineTotal || item.totalAmount || item.amount || '0.00'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="py-4">
                              <p className="font-medium text-gray-900">Service Item</p>
                              <p className="text-sm text-gray-600">Professional services</p>
                            </td>
                            <td className="py-4 text-center text-gray-900">1</td>
                            <td className="py-4 text-right text-gray-900">{invoice.totalAmount}</td>
                            <td className="py-4 text-right font-medium text-gray-900">{invoice.totalAmount}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invoice Summary */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-3">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>{invoice.subtotal || invoice.totalAmount} {invoice.currency}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Tax:</span>
                        <span>{invoice.taxAmount || '0.00'} {invoice.currency}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Discount:</span>
                        <span>0.00 {invoice.currency}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-lg font-semibold text-gray-900">
                          <span>Total:</span>
                          <span>{invoice.totalAmount} {invoice.currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </CamInvCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Enhanced Basic Info */}
            <CamInvCard
              title="Basic Info"
              description="Document details and actions"
              icon={<FileText className="h-6 w-6 text-white" />}
            >
              <div className="space-y-3">
                {/* Current Status */}
                  <p className="text-sm font-medium text-gray-600 mb-2">Current Status</p>
                  <Badge
                    variant="secondary"
                    className={`${
                      invoice.status === 'validated' ? 'bg-green-100 text-green-800 border-green-200' :
                      invoice.submittedAt ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    } px-3 py-1`}
                  >
                    {invoice.status === 'validated' ? 'Validated' :
                     invoice.submittedAt ? 'Processing' : 'Draft'}
                  </Badge>

                {/* Last Checked */}
                {(invoice.camInvResponse as any)?.latest_status_check && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Last Checked</p>
                    <p className="text-sm text-gray-900">
                      {new Date((invoice.camInvResponse as any).latest_status_check).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {/* Document Information */}
                {invoice.documentId && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">CamInv Document ID</p>
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <p className="font-mono text-xs text-gray-900 break-all flex-1 mr-2">{invoice.documentId}</p>
                        <CopyButton text={invoice.documentId} />
                      </div>
                    </div>

                  </div>
                )}

                {/* Invoice Dates */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Invoice Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-900">
                        {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {invoice.dueDate && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Due Date</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <p className="text-sm text-gray-900">
                          {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <InvoiceActionButtons
                  verificationLink={invoice.verificationLink}
                  invoiceId={invoice.id}
                  ublXml={invoice.ublXml}
                  invoiceNumber={invoice.invoiceNumber}
                />
              </div>
            </CamInvCard>

            {/* CamInv Status */}
            <CamInvCard
              title="CamInv Status"
              description="Document processing status and timeline"
              icon={<Building2 className="h-6 w-6 text-white" />}
            >
                <EnhancedStatusTimeline invoice={invoice} />
            </CamInvCard>
          </div>
      </div>
      </div>
    </div>
  );
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<InvoiceDetailSkeleton />}>
      <InvoiceDetail id={id} />
    </Suspense>
  );
}
