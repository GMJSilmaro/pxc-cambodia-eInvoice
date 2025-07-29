#!/usr/bin/env tsx

import { db } from '../lib/db/drizzle';
import { camInvMerchants } from '../lib/db/schema';

async function checkMerchants() {
  try {
    console.log('🔍 Checking CamInv merchants in database...\n');
    
    const merchants = await db.select().from(camInvMerchants);
    
    if (merchants.length === 0) {
      console.log('❌ No merchants found in database');
      return;
    }
    
    console.log(`✅ Found ${merchants.length} merchant(s):\n`);
    
    merchants.forEach((merchant, index) => {
      console.log(`Merchant ${index + 1}:`);
      console.log(`  ID: ${merchant.id}`);
      console.log(`  Team ID: ${merchant.teamId}`);
      console.log(`  Merchant ID: ${merchant.merchantId}`);
      console.log(`  Merchant Name: ${merchant.merchantName}`);
      console.log(`  Company Name (EN): ${merchant.companyNameEn}`);
      console.log(`  Company Name (KH): ${merchant.companyNameKh}`);
      console.log(`  TIN: ${merchant.tin}`);
      console.log(`  Endpoint ID: ${merchant.endpointId}`);
      console.log(`  MOC ID: ${merchant.mocId}`);
      console.log(`  Registration Status: ${merchant.registrationStatus}`);
      console.log(`  Is Active: ${merchant.isActive}`);
      console.log(`  City: ${merchant.city}`);
      console.log(`  Country: ${merchant.country}`);
      console.log(`  Phone: ${merchant.phoneNumber}`);
      console.log(`  Email: ${merchant.email}`);
      console.log(`  Created At: ${merchant.createdAt}`);
      console.log(`  Updated At: ${merchant.updatedAt}`);
      console.log(`  Last Sync At: ${merchant.lastSyncAt}`);
      console.log(`  Token Expires At: ${merchant.tokenExpiresAt}`);
      console.log(`  Has Access Token: ${merchant.accessToken ? 'Yes (encrypted)' : 'No'}`);
      console.log(`  Has Refresh Token: ${merchant.refreshToken ? 'Yes (encrypted)' : 'No'}`);
      console.log(`  Has Client ID: ${merchant.clientId ? 'Yes (encrypted)' : 'No'}`);
      console.log(`  Has Client Secret: ${merchant.clientSecret ? 'Yes (encrypted)' : 'No'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking merchants:', error);
  }
}

checkMerchants()
  .then(() => {
    console.log('✅ Merchant check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
