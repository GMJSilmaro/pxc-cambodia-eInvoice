'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface LineItem {
  id: string;
  itemName: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxCategory?: string;
  taxScheme?: string;
}

export interface InvoiceFormData {
  merchantId: string;
  invoiceNumber: string;
  invoiceType: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  customerName: string;
  customerTaxId: string;
  customerEmail: string;
  customerAddress: string;
  // Original invoice reference for credit/debit notes
  originalInvoiceId?: number;
  originalInvoiceNumber?: string;
  originalInvoiceUuid?: string;
  originalInvoiceDate?: string;
}

export interface InvoiceTotals {
  subtotal: number;
  totalTax: number;
  totalAmount: number;
}

interface InvoiceFormContextType {
  formData: InvoiceFormData;
  lineItems: LineItem[];
  totals: InvoiceTotals;
  updateFormData: (data: Partial<InvoiceFormData>) => void;
  updateLineItems: (items: LineItem[]) => void;
  calculateTotals: () => InvoiceTotals;
}

const InvoiceFormContext = createContext<InvoiceFormContextType | undefined>(undefined);

export function useInvoiceForm() {
  const context = useContext(InvoiceFormContext);
  if (context === undefined) {
    throw new Error('useInvoiceForm must be used within an InvoiceFormProvider');
  }
  return context;
}

interface InvoiceFormProviderProps {
  children: React.ReactNode;
}

export function InvoiceFormProvider({ children }: InvoiceFormProviderProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    merchantId: '',
    invoiceNumber: '',
    invoiceType: 'invoice',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'KHR',
    customerName: '',
    customerTaxId: '',
    customerEmail: '',
    customerAddress: '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      itemName: '',
      itemDescription: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 10,
      taxCategory: 'S',
      taxScheme: 'VAT',
    }
  ]);

  const calculateTotalsFromItems = useCallback((items: LineItem[]): InvoiceTotals => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const totalTax = items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      return sum + (lineTotal * (item.taxRate / 100));
    }, 0);

    const totalAmount = subtotal + totalTax;

    return {
      subtotal,
      totalTax,
      totalAmount,
    };
  }, []);

  const [totals, setTotals] = useState<InvoiceTotals>(() => calculateTotalsFromItems(lineItems));

  const calculateTotals = useCallback((): InvoiceTotals => {
    return calculateTotalsFromItems(lineItems);
  }, [lineItems, calculateTotalsFromItems]);

  const updateFormData = useCallback((data: Partial<InvoiceFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const updateLineItems = useCallback((items: LineItem[]) => {
    setLineItems(items);
    // Totals will be updated by the useEffect
  }, []);

  // Update totals when line items change
  React.useEffect(() => {
    setTotals(calculateTotalsFromItems(lineItems));
  }, [lineItems, calculateTotalsFromItems]);

  const value: InvoiceFormContextType = {
    formData,
    lineItems,
    totals,
    updateFormData,
    updateLineItems,
    calculateTotals,
  };

  return (
    <InvoiceFormContext.Provider value={value}>
      {children}
    </InvoiceFormContext.Provider>
  );
}
