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

// Tables to export (in dependency order)
const tables = [
  'users',
  'user_sessions',
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
  'system_logs',
];

let sql = `-- Bulnix data export from TiDB\n-- Generated: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

for (const table of tables) {
  try {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    if (!rows.length) {
      sql += `-- Table ${table}: empty\n\n`;
      continue;
    }
    sql += `-- Table: ${table} (${rows.length} rows)\n`;
    sql += `TRUNCATE TABLE \`${table}\`;\n`;
    
    const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const values = chunk.map(row => {
        const vals = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (v instanceof Date) return `'${v.toISOString().replace('T', ' ').replace('Z', '')}'`;
          if (typeof v === 'boolean') return v ? '1' : '0';
          if (typeof v === 'number') return v;
          return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
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
writeFileSync('/home/ubuntu/bulnix_data_export.sql', sql);
console.log('\nExport complete: /home/ubuntu/bulnix_data_export.sql');
await pool.end();
