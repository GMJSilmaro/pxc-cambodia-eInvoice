import { db } from '@/lib/db';
import { camInvMerchants, camInvAuditLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt } from './encryption';
import { camInvApiClient, type CamInvTokenResponse } from './api-client';
import type { CamInvMerchant, NewCamInvMerchant } from '@/lib/db/schema';

export interface MerchantConnectionResult {
  success: boolean;
  merchant?: CamInvMerchant;
  error?: string;
}

export interface TokenRefreshResult {
  success: boolean;
  newTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  error?: string;
}

export class CamInvMerchantService {
  /**
   * Configure redirect URLs before OAuth flow
   */
  async configureRedirectUrls(redirectUrls: string[]): Promise<boolean> {
    try {
      await camInvApiClient.configureRedirectUrls(redirectUrls);
      return true;
    } catch (error) {
      console.error('Failed to configure redirect URLs:', error);
      return false;
    }
  }

  /**
   * Connect a merchant account using OAuth2 authToken with custom credentials
   * Following CamInv documentation: authToken is received from callback, not authorization code
   */
  async connectMerchantWithCredentials(
    teamId: number,
    authToken: string,
    redirectUri: string,
    clientId: string,
    clientSecret: string,
    userId?: number
  ): Promise<MerchantConnectionResult> {
    try {
      // Create API client with provided credentials
      const apiClient = new (await import('./api-client')).CamInvApiClient(
        process.env.CAMBODIA_API_BASE_URL || 'https://sb-merchant.e-invoice.gov.kh',
        clientId,
        clientSecret
      );

      // Exchange authToken for access and refresh tokens (CamInv OAuth2 flow)
      console.log('[MERCHANT SERVICE] Starting token exchange...');
      const tokenResponse = await apiClient.exchangeCodeForToken(authToken, redirectUri);
      console.log('[MERCHANT SERVICE] Token exchange completed successfully');
      console.log('[MERCHANT SERVICE] Received business_info:', JSON.stringify(tokenResponse.business_info, null, 2));

      // Get member information from business_info in token response
      const businessInfo = tokenResponse.business_info;

      // Calculate token expiration - CamInv returns expires_in as "1d" string, not seconds
      // Default to 24 hours (86400 seconds) for "1d" or any non-numeric value
      let expiresInSeconds = 86400; // 24 hours default
      if (tokenResponse.expires_in && typeof tokenResponse.expires_in === 'number') {
        expiresInSeconds = tokenResponse.expires_in;
      } else if (tokenResponse.expires_in === '1d') {
        expiresInSeconds = 86400; // 24 hours
      }
      const expiresAt = new Date(Date.now() + (expiresInSeconds * 1000));

      // Check if merchant already exists for this team
      const existingMerchant = await db
        .select()
        .from(camInvMerchants)
        .where(and(
          eq(camInvMerchants.teamId, teamId),
          eq(camInvMerchants.endpointId, businessInfo.endpoint_id)
        ))
        .limit(1);

      const merchantData: NewCamInvMerchant = {
        teamId,
        merchantId: businessInfo.endpoint_id,
        merchantName: businessInfo.company_name_en || businessInfo.company_name_kh || 'Unknown Company',

        // Store encrypted client credentials
        clientId: await encrypt(clientId),
        clientSecret: await encrypt(clientSecret),

        // Store encrypted OAuth tokens
        accessToken: await encrypt(tokenResponse.access_token),
        refreshToken: tokenResponse.refresh_token ? await encrypt(tokenResponse.refresh_token) : null,
        tokenExpiresAt: expiresAt,

        // Business information
        endpointId: businessInfo.endpoint_id,
        mocId: businessInfo.moc_id,
        companyNameEn: businessInfo.company_name_en,
        companyNameKh: businessInfo.company_name_kh,
        tin: businessInfo.tin,
        dateOfIncorporation: null, // CamInv API doesn't provide this field
        businessType: businessInfo.business_type,
        city: businessInfo.city,
        country: businessInfo.country || 'KH',
        phoneNumber: businessInfo.phone_number,
        email: businessInfo.email,

        registrationStatus: 'active',
        isActive: true,
        // lastSyncAt: new Date(), // Temporarily removed to debug date issue
      };

      console.log('[MERCHANT SERVICE] About to save merchant data:', JSON.stringify(merchantData, null, 2));

      let merchant: CamInvMerchant;

      try {
        if (existingMerchant.length > 0) {
          // Update existing merchant
          console.log('[MERCHANT SERVICE] Updating existing merchant:', existingMerchant[0].id);
          const [updatedMerchant] = await db
            .update(camInvMerchants)
            .set(merchantData)
            .where(eq(camInvMerchants.id, existingMerchant[0].id))
            .returning();
          merchant = updatedMerchant;
          console.log('[MERCHANT SERVICE] Merchant updated successfully');
        } else {
          // Create new merchant
          console.log('[MERCHANT SERVICE] Creating new merchant');
          const [newMerchant] = await db
            .insert(camInvMerchants)
            .values(merchantData)
            .returning();
          merchant = newMerchant;
          console.log('[MERCHANT SERVICE] Merchant created successfully');
        }
      } catch (dbError) {
        console.error('[MERCHANT SERVICE] Database error:', dbError);
        throw dbError;
      }

      // Log the connection (temporarily disabled to debug date issue)
      try {
        await this.logAuditEvent(
          teamId,
          userId,
          'MERCHANT_CONNECTED',
          'merchant',
          merchant.id,
          {
            endpointId: businessInfo.endpoint_id,
            companyName: businessInfo.company_name_en,
            tin: businessInfo.tin
          }
        );
      } catch (auditError) {
        console.warn('Audit logging failed, but continuing with merchant connection:', auditError);
      }

      return {
        success: true,
        merchant
      };

    } catch (error) {
      console.error('Failed to connect merchant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Connect a merchant account using OAuth2 authToken (legacy method using env credentials)
   * Following CamInv documentation: authToken is received from callback
   */
  async connectMerchant(
    teamId: number,
    authToken: string,
    redirectUri: string,
    userId?: number
  ): Promise<MerchantConnectionResult> {
    try {
      // Exchange authToken for access and refresh tokens
      const tokenResponse = await camInvApiClient.exchangeCodeForToken(authToken, redirectUri);

      // Get member information from business_info in token response
      const businessInfo = tokenResponse.business_info;

      // Calculate token expiration
      const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));

      // Check if merchant already exists for this team
      const existingMerchant = await db
        .select()
        .from(camInvMerchants)
        .where(
          and(
            eq(camInvMerchants.teamId, teamId),
            eq(camInvMerchants.endpointId, businessInfo.endpoint_id)
          )
        )
        .limit(1);

      let merchant: CamInvMerchant;

      if (existingMerchant.length > 0) {
        // Update existing merchant with complete business_info
        const [updatedMerchant] = await db
          .update(camInvMerchants)
          .set({
            merchantName: businessInfo.company_name_en,
            accessToken: encrypt(tokenResponse.access_token),
            refreshToken: encrypt(tokenResponse.refresh_token),
            tokenExpiresAt: expiresAt,
            isActive: true,
            registrationStatus: 'active', // Assume active if we got tokens
            endpointId: businessInfo.endpoint_id,
            mocId: businessInfo.moc_id,
            companyNameEn: businessInfo.company_name_en,
            companyNameKh: businessInfo.company_name_kh,
            tin: businessInfo.tin,
            dateOfIncorporation: null, // CamInv API doesn't provide this field
            businessType: businessInfo.business_type,
            city: businessInfo.city,
            country: businessInfo.country || 'KH',
            phoneNumber: businessInfo.phone_number,
            email: businessInfo.email,
            businessInfo: businessInfo,
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(camInvMerchants.id, existingMerchant[0].id))
          .returning();

        merchant = updatedMerchant;
      } else {
        // Create new merchant with complete business_info
        const newMerchant: NewCamInvMerchant = {
          teamId,
          merchantId: businessInfo.endpoint_id, // Use endpoint_id as merchant ID
          merchantName: businessInfo.company_name_en,
          accessToken: encrypt(tokenResponse.access_token),
          refreshToken: encrypt(tokenResponse.refresh_token),
          tokenExpiresAt: expiresAt,
          isActive: true,
          registrationStatus: 'active', // Assume active if we got tokens
          endpointId: businessInfo.endpoint_id,
          mocId: businessInfo.moc_id,
          companyNameEn: businessInfo.company_name_en,
          companyNameKh: businessInfo.company_name_kh,
          tin: businessInfo.tin,
          dateOfIncorporation: null, // CamInv API doesn't provide this field
          businessType: businessInfo.business_type,
          city: businessInfo.city,
          country: businessInfo.country || 'KH',
          phoneNumber: businessInfo.phone_number,
          email: businessInfo.email,
          businessInfo: businessInfo,
          lastSyncAt: new Date(),
        };

        const [createdMerchant] = await db
          .insert(camInvMerchants)
          .values(newMerchant)
          .returning();

        merchant = createdMerchant;
      }

      // Log the connection (temporarily disabled to debug date issue)
      try {
        await this.logAuditEvent(
          teamId,
          userId,
          'MERCHANT_CONNECTED',
          'merchant',
          merchant.id,
          {
            endpointId: businessInfo.endpoint_id,
            companyName: businessInfo.company_name_en,
            tin: businessInfo.tin
          }
        );
      } catch (auditError) {
        console.warn('Audit logging failed, but continuing with merchant connection:', auditError);
      }

      return { success: true, merchant };
    } catch (error) {
      console.error('Failed to connect merchant:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Refresh access token for a merchant
   */
  async refreshMerchantToken(merchantId: number): Promise<TokenRefreshResult> {
    try {
      const merchant = await db
        .select()
        .from(camInvMerchants)
        .where(eq(camInvMerchants.id, merchantId))
        .limit(1);

      if (merchant.length === 0) {
        return { success: false, error: 'Merchant not found' };
      }

      const merchantData = merchant[0];
      
      if (!merchantData.refreshToken) {
        return { success: false, error: 'No refresh token available' };
      }

      // Refresh the token
      const tokenResponse = await camInvApiClient.refreshToken(merchantData.refreshToken);
      
      // Calculate new expiration
      const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));
      
      // Update merchant with new tokens
      await db
        .update(camInvMerchants)
        .set({
          accessToken: encrypt(tokenResponse.access_token),
          refreshToken: encrypt(tokenResponse.refresh_token),
          tokenExpiresAt: expiresAt,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(camInvMerchants.id, merchantId));

      return {
        success: true,
        newTokens: {
          accessToken: encrypt(tokenResponse.access_token),
          refreshToken: encrypt(tokenResponse.refresh_token),
          expiresAt,
        },
      };
    } catch (error) {
      console.error('Failed to refresh merchant token:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      };
    }
  }

  /**
   * Get valid access token for a merchant (refresh if needed)
   */
  async getValidAccessToken(merchantId: number): Promise<string | null> {
    try {
      const merchant = await db
        .select()
        .from(camInvMerchants)
        .where(eq(camInvMerchants.id, merchantId))
        .limit(1);

      if (merchant.length === 0 || !merchant[0].isActive) {
        return null;
      }

      const merchantData = merchant[0];
      
      // Check if token is expired or will expire in the next 5 minutes
      const now = new Date();
      const expirationBuffer = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes buffer
      
      if (!merchantData.tokenExpiresAt || merchantData.tokenExpiresAt <= expirationBuffer) {
        // Token is expired or will expire soon, refresh it
        const refreshResult = await this.refreshMerchantToken(merchantId);
        
        if (!refreshResult.success || !refreshResult.newTokens) {
          return null;
        }
        
        return refreshResult.newTokens.accessToken;
      }

      return merchantData.accessToken;
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }

  /**
   * Get all merchants for a team
   */
  async getMerchantsForTeam(teamId: number): Promise<CamInvMerchant[]> {
    return await db
      .select()
      .from(camInvMerchants)
      .where(eq(camInvMerchants.teamId, teamId));
  }

  /**
   * Get merchant by ID
   */
  async getMerchantById(merchantId: number): Promise<CamInvMerchant | null> {
    const merchants = await db
      .select()
      .from(camInvMerchants)
      .where(eq(camInvMerchants.id, merchantId))
      .limit(1);

    return merchants.length > 0 ? merchants[0] : null;
  }

  /**
   * Disconnect a merchant (revoke connection and deactivate)
   */
  async disconnectMerchant(merchantId: number, userId?: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[MERCHANT SERVICE] Starting disconnect process for merchant:', merchantId);

      const merchant = await this.getMerchantById(merchantId);

      if (!merchant) {
        return { success: false, error: 'Merchant not found' };
      }

      console.log('[MERCHANT SERVICE] Found merchant:', {
        id: merchant.id,
        merchantName: merchant.merchantName,
        endpointId: merchant.endpointId,
        isActive: merchant.isActive
      });

      // Only call revoke API if merchant is still active and has credentials
      if (merchant.isActive && merchant.clientId && merchant.clientSecret && merchant.endpointId) {
        try {
          // Decrypt client credentials for API call
          const clientId = decrypt(merchant.clientId);
          const clientSecret = decrypt(merchant.clientSecret);

          console.log('[MERCHANT SERVICE] Calling CamInv revoke API...');

          // Call CamInv API to revoke the connection
          await camInvApiClient.revokeConnectedMember(
            clientId,
            clientSecret,
            merchant.endpointId
          );

          console.log('[MERCHANT SERVICE] CamInv revoke successful');
        } catch (revokeError) {
          console.warn('[MERCHANT SERVICE] CamInv revoke failed, but continuing with local disconnect:', revokeError);
          // Continue with local disconnect even if API call fails
        }
      } else {
        console.log('[MERCHANT SERVICE] Skipping CamInv revoke API call (merchant inactive or missing credentials)');
      }

      console.log('[MERCHANT SERVICE] Updating database...');

      // Mark merchant as inactive and clear sensitive data
      await db
        .update(camInvMerchants)
        .set({
          isActive: false,
          registrationStatus: 'disconnected',
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
          lastSyncAt: null,
          updatedAt: new Date(),
        })
        .where(eq(camInvMerchants.id, merchantId));

      // Log the disconnection
      try {
        await this.logAuditEvent(
          merchant.teamId,
          userId,
          'MERCHANT_DISCONNECTED',
          'merchant',
          merchantId,
          { merchantId: merchant.merchantId, merchantName: merchant.merchantName }
        );
      } catch (auditError) {
        console.warn('Audit logging failed, but continuing with disconnect:', auditError);
      }

      console.log('[MERCHANT SERVICE] Merchant disconnected successfully');

      return { success: true };
    } catch (error) {
      console.error('[MERCHANT SERVICE] Failed to disconnect merchant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update merchant sync status
   */
  async updateMerchantSync(merchantId: number): Promise<void> {
    await db
      .update(camInvMerchants)
      .set({
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(camInvMerchants.id, merchantId));
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
      console.error('Failed to log audit event:', error);
    }
  }
}

// Export singleton instance
export const camInvMerchantService = new CamInvMerchantService();
