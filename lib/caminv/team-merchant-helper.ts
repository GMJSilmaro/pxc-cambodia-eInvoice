import { camInvMerchantService } from './merchant-service';

/**
 * Get the primary (first active) merchant for a team
 * This is a helper function for components that need a merchant ID
 * but don't have it explicitly passed as a prop.
 */
export async function getPrimaryMerchantForTeam(teamId: number): Promise<number | null> {
  try {
    const merchants = await camInvMerchantService.getMerchantsForTeam(teamId);
    
    // Find the first active merchant
    const activeMerchant = merchants.find(merchant => merchant.isActive);
    
    return activeMerchant?.id || null;
  } catch (error) {
    console.error('Error getting primary merchant for team:', error);
    return null;
  }
}

/**
 * Get all active merchants for a team
 */
export async function getActiveMerchantsForTeam(teamId: number) {
  try {
    const merchants = await camInvMerchantService.getMerchantsForTeam(teamId);
    return merchants.filter(merchant => merchant.isActive);
  } catch (error) {
    console.error('Error getting active merchants for team:', error);
    return [];
  }
}
