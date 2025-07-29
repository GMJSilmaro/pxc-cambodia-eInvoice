ALTER TABLE "caminv_merchants" ADD COLUMN "endpoint_id" varchar(255);--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "moc_id" varchar(255);--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "company_name_en" varchar(255);--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "company_name_kh" varchar(255);--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "tin" varchar(50);--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "date_of_incorporation" timestamp;--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "business_type" varchar(100);--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "country" varchar(10) DEFAULT 'KH';--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "phone_number" varchar(50);--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD COLUMN "business_info" json;--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "supplier_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "supplier_tax_id" varchar(100);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "supplier_email" varchar(255);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "supplier_address" text;--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "document_id" varchar(255);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "verification_link" varchar(500);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "pdf_file" varchar(500);