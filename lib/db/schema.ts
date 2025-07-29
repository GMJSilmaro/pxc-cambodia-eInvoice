import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  json,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  camInvMerchants: many(camInvMerchants),
  eInvoices: many(eInvoices),
  camInvWebhookEvents: many(camInvWebhookEvents),
  camInvAuditLogs: many(camInvAuditLogs),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));



// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};



// CamInv Merchant Credentials - stores encrypted OAuth tokens
export const camInvMerchants = pgTable('caminv_merchants', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  merchantId: varchar('merchant_id', { length: 255 }).notNull(), // CamInv merchant ID
  merchantName: varchar('merchant_name', { length: 255 }).notNull(),

  // Client credentials (encrypted)
  clientId: text('client_id'), // Encrypted CamInv Client ID
  clientSecret: text('client_secret'), // Encrypted CamInv Client Secret

  // OAuth tokens (encrypted)
  accessToken: text('access_token'), // Encrypted
  refreshToken: text('refresh_token'), // Encrypted
  tokenExpiresAt: timestamp('token_expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  registrationStatus: varchar('registration_status', { length: 50 }).notNull().default('pending'), // pending, active, suspended
  lastSyncAt: timestamp('last_sync_at'),

  // Complete fields from CamInv API business_info response
  endpointId: varchar('endpoint_id', { length: 255 }), // CamInv endpoint_id (e.g., KHUID00001234)
  mocId: varchar('moc_id', { length: 255 }), // Ministry of Commerce ID
  companyNameEn: varchar('company_name_en', { length: 255 }), // English company name
  companyNameKh: varchar('company_name_kh', { length: 255 }), // Khmer company name
  tin: varchar('tin', { length: 50 }), // Tax Identification Number
  dateOfIncorporation: timestamp('date_of_incorporation'), // Date of incorporation
  businessType: varchar('business_type', { length: 100 }), // Type of business
  city: varchar('city', { length: 100 }), // City
  country: varchar('country', { length: 10 }).default('KH'), // Country code (KH for Cambodia)
  phoneNumber: varchar('phone_number', { length: 50 }), // Phone number
  email: varchar('email', { length: 255 }), // Email address
  businessInfo: json('business_info'), // Store complete business_info response

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// E-Invoices table
export const eInvoices = pgTable('e_invoices', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  merchantId: integer('merchant_id')
    .notNull()
    .references(() => camInvMerchants.id),
  invoiceUuid: uuid('invoice_uuid').notNull().unique(), // CamInv UUID
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
  invoiceType: varchar('invoice_type', { length: 50 }).notNull(), // 'invoice', 'credit_note', 'debit_note'
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, submitted, sent, accepted, rejected, cancelled
  direction: varchar('direction', { length: 20 }).notNull(), // 'outgoing', 'incoming'

  // Customer/Supplier Information
  supplierName: varchar('supplier_name', { length: 255 }).notNull(),
  supplierTaxId: varchar('supplier_tax_id', { length: 100 }),
  supplierEmail: varchar('supplier_email', { length: 255 }),
  supplierAddress: text('supplier_address'),

  // Enhanced CamInv Supplier Fields
  supplierId: varchar('supplier_id', { length: 100 }), // CamInv endpoint ID
  supplierCompanyNameKh: varchar('supplier_company_name_kh', { length: 255 }), // Khmer name
  supplierCompanyNameEn: varchar('supplier_company_name_en', { length: 255 }), // English name
  supplierVattin: varchar('supplier_vattin', { length: 100 }), // VAT TIN

  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerTaxId: varchar('customer_tax_id', { length: 100 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerAddress: text('customer_address'),

  // Enhanced CamInv Customer Fields
  customerId: varchar('customer_id', { length: 100 }), // CamInv endpoint ID
  customerCompanyNameKh: varchar('customer_company_name_kh', { length: 255 }), // Khmer name
  customerCompanyNameEn: varchar('customer_company_name_en', { length: 255 }), // English name
  customerVattin: varchar('customer_vattin', { length: 100 }), // VAT TIN

  // Invoice Details
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date'),
  currency: varchar('currency', { length: 10 }).notNull().default('KHR'),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),

  // UBL XML and Documents
  ublXml: text('ubl_xml'), // Generated UBL XML
  pdfPath: varchar('pdf_path', { length: 500 }), // Path to generated PDF
  qrCode: text('qr_code'), // QR code data for verification
  verificationUrl: varchar('verification_url', { length: 500 }), // CamInv verification URL

  // CamInv Integration
  camInvStatus: varchar('caminv_status', { length: 50 }), // CamInv specific status
  camInvResponse: json('caminv_response'), // Store API responses
  documentId: varchar('document_id', { length: 255 }), // CamInv document_id from submission
  verificationLink: varchar('verification_link', { length: 500 }), // CamInv verification URL
  pdfFile: varchar('pdf_file', { length: 500 }), // Path to generated PDF file
  submittedAt: timestamp('submitted_at'),
  sentAt: timestamp('sent_at'),
  acceptedAt: timestamp('accepted_at'),
  rejectedAt: timestamp('rejected_at'),
  rejectionReason: text('rejection_reason'),

  // Enhanced CamInv API Fields
  createdBy: varchar('created_by', { length: 50 }).default('MANUAL'), // API_INTEGRATION or MANUAL
  validatedAt: timestamp('validated_at'), // When document was validated by CamInv

  // Reference for credit/debit notes
  originalInvoiceId: integer('original_invoice_id'),
  originalInvoiceNumber: varchar('original_invoice_number', { length: 100 }), // For billing reference
  originalInvoiceUuid: uuid('original_invoice_uuid'), // For billing reference UUID

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Invoice Line Items
export const invoiceLineItems = pgTable('invoice_line_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => eInvoices.id),
  lineNumber: integer('line_number').notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  itemDescription: text('item_description'),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  lineTotal: decimal('line_total', { precision: 15, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  taxCategory: varchar('tax_category', { length: 10 }).default('S'), // Tax category (S, Z, E, etc.)
  taxScheme: varchar('tax_scheme', { length: 20 }).default('VAT'), // Tax scheme (VAT, GST, etc.)
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// CamInv Webhook Events
export const camInvWebhookEvents = pgTable('caminv_webhook_events', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  eventType: varchar('event_type', { length: 100 }).notNull(), // invoice_received, status_updated, etc.
  eventData: json('event_data').notNull(), // Raw webhook payload
  invoiceId: integer('invoice_id').references(() => eInvoices.id),
  processed: boolean('processed').notNull().default(false),
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// CamInv Audit Logs
export const camInvAuditLogs = pgTable('caminv_audit_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // submit_invoice, accept_invoice, etc.
  entityType: varchar('entity_type', { length: 50 }).notNull(), // invoice, merchant, etc.
  entityId: integer('entity_id'), // ID of the affected entity
  details: json('details'), // Additional action details
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  // CamInv Activities
  CAMINV_MERCHANT_CONNECTED = 'CAMINV_MERCHANT_CONNECTED',
  CAMINV_INVOICE_SUBMITTED = 'CAMINV_INVOICE_SUBMITTED',
  CAMINV_INVOICE_SENT = 'CAMINV_INVOICE_SENT',
  CAMINV_INVOICE_ACCEPTED = 'CAMINV_INVOICE_ACCEPTED',
  CAMINV_INVOICE_REJECTED = 'CAMINV_INVOICE_REJECTED',
}

// CamInv Type exports
export type CamInvMerchant = typeof camInvMerchants.$inferSelect;
export type NewCamInvMerchant = typeof camInvMerchants.$inferInsert;
export type EInvoice = typeof eInvoices.$inferSelect;
export type NewEInvoice = typeof eInvoices.$inferInsert;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert;
export type CamInvWebhookEvent = typeof camInvWebhookEvents.$inferSelect;
export type NewCamInvWebhookEvent = typeof camInvWebhookEvents.$inferInsert;
export type CamInvAuditLog = typeof camInvAuditLogs.$inferSelect;
export type NewCamInvAuditLog = typeof camInvAuditLogs.$inferInsert;

// CamInv Relations
export const camInvMerchantsRelations = relations(camInvMerchants, ({ one, many }) => ({
  team: one(teams, {
    fields: [camInvMerchants.teamId],
    references: [teams.id],
  }),
  eInvoices: many(eInvoices),
}));

export const eInvoicesRelations = relations(eInvoices, ({ one, many }) => ({
  team: one(teams, {
    fields: [eInvoices.teamId],
    references: [teams.id],
  }),
  merchant: one(camInvMerchants, {
    fields: [eInvoices.merchantId],
    references: [camInvMerchants.id],
  }),
  originalInvoice: one(eInvoices, {
    fields: [eInvoices.originalInvoiceId],
    references: [eInvoices.id],
  }),
  lineItems: many(invoiceLineItems),
  webhookEvents: many(camInvWebhookEvents),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(eInvoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [eInvoices.id],
  }),
}));

export const camInvWebhookEventsRelations = relations(camInvWebhookEvents, ({ one }) => ({
  team: one(teams, {
    fields: [camInvWebhookEvents.teamId],
    references: [teams.id],
  }),
  invoice: one(eInvoices, {
    fields: [camInvWebhookEvents.invoiceId],
    references: [eInvoices.id],
  }),
}));

export const camInvAuditLogsRelations = relations(camInvAuditLogs, ({ one }) => ({
  team: one(teams, {
    fields: [camInvAuditLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [camInvAuditLogs.userId],
    references: [users.id],
  }),
}));
