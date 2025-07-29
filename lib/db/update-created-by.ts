import { db } from './drizzle';
import { eInvoices, users, camInvAuditLogs } from './schema';
import { eq, and, isNotNull } from 'drizzle-orm';

/**
 * Update existing invoices to have proper createdBy values
 * This script looks at audit logs to find who created each invoice
 */
export async function updateCreatedByFields() {
  try {
    console.log('🔄 Starting to update createdBy fields...');

    // Get all invoices with 'MANUAL' createdBy
    const invoicesWithManual = await db
      .select({
        id: eInvoices.id,
        invoiceNumber: eInvoices.invoiceNumber,
        createdAt: eInvoices.createdAt,
      })
      .from(eInvoices)
      .where(eq(eInvoices.createdBy, 'MANUAL'));

    console.log(`📊 Found ${invoicesWithManual.length} invoices with 'MANUAL' createdBy`);

    let updatedCount = 0;

    for (const invoice of invoicesWithManual) {
      // Look for audit log entry for this invoice creation
      const auditLog = await db
        .select({
          userId: camInvAuditLogs.userId,
        })
        .from(camInvAuditLogs)
        .where(
          and(
            eq(camInvAuditLogs.entityType, 'invoice'),
            eq(camInvAuditLogs.entityId, invoice.id),
            eq(camInvAuditLogs.action, 'INVOICE_CREATED'),
            isNotNull(camInvAuditLogs.userId)
          )
        )
        .limit(1);

      if (auditLog.length > 0 && auditLog[0].userId) {
        // Get user information
        const user = await db
          .select({
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, auditLog[0].userId))
          .limit(1);

        if (user.length > 0) {
          const createdByValue = user[0].name || user[0].email || 'MANUAL';
          
          // Update the invoice
          await db
            .update(eInvoices)
            .set({ createdBy: createdByValue })
            .where(eq(eInvoices.id, invoice.id));

          console.log(`✅ Updated invoice ${invoice.invoiceNumber} - createdBy: ${createdByValue}`);
          updatedCount++;
        }
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} invoices`);
    return { success: true, updatedCount };

  } catch (error) {
    console.error('❌ Error updating createdBy fields:', error);
    return { success: false, error };
  }
}

// Run the update if this file is executed directly
if (require.main === module) {
  updateCreatedByFields()
    .then((result) => {
      if (result.success) {
        console.log(`✨ Migration completed successfully! Updated ${result.updatedCount} records.`);
      } else {
        console.error('💥 Migration failed:', result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}
