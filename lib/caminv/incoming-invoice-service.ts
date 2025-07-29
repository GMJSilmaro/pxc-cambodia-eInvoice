import { db } from '@/lib/db/drizzle';
import { eInvoices, invoiceLineItems, camInvAuditLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { camInvCoreService } from './core-service';
import { CamInvXMLValidator } from './xml-validator';
import { CamInvError, CamInvErrorCode, logger } from './error-handler';
import { parseStringPromise } from 'xml2js';
import type { EInvoice, NewEInvoice, NewInvoiceLineItem } from '@/lib/db/schema';

export interface IncomingInvoiceData {
  invoiceUuid: string;
  invoiceNumber: string;
  invoiceType: 'invoice' | 'credit_note' | 'debit_note';
  issueDate: Date;
  dueDate?: Date;
  currency: string;
  
  // Supplier Information
  supplierName: string;
  supplierTaxId: string;
  supplierEmail?: string;
  supplierAddress?: string;
  
  // Customer Information (this merchant)
  customerName: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerAddress?: string;
  
  // Totals
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  
  // UBL XML
  ublXml: string;
  
  // Line Items
  lineItems: Array<{
    lineNumber: number;
    itemName: string;
    itemDescription?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    taxRate: number;
    taxAmount: number;
  }>;
}

export interface InvoiceAcceptanceResult {
  success: boolean;
  error?: string;
}

export class CamInvIncomingInvoiceService {
  /**
   * Process incoming invoice from CamInv
   */
  async processIncomingInvoice(
    teamId: number,
    merchantId: number,
    invoiceData: IncomingInvoiceData
  ): Promise<EInvoice> {
    try {
      // Validate the UBL XML
      const validationResult = await CamInvXMLValidator.validateUBLXML(
        invoiceData.ublXml,
        invoiceData.invoiceType
      );

      if (!validationResult.isValid) {
        throw new CamInvError(
          CamInvErrorCode.XML_VALIDATION_FAILED,
          'Incoming invoice UBL XML failed validation',
          400,
          { validationErrors: validationResult.errors }
        );
      }

      // Check if invoice already exists
      const existingInvoice = await db
        .select()
        .from(eInvoices)
        .where(
          and(
            eq(eInvoices.teamId, teamId),
            eq(eInvoices.invoiceUuid, invoiceData.invoiceUuid)
          )
        )
        .limit(1);

      if (existingInvoice.length > 0) {
        logger.warn('Incoming invoice already exists', {
          invoiceUuid: invoiceData.invoiceUuid,
          existingId: existingInvoice[0].id
        });
        return existingInvoice[0];
      }

      // Create incoming invoice record
      const newInvoice: NewEInvoice = {
        teamId,
        merchantId,
        invoiceUuid: invoiceData.invoiceUuid,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceType: invoiceData.invoiceType,
        status: 'received',
        direction: 'incoming',
        customerName: invoiceData.supplierName, // Supplier becomes customer for incoming
        customerTaxId: invoiceData.supplierTaxId,
        customerEmail: invoiceData.supplierEmail,
        customerAddress: invoiceData.supplierAddress,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        currency: invoiceData.currency,
        subtotal: invoiceData.subtotal.toString(),
        taxAmount: invoiceData.taxAmount.toString(),
        totalAmount: invoiceData.totalAmount.toString(),
        ublXml: invoiceData.ublXml,
      };

      const [createdInvoice] = await db.insert(eInvoices).values(newInvoice).returning();

      // Create line items
      const lineItemRecords: NewInvoiceLineItem[] = invoiceData.lineItems.map(item => ({
        invoiceId: createdInvoice.id,
        lineNumber: item.lineNumber,
        itemName: item.itemName,
        itemDescription: item.itemDescription,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
        taxRate: item.taxRate.toString(),
        taxAmount: item.taxAmount.toString(),
      }));

      await db.insert(invoiceLineItems).values(lineItemRecords);

      // Log the receipt
      await this.logAuditEvent(
        teamId,
        undefined,
        'INVOICE_RECEIVED',
        'invoice',
        createdInvoice.id,
        { 
          invoiceNumber: invoiceData.invoiceNumber,
          supplierName: invoiceData.supplierName,
          totalAmount: invoiceData.totalAmount
        }
      );

      logger.info('Incoming invoice processed successfully', {
        invoiceId: createdInvoice.id,
        invoiceNumber: invoiceData.invoiceNumber,
        supplierName: invoiceData.supplierName,
        totalAmount: invoiceData.totalAmount
      });

      return createdInvoice;
    } catch (error) {
      logger.error('Failed to process incoming invoice', error);
      throw error instanceof CamInvError ? error : new CamInvError(
        CamInvErrorCode.DATABASE_ERROR,
        'Failed to process incoming invoice',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Accept an incoming invoice
   */
  async acceptInvoice(
    invoiceId: number,
    userId?: number
  ): Promise<InvoiceAcceptanceResult> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.direction !== 'incoming') {
        return { success: false, error: 'Can only accept incoming invoices' };
      }

      if (invoice.status === 'accepted') {
        return { success: false, error: 'Invoice has already been accepted' };
      }

      // Accept via CamInv
      const acceptResult = await camInvCoreService.acceptInvoice(
        invoice.merchantId,
        invoice.invoiceUuid,
        userId
      );

      if (acceptResult.success) {
        // Update invoice status
        await db
          .update(eInvoices)
          .set({
            status: 'accepted',
            acceptedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(eInvoices.id, invoiceId));

        // Log the acceptance
        await this.logAuditEvent(
          invoice.teamId,
          userId,
          'INVOICE_ACCEPTED',
          'invoice',
          invoiceId,
          { camInvResponse: acceptResult.data }
        );

        return { success: true };
      } else {
        return {
          success: false,
          error: acceptResult.error?.message || 'Failed to accept invoice'
        };
      }
    } catch (error) {
      logger.error('Failed to accept invoice', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reject an incoming invoice
   */
  async rejectInvoice(
    invoiceId: number,
    reason: string,
    userId?: number
  ): Promise<InvoiceAcceptanceResult> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.direction !== 'incoming') {
        return { success: false, error: 'Can only reject incoming invoices' };
      }

      if (invoice.status === 'rejected') {
        return { success: false, error: 'Invoice has already been rejected' };
      }

      // Reject via CamInv
      const rejectResult = await camInvCoreService.rejectInvoice(
        invoice.merchantId,
        invoice.invoiceUuid,
        reason,
        userId
      );

      if (rejectResult.success) {
        // Update invoice status
        await db
          .update(eInvoices)
          .set({
            status: 'rejected',
            rejectedAt: new Date(),
            rejectionReason: reason,
            updatedAt: new Date(),
          })
          .where(eq(eInvoices.id, invoiceId));

        // Log the rejection
        await this.logAuditEvent(
          invoice.teamId,
          userId,
          'INVOICE_REJECTED',
          'invoice',
          invoiceId,
          { reason, camInvResponse: rejectResult.data }
        );

        return { success: true };
      } else {
        return {
          success: false,
          error: rejectResult.error?.message || 'Failed to reject invoice'
        };
      }
    } catch (error) {
      logger.error('Failed to reject invoice', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Parse UBL XML to extract invoice data
   */
  async parseUBLXML(ublXml: string): Promise<Partial<IncomingInvoiceData>> {
    try {
      const parsed = await parseStringPromise(ublXml);
      
      // Extract data based on document type
      let rootElement: any;
      let documentType: 'invoice' | 'credit_note' | 'debit_note';
      
      if (parsed.Invoice) {
        rootElement = parsed.Invoice;
        documentType = 'invoice';
      } else if (parsed.CreditNote) {
        rootElement = parsed.CreditNote;
        documentType = 'credit_note';
      } else if (parsed.DebitNote) {
        rootElement = parsed.DebitNote;
        documentType = 'debit_note';
      } else {
        throw new Error('Unknown UBL document type');
      }

      // Extract basic invoice information
      const invoiceData: Partial<IncomingInvoiceData> = {
        invoiceNumber: this.extractValue(rootElement, 'cbc:ID'),
        invoiceType: documentType,
        issueDate: new Date(this.extractValue(rootElement, 'cbc:IssueDate')),
        currency: this.extractValue(rootElement, 'cbc:DocumentCurrencyCode'),
        ublXml,
      };

      // Extract due date if present
      const dueDate = this.extractValue(rootElement, 'cbc:DueDate');
      if (dueDate) {
        invoiceData.dueDate = new Date(dueDate);
      }

      // Extract supplier information
      const supplierParty = rootElement['cac:AccountingSupplierParty']?.[0]?.['cac:Party']?.[0];
      if (supplierParty) {
        invoiceData.supplierName = this.extractValue(supplierParty, 'cac:PartyName.cbc:Name') ||
                                   this.extractValue(supplierParty, 'cac:PartyLegalEntity.cbc:RegistrationName');
        invoiceData.supplierTaxId = this.extractValue(supplierParty, 'cac:PartyTaxScheme.cbc:CompanyID') ||
                                    this.extractValue(supplierParty, 'cac:PartyLegalEntity.cbc:CompanyID');
        invoiceData.supplierEmail = this.extractValue(supplierParty, 'cac:Contact.cbc:ElectronicMail');
      }

      // Extract customer information
      const customerParty = rootElement['cac:AccountingCustomerParty']?.[0]?.['cac:Party']?.[0];
      if (customerParty) {
        invoiceData.customerName = this.extractValue(customerParty, 'cac:PartyName.cbc:Name') ||
                                   this.extractValue(customerParty, 'cac:PartyLegalEntity.cbc:RegistrationName');
        invoiceData.customerTaxId = this.extractValue(customerParty, 'cac:PartyTaxScheme.cbc:CompanyID') ||
                                    this.extractValue(customerParty, 'cac:PartyLegalEntity.cbc:CompanyID');
        invoiceData.customerEmail = this.extractValue(customerParty, 'cac:Contact.cbc:ElectronicMail');
      }

      // Extract monetary totals
      const monetaryTotal = rootElement['cac:LegalMonetaryTotal']?.[0];
      if (monetaryTotal) {
        invoiceData.subtotal = parseFloat(this.extractValue(monetaryTotal, 'cbc:LineExtensionAmount') || '0');
        invoiceData.totalAmount = parseFloat(this.extractValue(monetaryTotal, 'cbc:PayableAmount') || '0');
      }

      const taxTotal = rootElement['cac:TaxTotal']?.[0];
      if (taxTotal) {
        invoiceData.taxAmount = parseFloat(this.extractValue(taxTotal, 'cbc:TaxAmount') || '0');
      }

      // Extract line items
      const lineItemsKey = documentType === 'invoice' ? 'cac:InvoiceLine' :
                          documentType === 'credit_note' ? 'cac:CreditNoteLine' : 'cac:DebitNoteLine';
      
      const lineItemsXml = rootElement[lineItemsKey] || [];
      invoiceData.lineItems = lineItemsXml.map((lineXml: any, index: number) => {
        const quantityKey = documentType === 'invoice' ? 'cbc:InvoicedQuantity' :
                           documentType === 'credit_note' ? 'cbc:CreditedQuantity' : 'cbc:DebitedQuantity';
        
        const quantity = parseFloat(this.extractValue(lineXml, quantityKey) || '0');
        const unitPrice = parseFloat(this.extractValue(lineXml, 'cac:Price.cbc:PriceAmount') || '0');
        const lineTotal = parseFloat(this.extractValue(lineXml, 'cbc:LineExtensionAmount') || '0');
        
        return {
          lineNumber: index + 1,
          itemName: this.extractValue(lineXml, 'cac:Item.cbc:Name') || '',
          itemDescription: this.extractValue(lineXml, 'cac:Item.cbc:Description'),
          quantity,
          unitPrice,
          lineTotal,
          taxRate: 0, // Extract from tax information if available
          taxAmount: 0, // Extract from tax information if available
        };
      });

      return invoiceData;
    } catch (error) {
      logger.error('Failed to parse UBL XML', error);
      throw new CamInvError(
        CamInvErrorCode.XML_VALIDATION_FAILED,
        'Failed to parse UBL XML',
        400,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Extract value from parsed XML object
   */
  private extractValue(obj: any, path: string): string | undefined {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current && current[part]) {
        current = current[part][0];
      } else {
        return undefined;
      }
    }
    
    return typeof current === 'string' ? current : current?._ || current;
  }

  /**
   * Get invoice by ID
   */
  private async getInvoiceById(invoiceId: number): Promise<EInvoice | null> {
    const invoices = await db
      .select()
      .from(eInvoices)
      .where(eq(eInvoices.id, invoiceId))
      .limit(1);

    return invoices.length > 0 ? invoices[0] : null;
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    teamId: number,
    userId: number | undefined,
    action: string,
    entityType: string,
    entityId: number,
    details?: any
  ): Promise<void> {
    try {
      await db.insert(camInvAuditLogs).values({
        teamId,
        userId,
        action,
        entityType,
        entityId,
        details,
      });
    } catch (error) {
      logger.error('Failed to log audit event', error);
    }
  }
}

// Export singleton instance
export const camInvIncomingInvoiceService = new CamInvIncomingInvoiceService();
