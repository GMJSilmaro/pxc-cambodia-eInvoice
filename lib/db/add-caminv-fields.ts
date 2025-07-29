import { db } from './drizzle';
import { sql } from 'drizzle-orm';

async function addCamInvFields() {
  console.log('🔧 Adding CamInv API fields to e_invoices table...');

  try {
    // Add supplier_id field (CamInv endpoint ID)
    const checkSupplierId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'e_invoices' 
      AND column_name = 'supplier_id'
    `);

    if (checkSupplierId.length === 0) {
      console.log('Adding supplier_id column...');
      await db.execute(sql`
        ALTER TABLE e_invoices 
        ADD COLUMN supplier_id VARCHAR(100)
      `);
      console.log('✅ Added supplier_id column');
    } else {
      console.log('✅ supplier_id column already exists');
    }

    // Add customer_id field (CamInv endpoint ID)
    const checkCustomerId = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'e_invoices' 
      AND column_name = 'customer_id'
    `);

    if (checkCustomerId.length === 0) {
      console.log('Adding customer_id column...');
      await db.execute(sql`
        ALTER TABLE e_invoices 
        ADD COLUMN customer_id VARCHAR(100)
      `);
      console.log('✅ Added customer_id column');
    } else {
      console.log('✅ customer_id column already exists');
    }

    // Add supplier_company_name_kh field
    const checkSupplierNameKh = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'e_invoices' 
      AND column_name = 'supplier_company_name_kh'
    `);

    if (checkSupplierNameKh.length === 0) {
      console.log('Adding supplier_company_name_kh column...');
      await db.execute(sql`
        ALTER TABLE e_invoices 
        ADD COLUMN supplier_company_name_kh VARCHAR(255)
      `);
      console.log('✅ Added supplier_company_name_kh column');
    } else {
      console.log('✅ supplier_company_name_kh column already exists');
    }

    // Add customer_company_name_kh field
    const checkCustomerNameKh = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'e_invoices' 
      AND column_name = 'customer_company_name_kh'
    `);

    if (checkCustomerNameKh.length === 0) {
      console.log('Adding customer_company_name_kh column...');
      await db.execute(sql`
        ALTER TABLE e_invoices 
        ADD COLUMN customer_company_name_kh VARCHAR(255)
      `);
      console.log('✅ Added customer_company_name_kh column');
    } else {
      console.log('✅ customer_company_name_kh column already exists');
    }

    // Add created_by field (API_INTEGRATION, MANUAL, etc.)
    const checkCreatedBy = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'e_invoices' 
      AND column_name = 'created_by'
    `);

    if (checkCreatedBy.length === 0) {
      console.log('Adding created_by column...');
      await db.execute(sql`
        ALTER TABLE e_invoices 
        ADD COLUMN created_by VARCHAR(50) DEFAULT 'MANUAL'
      `);
      console.log('✅ Added created_by column');
    } else {
      console.log('✅ created_by column already exists');
    }

    // Add document_type field (INVOICE, CREDIT_NOTE, DEBIT_NOTE)
    const checkDocumentType = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'e_invoices' 
      AND column_name = 'document_type'
    `);

    if (checkDocumentType.length === 0) {
      console.log('Adding document_type column...');
      await db.execute(sql`
        ALTER TABLE e_invoices 
        ADD COLUMN document_type VARCHAR(50) DEFAULT 'INVOICE'
      `);
      console.log('✅ Added document_type column');
    } else {
      console.log('✅ document_type column already exists');
    }

    // Add last_sync_at field for tracking when we last synced with CamInv
    const checkLastSyncAt = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'e_invoices'
      AND column_name = 'last_sync_at'
    `);

    if (checkLastSyncAt.length === 0) {
      console.log('Adding last_sync_at column...');
      await db.execute(sql`
        ALTER TABLE e_invoices
        ADD COLUMN last_sync_at TIMESTAMP
      `);
      console.log('✅ Added last_sync_at column');
    } else {
      console.log('✅ last_sync_at column already exists');
    }

    // Add remaining CamInv API fields
    const additionalFields = [
      { name: 'supplier_company_name_en', type: 'VARCHAR(255)', description: 'Supplier company name in English' },
      { name: 'supplier_vattin', type: 'VARCHAR(100)', description: 'Supplier VAT TIN' },
      { name: 'customer_company_name_en', type: 'VARCHAR(255)', description: 'Customer company name in English' },
      { name: 'customer_vattin', type: 'VARCHAR(100)', description: 'Customer VAT TIN' },
      { name: 'validated_at', type: 'TIMESTAMP', description: 'When document was validated by CamInv' }
    ];

    for (const field of additionalFields) {
      const checkField = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'e_invoices'
        AND column_name = ${field.name}
      `);

      if (checkField.length === 0) {
        console.log(`Adding ${field.name} column...`);
        await db.execute(sql`
          ALTER TABLE e_invoices
          ADD COLUMN ${sql.identifier(field.name)} ${sql.raw(field.type)}
        `);
        console.log(`✅ Added ${field.name} column`);
      } else {
        console.log(`✅ ${field.name} column already exists`);
      }
    }

    console.log('🎉 All CamInv API fields have been added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding CamInv fields:', error);
    throw error;
  }
}

// Run the script
addCamInvFields()
  .then(() => {
    console.log('✅ CamInv fields addition completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ CamInv fields addition failed:', error);
    process.exit(1);
  });
