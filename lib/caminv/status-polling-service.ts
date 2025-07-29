import { db } from '@/lib/db';
import { eInvoices, camInvMerchants } from '@/lib/db/schema';
import { eq, and, inArray, isNotNull, lt } from 'drizzle-orm';
import { camInvCoreService } from './core-service';
import { camInvInvoiceService } from './invoice-service';

interface PollingConfig {
  maxAge?: number; // Maximum age in minutes for documents to poll
  batchSize?: number; // Number of documents to process in each batch
  retryAttempts?: number; // Number of retry attempts for failed polls
  retryDelay?: number; // Delay between retries in milliseconds
}

interface PollingResult {
  success: boolean;
  processed: number;
  updated: number;
  failed: number;
  errors: Array<{
    invoiceId: number;
    documentId: string;
    error: string;
  }>;
}

export class StatusPollingService {
  private readonly defaultConfig: Required<PollingConfig> = {
    maxAge: 60, // 1 hour
    batchSize: 10,
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  };

  /**
   * Poll for document updates using official CamInv polling endpoint
   * This is the recommended approach according to CamInv documentation
   */
  async pollOfficialDocumentUpdates(
    merchantId: number,
    lastSyncedAt?: string
  ): Promise<PollingResult> {
    try {
      console.log(`[OFFICIAL POLLING] Starting official CamInv polling for merchant ${merchantId}`);

      const result = await camInvCoreService.pollDocumentUpdates(merchantId, lastSyncedAt);

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to poll document updates');
      }

      const documents = result.data?.documents || [];
      console.log(`[OFFICIAL POLLING] Found ${documents.length} updated documents`);

      const pollingResult: PollingResult = {
        success: true,
        processed: 0,
        updated: 0,
        failed: 0,
        errors: []
      };

      // Process each updated document
      for (const doc of documents) {
        try {
          // Get detailed document information
          const detailResult = await camInvCoreService.getDocumentById(merchantId, doc.document_id);

          if (detailResult.success) {
            // Update local database with the document details
            await this.updateLocalDocumentFromPolling(doc, detailResult.data);
            pollingResult.processed++;
            pollingResult.updated++;
          } else {
            pollingResult.failed++;
            pollingResult.errors.push({
              invoiceId: 0,
              documentId: doc.document_id,
              error: detailResult.error?.message || 'Failed to get document details'
            });
          }
        } catch (error) {
          pollingResult.failed++;
          pollingResult.errors.push({
            invoiceId: 0,
            documentId: doc.document_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`[OFFICIAL POLLING] Completed: ${pollingResult.processed} processed, ${pollingResult.updated} updated, ${pollingResult.failed} failed`);

      return pollingResult;
    } catch (error) {
      console.error('[OFFICIAL POLLING] Service error:', error);
      return {
        success: false,
        processed: 0,
        updated: 0,
        failed: 0,
        errors: [{
          invoiceId: 0,
          documentId: '',
          error: error instanceof Error ? error.message : 'Official polling service error'
        }]
      };
    }
  }

  /**
   * Update local document from official polling result
   */
  private async updateLocalDocumentFromPolling(
    polledDoc: { document_id: string; updated_at: string; type: 'SEND' | 'RECEIVE' },
    documentDetails: any
  ): Promise<void> {
    try {
      // Find the invoice by document ID
      const invoices = await db
        .select()
        .from(eInvoices)
        .where(eq(eInvoices.documentId, polledDoc.document_id))
        .limit(1);

      if (invoices.length === 0) {
        console.log(`[OFFICIAL POLLING] No local invoice found for document ${polledDoc.document_id}`);
        return;
      }

      const invoice = invoices[0];
      const camInvStatus = documentDetails.status?.toLowerCase();
      let internalStatus = invoice.status;

      // Map CamInv status to internal status
      if (camInvStatus === 'validated' || camInvStatus === 'valid') {
        internalStatus = 'validated';
      } else if (camInvStatus === 'validation_failed' || camInvStatus === 'invalid') {
        internalStatus = 'validation_failed';
      } else if (camInvStatus === 'rejected') {
        internalStatus = 'rejected';
      } else if (camInvStatus === 'accepted') {
        internalStatus = 'accepted';
      } else if (camInvStatus === 'processing' || camInvStatus === 'pending') {
        internalStatus = 'submitted';
      }

      // Update the invoice
      await db
        .update(eInvoices)
        .set({
          status: internalStatus,
          camInvStatus: camInvStatus,
          camInvResponse: {
            ...invoice.camInvResponse,
            latest_status_check: new Date().toISOString(),
            status_updated_at: polledDoc.updated_at,
            document_details: documentDetails,
            polling_source: 'official_polling'
          },
          ...(internalStatus === 'validated' && { validatedAt: new Date() }),
          ...(internalStatus === 'accepted' && { acceptedAt: new Date() }),
          ...(internalStatus === 'rejected' && { rejectedAt: new Date() }),
          updatedAt: new Date(),
        })
        .where(eq(eInvoices.id, invoice.id));

      console.log(`[OFFICIAL POLLING] Updated invoice ${invoice.id}: ${invoice.status} -> ${internalStatus} (CamInv: ${camInvStatus})`);
    } catch (error) {
      console.error('[OFFICIAL POLLING] Error updating local document:', error);
      throw error;
    }
  }

  /**
   * Poll status for all processing invoices
   */
  async pollProcessingInvoices(config: PollingConfig = {}): Promise<PollingResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Get invoices that need status polling
      const invoicesToPoll = await this.getInvoicesNeedingStatusPoll(finalConfig.maxAge, finalConfig.batchSize);
      
      if (invoicesToPoll.length === 0) {
        return {
          success: true,
          processed: 0,
          updated: 0,
          failed: 0,
          errors: []
        };
      }

      console.log(`[STATUS POLLING] Found ${invoicesToPoll.length} invoices to poll`);

      const result: PollingResult = {
        success: true,
        processed: 0,
        updated: 0,
        failed: 0,
        errors: []
      };

      // Process invoices in batches
      for (const invoice of invoicesToPoll) {
        try {
          const pollResult = await this.pollInvoiceStatus(
            invoice.id,
            invoice.documentId!,
            invoice.merchantId!,
            finalConfig.retryAttempts,
            finalConfig.retryDelay
          );

          result.processed++;
          
          if (pollResult.updated) {
            result.updated++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            invoiceId: invoice.id,
            documentId: invoice.documentId!,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          console.error(`[STATUS POLLING] Failed to poll invoice ${invoice.id}:`, error);
        }
      }

      console.log(`[STATUS POLLING] Completed: ${result.processed} processed, ${result.updated} updated, ${result.failed} failed`);
      
      return result;
    } catch (error) {
      console.error('[STATUS POLLING] Service error:', error);
      return {
        success: false,
        processed: 0,
        updated: 0,
        failed: 0,
        errors: [{
          invoiceId: 0,
          documentId: '',
          error: error instanceof Error ? error.message : 'Service error'
        }]
      };
    }
  }

  /**
   * Poll status for a specific invoice
   */
  async pollInvoiceStatus(
    invoiceId: number,
    documentId: string,
    merchantId: number,
    retryAttempts: number = 3,
    retryDelay: number = 1000
  ): Promise<{ updated: boolean; status?: string }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Get document status from CamInv
        const result = await camInvCoreService.getDocumentById(merchantId, documentId);
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to get document status');
        }

        const document = result.data;
        const camInvStatus = document.status?.toLowerCase();

        // Get current invoice data
        const invoices = await db
          .select()
          .from(eInvoices)
          .where(eq(eInvoices.id, invoiceId))
          .limit(1);

        if (invoices.length === 0) {
          throw new Error('Invoice not found');
        }

        const invoice = invoices[0];
        
        // Check if status has changed
        const currentCamInvStatus = invoice.camInvStatus?.toLowerCase();
        if (camInvStatus === currentCamInvStatus) {
          // No change, but update last check time
          await db
            .update(eInvoices)
            .set({
              camInvResponse: {
                ...invoice.camInvResponse,
                latest_status_check: new Date().toISOString(),
                document_details: document
              },
              updatedAt: new Date(),
            })
            .where(eq(eInvoices.id, invoiceId));

          return { updated: false, status: camInvStatus };
        }

        // Status has changed, update the invoice
        let internalStatus = invoice.status;
        
        // Map CamInv status to internal status
        if (camInvStatus === 'validated' || camInvStatus === 'valid') {
          internalStatus = 'validated';
        } else if (camInvStatus === 'validation_failed' || camInvStatus === 'invalid') {
          internalStatus = 'validation_failed';
        } else if (camInvStatus === 'rejected') {
          internalStatus = 'rejected';
        } else if (camInvStatus === 'accepted') {
          internalStatus = 'accepted';
        } else if (camInvStatus === 'processing' || camInvStatus === 'pending') {
          internalStatus = 'submitted'; // Keep as submitted while processing
        }

        await db
          .update(eInvoices)
          .set({
            status: internalStatus,
            camInvStatus: camInvStatus,
            camInvResponse: {
              ...invoice.camInvResponse,
              latest_status_check: new Date().toISOString(),
              status_updated_at: new Date().toISOString(),
              document_details: document,
              polling_source: 'automatic'
            },
            ...(internalStatus === 'validated' && { validatedAt: new Date() }),
            ...(internalStatus === 'accepted' && { acceptedAt: new Date() }),
            ...(internalStatus === 'rejected' && { rejectedAt: new Date() }),
            updatedAt: new Date(),
          })
          .where(eq(eInvoices.id, invoiceId));

        // Log the status update
        await camInvInvoiceService.logAuditEvent(
          invoice.teamId,
          null, // System user
          'INVOICE_STATUS_POLLED',
          'invoice',
          invoiceId,
          {
            documentId,
            previousStatus: invoice.status,
            newStatus: internalStatus,
            camInvStatus: camInvStatus,
            source: 'automatic_polling',
            attempt
          }
        );

        console.log(`[STATUS POLLING] Updated invoice ${invoiceId}: ${invoice.status} -> ${internalStatus} (CamInv: ${camInvStatus})`);
        
        return { updated: true, status: camInvStatus };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retryAttempts) {
          console.warn(`[STATUS POLLING] Attempt ${attempt} failed for invoice ${invoiceId}, retrying in ${retryDelay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Get invoices that need status polling
   */
  private async getInvoicesNeedingStatusPoll(maxAgeMinutes: number, limit: number) {
    const maxAge = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    // Get invoices that are in processing state and have document IDs
    const invoices = await db
      .select({
        id: eInvoices.id,
        documentId: eInvoices.documentId,
        merchantId: eInvoices.merchantId,
        status: eInvoices.status,
        camInvStatus: eInvoices.camInvStatus,
        submittedAt: eInvoices.submittedAt,
        updatedAt: eInvoices.updatedAt,
        teamId: eInvoices.teamId,
      })
      .from(eInvoices)
      .innerJoin(camInvMerchants, eq(eInvoices.merchantId, camInvMerchants.id))
      .where(
        and(
          // Has document ID (submitted to CamInv)
          isNotNull(eInvoices.documentId),
          // Merchant is active
          eq(camInvMerchants.isActive, true),
          // Status indicates processing
          inArray(eInvoices.status, ['submitted']),
          // CamInv status indicates processing (or null/undefined)
          // Updated recently enough to be worth polling
          lt(eInvoices.updatedAt, maxAge)
        )
      )
      .limit(limit);

    // Filter by CamInv status if available
    return invoices.filter(invoice => {
      const camInvStatus = invoice.camInvStatus?.toLowerCase();
      const processingStatuses = ['processing', 'pending', 'submitted', null, undefined];
      return !camInvStatus || processingStatuses.includes(camInvStatus);
    });
  }

  /**
   * Poll status for invoices of a specific team
   */
  async pollTeamInvoices(teamId: number, config: PollingConfig = {}): Promise<PollingResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Get team's processing invoices
      const invoices = await db
        .select({
          id: eInvoices.id,
          documentId: eInvoices.documentId,
          merchantId: eInvoices.merchantId,
          status: eInvoices.status,
          camInvStatus: eInvoices.camInvStatus,
        })
        .from(eInvoices)
        .innerJoin(camInvMerchants, eq(eInvoices.merchantId, camInvMerchants.id))
        .where(
          and(
            eq(eInvoices.teamId, teamId),
            isNotNull(eInvoices.documentId),
            eq(camInvMerchants.isActive, true),
            inArray(eInvoices.status, ['submitted'])
          )
        )
        .limit(finalConfig.batchSize);

      const result: PollingResult = {
        success: true,
        processed: 0,
        updated: 0,
        failed: 0,
        errors: []
      };

      for (const invoice of invoices) {
        try {
          const pollResult = await this.pollInvoiceStatus(
            invoice.id,
            invoice.documentId!,
            invoice.merchantId!,
            finalConfig.retryAttempts,
            finalConfig.retryDelay
          );

          result.processed++;
          
          if (pollResult.updated) {
            result.updated++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            invoiceId: invoice.id,
            documentId: invoice.documentId!,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return result;
    } catch (error) {
      console.error('[STATUS POLLING] Team polling error:', error);
      return {
        success: false,
        processed: 0,
        updated: 0,
        failed: 0,
        errors: [{
          invoiceId: 0,
          documentId: '',
          error: error instanceof Error ? error.message : 'Team polling error'
        }]
      };
    }
  }
}

export const statusPollingService = new StatusPollingService();
