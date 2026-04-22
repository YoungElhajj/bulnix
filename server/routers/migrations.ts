/**
 * One-time migration runner procedure — admin only, runs all pending migrations
 * This is a temporary procedure to apply pending schema migrations to the live DB.
 */
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const migrationsRouter = router({
  runPending: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const migrations: { name: string; sql: string[] }[] = [
      {
        name: "0001_main_tables",
        sql: [
          `CREATE TABLE IF NOT EXISTS \`admin_actions\` (\`id\` int AUTO_INCREMENT NOT NULL, \`adminId\` int NOT NULL, \`action\` varchar(256) NOT NULL, \`targetType\` varchar(64), \`targetId\` int, \`details\` json, \`ipAddress\` varchar(64), \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`admin_actions_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`categories\` (\`id\` int AUTO_INCREMENT NOT NULL, \`slug\` varchar(128) NOT NULL, \`name\` varchar(256) NOT NULL, \`description\` text, \`imageUrl\` text, \`parentId\` int, \`isVisible\` boolean NOT NULL DEFAULT true, \`sortOrder\` int NOT NULL DEFAULT 0, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`categories_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`categories_slug_unique\` UNIQUE(\`slug\`))`,
          `CREATE TABLE IF NOT EXISTS \`coupons\` (\`id\` int AUTO_INCREMENT NOT NULL, \`code\` varchar(64) NOT NULL, \`discountType\` enum('percent','fixed_usd') NOT NULL, \`discountValue\` decimal(10,2) NOT NULL, \`maxUses\` int, \`usedCount\` int NOT NULL DEFAULT 0, \`minOrderUSD\` decimal(10,2) DEFAULT '0.00', \`expiresAt\` timestamp, \`isActive\` boolean NOT NULL DEFAULT true, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`coupons_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`coupons_code_unique\` UNIQUE(\`code\`))`,
          `CREATE TABLE IF NOT EXISTS \`exchange_rates\` (\`id\` int AUTO_INCREMENT NOT NULL, \`fromCurrency\` varchar(8) NOT NULL, \`toCurrency\` varchar(8) NOT NULL, \`rate\` decimal(18,6) NOT NULL, \`source\` varchar(64) NOT NULL DEFAULT 'manual', \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`exchange_rates_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`fulfillment_records\` (\`id\` int AUTO_INCREMENT NOT NULL, \`orderId\` int NOT NULL, \`orderItemId\` int, \`providerKey\` varchar(64) NOT NULL, \`supplierOrderId\` varchar(256), \`status\` enum('pending','success','failed','partial') NOT NULL, \`deliveryData\` text, \`rawResponse\` json, \`errorMessage\` text, \`userViewed\` boolean NOT NULL DEFAULT false, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`fulfillment_records_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`notifications\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`type\` varchar(64) NOT NULL, \`title\` varchar(256) NOT NULL, \`message\` text NOT NULL, \`isRead\` boolean NOT NULL DEFAULT false, \`relatedOrderId\` int, \`relatedTicketId\` int, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`notifications_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`order_items\` (\`id\` int AUTO_INCREMENT NOT NULL, \`orderId\` int NOT NULL, \`productId\` int NOT NULL, \`productTitle\` varchar(512) NOT NULL, \`quantity\` int NOT NULL, \`unitPriceUSD\` decimal(18,2) NOT NULL, \`totalPriceUSD\` decimal(18,2) NOT NULL, \`supplierProductId\` varchar(256), \`providerKey\` varchar(64), \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`order_items_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`orders\` (\`id\` int AUTO_INCREMENT NOT NULL, \`orderNumber\` varchar(64) NOT NULL, \`userId\` int NOT NULL, \`status\` enum('pending_payment','paid','processing','fulfilled','partial','failed','cancelled','refunded','disputed') NOT NULL DEFAULT 'pending_payment', \`subtotalUSD\` decimal(18,2) NOT NULL, \`discountUSD\` decimal(18,2) NOT NULL DEFAULT '0.00', \`totalUSD\` decimal(18,2) NOT NULL, \`currency\` enum('NGN','USD','EUR','GBP') NOT NULL DEFAULT 'USD', \`totalInCurrency\` decimal(18,2) NOT NULL, \`exchangeRateSnapshot\` decimal(18,6), \`couponCode\` varchar(64), \`couponDiscountUSD\` decimal(18,2) DEFAULT '0.00', \`billingEmail\` varchar(320), \`billingCountry\` varchar(64), \`fraudFlag\` boolean NOT NULL DEFAULT false, \`fraudReason\` text, \`isLocked\` boolean NOT NULL DEFAULT false, \`adminNotes\` text, \`supplierOrderId\` varchar(256), \`supplierStatus\` varchar(64), \`fulfillmentRetries\` int NOT NULL DEFAULT 0, \`lastFulfillmentAttempt\` timestamp, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`orders_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`orders_orderNumber_unique\` UNIQUE(\`orderNumber\`))`,
          `CREATE TABLE IF NOT EXISTS \`payment_events\` (\`id\` int AUTO_INCREMENT NOT NULL, \`paymentId\` int, \`orderId\` int, \`gateway\` varchar(64) NOT NULL, \`eventType\` varchar(128) NOT NULL, \`payload\` json, \`isProcessed\` boolean NOT NULL DEFAULT false, \`isDuplicate\` boolean NOT NULL DEFAULT false, \`processedAt\` timestamp, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`payment_events_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`payments\` (\`id\` int AUTO_INCREMENT NOT NULL, \`orderId\` int NOT NULL, \`userId\` int NOT NULL, \`gateway\` varchar(64) NOT NULL, \`gatewayReference\` varchar(256), \`gatewayTransactionId\` varchar(256), \`status\` enum('pending','success','failed','refunded','disputed') NOT NULL DEFAULT 'pending', \`amount\` decimal(18,2) NOT NULL, \`currency\` enum('NGN','USD','EUR','GBP') NOT NULL, \`amountUSD\` decimal(18,2), \`exchangeRate\` decimal(18,6), \`paymentMethod\` varchar(64), \`metadata\` json, \`webhookVerified\` boolean NOT NULL DEFAULT false, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`payments_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`payments_gatewayReference_unique\` UNIQUE(\`gatewayReference\`))`,
          `CREATE TABLE IF NOT EXISTS \`products\` (\`id\` int AUTO_INCREMENT NOT NULL, \`slug\` varchar(256) NOT NULL, \`supplierProductId\` varchar(256), \`providerKey\` varchar(64) NOT NULL, \`categoryId\` int, \`title\` varchar(512) NOT NULL, \`description\` text, \`shortDescription\` text, \`imageUrl\` text, \`tags\` json, \`supplierPrice\` decimal(18,8) NOT NULL, \`supplierCurrency\` varchar(16) NOT NULL DEFAULT 'USD', \`markupPercent\` decimal(10,2) NOT NULL DEFAULT '20.00', \`customerPriceUSD\` decimal(18,2) NOT NULL, \`customerPriceNGN\` decimal(18,2), \`stockQuantity\` int NOT NULL DEFAULT 0, \`stockUnlimited\` boolean NOT NULL DEFAULT false, \`isVisible\` boolean NOT NULL DEFAULT true, \`isFeatured\` boolean NOT NULL DEFAULT false, \`isDigital\` boolean NOT NULL DEFAULT true, \`regionRestrictions\` json, \`allowedPaymentMethods\` json, \`riskFlag\` boolean NOT NULL DEFAULT false, \`requiresAgeVerification\` boolean NOT NULL DEFAULT false, \`deliveryNote\` text, \`refundPolicy\` text, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`products_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`products_slug_unique\` UNIQUE(\`slug\`))`,
          `CREATE TABLE IF NOT EXISTS \`provider_configs\` (\`id\` int AUTO_INCREMENT NOT NULL, \`providerKey\` varchar(64) NOT NULL, \`displayName\` varchar(128) NOT NULL, \`baseUrl\` text NOT NULL, \`apiKey\` text, \`webhookSecret\` text, \`isEnabled\` boolean NOT NULL DEFAULT true, \`syncIntervalMinutes\` int NOT NULL DEFAULT 30, \`lastSyncAt\` timestamp, \`defaultMarkupPercent\` decimal(10,2) NOT NULL DEFAULT '20.00', \`settings\` json, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`provider_configs_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`provider_configs_providerKey_unique\` UNIQUE(\`providerKey\`))`,
          `CREATE TABLE IF NOT EXISTS \`provider_sync_logs\` (\`id\` int AUTO_INCREMENT NOT NULL, \`providerKey\` varchar(64) NOT NULL, \`syncType\` enum('categories','products','stock','prices','full') NOT NULL, \`status\` enum('running','success','failed','partial') NOT NULL, \`itemsSynced\` int DEFAULT 0, \`itemsFailed\` int DEFAULT 0, \`errorMessage\` text, \`startedAt\` timestamp NOT NULL DEFAULT (now()), \`completedAt\` timestamp, CONSTRAINT \`provider_sync_logs_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`saved_products\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`productId\` int NOT NULL, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`saved_products_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`supplier_products\` (\`id\` int AUTO_INCREMENT NOT NULL, \`providerKey\` varchar(64) NOT NULL, \`supplierProductId\` varchar(256) NOT NULL, \`supplierCategoryId\` varchar(128), \`supplierSlug\` varchar(256), \`rawTitle\` text, \`rawDescription\` text, \`rawPrice\` decimal(18,8), \`rawCurrency\` varchar(16), \`rawStock\` int DEFAULT 0, \`rawData\` json, \`lastSyncedAt\` timestamp NOT NULL DEFAULT (now()), \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`supplier_products_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`support_tickets\` (\`id\` int AUTO_INCREMENT NOT NULL, \`ticketNumber\` varchar(32) NOT NULL, \`userId\` int NOT NULL, \`orderId\` int, \`subject\` varchar(512) NOT NULL, \`status\` enum('open','pending','resolved','closed') NOT NULL DEFAULT 'open', \`priority\` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium', \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, \`resolvedAt\` timestamp, CONSTRAINT \`support_tickets_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`support_tickets_ticketNumber_unique\` UNIQUE(\`ticketNumber\`))`,
          `CREATE TABLE IF NOT EXISTS \`system_logs\` (\`id\` int AUTO_INCREMENT NOT NULL, \`level\` enum('info','warn','error','critical') NOT NULL, \`category\` varchar(64) NOT NULL, \`message\` text NOT NULL, \`details\` json, \`userId\` int, \`orderId\` int, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`system_logs_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`ticket_messages\` (\`id\` int AUTO_INCREMENT NOT NULL, \`ticketId\` int NOT NULL, \`senderId\` int NOT NULL, \`senderRole\` enum('user','admin') NOT NULL, \`message\` text NOT NULL, \`attachmentUrl\` text, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`ticket_messages_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`user_sessions\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`sessionToken\` varchar(256) NOT NULL, \`ipAddress\` varchar(64), \`userAgent\` text, \`expiresAt\` timestamp NOT NULL, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`user_sessions_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`user_sessions_sessionToken_unique\` UNIQUE(\`sessionToken\`))`,
          // users columns
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`username\` varchar(64)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`passwordHash\` text`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`country\` varchar(64)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`referralCode\` varchar(32)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`referredBy\` varchar(32)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`emailVerified\` boolean DEFAULT false NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`emailVerifyToken\` varchar(128)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`passwordResetToken\` varchar(128)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`passwordResetExpiry\` timestamp`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`isSuspended\` boolean DEFAULT false NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`suspendedReason\` text`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`twoFactorEnabled\` boolean DEFAULT false NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`twoFactorSecret\` varchar(64)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`notifyEmail\` boolean DEFAULT true NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`notifyOrders\` boolean DEFAULT true NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`preferredCurrency\` enum('NGN','USD','EUR','GBP') DEFAULT 'USD' NOT NULL`,
        ],
      },
      {
        name: "0002_wallets",
        sql: [
          `CREATE TABLE IF NOT EXISTS \`wallet_transactions\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`type\` enum('deposit','spend','refund','adjustment') NOT NULL, \`amountUSD\` decimal(18,6) NOT NULL, \`balanceAfterUSD\` decimal(18,6) NOT NULL, \`description\` varchar(512) NOT NULL, \`reference\` varchar(256), \`orderId\` int, \`paymentId\` int, \`status\` enum('pending','completed','failed','reversed') NOT NULL DEFAULT 'completed', \`gateway\` varchar(64), \`gatewayRef\` varchar(256), \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`wallet_transactions_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`wallets\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`balanceUSD\` decimal(18,6) NOT NULL DEFAULT '0.000000', \`totalDeposited\` decimal(18,6) NOT NULL DEFAULT '0.000000', \`totalSpent\` decimal(18,6) NOT NULL DEFAULT '0.000000', \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`wallets_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`wallets_userId_unique\` UNIQUE(\`userId\`))`,
        ],
      },
      {
        name: "0003_supplier_refund_claims",
        sql: [
          `CREATE TABLE IF NOT EXISTS \`supplier_refund_claims\` (\`id\` int AUTO_INCREMENT NOT NULL, \`raisedByAdminId\` int NOT NULL, \`ticketId\` int, \`orderId\` int, \`providerKey\` varchar(64) NOT NULL, \`supplierOrderId\` varchar(256), \`claimAmountUSD\` decimal(18,6) NOT NULL, \`reason\` text NOT NULL, \`status\` enum('draft','submitted','acknowledged','approved','partially_approved','rejected','resolved','cancelled') NOT NULL DEFAULT 'draft', \`approvedAmountUSD\` decimal(18,6), \`supplierResponse\` text, \`supplierRefundRef\` varchar(256), \`adminNotes\` text, \`communicationLog\` json, \`creditedToCustomer\` boolean NOT NULL DEFAULT false, \`submittedAt\` timestamp, \`resolvedAt\` timestamp, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`supplier_refund_claims_id\` PRIMARY KEY(\`id\`))`,
        ],
      },
      {
        name: "0004_otp_columns",
        sql: [
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`otpCode\` varchar(6)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`otpExpiry\` timestamp`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`otpPurpose\` varchar(16)`,
        ],
      },
      {
        name: "0005_lastLoginIp",
        sql: [
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`lastLoginIp\` varchar(64)`,
        ],
      },
      {
        name: "0007_deliveryFormat",
        sql: [
          `ALTER TABLE \`products\` ADD COLUMN IF NOT EXISTS \`deliveryFormat\` text`,
        ],
      },
    ];

    const results: { migration: string; statement: string; status: string; error?: string }[] = [];

    for (const migration of migrations) {
      for (const sql of migration.sql) {
        try {
          await db.execute(sql as any);
          results.push({ migration: migration.name, statement: sql.slice(0, 60) + "...", status: "ok" });
        } catch (err: any) {
          // Ignore "already exists" and "duplicate column" errors
          const msg = err?.message ?? String(err);
          if (
            msg.includes("already exists") ||
            msg.includes("Duplicate column") ||
            msg.includes("Multiple primary key") ||
            msg.includes("Duplicate key name")
          ) {
            results.push({ migration: migration.name, statement: sql.slice(0, 60) + "...", status: "skipped (already exists)" });
          } else {
            results.push({ migration: migration.name, statement: sql.slice(0, 60) + "...", status: "error", error: msg });
          }
        }
      }
    }

    const errors = results.filter(r => r.status === "error");
    return {
      total: results.length,
      ok: results.filter(r => r.status === "ok").length,
      skipped: results.filter(r => r.status.startsWith("skipped")).length,
      errors: errors.length,
      errorDetails: errors,
      results,
    };
  }),
});
