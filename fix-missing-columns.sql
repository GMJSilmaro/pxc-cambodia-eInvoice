-- Fix missing columns in e_invoices table
-- Add original_invoice_number and original_invoice_uuid columns if they don't exist

DO $$
BEGIN
    -- Add original_invoice_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'e_invoices' 
        AND column_name = 'original_invoice_number'
    ) THEN
        ALTER TABLE e_invoices ADD COLUMN original_invoice_number VARCHAR(100);
        RAISE NOTICE 'Added original_invoice_number column';
    ELSE
        RAISE NOTICE 'original_invoice_number column already exists';
    END IF;

    -- Add original_invoice_uuid column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'e_invoices' 
        AND column_name = 'original_invoice_uuid'
    ) THEN
        ALTER TABLE e_invoices ADD COLUMN original_invoice_uuid UUID;
        RAISE NOTICE 'Added original_invoice_uuid column';
    ELSE
        RAISE NOTICE 'original_invoice_uuid column already exists';
    END IF;

    -- Add tax_category column to invoice_line_items if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_line_items' 
        AND column_name = 'tax_category'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN tax_category VARCHAR(10) DEFAULT 'S';
        RAISE NOTICE 'Added tax_category column';
    ELSE
        RAISE NOTICE 'tax_category column already exists';
    END IF;

    -- Add tax_scheme column to invoice_line_items if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_line_items' 
        AND column_name = 'tax_scheme'
    ) THEN
        ALTER TABLE invoice_line_items ADD COLUMN tax_scheme VARCHAR(20) DEFAULT 'VAT';
        RAISE NOTICE 'Added tax_scheme column';
    ELSE
        RAISE NOTICE 'tax_scheme column already exists';
    END IF;
END $$;
