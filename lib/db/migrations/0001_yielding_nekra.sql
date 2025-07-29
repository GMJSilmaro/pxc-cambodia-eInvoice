CREATE TABLE "caminv_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"details" json,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caminv_merchants" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"merchant_id" varchar(255) NOT NULL,
	"merchant_name" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"registration_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caminv_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"event_data" json NOT NULL,
	"invoice_id" integer,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "e_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"merchant_id" integer NOT NULL,
	"invoice_uuid" uuid NOT NULL,
	"invoice_number" varchar(100) NOT NULL,
	"invoice_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"direction" varchar(20) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_tax_id" varchar(100),
	"customer_email" varchar(255),
	"customer_address" text,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp,
	"currency" varchar(10) DEFAULT 'KHR' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"ubl_xml" text,
	"pdf_path" varchar(500),
	"qr_code" text,
	"verification_url" varchar(500),
	"caminv_status" varchar(50),
	"caminv_response" json,
	"submitted_at" timestamp,
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"original_invoice_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "e_invoices_invoice_uuid_unique" UNIQUE("invoice_uuid")
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"item_description" text,
	"quantity" numeric(10, 3) NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"line_total" numeric(15, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "caminv_audit_logs" ADD CONSTRAINT "caminv_audit_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caminv_audit_logs" ADD CONSTRAINT "caminv_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caminv_merchants" ADD CONSTRAINT "caminv_merchants_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caminv_webhook_events" ADD CONSTRAINT "caminv_webhook_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caminv_webhook_events" ADD CONSTRAINT "caminv_webhook_events_invoice_id_e_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."e_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "e_invoices" ADD CONSTRAINT "e_invoices_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "e_invoices" ADD CONSTRAINT "e_invoices_merchant_id_caminv_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."caminv_merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_e_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."e_invoices"("id") ON DELETE no action ON UPDATE no action;