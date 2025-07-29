"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Trash2, AlertCircle, Save, Send, CheckCircle, ExternalLink } from 'lucide-react';
import { useInvoiceForm, type LineItem } from './invoice-form-context';
import { TaxpayerValidation } from './taxpayer-validation';
import { OriginalInvoiceSelector } from './original-invoice-selector';
import { TaxDropdowns } from './tax-dropdowns';
import { useModalToastMigration, CamInvProgressSteps } from '@/lib/modal-loading-utils';

interface InvoiceCreateFormProps {
  merchants: any[];
}

export function InvoiceCreateForm({ merchants }: InvoiceCreateFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { formData, lineItems, totals, updateFormData, updateLineItems } = useInvoiceForm();
  const modalLoading = useModalToastMigration();

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      itemName: '',
      itemDescription: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 10,
      taxCategory: 'S',
      taxScheme: 'VAT',
    };
    updateLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      updateLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    updateLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (action: 'save' | 'submit') => {
    if (action === 'save') {
      setIsSaving(true);
    } else {
      setIsSubmitting(true);
    }
    setError(null);

    const actionTitle = action === 'save' ? 'Saving Invoice...' : 'Creating & Submitting Invoice...';
    const actionDescription = action === 'save'
      ? 'Saving your invoice as a draft'
      : 'Creating invoice and submitting to CamInv for processing';

    try {
      const steps = action === 'submit'
        ? CamInvProgressSteps.invoiceSubmission
        : CamInvProgressSteps.invoiceCreation;

      await modalLoading.executeWithSteps(async (stepController) => {
        // Step 1: Validate form data
        stepController.activateStep(action === 'submit' ? 'validate' : 'validate');

        if (!formData.merchantId || !formData.invoiceNumber || !formData.customerName) {
          throw new Error('Please fill in all required fields');
        }

        if (lineItems.some(item => !item.itemName || item.quantity <= 0 || item.unitPrice < 0)) {
          throw new Error('Please complete all line items with valid values');
        }

        stepController.completeStep(action === 'submit' ? 'validate' : 'validate');

        // Step 2: Create invoice data structure
        if (action === 'submit') {
          stepController.activateStep('transform');
        } else {
          stepController.activateStep('create');
        }

        const invoiceData = {
          ...formData,
          merchantId: parseInt(formData.merchantId),
          issueDate: new Date(formData.issueDate),
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          lineItems: lineItems.map(item => ({
            itemName: item.itemName,
            itemDescription: item.itemDescription || undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          })),
        };

        if (action === 'submit') {
          stepController.completeStep('transform');
          stepController.activateStep('submit');
        } else {
          stepController.completeStep('create');
          stepController.activateStep('generate');
        }

        // Step 3: Create invoice in database
        const response = await fetch('/api/caminv/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create invoice');
        }

        const { invoice } = await response.json();

        if (action === 'submit') {
          stepController.completeStep('submit');
          stepController.activateStep('process');
        } else {
          stepController.completeStep('generate');
          stepController.activateStep('complete');
        }

        // If action is submit, also submit to CamInv
        if (action === 'submit') {
          const submitResponse = await fetch(`/api/caminv/invoices/${invoice.id}/submit`, {
            method: 'POST',
          });

          if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            // Invoice was created but submission failed
            router.push(`/caminv/invoices/${invoice.id}?error=submission-failed&message=${encodeURIComponent(errorData.error)}`);
            throw new Error(errorData.error || 'Failed to submit invoice to CamInv');
          }

          // Parse successful submission response
          const submitData = await submitResponse.json();

          stepController.completeStep('process');
          stepController.activateStep('finalize');

          // Small delay to show finalization step
          await new Promise(resolve => setTimeout(resolve, 500));
          stepController.completeStep('finalize');

          // Navigate to invoice detail page
          router.push(`/caminv/invoices/${invoice.id}`);
          return invoice;
        } else {
          // Complete the final step for draft save
          stepController.completeStep('complete');

          // Navigate to invoice detail page for draft
          router.push(`/caminv/invoices/${invoice.id}`);
          return invoice;
        }
      },
      steps,
      actionTitle,
      actionDescription,
      action === 'save' ? 'Invoice Saved!' : 'Invoice Submitted Successfully!',
      action === 'save'
        ? 'Your invoice has been saved as a draft'
        : 'Your invoice has been submitted to CamInv and is being processed',
      true // Show toast on success for hybrid notification
      );

    } catch (error) {
      console.error('Form submission error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Details</CardTitle>
        <CardDescription>
          Enter the invoice information and line items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="merchant">Merchant Account *</Label>
              <Select
                value={formData.merchantId}
                onValueChange={(value) => updateFormData({ merchantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select merchant account" />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((merchant) => (
                    <SelectItem key={merchant.id} value={merchant.id.toString()}>
                      {merchant.merchantName} ({merchant.endpointId || merchant.merchantId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => updateFormData({ invoiceNumber: e.target.value })}
                placeholder="INV-2024-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => updateFormData({ issueDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateFormData({ dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => updateFormData({ currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KHR">Cambodian Riel (KHR)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => updateFormData({ customerName: e.target.value })}
                  placeholder="Customer Company Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerTaxId">Customer Tax ID</Label>
                <Input
                  id="customerTaxId"
                  value={formData.customerTaxId}
                  onChange={(e) => updateFormData({ customerTaxId: e.target.value })}
                  placeholder="Tax Identification Number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => updateFormData({ customerEmail: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customerAddress">Customer Address</Label>
                <Textarea
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={(e) => updateFormData({ customerAddress: e.target.value })}
                  placeholder="Customer address"
                  rows={2}
                />
              </div>
            </div>

            {/* Taxpayer Validation */}
            <TaxpayerValidation
              customerName={formData.customerName}
              customerTaxId={formData.customerTaxId}
              onValidationResult={(isValid, data) => {
                // You can store the validation result in form state if needed
                console.log('Taxpayer validation result:', { isValid, data });
              }}
              className="mt-6"
            />
          </div>

          {/* Original Invoice Reference for Credit/Debit Notes */}
          {(formData.invoiceType === 'credit_note' || formData.invoiceType === 'debit_note') && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Original Invoice Reference
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the original invoice that this {formData.invoiceType === 'credit_note' ? 'credit note' : 'debit note'} references.
                </p>
                <OriginalInvoiceSelector
                  merchantId={formData.merchantId ? parseInt(formData.merchantId) : undefined}
                  selectedInvoice={formData.originalInvoiceId ? {
                    id: formData.originalInvoiceId,
                    invoiceNumber: formData.originalInvoiceNumber || '',
                    invoiceUuid: formData.originalInvoiceUuid || '',
                    issueDate: formData.originalInvoiceDate || '',
                    customerName: formData.customerName,
                    totalAmount: 0,
                    currency: formData.currency
                  } : null}
                  onInvoiceSelect={(invoice) => {
                    if (invoice) {
                      updateFormData({
                        originalInvoiceId: invoice.id,
                        originalInvoiceNumber: invoice.invoiceNumber,
                        originalInvoiceUuid: invoice.invoiceUuid,
                        originalInvoiceDate: invoice.issueDate,
                        // Pre-fill customer information from original invoice
                        customerName: invoice.customerName,
                        currency: invoice.currency
                      });
                    } else {
                      updateFormData({
                        originalInvoiceId: undefined,
                        originalInvoiceNumber: undefined,
                        originalInvoiceUuid: undefined,
                        originalInvoiceDate: undefined
                      });
                    }
                  }}
                />
              </div>
            </>
          )}

          <Separator />

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Item Name *</Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => updateLineItem(item.id, 'itemName', e.target.value)}
                        placeholder="Product or service name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={item.itemDescription}
                        onChange={(e) => updateLineItem(item.id, 'itemDescription', e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        value={item.taxRate}
                        onChange={(e) => updateLineItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <TaxDropdowns
                        taxCategory={item.taxCategory}
                        taxScheme={item.taxScheme}
                        onTaxCategoryChange={(value) => updateLineItem(item.id, 'taxCategory', value)}
                        onTaxSchemeChange={(value) => updateLineItem(item.id, 'taxScheme', value)}
                        onTaxRateChange={(rate) => updateLineItem(item.id, 'taxRate', rate)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Line Total</Label>
                      <Input
                        value={`${(item.quantity * item.unitPrice).toFixed(2)} ${formData.currency}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Invoice Totals</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{totals.subtotal.toFixed(2)} {formData.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tax:</span>
                <span>{totals.totalTax.toFixed(2)} {formData.currency}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span>{totals.totalAmount.toFixed(2)} {formData.currency}</span>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit('save')}
              disabled={isSaving || isSubmitting}
              className="flex-1 bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as Draft
            </Button>

            <Button
              type="button"
              onClick={() => handleSubmit('submit')}
              disabled={isSaving || isSubmitting}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Create & Submit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
