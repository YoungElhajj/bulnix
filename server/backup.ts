/**
 * server/backup.ts
 * Automatic database backup: dumps all tables to SQL, uploads to S3, emails owner.
 */
import { getDb } from "./db";
import { storagePut } from "./storage";
import { safeSendEmail } from "./email";
import { logSystem } from "./db";
import { sql } from "drizzle-orm";

// All tables in dependency order (parents before children)
const TABLES = [
  "users",
  "wallets",
  "wallet_transactions",
  "exchange_rates",
  "categories",
  "products",
  "provider_configs",
  "provider_sync_logs",
  "supplier_products",
  "coupons",
  "orders",
  "order_items",
  "payments",
  "payment_events",
  "fulfillment_records",
  "support_tickets",
  "ticket_messages",
  "notifications",
  "user_sessions",
  "system_logs",
  "admin_actions",
  "saved_products",
  "supplier_refund_claims",
];

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
  // Strings and JSON
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  return `'${str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}'`;
}

async function dumpTable(tableName: string): Promise<string> {
  let output = `\n-- Table: ${tableName}\n`;
  try {
    const db = await getDb();
    if (!db) { output += `-- SKIPPED (no DB connection)\n`; return output; }
    // Get column info
    const columns = await db.execute(sql.raw(`SHOW COLUMNS FROM \`${tableName}\``));
    const colNames: string[] = (columns as any[]).map((c: any) => c.Field ?? c.field ?? Object.values(c)[0]);

    // Get all rows
    const rows = await db.execute(sql.raw(`SELECT * FROM \`${tableName}\``));
    const rowArr = rows as any[];

    if (rowArr.length === 0) {
      output += `-- (empty)\n`;
      return output;
    }

    output += `INSERT INTO \`${tableName}\` (\`${colNames.join("`, `")}\`) VALUES\n`;
    const valueLines = rowArr.map((row: any) => {
      const vals = colNames.map((col) => escapeValue(row[col]));
      return `  (${vals.join(", ")})`;
    });
    output += valueLines.join(",\n") + ";\n";
  } catch (err: any) {
    output += `-- SKIPPED (${err.message})\n`;
  }
  return output;
}

export async function runDatabaseBackup(): Promise<{ url: string; sizeKb: number; tableCount: number }> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "-"); // HH-MM-SS

  let sql_dump = `-- Bulnix Database Backup\n-- Date: ${now.toISOString()}\n-- Generated automatically by Bulnix backup system\n\nSET FOREIGN_KEY_CHECKS=0;\n`;

  let tableCount = 0;
  for (const table of TABLES) {
    sql_dump += await dumpTable(table);
    tableCount++;
  }

  sql_dump += `\nSET FOREIGN_KEY_CHECKS=1;\n-- End of backup\n`;

  const fileKey = `backups/bulnix-backup-${dateStr}-${timeStr}.sql`;
  const buffer = Buffer.from(sql_dump, "utf8");
  const sizeKb = Math.round(buffer.byteLength / 1024);

  const { url } = await storagePut(fileKey, buffer, "text/plain");

  // Email the owner
  const ownerEmail = process.env.EMAIL_FROM ?? process.env.OWNER_EMAIL ?? "";
  if (ownerEmail) {
    const backupUrl = url;
    const backupDate = now.toUTCString();
    const backupSize = sizeKb;
    const backupTables = tableCount;
    safeSendEmail(() => import("./email").then(m => m.sendBackupEmail({
      to: ownerEmail,
      date: backupDate,
      sizeKb: backupSize,
      tableCount: backupTables,
      downloadUrl: backupUrl,
    })));
  }

  await logSystem("info", "backup", `Daily backup complete: ${sizeKb} KB, ${tableCount} tables → ${url}`);

  return { url, sizeKb, tableCount };
}

export async function runDatabaseBackupSafe(): Promise<void> {
  try {
    const result = await runDatabaseBackup();
    console.log(`[Backup] ✅ Daily backup complete: ${result.sizeKb} KB, ${result.tableCount} tables`);
  } catch (err: any) {
    console.error(`[Backup] ❌ Daily backup failed:`, err.message);
    // Try to notify owner of failure
    try {
      const ownerEmail = process.env.EMAIL_FROM ?? "";
      if (ownerEmail) {
        const errMsg = err.message;
        safeSendEmail(() => import("./email").then(m => m.sendBackupFailedEmail({
          to: ownerEmail,
          errorMessage: errMsg,
          date: new Date().toISOString().slice(0, 10),
        })));
      }
    } catch (_) { /* ignore email failure */ }
    await logSystem("error", "backup", `Daily backup failed: ${err.message}`).catch(() => {});
  }
}
