import { db } from './drizzle';
import { sql } from 'drizzle-orm';

async function addMissingColumns() {
  console.log('🔧 Checking and adding missing columns...');

  try {
    // Check if original_invoice_number column exists
    const checkOriginalInvoiceNumber = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'e_invoices' 
      AND column_name = 'original_invoice_number'
    `);

    if (checkOriginalInvoiceNumber.length === 0) {
      console.log('Adding original_invoice_number column...');
      await db.execute(sql`
        ALTER TABLE e_invoices 
        ADD COLUMN original_invoice_number VARCHAR(100)
      `);
      console.log('✅ Added original_invoice_number column');
    } else {
      console.log('✅ original_invoice_number column already exists');
    }

    // Check if original_invoice_uuid column exists
    const checkOriginalInvoiceUuid = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'e_invoices' 
      AND column_name = 'original_invoice_uuid'
    `);

    if (checkOriginalInvoiceUuid.length === 0) {
      console.log('Adding original_invoice_uuid column...');
      await db.execute(sql`
        ALTER TABLE e_invoices 
        ADD COLUMN original_invoice_uuid UUID
      `);
      console.log('✅ Added original_invoice_uuid column');
    } else {
      console.log('✅ original_invoice_uuid column already exists');
    }

    // Check if tax_category column exists in invoice_line_items
    const checkTaxCategory = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoice_line_items' 
      AND column_name = 'tax_category'
    `);

    if (checkTaxCategory.length === 0) {
      console.log('Adding tax_category column...');
      await db.execute(sql`
        ALTER TABLE invoice_line_items 
        ADD COLUMN tax_category VARCHAR(10) DEFAULT 'S'
      `);
      console.log('✅ Added tax_category column');
    } else {
      console.log('✅ tax_category column already exists');
    }

    // Check if tax_scheme column exists in invoice_line_items
    const checkTaxScheme = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoice_line_items' 
      AND column_name = 'tax_scheme'
    `);

    if (checkTaxScheme.length === 0) {
      console.log('Adding tax_scheme column...');
      await db.execute(sql`
        ALTER TABLE invoice_line_items 
        ADD COLUMN tax_scheme VARCHAR(20) DEFAULT 'VAT'
      `);
      console.log('✅ Added tax_scheme column');
    } else {
      console.log('✅ tax_scheme column already exists');
    }

    console.log('🎉 All missing columns have been checked and added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding missing columns:', error);
    throw error;
  }
}

// Run the script
addMissingColumns()
  .then(() => {
    console.log('✅ Database column fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database column fix failed:', error);
    process.exit(1);
  });
