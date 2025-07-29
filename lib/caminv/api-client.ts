import { decrypt } from './encryption';
import { getCamInvConfig } from './config';

// Get CamInv configuration
const CAMINV_CONFIG = getCamInvConfig();

// Note: Client credentials can be provided dynamically through the API client constructor
// or will fall back to environment variables

export interface CamInvTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  business_info: {
    endpoint_id: string;
    moc_id: string;
    company_name_en: string;
    company_name_kh: string;
    tin: string;
    date_of_incorporation?: string;
    business_type?: string;
    city?: string;
    country?: string;
    phone_number?: string;
    email?: string;
    [key: string]: any; // Additional business info fields
  };
}

export interface CamInvRedirectUrlConfig {
  white_list_redirect_urls: string[];
}

export interface CamInvRedirectUrlResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CamInvMemberInfo {
  endpoint_id: string;
  moc_id: string;
  company_name_en: string;
  company_name_kh: string;
  tin: string;
  status: string;
  [key: string]: any;
}

export interface CamInvDocumentSubmission {
  documents: Array<{
    document_type: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
    document: string; // Base64 encoded UBL XML
  }>;
}

export interface CamInvRevokeRequest {
  endpoint_id: string;
}

export interface CamInvRevokeResponse {
  message: string;
}

export interface CamInvDocumentResponse {
  valid_documents: Array<{
    document_id: string;
    verification_link: string;
    document_type: string;
    [key: string]: any;
  }>;
  failed_documents: Array<{
    document_type: string;
    error_message: string;
    [key: string]: any;
  }>;
}

export interface CamInvApiError {
  error: string;
  error_description?: string;
  message?: string;
  code?: string;
}

export class CamInvApiClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor(baseUrl?: string, clientId?: string, clientSecret?: string) {
    this.baseUrl = baseUrl || CAMINV_CONFIG.baseUrl;
    this.clientId = clientId || CAMINV_CONFIG.clientId || '';
    this.clientSecret = clientSecret || CAMINV_CONFIG.clientSecret || '';

    // Validate that we have the required credentials
    if (!this.clientId || !this.clientSecret) {
      console.warn('CamInvApiClient: Missing client credentials. Some operations may fail.');
    }
  }

  /**
   * Configure redirect URLs (required before OAuth flow)
   * Following official documentation:
   * POST {BaseURL}/api/v1/configure/configure-redirect-url
   * Authorization: Basic base64encode({clientId:clientSecret})
   * Body: { "white_list_redirect_urls": ["http://domain_webhook"] }
   */
  async configureRedirectUrls(redirectUrls: string[]): Promise<CamInvRedirectUrlResponse> {
    const configUrl = `${this.baseUrl}/api/v1/configure/configure-redirect-url`;

    // Create Basic Auth header as per documentation: base64encode({clientId:clientSecret})
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const body: CamInvRedirectUrlConfig = {
      white_list_redirect_urls: redirectUrls
    };

    const response = await fetch(configUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Redirect URL configuration failed: ${data.error || data.message || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * Exchange authorization token for access token (CamInv OAuth2 flow)
   * Following official documentation:
   * POST {BaseURL}/api/v1/auth/authorize/connect
   * Authorization: Basic base64encode({clientId:clientSecret})
   * Body: { "auth_token": "{authToken}" }
   */
  async exchangeCodeForToken(authToken: string, _redirectUri: string): Promise<CamInvTokenResponse> {
    const tokenUrl = `${this.baseUrl}/api/v1/auth/authorize/connect`;

    // Create Basic Auth header as per documentation: base64encode({clientId:clientSecret})
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const body = {
      auth_token: authToken,
    };

    console.log('[TOKEN EXCHANGE] Making request to:', tokenUrl);
    console.log('[TOKEN EXCHANGE] Client ID:', this.clientId);
    console.log('[TOKEN EXCHANGE] Basic Auth credentials (base64):', credentials);
    console.log('[TOKEN EXCHANGE] Request body:', JSON.stringify(body, null, 2));

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[TOKEN EXCHANGE] Response status:', response.status);
    console.log('[TOKEN EXCHANGE] Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('[TOKEN EXCHANGE] Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('[TOKEN EXCHANGE] Request failed with status:', response.status);
      console.error('[TOKEN EXCHANGE] Error response:', data);
      throw new Error(`Token exchange failed: ${data.error_description || data.message || 'Unknown error'}`);
    }

    console.log('[TOKEN EXCHANGE] Success! Received access_token and business_info');
    return data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<CamInvTokenResponse> {
    const tokenUrl = `${this.baseUrl}/oauth/token`;
    
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: decrypt(refreshToken), // Decrypt stored refresh token
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${data.error_description || data.message || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * Get member information using access token
   */
  async getMemberInfo(accessToken: string): Promise<CamInvMemberInfo> {
    const response = await this.makeAuthenticatedRequest(
      '/api/v1/member',
      'GET',
      accessToken
    );

    return response;
  }

  /**
   * Submit documents to CamInv
   */
  async submitDocuments(accessToken: string, documents: CamInvDocumentSubmission): Promise<CamInvDocumentResponse> {
    return await this.makeAuthenticatedRequest(
      '/api/v1/document',
      'POST',
      accessToken,
      documents
    );
  }

  /**
   * Get document list from CamInv
   */
  async getDocuments(
    accessToken: string,
    params?: {
      type?: string;
      page?: number;
      size?: number;
      document_type?: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
    }
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.document_type) queryParams.append('document_type', params.document_type);

    const url = `/api/v1/document${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    return await this.makeAuthenticatedRequest(url, 'GET', accessToken);
  }

  /**
   * Get document details by ID
   * Based on: https://doc-caminv.netlify.app/api-reference/get-document-detail
   */
  async getDocumentById(accessToken: string, documentId: string): Promise<any> {
    return await this.makeAuthenticatedRequest(
      `/api/v1/document/${documentId}`,
      'GET',
      accessToken
    );
  }

  /**
   * Get incoming documents (received invoices)
   */
  async getIncomingDocuments(
    accessToken: string,
    params?: {
      page?: number;
      size?: number;
      status?: string;
      document_type?: 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
    }
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('type', 'incoming'); // Filter for incoming documents

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.document_type) queryParams.append('document_type', params.document_type);

    const url = `/api/v1/document${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    return await this.makeAuthenticatedRequest(url, 'GET', accessToken);
  }

  /**
   * Send document to customer using CamInv Send Document API
   * Based on: https://doc-caminv.netlify.app/api-reference/send-document
   */
  async sendDocument(accessToken: string, documentIds: string[]): Promise<any> {
    return await this.makeAuthenticatedRequest(
      `/api/v1/document/send`,
      'POST',
      accessToken,
      {
        documents: documentIds
      }
    );
  }

  /**
   * Get invoice status
   */
  async getInvoiceStatus(accessToken: string, invoiceId: string): Promise<any> {
    return await this.makeAuthenticatedRequest(
      `/api/v1/invoices/${invoiceId}/status`,
      'GET',
      accessToken
    );
  }

  /**
   * Poll for document updates using official CamInv polling endpoint
   * Based on: https://doc-caminv.netlify.app/receive-update-event/polling/getting-started
   */
  async pollDocumentUpdates(
    accessToken: string,
    lastSyncedAt?: string
  ): Promise<{
    documents: Array<{
      document_id: string;
      updated_at: string;
      type: 'SEND' | 'RECEIVE';
    }>;
  }> {
    const params = new URLSearchParams();
    if (lastSyncedAt) {
      params.append('last_synced_at', lastSyncedAt);
    }

    const url = `/api/v1/document/poll${params.toString() ? '?' + params.toString() : ''}`;

    return await this.makeAuthenticatedRequest(url, 'GET', accessToken);
  }

  /**
   * Validate taxpayer information using CamInv API
   * Based on: https://doc-caminv.netlify.app/api-reference/validate-taxpayer
   */
  async validateTaxpayer(
    accessToken: string,
    taxpayerData: {
      single_id: string;
      tin: string;
      company_name_en: string;
      company_name_kh: string;
    }
  ): Promise<{
    is_valid: boolean;
  }> {
    return await this.makeAuthenticatedRequest(
      '/api/v1/business/validate',
      'POST',
      accessToken,
      taxpayerData
    );
  }

  /**
   * Get member detail information using CamInv API
   * Based on: https://doc-caminv.netlify.app/api-reference/get-member-detail
   */
  async getMemberDetail(
    accessToken: string,
    endpointId: string
  ): Promise<{
    endpoint_id: string;
    company_name_en: string;
    company_name_kh: string;
    entity_type: string;
    entity_id: string;
    tin: string;
    country: string;
  }> {
    return await this.makeAuthenticatedRequest(
      `/api/v1/business/${endpointId}`,
      'GET',
      accessToken
    );
  }

  /**
   * Download document PDF from CamInv API
   * Based on: https://doc-caminv.netlify.app/api-reference/download-document-pdf
   */
  async downloadDocumentPDF(accessToken: string, documentId: string): Promise<ArrayBuffer> {
    const url = `${this.baseUrl}/api/v1/document/${documentId}/pdf`;
    const decryptedToken = decrypt(accessToken);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${decryptedToken}`,
      'Accept': 'application/pdf',
      'User-Agent': `${CAMINV_CONFIG.serviceProviderName}/1.0`,
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CamInv API error: ${response.status} - ${errorText}`);
    }

    return await response.arrayBuffer();
  }

  /**
   * Accept an incoming invoice
   */
  async acceptInvoice(accessToken: string, invoiceId: string): Promise<any> {
    return await this.makeAuthenticatedRequest(
      `/api/v1/invoices/${invoiceId}/accept`,
      'POST',
      accessToken
    );
  }

  /**
   * Reject an incoming invoice
   */
  async rejectInvoice(accessToken: string, invoiceId: string, reason: string): Promise<any> {
    return await this.makeAuthenticatedRequest(
      `/api/v1/invoices/${invoiceId}/reject`,
      'POST',
      accessToken,
      { reason }
    );
  }

  /**
   * Update document status using CamInv API
   * Based on: https://doc-caminv.netlify.app/api-reference/update-document-status
   */
  async updateDocumentStatus(
    accessToken: string,
    documentId: string,
    status: 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  ): Promise<any> {
    return await this.makeAuthenticatedRequest(
      `/api/v1/document/${documentId}/status`,
      'PUT',
      accessToken,
      { status }
    );
  }

  /**
   * Get list of incoming invoices
   */
  async getIncomingInvoices(accessToken: string, params?: { page?: number; limit?: number }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/api/v1/invoices/incoming${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return await this.makeAuthenticatedRequest(url, 'GET', accessToken);
  }

  /**
   * Generate CamInv OAuth2 authorization URL
   * Following official documentation: {BaseURL}/connect?client_id={client_id}&redirect_url={encoded_redirect_url}&state={state}
   */
  generateAuthUrl(redirectUri: string, state?: string): string {
    // URL encode the redirect URI as per documentation
    const encodedRedirectUrl = encodeURIComponent(redirectUri);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_url: encodedRedirectUrl, // Use encoded URL as per docs
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.baseUrl}/connect?${params.toString()}`;
  }

  /**
   * Make authenticated API request
   */
  private async makeAuthenticatedRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    accessToken: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const decryptedToken = decrypt(accessToken);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${decryptedToken}`,
      'Accept': 'application/json',
      'User-Agent': `${CAMINV_CONFIG.serviceProviderName}/1.0`,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const error: CamInvApiError = data;
      throw new Error(`CamInv API Error (${response.status}): ${error.message || error.error_description || error.error || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * Revoke connected member (disconnect merchant)
   */
  async revokeConnectedMember(
    clientId: string,
    clientSecret: string,
    endpointId: string
  ): Promise<CamInvRevokeResponse> {
    console.log('[REVOKE MEMBER] Starting revoke process...');
    console.log('[REVOKE MEMBER] Endpoint ID:', endpointId);
    console.log('[REVOKE MEMBER] Client ID:', clientId);

    // Create Basic Auth header
    const credentials = `${clientId}:${clientSecret}`;
    const basicAuth = Buffer.from(credentials).toString('base64');
    console.log('[REVOKE MEMBER] Basic Auth credentials (base64):', basicAuth);

    const requestBody: CamInvRevokeRequest = {
      endpoint_id: endpointId
    };

    console.log('[REVOKE MEMBER] Making request to:', `${this.baseUrl}/api/v1/auth/revoke`);
    console.log('[REVOKE MEMBER] Request body:', requestBody);

    const response = await fetch(`${this.baseUrl}/api/v1/auth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[REVOKE MEMBER] Response status:', response.status);
    console.log('[REVOKE MEMBER] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[REVOKE MEMBER] Error response:', errorData);
      throw new Error(`Revoke member failed: ${response.status} ${errorData}`);
    }

    const responseData = await response.json();
    console.log('[REVOKE MEMBER] Response data:', responseData);
    console.log('[REVOKE MEMBER] Success! Member revoked');

    return responseData;
  }

  /**
   * Validate webhook signature (if CamInv provides webhook signatures)
   */
  validateWebhookSignature(_payload: string, _signature: string, _secret: string): boolean {
    // Implementation depends on CamInv's webhook signature method
    // This is a placeholder - update based on actual CamInv documentation
    return true;
  }
}

// Export singleton instance
export const camInvApiClient = new CamInvApiClient();
