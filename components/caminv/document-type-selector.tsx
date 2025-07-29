'use client';

import { useState } from 'react';
import { FileText, CreditCard, Receipt } from 'lucide-react';
import { useInvoiceForm } from './invoice-form-context';

export type DocumentType = 'invoice' | 'credit_note' | 'debit_note';

interface DocumentTypeOption {
  type: DocumentType;
  title: string;
  description: string;
  ublCode: string;
  icon: React.ComponentType<{ className?: string }>;
}

const documentTypes: DocumentTypeOption[] = [
  {
    type: 'invoice',
    title: 'Tax Invoice',
    description: 'Standard commercial invoice',
    ublCode: '388',
    icon: FileText,
  },
  {
    type: 'credit_note',
    title: 'Credit Note',
    description: 'Credit adjustment document',
    ublCode: '381',
    icon: CreditCard,
  },
  {
    type: 'debit_note',
    title: 'Debit Note',
    description: 'Debit adjustment document',
    ublCode: '383',
    icon: Receipt,
  },
];

export function DocumentTypeSelector() {
  const { formData, updateFormData } = useInvoiceForm();
  const [selectedType, setSelectedType] = useState<DocumentType>(formData.invoiceType as DocumentType || 'invoice');

  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
    updateFormData({ invoiceType: type });
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {documentTypes.map((docType) => {
        const isSelected = selectedType === docType.type;
        const Icon = docType.icon;
        
        return (
          <div
            key={docType.type}
            onClick={() => handleTypeSelect(docType.type)}
            className={`
              p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer
              ${isSelected 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon 
                className={`h-6 w-6 ${
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
              <h3 className="font-semibold">{docType.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {docType.description}
            </p>
            <p className="text-xs text-muted-foreground">
              UBL Type Code: {docType.ublCode}
            </p>
          </div>
        );
      })}
    </div>
  );
}
