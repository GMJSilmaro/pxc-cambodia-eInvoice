import { camInvApiClient } from './api-client';
import { camInvMerchantService } from './merchant-service';
import { CamInvError, CamInvErrorCode, CamInvErrorHandler, logger } from './error-handler';
import { db } from '@/lib/db/drizzle';
import { camInvAuditLogs } from '@/lib/db/schema';
import type { CamInvMerchant } from '@/lib/db/schema';

export interface CamInvServiceConfig {
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: CamInvError;
}

export class CamInvCoreService {
  private config: CamInvServiceConfig;

  constructor(config: Partial<CamInvServiceConfig> = {}) {
    this.config = {
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: true,
      ...config,
    };
  }

  /**
   * Execute an operation with error handling and logging
   */
  private async executeOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: any
  ): Promise<ServiceResult<T>> {
    const startTime = Date.now();
    
    try {
      if (this.config.enableLogging) {
        logger.info(`Starting operation: ${operationName}`, context);
      }

      let result: T;
      
      if (this.config.enableRetry) {
        result = await CamInvErrorHandler.withRetry(
          operation,
          this.config.maxRetries,
          this.config.retryDelay
        );
      } else {
        result = await operation();
      }

      const duration = Date.now() - startTime;
      
      if (this.config.enableLogging) {
        logger.info(`Operation completed: ${operationName}`, { 
          duration, 
          success: true,
          context 
        });
      }

      return { success: true, data: result };
    } catch (error) {
      const duration = Date.now() - startTime;
      const camInvError = CamInvErrorHandler.handleApiError(error, operationName);
      
      if (this.config.enableLogging) {
        logger.error(`Operation failed: ${operationName}`, {
          duration,
          error: camInvError,
          context
        });
      }

      return { success: false, error: camInvError };
    }
  }

  /**
   * Get valid merchant and access token
   */
  private async getMerchantWithToken(merchantId: number): Promise<{
    merchant: CamInvMerchant;
    accessToken: string;
  }> {
    const merchant = await camInvMerchantService.getMerchantById(merchantId);
    
    if (!merchant) {
      throw new CamInvError(
        CamInvErrorCode.MERCHANT_NOT_FOUND,
        'Merchant not found',
        404,
        { merchantId }
      );
    }

    if (!merchant.isActive) {
      throw new CamInvError(
        CamInvErrorCode.MERCHANT_NOT_ACTIVE,
        'Merchant is not active',
        400,
        { merchantId, status: merchant.registrationStatus }
      );
    }

    const accessToken = await camInvMerchantService.getValidAccessToken(merchantId);
    
    if (!accessToken) {
      throw new CamInvError(
        CamInvErrorCode.TOKEN_EXPIRED,
        'Unable to obtain valid access token',
        401,
        { merchantId }
      );
    }

    return { merchant, accessToken };
  }

  /**
   * Submit documents to CamInv
   */
  async submitDocuments(
    merchantId: number,
    documents: Array<{
      documentType: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
      ublXml: string;
      invoiceId?: number;
      invoiceNumber?: string;
    }>,
    userId?: number
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

        // Convert UBL XML to Base64 and format for CamInv API
        const camInvDocuments = {
          documents: documents.map(doc => ({
            document_type: doc.documentType,
            document: Buffer.from(doc.ublXml, 'utf-8').toString('base64')
          }))
        };

        const result = await camInvApiClient.submitDocuments(accessToken, camInvDocuments);

        // Log the operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'DOCUMENTS_SUBMITTED',
          'document',
          documents[0]?.invoiceId || 0,
          {
            merchantId,
            documentCount: documents.length,
            documentTypes: documents.map(d => d.documentType),
            invoiceNumbers: documents.map(d => d.invoiceNumber).filter(Boolean)
          }
        );

        return result;
      },
      'submitDocuments',
      { merchantId, documentCount: documents.length }
    );
  }

  // /**
  //  * Send document to customer using CamInv Send Document API
  //  */
  // async sendDocument(
  //   merchantId: number,
  //   documentId: string,
  //   customerEmail: string,
  //   userId?: number
  // ): Promise<ServiceResult<any>> {
  //   return await this.executeOperation(
  //     async () => {
  //       const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

  //       const result = await camInvApiClient.sendDocument(accessToken, documentId, customerEmail);

  //       // Log the operation
  //       await this.logAuditEvent(
  //         merchant.teamId,
  //         userId,
  //         'DOCUMENT_SENT',
  //         'document',
  //         0, // No specific invoice ID for this operation
  //         {
  //           merchantId,
  //           documentId,
  //           customerEmail
  //         }
  //       );

  //       return result;
  //     },
  //     'sendDocument',
  //     { merchantId, documentId, customerEmail }
  //   );
  // }

  /**
   * Get incoming documents for a merchant
   */
  async getIncomingDocuments(
    merchantId: number,
    params?: {
      page?: number;
      size?: number;
      status?: string;
      document_type?: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
    },
    userId?: number
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

        const result = await camInvApiClient.getIncomingDocuments(accessToken, params);

        // Log the operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'INCOMING_DOCUMENTS_RETRIEVED',
          'document',
          0,
          {
            merchantId,
            params
          }
        );

        return result;
      },
      'getIncomingDocuments',
      { merchantId, params }
    );
  }

  /**
   * Get documents from CamInv
   */
  async getDocuments(
    merchantId: number,
    params?: {
      type?: string;
      page?: number;
      size?: number;
      document_type?: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
    }
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { accessToken } = await this.getMerchantWithToken(merchantId);
        return await camInvApiClient.getDocuments(accessToken, params);
      },
      'getDocuments',
      { merchantId, params }
    );
  }

  /**
   * Get document details by ID
   */
  async getDocumentById(
    merchantId: number,
    documentId: string,
    userId?: number
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

        const result = await camInvApiClient.getDocumentById(accessToken, documentId);

        // Log the operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'DOCUMENT_DETAIL_RETRIEVED',
          'document',
          0,
          {
            merchantId,
            documentId
          }
        );

        return result;
      },
      'getDocumentById',
      { merchantId, documentId }
    );
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(
    merchantId: number,
    invoiceId: string
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { accessToken } = await this.getMerchantWithToken(merchantId);
        return await camInvApiClient.getInvoiceStatus(accessToken, invoiceId);
      },
      'getInvoiceStatus',
      { merchantId, invoiceId }
    );
  }

  /**
   * Poll for document updates using official CamInv polling endpoint
   * This is the recommended approach according to CamInv documentation
   */
  async pollDocumentUpdates(
    merchantId: number,
    lastSyncedAt?: string,
    userId?: number
  ): Promise<ServiceResult<{
    documents: Array<{
      document_id: string;
      updated_at: string;
      type: 'SEND' | 'RECEIVE';
    }>;
  }>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

        const result = await camInvApiClient.pollDocumentUpdates(accessToken, lastSyncedAt);

        // Log the polling operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'DOCUMENTS_POLLED',
          'system',
          0,
          {
            merchantId,
            lastSyncedAt,
            documentsFound: result.documents?.length || 0
          }
        );

        return result;
      },
      'pollDocumentUpdates',
      { merchantId, lastSyncedAt }
    );
  }

  /**
   * Validate taxpayer information using CamInv API
   * This helps verify if a customer is registered with CamInv
   */
  async validateTaxpayer(
    merchantId: number,
    taxpayerData: {
      single_id: string;
      tin: string;
      company_name_en: string;
      company_name_kh: string;
    },
    userId?: number
  ): Promise<ServiceResult<{
    is_valid: boolean;
  }>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

        const result = await camInvApiClient.validateTaxpayer(accessToken, taxpayerData);

        // Log the validation operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'TAXPAYER_VALIDATED',
          'system',
          0,
          {
            merchantId,
            taxpayerData: {
              single_id: taxpayerData.single_id,
              tin: taxpayerData.tin,
              company_name_en: taxpayerData.company_name_en,
              // Don't log Khmer name for audit simplicity
            },
            isValid: result.is_valid
          }
        );

        return result;
      },
      'validateTaxpayer',
      { merchantId, taxpayerData }
    );
  }

  /**
   * Get member detail information using CamInv API
   * This retrieves detailed information about a CamInv member
   */
  async getMemberDetail(
    merchantId: number,
    endpointId?: string,
    userId?: number
  ): Promise<ServiceResult<{
    endpoint_id: string;
    company_name_en: string;
    company_name_kh: string;
    entity_type: string;
    entity_id: string;
    tin: string;
    country: string;
  }>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

        // Use the merchant's own endpoint ID if not provided
        const targetEndpointId = endpointId || merchant.endpointId;

        if (!targetEndpointId) {
          throw new Error('No endpoint ID available for member detail lookup');
        }

        const result = await camInvApiClient.getMemberDetail(accessToken, targetEndpointId);

        // Log the operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'MEMBER_DETAIL_RETRIEVED',
          'system',
          0,
          {
            merchantId,
            endpointId: targetEndpointId,
            companyName: result.company_name_en
          }
        );

        return result;
      },
      'getMemberDetail',
      { merchantId, endpointId }
    );
  }

  /**
   * Accept incoming invoice
   */
  async acceptInvoice(
    merchantId: number,
    invoiceId: string,
    userId?: number
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);
        
        const result = await camInvApiClient.acceptInvoice(accessToken, invoiceId);
        
        // Log the operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'INVOICE_ACCEPTED',
          'invoice',
          invoiceId,
          { merchantId }
        );

        return result;
      },
      'acceptInvoice',
      { merchantId, invoiceId }
    );
  }

  /**
   * Reject incoming invoice
   */
  async rejectInvoice(
    merchantId: number,
    invoiceId: string,
    reason: string,
    userId?: number
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

        const result = await camInvApiClient.rejectInvoice(accessToken, invoiceId, reason);

        // Log the operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'INVOICE_REJECTED',
          'invoice',
          invoiceId,
          { merchantId, reason }
        );

        return result;
      },
      'rejectInvoice',
      { merchantId, invoiceId, reason }
    );
  }

  /**
   * Send document to customer
   */
  async sendDocument(
    merchantId: number,
    documentId: string,
    customerEmail: string,
    message?: string,
    userId?: number
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

        const result = await camInvApiClient.sendDocument(accessToken, [documentId]);

        // Log the operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'DOCUMENT_SENT',
          'document',
          documentId,
          { merchantId, customerEmail, message }
        );

        return result;
      },
      'sendDocument',
      { merchantId, documentId, customerEmail, message }
    );
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    merchantId: number,
    documentId: string,
    status: 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
    userId?: number
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { merchant, accessToken } = await this.getMerchantWithToken(merchantId);

        const result = await camInvApiClient.updateDocumentStatus(accessToken, documentId, status);

        // Log the operation
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'DOCUMENT_STATUS_UPDATED',
          'document',
          documentId,
          { merchantId, status }
        );

        return result;
      },
      'updateDocumentStatus',
      { merchantId, documentId, status }
    );
  }

  /**
   * Get incoming invoices
   */
  async getIncomingInvoices(
    merchantId: number,
    params?: { page?: number; limit?: number }
  ): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { accessToken } = await this.getMerchantWithToken(merchantId);
        return await camInvApiClient.getIncomingInvoices(accessToken, params);
      },
      'getIncomingInvoices',
      { merchantId, params }
    );
  }

  /**
   * Get member information
   */
  async getMemberInfo(merchantId: number): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const { accessToken } = await this.getMerchantWithToken(merchantId);
        return await camInvApiClient.getMemberInfo(accessToken);
      },
      'getMemberInfo',
      { merchantId }
    );
  }

  /**
   * Sync merchant data with CamInv
   */
  async syncMerchantData(merchantId: number): Promise<ServiceResult<any>> {
    return await this.executeOperation(
      async () => {
        const merchantInfo = await this.getMemberInfo(merchantId);
        
        if (merchantInfo.success && merchantInfo.data) {
          // Update local merchant data
          await camInvMerchantService.updateMerchantSync(merchantId);
          return merchantInfo.data;
        }
        
        throw new CamInvError(
          CamInvErrorCode.API_ERROR,
          'Failed to sync merchant data',
          500
        );
      },
      'syncMerchantData',
      { merchantId }
    );
  }

  /**
   * Health check for CamInv service
   */
  async healthCheck(): Promise<ServiceResult<{ status: string; timestamp: Date }>> {
    return await this.executeOperation(
      async () => {
        // Simple health check - try to make a basic API call
        // This would depend on CamInv providing a health check endpoint
        return {
          status: 'healthy',
          timestamp: new Date(),
        };
      },
      'healthCheck'
    );
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    teamId: number,
    userId: number | undefined,
    action: string,
    entityType: string,
    entityId: string | number,
    details?: any
  ): Promise<void> {
    try {
      await db.insert(camInvAuditLogs).values({
        teamId,
        userId,
        action,
        entityType,
        entityId: typeof entityId === 'string' ? parseInt(entityId) || 0 : entityId,
        details,
      });
    } catch (error) {
      logger.error('Failed to log audit event', error);
    }
  }
}

// Export singleton instance
export const camInvCoreService = new CamInvCoreService();
