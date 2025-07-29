import { db } from '@/lib/db/drizzle';
import { eInvoices, camInvMerchants, auditLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export interface WebhookEvent {
  type: 'DOCUMENT.DELIVERED' | 'DOCUMENT.RECEIVED' | 'DOCUMENT.STATUS_UPDATED' | 'ENTITY.REVOKED';
  document_id?: string;
  endpoint_id?: string;
  status?: string;
  timestamp?: string;
}

export class CamInvWebhookService {
  /**
   * Process incoming webhook events from CamInv
   */
  async processWebhookEvent(event: WebhookEvent): Promise<{ success: boolean; message?: string }> {
    try {
      logger.info('Processing CamInv webhook event', {
        eventType: event.type,
        timestamp: event.timestamp
      });

      switch (event.type) {
        case 'DOCUMENT.DELIVERED':
          return await this.handleDocumentDelivered(event);

        case 'DOCUMENT.RECEIVED':
          return await this.handleDocumentReceived(event);

        case 'DOCUMENT.STATUS_UPDATED':
          return await this.handleDocumentStatusUpdated(event);

        case 'DOCUMENT.VALIDATED':
          return await this.handleDocumentValidated(event);

        case 'DOCUMENT.VALIDATION_FAILED':
          return await this.handleDocumentValidationFailed(event);

        case 'DOCUMENT.ACCEPTED':
          return await this.handleDocumentAccepted(event);

        case 'DOCUMENT.REJECTED':
          return await this.handleDocumentRejected(event);

        case 'ENTITY.REVOKED':
          return await this.handleEntityRevoked(event);

        default:
          logger.warn('Unknown webhook event type', { eventType: event.type });
          return { success: true, message: 'Unknown event type, ignored' };
      }
    } catch (error) {
      logger.error('Error processing webhook event', error, { event });
      return { success: false, message: 'Internal processing error' };
    }
  }

  /**
   * Handle document delivered to customer
   */
  private async handleDocumentDelivered(event: WebhookEvent): Promise<{ success: boolean; message?: string }> {
    const { document_id, endpoint_id } = event;

    if (!document_id) {
      return { success: false, message: 'Missing document_id' };
    }

    try {
      // Find the invoice by document ID
      const invoices = await db
        .select()
        .from(eInvoices)
        .where(eq(eInvoices.documentId, document_id))
        .limit(1);

      if (invoices.length === 0) {
        logger.warn('No invoice found for document delivery', { document_id });
        return { success: true, message: 'Invoice not found, possibly external document' };
      }

      const invoice = invoices[0];

      // Update invoice status to delivered
      await db
        .update(eInvoices)
        .set({
          status: 'sent',
          camInvStatus: 'delivered',
          sentAt: new Date(),
          camInvResponse: {
            ...invoice.camInvResponse,
            delivered_at: new Date().toISOString(),
            endpoint_id
          },
          updatedAt: new Date(),
        })
        .where(eq(eInvoices.id, invoice.id));

      // Log the status change
      await this.logWebhookEvent(
        invoice.teamId,
        'DOCUMENT_DELIVERED',
        'invoice',
        invoice.id,
        {
          document_id,
          endpoint_id,
          previous_status: invoice.status,
          new_status: 'sent'
        }
      );

      logger.info('Invoice delivery status updated', {
        invoiceId: invoice.id,
        documentId: document_id,
        endpoint_id,
        status: 'delivered'
      });

      return { success: true, message: 'Document delivery processed' };

    } catch (error) {
      logger.error('Error handling document delivery', error, { document_id });
      return { success: false, message: 'Database update failed' };
    }
  }

  /**
   * Handle document status updated by customer
   */
  private async handleDocumentStatusUpdated(event: WebhookEvent): Promise<{ success: boolean; message?: string }> {
    const { document_id, endpoint_id, status } = event;

    if (!document_id || !status) {
      return { success: false, message: 'Missing document_id or status' };
    }

    try {
      // Find the invoice by document ID
      const invoices = await db
        .select()
        .from(eInvoices)
        .where(eq(eInvoices.documentId, document_id))
        .limit(1);

      if (invoices.length === 0) {
        logger.warn('No invoice found for status update', { document_id });
        return { success: true, message: 'Invoice not found, possibly external document' };
      }

      const invoice = invoices[0];
      const previousStatus = invoice.status;

      // Map CamInv status to our internal status
      let internalStatus = invoice.status;
      let camInvStatus = status.toLowerCase();

      // Enhanced status mapping based on CamInv documentation
      switch (status.toUpperCase()) {
        case 'VALIDATED':
        case 'VALID':
          internalStatus = 'validated';
          break;
        case 'VALIDATION_FAILED':
        case 'INVALID':
          internalStatus = 'validation_failed';
          break;
        case 'ACCEPTED':
          internalStatus = 'accepted';
          break;
        case 'REJECTED':
          internalStatus = 'rejected';
          break;
        case 'PAID':
          internalStatus = 'paid';
          break;
        case 'PROCESSING':
        case 'PENDING':
          internalStatus = 'submitted'; // Keep as submitted while processing
          break;
        case 'DELIVERED':
          // Document was delivered to recipient, but keep current status
          // unless it's still in submitted state
          if (invoice.status === 'submitted') {
            internalStatus = 'sent';
          }
          break;
        case 'FAILED':
        case 'ERROR':
          internalStatus = 'failed';
          break;
        default:
          // Log unknown status for debugging
          logger.warn('Unknown CamInv status received', {
            status,
            invoiceId: invoice.id,
            documentId: document_id
          });
          // Keep current status for unknown statuses
          break;
      }

      // Update invoice status
      await db
        .update(eInvoices)
        .set({
          status: internalStatus,
          camInvStatus: camInvStatus,
          ...(status.toUpperCase() === 'VALIDATED' && { validatedAt: new Date() }),
          ...(status.toUpperCase() === 'ACCEPTED' && { acceptedAt: new Date() }),
          ...(status.toUpperCase() === 'REJECTED' && { rejectedAt: new Date() }),
          ...(status.toUpperCase() === 'DELIVERED' && invoice.status === 'submitted' && { sentAt: new Date() }),
          ...(internalStatus === 'validation_failed' && { rejectionReason: `Validation failed: ${status}` }),
          camInvResponse: {
            ...invoice.camInvResponse,
            status_updated_at: new Date().toISOString(),
            endpoint_id,
            latest_status: status,
            webhook_received_at: new Date().toISOString(),
            webhook_source: 'DOCUMENT_STATUS_UPDATED'
          },
          updatedAt: new Date(),
        })
        .where(eq(eInvoices.id, invoice.id));

      // Log the status change
      await this.logWebhookEvent(
        invoice.teamId,
        'DOCUMENT_STATUS_UPDATED',
        'invoice',
        invoice.id,
        {
          document_id,
          endpoint_id,
          previous_status: previousStatus,
          new_status: internalStatus,
          caminv_status: status
        }
      );

      logger.info('Invoice status updated by customer', {
        invoiceId: invoice.id,
        documentId: document_id,
        endpoint_id,
        previousStatus,
        newStatus: internalStatus,
        camInvStatus: status
      });

      return { success: true, message: 'Document status update processed' };

    } catch (error) {
      logger.error('Error handling document status update', error, { document_id, status });
      return { success: false, message: 'Database update failed' };
    }
  }

  /**
   * Handle incoming document notification
   */
  private async handleDocumentReceived(event: WebhookEvent): Promise<{ success: boolean; message?: string }> {
    const { document_id, endpoint_id } = event;

    if (!document_id) {
      return { success: false, message: 'Missing document_id' };
    }

    logger.info('Incoming document received', {
      document_id,
      endpoint_id
    });

    try {
      // Check if we already have this document
      const existingInvoices = await db
        .select()
        .from(eInvoices)
        .where(eq(eInvoices.documentId, document_id))
        .limit(1);

      if (existingInvoices.length > 0) {
        logger.info('Document already exists, skipping', { document_id });
        return { success: true, message: 'Document already processed' };
      }

      // TODO: Implement incoming invoice creation logic
      // This would involve:
      // 1. Fetching the document details from CamInv API
      // 2. Creating a new incoming invoice record
      // 3. Parsing the UBL XML content
      // 4. Storing sender information
      // 5. Notifying relevant users via email/push notifications
      // 6. Triggering any automated processing rules

      logger.info('Incoming document processing queued', { document_id, endpoint_id });

      return { success: true, message: 'Incoming document notification processed' };

    } catch (error) {
      logger.error('Error handling incoming document', error, { document_id });
      return { success: false, message: 'Processing error' };
    }
  }

  /**
   * Handle entity revocation (merchant disconnection)
   */
  private async handleEntityRevoked(event: WebhookEvent): Promise<{ success: boolean; message?: string }> {
    const { endpoint_id } = event;

    if (!endpoint_id) {
      return { success: false, message: 'Missing endpoint_id' };
    }

    try {
      // Find the merchant by endpoint_id
      const merchants = await db
        .select()
        .from(camInvMerchants)
        .where(eq(camInvMerchants.endpointId, endpoint_id))
        .limit(1);

      if (merchants.length === 0) {
        logger.warn('No merchant found for entity revocation', { endpoint_id });
        return { success: true, message: 'Merchant not found' };
      }

      const merchant = merchants[0];

      // Update merchant status to disconnected
      await db
        .update(camInvMerchants)
        .set({
          isActive: false,
          registrationStatus: 'revoked',
          updatedAt: new Date(),
        })
        .where(eq(camInvMerchants.id, merchant.id));

      // Log the revocation
      await this.logWebhookEvent(
        merchant.teamId,
        'ENTITY_REVOKED',
        'merchant',
        merchant.id,
        {
          endpoint_id,
          merchant_name: merchant.merchantName,
          revoked_at: new Date().toISOString()
        }
      );

      logger.info('Merchant revoked via webhook', {
        merchantId: merchant.id,
        endpointId: endpoint_id
      });

      return { success: true, message: 'Entity revocation processed' };

    } catch (error) {
      logger.error('Error handling entity revocation', error, { endpoint_id });
      return { success: false, message: 'Database update failed' };
    }
  }

  /**
   * Handle document validation success
   */
  private async handleDocumentValidated(event: WebhookEvent): Promise<{ success: boolean; message?: string }> {
    return await this.updateDocumentStatus(event, 'VALIDATED');
  }

  /**
   * Handle document validation failure
   */
  private async handleDocumentValidationFailed(event: WebhookEvent): Promise<{ success: boolean; message?: string }> {
    return await this.updateDocumentStatus(event, 'VALIDATION_FAILED');
  }

  /**
   * Handle document acceptance by recipient
   */
  private async handleDocumentAccepted(event: WebhookEvent): Promise<{ success: boolean; message?: string }> {
    return await this.updateDocumentStatus(event, 'ACCEPTED');
  }

  /**
   * Handle document rejection by recipient
   */
  private async handleDocumentRejected(event: WebhookEvent): Promise<{ success: boolean; message?: string }> {
    return await this.updateDocumentStatus(event, 'REJECTED');
  }

  /**
   * Generic method to update document status from webhook events
   */
  private async updateDocumentStatus(
    event: WebhookEvent,
    status: string
  ): Promise<{ success: boolean; message?: string }> {
    const { document_id, endpoint_id } = event;

    if (!document_id) {
      return { success: false, message: 'Missing document_id' };
    }

    try {
      // Find the invoice by document ID
      const invoices = await db
        .select()
        .from(eInvoices)
        .where(eq(eInvoices.documentId, document_id))
        .limit(1);

      if (invoices.length === 0) {
        logger.warn('No invoice found for document status update', { document_id, status });
        return { success: true, message: 'Invoice not found, possibly external document' };
      }

      const invoice = invoices[0];
      const previousStatus = invoice.status;

      // Map status using enhanced logic
      let internalStatus = invoice.status;
      let camInvStatus = status.toLowerCase();

      switch (status.toUpperCase()) {
        case 'VALIDATED':
        case 'VALID':
          internalStatus = 'validated';
          break;
        case 'VALIDATION_FAILED':
        case 'INVALID':
          internalStatus = 'validation_failed';
          break;
        case 'ACCEPTED':
          internalStatus = 'accepted';
          break;
        case 'REJECTED':
          internalStatus = 'rejected';
          break;
        default:
          logger.warn('Unknown status in updateDocumentStatus', { status, document_id });
          break;
      }

      // Update invoice status
      await db
        .update(eInvoices)
        .set({
          status: internalStatus,
          camInvStatus: camInvStatus,
          ...(status.toUpperCase() === 'VALIDATED' && { validatedAt: new Date() }),
          ...(status.toUpperCase() === 'ACCEPTED' && { acceptedAt: new Date() }),
          ...(status.toUpperCase() === 'REJECTED' && { rejectedAt: new Date() }),
          ...(internalStatus === 'validation_failed' && { rejectionReason: `Validation failed: ${status}` }),
          camInvResponse: {
            ...invoice.camInvResponse,
            status_updated_at: new Date().toISOString(),
            endpoint_id,
            latest_status: status,
            webhook_received_at: new Date().toISOString(),
            webhook_source: event.type
          },
          updatedAt: new Date(),
        })
        .where(eq(eInvoices.id, invoice.id));

      // Log the status change
      await this.logWebhookEvent(
        invoice.teamId,
        event.type,
        'invoice',
        invoice.id,
        {
          document_id,
          endpoint_id,
          previous_status: previousStatus,
          new_status: internalStatus,
          caminv_status: status
        }
      );

      logger.info('Document status updated via webhook', {
        invoiceId: invoice.id,
        documentId: document_id,
        endpoint_id,
        previousStatus,
        newStatus: internalStatus,
        camInvStatus: status,
        eventType: event.type
      });

      return { success: true, message: `Document status updated to ${status}` };

    } catch (error) {
      logger.error('Error updating document status', error, { document_id, status });
      return { success: false, message: 'Database update error' };
    }
  }

  /**
   * Log webhook events for audit trail
   */
  private async logWebhookEvent(
    teamId: number,
    action: string,
    resourceType: string,
    resourceId: number,
    metadata: any
  ): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        teamId,
        userId: null, // Webhook events don't have a specific user
        action,
        resourceType,
        resourceId,
        metadata,
        createdAt: new Date(),
      });
    } catch (error) {
      logger.error('Failed to log webhook event', error, {
        teamId,
        action,
        resourceType,
        resourceId
      });
    }
  }

  /**
   * Validate webhook signature (when CamInv provides signing)
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // TODO: Implement signature validation when CamInv provides webhook signing
    // This would typically involve HMAC-SHA256 verification

    if (!signature || !secret) {
      logger.warn('Webhook signature validation skipped - missing signature or secret');
      return true; // For now, accept all webhooks when signature is not provided
    }

    try {
      // When CamInv implements webhook signing, this would be something like:
      // const crypto = require('crypto');
      // const expectedSignature = crypto
      //   .createHmac('sha256', secret)
      //   .update(payload)
      //   .digest('hex');
      // return crypto.timingSafeEqual(
      //   Buffer.from(signature),
      //   Buffer.from(expectedSignature)
      // );

      logger.info('Webhook signature validation not yet implemented');
      return true;
    } catch (error) {
      logger.error('Error validating webhook signature', error);
      return false;
    }
  }

  /**
   * Check if webhook event is duplicate based on timestamp and content
   */
  async isDuplicateEvent(event: WebhookEvent): Promise<boolean> {
    try {
      // Simple duplicate detection based on event type, document_id, and timestamp
      // In a production system, you might want to store webhook event IDs
      const recentThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

      // For now, we'll just check if we've processed a similar event recently
      // This could be enhanced with a dedicated webhook events table
      return false;
    } catch (error) {
      logger.error('Error checking for duplicate webhook event', error);
      return false;
    }
  }

  /**
   * Get webhook processing statistics
   */
  async getWebhookStats(teamId?: number): Promise<{
    total: number;
    successful: number;
    failed: number;
    byType: Record<string, number>;
  }> {
    try {
      // This would require querying the webhook events audit log
      // For now, return placeholder data
      return {
        total: 0,
        successful: 0,
        failed: 0,
        byType: {}
      };
    } catch (error) {
      logger.error('Error getting webhook stats', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        byType: {}
      };
    }
  }
}

// Export singleton instance
export const camInvWebhookService = new CamInvWebhookService();
