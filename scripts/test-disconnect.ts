#!/usr/bin/env tsx

import { camInvMerchantService } from '../lib/caminv/merchant-service';

async function testDisconnect() {
  try {
    console.log('🧪 Testing merchant disconnect functionality...\n');
    
    // Get all merchants
    const merchants = await camInvMerchantService.getMerchantsForTeam(2);
    console.log(`Found ${merchants.length} merchant(s) in team 2`);
    
    if (merchants.length === 0) {
      console.log('❌ No merchants found to test disconnect');
      return;
    }
    
    const merchant = merchants[0];
    console.log(`\nTesting disconnect for merchant: ${merchant.merchantName} (ID: ${merchant.id})`);
    console.log(`Current status: ${merchant.isActive ? 'Active' : 'Inactive'}`);
    console.log(`Registration status: ${merchant.registrationStatus}`);
    
    if (!merchant.isActive) {
      console.log('⚠️  Merchant is already inactive, skipping disconnect test');
      return;
    }
    
    console.log('\n🔌 Calling disconnect...');
    const result = await camInvMerchantService.disconnectMerchant(merchant.id, 2);
    
    if (result.success) {
      console.log('✅ Disconnect successful!');
      
      // Verify the merchant is now inactive
      const updatedMerchant = await camInvMerchantService.getMerchantById(merchant.id);
      if (updatedMerchant) {
        console.log('\n📊 Updated merchant status:');
        console.log(`  Active: ${updatedMerchant.isActive}`);
        console.log(`  Registration Status: ${updatedMerchant.registrationStatus}`);
        console.log(`  Access Token: ${updatedMerchant.accessToken ? 'Present' : 'Cleared'}`);
        console.log(`  Refresh Token: ${updatedMerchant.refreshToken ? 'Present' : 'Cleared'}`);
      }
    } else {
      console.log('❌ Disconnect failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDisconnect()
  .then(() => {
    console.log('\n✅ Disconnect test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
