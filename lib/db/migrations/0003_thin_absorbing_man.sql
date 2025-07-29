ALTER TABLE "caminv_merchants" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "client_secret" text;--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "original_invoice_number" varchar(100);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "original_invoice_uuid" uuid;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD COLUMN "tax_category" varchar(10) DEFAULT 'S';--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD COLUMN "tax_scheme" varchar(20) DEFAULT 'VAT';