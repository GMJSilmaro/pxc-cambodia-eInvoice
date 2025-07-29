ALTER TABLE "e_invoices" ADD COLUMN "supplier_id" varchar(100);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "supplier_company_name_kh" varchar(255);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "supplier_company_name_en" varchar(255);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "supplier_vattin" varchar(100);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "customer_id" varchar(100);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "customer_company_name_kh" varchar(255);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "customer_company_name_en" varchar(255);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "customer_vattin" varchar(100);--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "created_by" varchar(50) DEFAULT 'MANUAL';--> statement-breakpoint
ALTER TABLE "e_invoices" ADD COLUMN "validated_at" timestamp;