import { createPool } from 'mysql2/promise';
import { writeFileSync } from 'fs';

const pool = createPool({
  host: 'gateway04.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2xomvQyHT3Pc2eM.33c921a427fa',
  password: '7Ipn1cvu5CPB9mFtV98w',
  database: '6qKkSV9dybS3AerhXhrTfQ',
  ssl: { rejectUnauthorized: false }
});

// Essential tables only (no system_logs, no user_sessions)
const tables = [
  'users',
  'wallets',
  'wallet_transactions',
  'orders',
  'order_items',
  'payments',
  'payment_events',
  'fulfillment_records',
  'saved_products',
  'supplier_refund_claims',
  'support_tickets',
  'ticket_messages',
  'notifications',
  'admin_actions',
];

let sql = `-- Bulnix essential data export\n-- Generated: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

for (const table of tables) {
  try {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    if (!rows.length) {
      sql += `-- Table ${table}: empty\n\n`;
      continue;
    }
    sql += `-- Table: ${table} (${rows.length} rows)\n`;
    
    const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const values = chunk.map(row => {
        const vals = Object.values(row).map(v => {
          if (v === null || v === undefined) return 'NULL';
          if (v instanceof Date) return `'${v.toISOString().replace('T', ' ').slice(0, 19)}'`;
          if (typeof v === 'boolean') return v ? '1' : '0';
          if (typeof v === 'number') return v;
          if (Buffer.isBuffer(v)) return `'${v.toString()}'`;
          return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
        });
        return `(${vals.join(', ')})`;
      }).join(',\n  ');
      sql += `INSERT INTO \`${table}\` (${cols}) VALUES\n  ${values};\n`;
    }
    sql += '\n';
    console.log(`✓ Exported ${table}: ${rows.length} rows`);
  } catch (e) {
    console.error(`✗ Error exporting ${table}: ${e.message}`);
  }
}

sql += `SET FOREIGN_KEY_CHECKS=1;\n`;
writeFileSync('/home/ubuntu/bulnix_essential.sql', sql);
console.log('\nExport complete: /home/ubuntu/bulnix_essential.sql');
await pool.end();
