#!/usr/bin/env tsx

import { db } from '../lib/db/drizzle';
import { camInvMerchants } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixMerchantTeam() {
  try {
    console.log('🔧 Fixing merchant team assignment...\n');
    
    // Get all merchants
    const merchants = await db.select().from(camInvMerchants);
    console.log(`Found ${merchants.length} merchant(s) in database`);
    
    if (merchants.length === 0) {
      console.log('❌ No merchants found to fix');
      return;
    }
    
    // Show current state
    merchants.forEach((merchant, index) => {
      console.log(`\nMerchant ${index + 1}:`);
      console.log(`  ID: ${merchant.id}`);
      console.log(`  Current Team ID: ${merchant.teamId}`);
      console.log(`  Merchant Name: ${merchant.merchantName}`);
      console.log(`  Endpoint ID: ${merchant.endpointId}`);
      console.log(`  Company Name: ${merchant.companyNameEn}`);
    });
    
    // Update merchant from team 1 to team 2 (the correct team for the current user)
    const merchantsInTeam1 = merchants.filter(m => m.teamId === 1);
    
    if (merchantsInTeam1.length > 0) {
      console.log(`\n🔄 Updating ${merchantsInTeam1.length} merchant(s) from team 1 to team 2...`);
      
      for (const merchant of merchantsInTeam1) {
        await db
          .update(camInvMerchants)
          .set({ 
            teamId: 2,
            updatedAt: new Date()
          })
          .where(eq(camInvMerchants.id, merchant.id));
        
        console.log(`✅ Updated merchant ${merchant.id} (${merchant.merchantName}) to team 2`);
      }
    } else {
      console.log('\n✅ No merchants in team 1 to update');
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const updatedMerchants = await db.select().from(camInvMerchants);
    
    updatedMerchants.forEach((merchant, index) => {
      console.log(`\nMerchant ${index + 1} (after fix):`);
      console.log(`  ID: ${merchant.id}`);
      console.log(`  Team ID: ${merchant.teamId}`);
      console.log(`  Merchant Name: ${merchant.merchantName}`);
      console.log(`  Endpoint ID: ${merchant.endpointId}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing merchant team:', error);
  }
}

fixMerchantTeam()
  .then(() => {
    console.log('\n✅ Merchant team fix complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
