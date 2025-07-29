-- Migration: Add original invoice reference columns for credit/debit notes
-- These columns are needed for billing references in credit notes and debit notes

ALTER TABLE e_invoices 
ADD COLUMN original_invoice_number VARCHAR(100),
ADD COLUMN original_invoice_uuid UUID;

-- Add comments for documentation
COMMENT ON COLUMN e_invoices.original_invoice_number IS 'Original invoice number for billing reference in credit/debit notes';
COMMENT ON COLUMN e_invoices.original_invoice_uuid IS 'Original invoice UUID for billing reference in credit/debit notes';
