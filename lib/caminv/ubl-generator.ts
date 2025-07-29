import { v4 as uuidv4 } from 'uuid';
import { CamInvError, CamInvErrorCode, CamInvValidator } from './error-handler';
import type { EInvoice, InvoiceLineItem, CamInvMerchant } from '@/lib/db/schema';

export interface UBLInvoiceData {
  // Invoice Header
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  invoiceType: 'invoice' | 'credit_note' | 'debit_note';
  currency: string;

  // Supplier (Merchant) Information
  supplier: {
    name: string;
    taxId: string;
    email: string;
    endpointId?: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };

  // Customer Information
  customer: {
    name: string;
    taxId?: string;
    email?: string;
    endpointId?: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };

  // Invoice Lines
  lines: Array<{
    lineNumber: number;
    itemName: string;
    itemDescription?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    taxRate: number;
    taxAmount: number;
    taxCategory?: string; // Tax category (S, Z, E, etc.)
    taxScheme?: string;   // Tax scheme (VAT, GST, etc.)
  }>;

  // Totals
  subtotal: number;
  totalTaxAmount: number;
  totalAmount: number;

  // Reference for credit/debit notes
  originalInvoiceNumber?: string;
  originalInvoiceDate?: Date;
  originalInvoiceUuid?: string; // UUID of the original invoice for billing reference
}

export class UBLGenerator {
  private static readonly UBL_VERSION = '2.1';
  private static readonly CAMBODIA_COUNTRY_CODE = 'KH';
  private static readonly DEFAULT_CURRENCY = 'KHR';

  /**
   * Generate UBL XML for an invoice
   */
  static generateInvoiceXML(data: UBLInvoiceData): string {
    this.validateInvoiceData(data);
    
    const invoiceUUID = uuidv4();
    const issueDateTime = this.formatDateTime(data.issueDate);
    
    let xml = this.getXMLHeader();
    
    if (data.invoiceType === 'invoice') {
      xml += this.generateInvoiceDocument(data, invoiceUUID, issueDateTime);
    } else if (data.invoiceType === 'credit_note') {
      xml += this.generateCreditNoteDocument(data, invoiceUUID, issueDateTime);
    } else if (data.invoiceType === 'debit_note') {
      xml += this.generateDebitNoteDocument(data, invoiceUUID, issueDateTime);
    }
    
    return xml;
  }

  /**
   * Generate UBL XML from database invoice record
   */
  static generateFromInvoiceRecord(invoice: EInvoice, lineItems: InvoiceLineItem[], merchant: CamInvMerchant): string {
    // Parse customer address
    const customerAddress = this.parseAddress(invoice.customerAddress || '');

    const data: UBLInvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate || undefined,
      invoiceType: invoice.invoiceType as 'invoice' | 'credit_note' | 'debit_note',
      currency: invoice.currency,

      supplier: {
        name: merchant.companyNameEn || merchant.merchantName,
        taxId: merchant.tin || 'N/A',
        email: merchant.email || 'noreply@merchant.com',
        endpointId: merchant.endpointId || 'KHUID00000000',
        address: {
          street: 'Business Address', // CamInv API doesn't provide detailed address
          city: merchant.city || 'Phnom Penh',
          postalCode: '12000', // Default postal code for Cambodia
          country: merchant.country || 'KH',
        },
      },

      customer: {
        name: invoice.customerName,
        taxId: invoice.customerTaxId || undefined,
        email: invoice.customerEmail || undefined,
        address: {
          street: customerAddress.street || 'Customer Address',
          city: customerAddress.city || 'Phnom Penh',
          postalCode: customerAddress.postalCode || '12000',
          country: customerAddress.country || 'KH',
        },
      },

      lines: lineItems.map(item => ({
        lineNumber: item.lineNumber,
        itemName: item.itemName,
        itemDescription: item.itemDescription || undefined,
        quantity: parseFloat(item.quantity.toString()),
        unitPrice: parseFloat(item.unitPrice.toString()),
        lineTotal: parseFloat(item.lineTotal.toString()),
        taxRate: parseFloat(item.taxRate.toString()),
        taxAmount: parseFloat(item.taxAmount.toString()),
        taxCategory: (item as any).taxCategory || 'S',
        taxScheme: (item as any).taxScheme || 'VAT',
      })),

      subtotal: parseFloat(invoice.subtotal.toString()),
      totalTaxAmount: parseFloat(invoice.taxAmount.toString()),
      totalAmount: parseFloat(invoice.totalAmount.toString()),

      // Reference for credit/debit notes
      originalInvoiceNumber: (invoice as any).originalInvoiceNumber || undefined,
      originalInvoiceDate: (invoice as any).originalInvoiceDate || undefined,
      originalInvoiceUuid: (invoice as any).originalInvoiceUuid || undefined,
    };

    return this.generateInvoiceXML(data);
  }

  /**
   * Parse address string into components
   */
  private static parseAddress(address: string): {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  } {
    // Simple address parsing - in production, you might want more sophisticated parsing
    const parts = address.split(',').map(part => part.trim());

    return {
      street: parts[0] || 'Address',
      city: parts[1] || 'Phnom Penh',
      postalCode: parts[2] || '12000',
      country: 'KH', // Default to Cambodia
    };
  }

  /**
   * Validate invoice data before XML generation
   */
  private static validateInvoiceData(data: UBLInvoiceData): void {
    if (!CamInvValidator.validateInvoiceNumber(data.invoiceNumber)) {
      throw new CamInvError(
        CamInvErrorCode.INVALID_INVOICE_DATA,
        'Invalid invoice number',
        400,
        { field: 'invoiceNumber' }
      );
    }

    if (!CamInvValidator.validateCurrency(data.currency)) {
      throw new CamInvError(
        CamInvErrorCode.INVALID_INVOICE_DATA,
        'Invalid currency code',
        400,
        { field: 'currency', value: data.currency }
      );
    }

    if (!CamInvValidator.validateAmount(data.totalAmount)) {
      throw new CamInvError(
        CamInvErrorCode.INVALID_INVOICE_DATA,
        'Invalid total amount',
        400,
        { field: 'totalAmount', value: data.totalAmount }
      );
    }

    if (data.customer.email && !CamInvValidator.validateEmail(data.customer.email)) {
      throw new CamInvError(
        CamInvErrorCode.INVALID_INVOICE_DATA,
        'Invalid customer email',
        400,
        { field: 'customer.email', value: data.customer.email }
      );
    }

    if (data.lines.length === 0) {
      throw new CamInvError(
        CamInvErrorCode.INVALID_INVOICE_DATA,
        'Invoice must have at least one line item',
        400,
        { field: 'lines' }
      );
    }

    // Validate line totals
    const calculatedSubtotal = data.lines.reduce((sum, line) => sum + line.lineTotal, 0);
    if (Math.abs(calculatedSubtotal - data.subtotal) > 0.01) {
      throw new CamInvError(
        CamInvErrorCode.INVALID_INVOICE_DATA,
        'Subtotal does not match sum of line totals',
        400,
        { calculated: calculatedSubtotal, provided: data.subtotal }
      );
    }
  }

  /**
   * Get XML header with namespaces
   */
  private static getXMLHeader(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
`;
  }

  /**
   * Generate invoice document XML (following official CamInv documentation)
   */
  private static generateInvoiceDocument(data: UBLInvoiceData, _uuid: string, _issueDateTime: string): string {
    return `<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:UBLVersionID>${this.UBL_VERSION}</cbc:UBLVersionID>
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${this.formatDate(data.issueDate)}</cbc:IssueDate>
  ${data.dueDate ? `<cbc:DueDate>${this.formatDate(data.dueDate)}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode listID="UN/ECE 1001 Subset">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${data.currency}</cbc:DocumentCurrencyCode>
  ${this.generateSupplierParty(data.supplier)}
  ${this.generateCustomerParty(data.customer)}
  ${this.generatePrepaidPayment()}
  ${this.generateTaxTotal(data)}
  ${this.generateLegalMonetaryTotal(data)}
  ${this.generateInvoiceLines(data.lines)}
</Invoice>`;
  } 

  /**
   * Generate credit note document XML
   */
  private static generateCreditNoteDocument(data: UBLInvoiceData, _uuid: string, _issueDateTime: string): string {
    return `<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
            xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
            xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">

  <cbc:UBLVersionID>${this.UBL_VERSION}</cbc:UBLVersionID>
  <cbc:CustomizationID>Cambodia E-Invoice Credit Note</cbc:CustomizationID>
  <cbc:ProfileID>Cambodia Tax Credit Note</cbc:ProfileID>
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${this.formatDate(data.issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${this.formatTime(data.issueDate)}</cbc:IssueTime>
  <cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>
  <cbc:DocumentCurrencyCode>${data.currency}</cbc:DocumentCurrencyCode>

  ${data.originalInvoiceNumber ? this.generateBillingReference(data.originalInvoiceNumber, data.originalInvoiceDate, data.originalInvoiceUuid) : ''}

  ${this.generateSupplierParty(data.supplier)}
  ${this.generateCustomerParty(data.customer)}

  ${this.generateTaxTotal(data)}
  ${this.generateLegalMonetaryTotal(data)}
  ${this.generateCreditNoteLines(data.lines)}

</CreditNote>`;
  }

  /**
   * Generate debit note document XML
   */
  private static generateDebitNoteDocument(data: UBLInvoiceData, _uuid: string, _issueDateTime: string): string {
    return `<DebitNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2"
           xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
           xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">

  <cbc:UBLVersionID>${this.UBL_VERSION}</cbc:UBLVersionID>
  <cbc:CustomizationID>Cambodia E-Invoice Debit Note</cbc:CustomizationID>
  <cbc:ProfileID>Cambodia Tax Debit Note</cbc:ProfileID>
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${this.formatDate(data.issueDate)}</cbc:IssueDate>
  <cbc:IssueTime>${this.formatTime(data.issueDate)}</cbc:IssueTime>
  <cbc:DebitNoteTypeCode>383</cbc:DebitNoteTypeCode>
  <cbc:DocumentCurrencyCode>${data.currency}</cbc:DocumentCurrencyCode>

  ${data.originalInvoiceNumber ? this.generateBillingReference(data.originalInvoiceNumber, data.originalInvoiceDate, data.originalInvoiceUuid) : ''}

  ${this.generateSupplierParty(data.supplier)}
  ${this.generateCustomerParty(data.customer)}

  ${this.generateTaxTotal(data)}
  ${this.generateRequestedMonetaryTotal(data)}
  ${this.generateDebitNoteLines(data.lines)}

</DebitNote>`;
  }

  /**
   * Generate supplier party XML (compliant with Cambodia GDT requirements)
   */
  private static generateSupplierParty(supplier: UBLInvoiceData['supplier']): string {
    return `  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID>${supplier.endpointId || 'KHUID00000000'}</cbc:EndpointID>
      <cac:PartyName>
        <cbc:Name>${this.escapeXML(supplier.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${this.escapeXML(supplier.address.street)}</cbc:StreetName>
        <cbc:CityName>${this.escapeXML(supplier.address.city)}</cbc:CityName>
        <cac:Country>
          <cbc:IdentificationCode>${this.CAMBODIA_COUNTRY_CODE}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${supplier.taxId || 'N/A'}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXML(supplier.name)}</cbc:RegistrationName>
        <cbc:CompanyID>${supplier.taxId || 'N/A'}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      <cac:Contact>
        <cbc:Telephone>+855000000000</cbc:Telephone>
        <cbc:ElectronicMail>${supplier.email || 'noreply@merchant.com'}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>`;
  }

  /**
   * Generate customer party XML (compliant with Cambodia GDT requirements)
   */
  private static generateCustomerParty(customer: UBLInvoiceData['customer']): string {
    return `  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:EndpointID>${customer.taxId || 'KHUID00000000'}</cbc:EndpointID>
      <cac:PartyName>
        <cbc:Name>${this.escapeXML(customer.name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${this.escapeXML(customer.address.street)}</cbc:StreetName>
        <cbc:CityName>${this.escapeXML(customer.address.city)}</cbc:CityName>
        <cac:Country>
          <cbc:IdentificationCode>${this.CAMBODIA_COUNTRY_CODE}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${customer.taxId ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${customer.taxId}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName languageID="en">${this.escapeXML(customer.name)}</cbc:RegistrationName>
        <cbc:CompanyID>${customer.taxId || 'N/A'}</cbc:CompanyID>
      </cac:PartyLegalEntity>
      ${customer.email ? `<cac:Contact>
        <cbc:Telephone>+855000000000</cbc:Telephone>
        <cbc:ElectronicMail>${customer.email}</cbc:ElectronicMail>
      </cac:Contact>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>`;
  }

  /**
   * Generate billing reference for credit/debit notes
   */
  private static generateBillingReference(originalInvoiceNumber: string, originalInvoiceDate?: Date, originalInvoiceUuid?: string): string {
    return `  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${originalInvoiceNumber}</cbc:ID>
      ${originalInvoiceUuid ? `<cbc:UUID>${originalInvoiceUuid}</cbc:UUID>` : ''}
      ${originalInvoiceDate ? `<cbc:IssueDate>${this.formatDate(originalInvoiceDate)}</cbc:IssueDate>` : ''}
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>`;
  }

  /**
   * Generate invoice lines XML
   */
  private static generateInvoiceLines(lines: UBLInvoiceData['lines']): string {
    return lines.map(line => `  <cac:InvoiceLine>
    <cbc:ID>${line.lineNumber}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="none">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="KHR">${line.lineTotal.toFixed(0)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="KHR">${line.taxAmount.toFixed(0)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxAmount currencyID="KHR">${line.taxAmount.toFixed(0)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${line.taxCategory || 'S'}</cbc:ID>
          <cbc:Percent>${line.taxRate.toFixed(0)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>${line.taxScheme || 'VAT'}</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      ${line.itemDescription ? `<cbc:Description>${this.escapeXML(line.itemDescription)}</cbc:Description>` : ''}
      <cbc:Name>${this.escapeXML(line.itemName)}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="KHR">${line.unitPrice.toFixed(0)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('\n');
  }

  /**
   * Generate credit note lines XML
   */
  private static generateCreditNoteLines(lines: UBLInvoiceData['lines']): string {
    return lines.map(line => `  <cac:CreditNoteLine>
    <cbc:ID>${line.lineNumber}</cbc:ID>
    <cbc:CreditedQuantity unitCode="EA">${line.quantity}</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="${this.DEFAULT_CURRENCY}">${line.lineTotal.toFixed(0)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${this.DEFAULT_CURRENCY}">${line.taxAmount.toFixed(0)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxAmount currencyID="${this.DEFAULT_CURRENCY}">${line.taxAmount.toFixed(0)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${line.taxCategory || 'S'}</cbc:ID>
          <cbc:Percent>${line.taxRate.toFixed(0)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>${line.taxScheme || 'VAT'}</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${this.escapeXML(line.itemName)}</cbc:Name>
      ${line.itemDescription ? `<cbc:Description>${this.escapeXML(line.itemDescription)}</cbc:Description>` : ''}
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${this.DEFAULT_CURRENCY}">${line.unitPrice.toFixed(0)}</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>`).join('\n');
  }

  /**
   * Generate debit note lines XML
   */
  private static generateDebitNoteLines(lines: UBLInvoiceData['lines']): string {
    return lines.map(line => `  <cac:DebitNoteLine>
    <cbc:ID>${line.lineNumber}</cbc:ID>
    <cbc:DebitedQuantity unitCode="EA">${line.quantity}</cbc:DebitedQuantity>
    <cbc:LineExtensionAmount currencyID="${this.DEFAULT_CURRENCY}">${line.lineTotal.toFixed(0)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${this.DEFAULT_CURRENCY}">${line.taxAmount.toFixed(0)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxAmount currencyID="${this.DEFAULT_CURRENCY}">${line.taxAmount.toFixed(0)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${line.taxCategory || 'S'}</cbc:ID>
          <cbc:Percent>${line.taxRate.toFixed(0)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>${line.taxScheme || 'VAT'}</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${this.escapeXML(line.itemName)}</cbc:Name>
      ${line.itemDescription ? `<cbc:Description>${this.escapeXML(line.itemDescription)}</cbc:Description>` : ''}
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${this.DEFAULT_CURRENCY}">${line.unitPrice.toFixed(0)}</cbc:PriceAmount>
    </cac:Price>
  </cac:DebitNoteLine>`).join('\n');
  }

  /**
   * Generate monetary totals XML
   */
  private static generateMonetaryTotals(data: UBLInvoiceData): string {
    return `  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${data.currency}">${data.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${data.currency}">${data.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${data.currency}">${data.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${data.currency}">${data.totalAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${data.currency}">${data.totalTaxAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${data.currency}">${data.subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${data.currency}">${data.totalTaxAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>${data.totalTaxAmount > 0 ? ((data.totalTaxAmount / data.subtotal) * 100).toFixed(2) : '0.00'}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>`;
  }

  /**
   * Generate prepaid payment section (required by CamInv)
   */
  private static generatePrepaidPayment(): string {
    return `  <cac:PrepaidPayment>
    <cbc:PaidAmount currencyID="KHR">0</cbc:PaidAmount>
  </cac:PrepaidPayment>`;
  }

  /**
   * Generate tax total section (following CamInv documentation)
   */
  private static generateTaxTotal(data: UBLInvoiceData): string {
    // Get the primary tax category and scheme from the first line item
    const primaryTaxCategory = data.lines[0]?.taxCategory || 'S';
    const primaryTaxScheme = data.lines[0]?.taxScheme || 'VAT';

    return `  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${data.currency}">${data.totalTaxAmount.toFixed(0)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${data.currency}">${data.subtotal.toFixed(0)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${data.currency}">${data.totalTaxAmount.toFixed(0)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${primaryTaxCategory}</cbc:ID>
        <cbc:Percent>${data.totalTaxAmount > 0 ? ((data.totalTaxAmount / data.subtotal) * 100).toFixed(0) : '0'}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>${primaryTaxScheme}</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>`;
  }

  /**
   * Generate legal monetary total section (following CamInv documentation)
   */
  private static generateLegalMonetaryTotal(data: UBLInvoiceData): string {
    return `  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${data.currency}">${data.subtotal.toFixed(0)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${data.currency}">${data.subtotal.toFixed(0)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${data.currency}">${data.totalAmount.toFixed(0)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${data.currency}">${data.totalAmount.toFixed(0)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
  }

  /**
   * Generate requested monetary total section for debit notes (following CamInv documentation)
   */
  private static generateRequestedMonetaryTotal(data: UBLInvoiceData): string {
    return `  <cac:RequestedMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${data.currency}">${data.subtotal.toFixed(0)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${data.currency}">${data.subtotal.toFixed(0)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${data.currency}">${data.totalAmount.toFixed(0)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${data.currency}">${data.totalAmount.toFixed(0)}</cbc:PayableAmount>
  </cac:RequestedMonetaryTotal>`;
  }

  /**
   * Format date for UBL (YYYY-MM-DD)
   */
  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format time for UBL (HH:MM:SS)
   */
  private static formatTime(date: Date): string {
    return date.toISOString().split('T')[1].split('.')[0];
  }

  /**
   * Format datetime for UBL (YYYY-MM-DDTHH:MM:SS)
   */
  private static formatDateTime(date: Date): string {
    return date.toISOString().split('.')[0];
  }

  /**
   * Escape XML special characters and handle empty values
   */
  private static escapeXML(text: string | undefined | null): string {
    if (!text || text.trim() === '') {
      return 'N/A'; // Cambodia GDT doesn't allow empty elements
    }
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Validate generated XML (basic validation)
   */
  static validateXML(xml: string): boolean {
    try {
      // Basic XML structure validation
      if (!xml.includes('<?xml version="1.0"')) {
        return false;
      }

      // Check for balanced tags (simplified check)
      const openTags = (xml.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (xml.match(/<\/[^>]*>/g) || []).length;
      const selfClosingTags = (xml.match(/<[^>]*\/>/g) || []).length;

      return openTags === closeTags + selfClosingTags;
    } catch (error) {
      return false;
    }
  }
}
