import { db } from '@/lib/db/drizzle';
import { eInvoices, invoiceLineItems, camInvAuditLogs, camInvMerchants, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { UBLGenerator, type UBLInvoiceData } from './ubl-generator';
import { CamInvXMLValidator } from './xml-validator';
import { camInvCoreService } from './core-service';
import { CamInvError, CamInvErrorCode, logger } from './error-handler';
import { v4 as uuidv4 } from 'uuid';
import type { EInvoice, NewEInvoice, InvoiceLineItem, NewInvoiceLineItem, CamInvMerchant } from '@/lib/db/schema';

export interface CreateInvoiceRequest {
  merchantId: number;
  invoiceNumber: string;
  invoiceType: 'invoice' | 'credit_note' | 'debit_note';
  issueDate: Date;
  dueDate?: Date;
  currency: string;
  
  // Customer Information
  customerName: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerAddress?: string;
  
  // Line Items
  lineItems: Array<{
    itemName: string;
    itemDescription?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
  
  // Reference for credit/debit notes
  originalInvoiceId?: number;
}

export interface InvoiceSubmissionResult {
  success: boolean;
  invoice?: EInvoice;
  camInvResponse?: any;
  error?: string;
}

export interface InvoiceStatusUpdate {
  status: string;
  camInvStatus?: string;
  camInvResponse?: any;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export class CamInvInvoiceService {
  /**
   * Create a new e-invoice
   */
  async createInvoice(
    teamId: number,
    request: CreateInvoiceRequest,
    userId?: number
  ): Promise<EInvoice> {
    try {
      // Get user information for createdBy field
      let createdByValue = 'MANUAL';
      if (userId) {
        const userResult = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (userResult.length > 0) {
          const user = userResult[0];
          createdByValue = user.name || user.email || 'MANUAL';
        }
      }

      // Calculate totals
      const lineItemsWithTotals = request.lineItems.map((item, index) => {
        const lineTotal = item.quantity * item.unitPrice;
        const taxAmount = lineTotal * (item.taxRate / 100);

        return {
          lineNumber: index + 1,
          itemName: item.itemName,
          itemDescription: item.itemDescription,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal,
          taxRate: item.taxRate,
          taxAmount,
        };
      });

      const subtotal = lineItemsWithTotals.reduce((sum, item) => sum + item.lineTotal, 0);
      const totalTaxAmount = lineItemsWithTotals.reduce((sum, item) => sum + item.taxAmount, 0);
      const totalAmount = subtotal + totalTaxAmount;

      // Create invoice record
      const newInvoice: NewEInvoice = {
        teamId,
        merchantId: request.merchantId,
        invoiceUuid: uuidv4(),
        invoiceNumber: request.invoiceNumber,
        invoiceType: request.invoiceType,
        status: 'draft',
        direction: 'outgoing',
        supplierName: 'Merchant Name', // This should come from merchant data
        customerName: request.customerName,
        customerTaxId: request.customerTaxId,
        customerEmail: request.customerEmail,
        customerAddress: request.customerAddress,
        issueDate: request.issueDate,
        dueDate: request.dueDate,
        currency: request.currency,
        subtotal: subtotal.toString(),
        taxAmount: totalTaxAmount.toString(),
        totalAmount: totalAmount.toString(),
        originalInvoiceId: request.originalInvoiceId,
        createdBy: createdByValue,
      };

      const [createdInvoice] = await db.insert(eInvoices).values(newInvoice).returning();

      // Create line items
      const lineItemRecords: NewInvoiceLineItem[] = lineItemsWithTotals.map(item => ({
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

      // Log the creation
      await this.logAuditEvent(
        teamId,
        userId,
        'INVOICE_CREATED',
        'invoice',
        createdInvoice.id,
        { invoiceNumber: request.invoiceNumber, invoiceType: request.invoiceType }
      );

      logger.info('Invoice created successfully', {
        invoiceId: createdInvoice.id,
        invoiceNumber: request.invoiceNumber,
        totalAmount
      });

      return createdInvoice;
    } catch (error) {
      logger.error('Failed to create invoice', error);
      throw new CamInvError(
        CamInvErrorCode.DATABASE_ERROR,
        'Failed to create invoice',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Generate UBL XML for an invoice
   */
  async generateUBLXML(invoiceId: number): Promise<string> {
    try {
      const invoice = await this.getInvoiceWithLineItems(invoiceId);

      if (!invoice) {
        throw new CamInvError(
          CamInvErrorCode.INVOICE_NOT_FOUND,
          'Invoice not found',
          404,
          { invoiceId }
        );
      }

      // Get merchant data
      const merchant = await db
        .select()
        .from(camInvMerchants)
        .where(eq(camInvMerchants.id, invoice.invoice.merchantId))
        .limit(1);

      if (merchant.length === 0) {
        throw new CamInvError(
          CamInvErrorCode.MERCHANT_NOT_FOUND,
          'Merchant not found',
          404,
          { merchantId: invoice.invoice.merchantId }
        );
      }

      // Generate UBL XML with merchant data
      const ublXml = UBLGenerator.generateFromInvoiceRecord(
        invoice.invoice,
        invoice.lineItems,
        merchant[0]
      );

      // Debug: Log the generated XML
      console.log('Generated UBL XML (first 2000 chars):', ublXml.substring(0, 2000));

      // Validate the generated XML
      const validationResult = await CamInvXMLValidator.validateUBLXML(
        ublXml,
        invoice.invoice.invoiceType as 'invoice' | 'credit_note' | 'debit_note'
      );

      if (!validationResult.isValid) {
        // Log detailed validation errors and XML snippet for debugging
        console.error('UBL XML validation failed:', {
          invoiceId,
          errors: validationResult.errors.map(err => ({
            code: err.code,
            message: err.message,
            severity: err.severity,
            line: err.line,
            column: err.column
          })),
          warnings: validationResult.warnings.map(warn => ({
            code: warn.code,
            message: warn.message,
            line: warn.line,
            column: warn.column
          })),
          xmlSnippet: ublXml.substring(0, 2000) + '...' // First 2000 chars for debugging
        });

        logger.error('UBL XML validation failed', {
          invoiceId,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });
        throw new CamInvError(
          CamInvErrorCode.XML_VALIDATION_FAILED,
          'Generated UBL XML failed validation',
          400,
          { validationErrors: validationResult.errors }
        );
      }

      // Update invoice with generated XML
      await db
        .update(eInvoices)
        .set({
          ublXml,
          updatedAt: new Date(),
        })
        .where(eq(eInvoices.id, invoiceId));

      logger.info('UBL XML generated successfully', { invoiceId });

      return ublXml;
    } catch (error) {
      logger.error('Failed to generate UBL XML', error);
      throw error instanceof CamInvError ? error : new CamInvError(
        CamInvErrorCode.XML_GENERATION_FAILED,
        'Failed to generate UBL XML',
        500,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Submit invoice to CamInv
   */
  async submitInvoice(
    invoiceId: number,
    userId?: number
  ): Promise<InvoiceSubmissionResult> {
    try {
      const invoice = await this.getInvoiceWithLineItems(invoiceId);
      
      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found'
        };
      }

      if (invoice.invoice.status !== 'draft') {
        return {
          success: false,
          error: 'Invoice has already been submitted'
        };
      }

      // Generate UBL XML if not already generated
      let ublXml = invoice.invoice.ublXml;
      if (!ublXml) {
        ublXml = await this.generateUBLXML(invoiceId);
      }

      // Submit to CamInv using new document submission format
      const documentType = invoice.invoice.invoiceType === 'invoice' ? 'INVOICE' :
                          invoice.invoice.invoiceType === 'credit_note' ? 'CREDIT_NOTE' : 'DEBIT_NOTE';

      const submissionResult = await camInvCoreService.submitDocuments(
        invoice.invoice.merchantId,
        [{
          documentType,
          ublXml,
          invoiceId,
          invoiceNumber: invoice.invoice.invoiceNumber,
        }],
        userId
      );

      if (submissionResult.success && submissionResult.data) {
        // Handle CamInv document submission response
        const response = submissionResult.data;
        let documentId: string | undefined;
        let verificationLink: string | undefined;

        // Check if document was successfully submitted
        if (response.valid_documents && response.valid_documents.length > 0) {
          const validDoc = response.valid_documents[0];
          documentId = validDoc.document_id;
          verificationLink = validDoc.verification_link;
        }

        // Update invoice status
        await db
          .update(eInvoices)
          .set({
            status: documentId ? 'submitted' : 'failed',
            camInvStatus: documentId ? 'submitted' : 'failed',
            camInvResponse: response,
            documentId,
            verificationLink,
            submittedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(eInvoices.id, invoiceId));

        // Log the submission
        await this.logAuditEvent(
          invoice.invoice.teamId,
          userId,
          'INVOICE_SUBMITTED',
          'invoice',
          invoiceId,
          { camInvResponse: submissionResult.data }
        );

        return {
          success: true,
          invoice: invoice.invoice,
          camInvResponse: submissionResult.data
        };
      } else {
        return {
          success: false,
          error: submissionResult.error?.message || 'Submission failed'
        };
      }
    } catch (error) {
      logger.error('Failed to submit invoice', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send invoice to customer using CamInv Send Document API
   */
  async sendInvoice(
    invoiceId: number,
    customerEmail: string,
    userId?: number
  ): Promise<{ success: boolean; error?: string; camInvResponse?: any }> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status !== 'submitted') {
        return { success: false, error: 'Invoice must be submitted before sending' };
      }

      if (!invoice.documentId) {
        return { success: false, error: 'Invoice document ID not found. Please resubmit the invoice.' };
      }

      // Use CamInv core service to send the document
      const sendResult = await camInvCoreService.sendDocument(
        invoice.merchantId,
        invoice.documentId,
        customerEmail,
        userId
      );

      if (sendResult.success) {
        // Update invoice status to sent
        await db
          .update(eInvoices)
          .set({
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(eInvoices.id, invoiceId));

        // Log the operation
        await this.logAuditEvent(
          invoice.teamId,
          userId,
          'INVOICE_SENT',
          'invoice',
          invoiceId,
          {
            customerEmail,
            documentId: invoice.documentId,
            camInvResponse: sendResult.data
          }
        );

        return {
          success: true,
          camInvResponse: sendResult.data
        };
      } else {
        return {
          success: false,
          error: sendResult.error?.message || 'Failed to send invoice via CamInv'
        };
      }
    } catch (error) {
      logger.error('Failed to send invoice', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: number): Promise<EInvoice | null> {
    const invoices = await db
      .select()
      .from(eInvoices)
      .where(eq(eInvoices.id, invoiceId))
      .limit(1);

    return invoices.length > 0 ? invoices[0] : null;
  }

  /**
   * Update an existing invoice (only drafts can be updated)
   */
  async updateInvoice(
    invoiceId: number,
    updateData: {
      merchantId?: number;
      invoiceNumber?: string;
      invoiceType?: string;
      customerName?: string;
      customerEmail?: string | null;
      customerTaxId?: string | null;
      customerAddress?: string | null;
      issueDate?: Date;
      dueDate?: Date | null;
      currency?: string;
      subtotal?: number;
      taxAmount?: number;
      totalAmount?: number;
      notes?: string | null;
    },
    lineItems?: Array<{
      id?: string;
      itemName: string;
      itemDescription?: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      lineTotal?: number;
    }>
  ): Promise<EInvoice> {
    try {
      // Check if invoice exists and is editable
      const existingInvoice = await this.getInvoiceById(invoiceId);
      if (!existingInvoice) {
        throw new CamInvError(CamInvErrorCode.INVOICE_NOT_FOUND, 'Invoice not found');
      }

      if (existingInvoice.status !== 'draft') {
        throw new CamInvError(CamInvErrorCode.INVALID_OPERATION, 'Only draft invoices can be edited');
      }

      // Update the invoice
      const updateFields: any = {
        updatedAt: new Date(),
      };

      // Convert numeric fields to strings as required by the schema
      if (updateData.merchantId !== undefined) updateFields.merchantId = updateData.merchantId;
      if (updateData.invoiceNumber !== undefined) updateFields.invoiceNumber = updateData.invoiceNumber;
      if (updateData.invoiceType !== undefined) updateFields.invoiceType = updateData.invoiceType;
      if (updateData.customerName !== undefined) updateFields.customerName = updateData.customerName;
      if (updateData.customerEmail !== undefined) updateFields.customerEmail = updateData.customerEmail;
      if (updateData.customerTaxId !== undefined) updateFields.customerTaxId = updateData.customerTaxId;
      if (updateData.customerAddress !== undefined) updateFields.customerAddress = updateData.customerAddress;
      if (updateData.issueDate !== undefined) updateFields.issueDate = updateData.issueDate;
      if (updateData.dueDate !== undefined) updateFields.dueDate = updateData.dueDate;
      if (updateData.currency !== undefined) updateFields.currency = updateData.currency;
      if (updateData.subtotal !== undefined) updateFields.subtotal = updateData.subtotal.toString();
      if (updateData.taxAmount !== undefined) updateFields.taxAmount = updateData.taxAmount.toString();
      if (updateData.totalAmount !== undefined) updateFields.totalAmount = updateData.totalAmount.toString();
      if (updateData.notes !== undefined) updateFields.notes = updateData.notes;

      const updatedInvoices = await db
        .update(eInvoices)
        .set(updateFields)
        .where(eq(eInvoices.id, invoiceId))
        .returning();

      if (updatedInvoices.length === 0) {
        throw new CamInvError(CamInvErrorCode.DATABASE_ERROR, 'Failed to update invoice');
      }

      const updatedInvoice = updatedInvoices[0];

      // Update line items if provided
      if (lineItems && lineItems.length > 0) {
        // Delete existing line items
        await db
          .delete(invoiceLineItems)
          .where(eq(invoiceLineItems.invoiceId, invoiceId));

        // Insert new line items
        const newLineItems: NewInvoiceLineItem[] = lineItems.map((item, index) => ({
          invoiceId,
          lineNumber: index + 1,
          itemName: item.itemName,
          itemDescription: item.itemDescription || null,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          lineTotal: (item.lineTotal || item.quantity * item.unitPrice).toString(),
          taxRate: item.taxRate.toString(),
          taxAmount: ((item.lineTotal || item.quantity * item.unitPrice) * item.taxRate / 100).toString(),
        }));

        await db.insert(invoiceLineItems).values(newLineItems);
      }

      logger.info('Invoice updated successfully', {
        invoiceId,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
      });

      return updatedInvoice;

    } catch (error) {
      if (error instanceof CamInvError) {
        throw error;
      }

      logger.error('Failed to update invoice', {
        invoiceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new CamInvError(
        CamInvErrorCode.DATABASE_ERROR,
        'Failed to update invoice'
      );
    }
  }

  /**
   * Get invoice with line items
   */
  async getInvoiceWithLineItems(invoiceId: number): Promise<{
    invoice: EInvoice;
    lineItems: InvoiceLineItem[];
  } | null> {
    const invoice = await this.getInvoiceById(invoiceId);
    
    if (!invoice) {
      return null;
    }

    const lineItems = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId))
      .orderBy(invoiceLineItems.lineNumber);

    return { invoice, lineItems };
  }

  /**
   * Get invoices for a team
   */
  async getInvoicesForTeam(
    teamId: number,
    options?: {
      status?: string;
      direction?: 'outgoing' | 'incoming';
      limit?: number;
      offset?: number;
    }
  ): Promise<EInvoice[]> {
    // Build where conditions
    const conditions = [eq(eInvoices.teamId, teamId)];

    if (options?.status) {
      conditions.push(eq(eInvoices.status, options.status));
    }

    if (options?.direction) {
      conditions.push(eq(eInvoices.direction, options.direction));
    }

    const queryBuilder = db
      .select()
      .from(eInvoices)
      .where(and(...conditions))
      .orderBy(desc(eInvoices.createdAt));

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options?.offset) {
      queryBuilder.offset(options.offset);
    }

    return await queryBuilder;
  }

  /**
   * Get submitted invoices for billing reference (credit/debit notes)
   */
  async getSubmittedInvoicesForReference(teamId: number, merchantId?: number): Promise<EInvoice[]> {
    try {
      let query = db
        .select()
        .from(eInvoices)
        .where(
          and(
            eq(eInvoices.teamId, teamId),
            eq(eInvoices.direction, 'outgoing'),
            eq(eInvoices.invoiceType, 'invoice'), // Only regular invoices can be referenced
            eq(eInvoices.status, 'submitted') // Only submitted invoices
          )
        )
        .orderBy(desc(eInvoices.issueDate));

      if (merchantId) {
        query = query.where(
          and(
            eq(eInvoices.teamId, teamId),
            eq(eInvoices.merchantId, merchantId),
            eq(eInvoices.direction, 'outgoing'),
            eq(eInvoices.invoiceType, 'invoice'),
            eq(eInvoices.status, 'submitted')
          )
        );
      }

      return await query;
    } catch (error) {
      logger.error('Error fetching submitted invoices for reference', { teamId, merchantId, error });
      throw new CamInvError(
        CamInvErrorCode.DATABASE_ERROR,
        'Failed to fetch submitted invoices for reference',
        500,
        { teamId, merchantId }
      );
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    invoiceId: number,
    statusUpdate: InvoiceStatusUpdate,
    userId?: number
  ): Promise<boolean> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return false;
      }

      await db
        .update(eInvoices)
        .set({
          status: statusUpdate.status,
          camInvStatus: statusUpdate.camInvStatus,
          camInvResponse: statusUpdate.camInvResponse,
          acceptedAt: statusUpdate.acceptedAt,
          rejectedAt: statusUpdate.rejectedAt,
          rejectionReason: statusUpdate.rejectionReason,
          updatedAt: new Date(),
        })
        .where(eq(eInvoices.id, invoiceId));

      // Log the status update
      await this.logAuditEvent(
        invoice.teamId,
        userId,
        'INVOICE_STATUS_UPDATED',
        'invoice',
        invoiceId,
        statusUpdate
      );

      return true;
    } catch (error) {
      logger.error('Failed to update invoice status', error);
      return false;
    }
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
export const camInvInvoiceService = new CamInvInvoiceService();
