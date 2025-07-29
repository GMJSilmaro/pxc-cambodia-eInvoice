"use client";

import { FileText, Building2, User } from 'lucide-react';
import { useInvoiceForm } from './invoice-form-context';
import { Separator } from '@/components/ui/separator';

export function InvoicePreview() {
  const { formData, lineItems, totals } = useInvoiceForm();

  const hasData = formData.customerName || formData.invoiceNumber || lineItems.some(item => item.itemName);

  if (!hasData) {
    return (
      <div className="space-y-4">
        <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Invoice preview will appear here as you fill in the form
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>0.00 {formData.currency || 'KHR'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax:</span>
            <span>0.00 {formData.currency || 'KHR'}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>0.00 {formData.currency || 'KHR'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Invoice Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">
            {formData.invoiceType === 'invoice' ? 'Tax Invoice' :
             formData.invoiceType === 'credit_note' ? 'Credit Note' : 'Debit Note'}
          </h3>
        </div>

        {formData.invoiceNumber && (
          <p className="text-sm text-muted-foreground">
            #{formData.invoiceNumber}
          </p>
        )}

        {formData.issueDate && (
          <p className="text-xs text-muted-foreground">
            Issue Date: {new Date(formData.issueDate).toLocaleDateString()}
          </p>
        )}
      </div>

      <Separator />

      {/* Customer Information */}
      {formData.customerName && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Bill To:</span>
          </div>
          <div className="text-sm space-y-1 ml-6">
            <p className="font-medium">{formData.customerName}</p>
            {formData.customerTaxId && (
              <p className="text-muted-foreground">Tax ID: {formData.customerTaxId}</p>
            )}
            {formData.customerEmail && (
              <p className="text-muted-foreground">{formData.customerEmail}</p>
            )}
            {formData.customerAddress && (
              <p className="text-muted-foreground">{formData.customerAddress}</p>
            )}
          </div>
        </div>
      )}

      {/* Line Items */}
      {lineItems.some(item => item.itemName) && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Items</h4>
            <div className="space-y-2">
              {lineItems.filter(item => item.itemName).map((item) => (
                <div key={item.id} className="text-xs space-y-1 p-2 bg-muted/50 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.itemName}</span>
                    <span>{(item.quantity * item.unitPrice).toFixed(2)} {formData.currency}</span>
                  </div>
                  {item.itemDescription && (
                    <p className="text-muted-foreground">{item.itemDescription}</p>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>{item.quantity} × {item.unitPrice.toFixed(2)} {formData.currency}</span>
                    <span>Tax: {item.taxRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal:</span>
          <span>{totals.subtotal.toFixed(2)} {formData.currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax:</span>
          <span>{totals.totalTax.toFixed(2)} {formData.currency}</span>
        </div>
        <div className="flex justify-between font-medium text-base">
          <span>Total:</span>
          <span>{totals.totalAmount.toFixed(2)} {formData.currency}</span>
        </div>
      </div>
    </div>
  );
}
