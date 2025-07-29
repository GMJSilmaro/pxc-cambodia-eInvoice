"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { toast } from 'sonner';

interface InvoiceEditFormProps {
  invoice: any;
  lineItems: any[];
  merchants: any[];
}

export function InvoiceEditForm({ invoice, lineItems: initialLineItems, merchants }: InvoiceEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { formData, lineItems, totals, updateFormData, updateLineItems } = useInvoiceForm();

  // Initialize form with existing invoice data
  useEffect(() => {
    if (invoice) {
      updateFormData({
        merchantId: invoice.merchantId || '',
        invoiceNumber: invoice.invoiceNumber || '',
        invoiceType: invoice.invoiceType || 'commercial_invoice',
        customerName: invoice.customerName || '',
        customerEmail: invoice.customerEmail || '',
        customerTaxId: invoice.customerTaxId || '',
        customerAddress: invoice.customerAddress || '',
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        currency: invoice.currency || 'KHR',
        notes: invoice.notes || '',
      });

      // Convert existing line items to form format
      const formattedLineItems: LineItem[] = initialLineItems.map((item, index) => ({
        id: item.id?.toString() || index.toString(),
        itemName: item.itemName || '',
        itemDescription: item.itemDescription || '',
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        taxRate: parseFloat(item.taxRate) || 10,
      }));

      updateLineItems(formattedLineItems.length > 0 ? formattedLineItems : [{
        id: '1',
        itemName: '',
        itemDescription: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 10,
      }]);
    }
  }, [invoice?.id, initialLineItems?.length]); // Only depend on invoice ID and line items length

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      itemName: '',
      itemDescription: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 10,
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

  const validateForm = () => {
    if (!formData.merchantId) {
      setError('Please select a merchant');
      return false;
    }
    if (!formData.invoiceNumber) {
      setError('Invoice number is required');
      return false;
    }
    if (!formData.customerName) {
      setError('Customer name is required');
      return false;
    }
    if (!formData.issueDate) {
      setError('Issue date is required');
      return false;
    }
    if (lineItems.some(item => !item.itemName || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('All line items must have valid names, quantities, and prices');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/caminv/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          lineItems: lineItems.map(item => ({
            ...item,
            lineTotal: item.quantity * item.unitPrice,
          })),
          subtotal: totals.subtotal,
          taxAmount: totals.totalTax,
          totalAmount: totals.totalAmount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Invoice updated successfully!', {
          description: `Invoice ${formData.invoiceNumber} has been saved.`,
        });
        router.push(`/caminv/invoices/${invoice.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Update failed:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // First save the invoice
      const saveResponse = await fetch(`/api/caminv/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          lineItems: lineItems.map(item => ({
            ...item,
            lineTotal: item.quantity * item.unitPrice,
          })),
          subtotal: totals.subtotal,
          taxAmount: totals.totalTax,
          totalAmount: totals.totalAmount,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        setError(errorData.error || 'Failed to save invoice before submission');
        return;
      }

      // Then submit to CamInv
      const submitResponse = await fetch(`/api/caminv/invoices/${invoice.id}/submit`, {
        method: 'POST',
      });

      if (submitResponse.ok) {
        const data = await submitResponse.json();
        toast.success('Invoice submitted successfully!', {
          description: `Invoice ${formData.invoiceNumber} has been submitted to CamInv.`,
        });
        router.push(`/caminv/invoices/${invoice.id}`);
      } else {
        const errorData = await submitResponse.json();
        setError(errorData.error || 'Failed to submit invoice to CamInv');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Invoice</CardTitle>
        <CardDescription>
          Update your draft invoice details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Merchant Selection */}
        <div className="space-y-2">
          <Label htmlFor="merchant">Merchant Account *</Label>
          <Select
            value={formData.merchantId || ""}
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

        {/* Invoice Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number *</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={(e) => updateFormData({ invoiceNumber: e.target.value })}
              placeholder="INV-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceType">Invoice Type</Label>
            <Select
              value={formData.invoiceType}
              onValueChange={(value) => updateFormData({ invoiceType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commercial_invoice">Commercial Invoice</SelectItem>
                <SelectItem value="credit_note">Credit Note</SelectItem>
                <SelectItem value="debit_note">Debit Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Customer Information</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => updateFormData({ customerName: e.target.value })}
                placeholder="Customer Company Ltd."
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerTaxId">Customer Tax ID</Label>
            <div className="flex gap-2">
              <Input
                id="customerTaxId"
                value={formData.customerTaxId}
                onChange={(e) => updateFormData({ customerTaxId: e.target.value })}
                placeholder="K001-901234567"
              />
              {formData.customerTaxId && (
                <TaxpayerValidation
                  customerTaxId={formData.customerTaxId}
                  customerName={formData.customerName}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress">Customer Address</Label>
            <Textarea
              id="customerAddress"
              value={formData.customerAddress}
              onChange={(e) => updateFormData({ customerAddress: e.target.value })}
              placeholder="Customer address..."
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={isSaving || isSubmitting}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>

          <Button onClick={handleSubmit} disabled={isSaving || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Save & Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
