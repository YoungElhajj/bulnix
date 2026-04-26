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

function escapeVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (v instanceof Date) return `'${v.toISOString().replace('T', ' ').slice(0, 19)}'`;
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return v;
  if (Buffer.isBuffer(v)) return `'${v.toString()}'`;
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
}

// Exact column mapping for users table (new schema)
const usersColumns = [
  'id','openId','name','username','email','passwordHash','loginMethod','role',
  'country','signupCountry','signupIp','referralCode','referredBy',
  'emailVerified','emailVerifyToken','passwordResetToken','passwordResetExpiry',
  'otpCode','otpExpiry','otpPurpose',
  'isSuspended','suspendedReason','twoFactorEnabled','twoFactorSecret',
  'notifyEmail','notifyOrders','preferredCurrency',
  'createdAt','updatedAt','lastSignedIn','lastLoginIp'
];

// Old column name -> new column name mapping
const colMap = { 'otpExpiresAt': 'otpExpiry' };

const [oldRows] = await pool.query('SELECT * FROM `users`');

let sql = `SET FOREIGN_KEY_CHECKS=0;\n-- Table: users (${oldRows.length} rows)\n`;
const colList = usersColumns.map(c => `\`${c}\``).join(', ');

const values = oldRows.map(row => {
  const vals = usersColumns.map(col => {
    // Find value from old row (try direct match, then reverse map)
    const oldCol = Object.keys(colMap).find(k => colMap[k] === col) || col;
    const v = row[col] !== undefined ? row[col] : row[oldCol];
    return escapeVal(v);
  });
  return `  (${vals.join(', ')})`;
}).join(',\n');

sql += `INSERT INTO \`users\` (${colList}) VALUES\n${values};\nSET FOREIGN_KEY_CHECKS=1;\n`;
writeFileSync('/home/ubuntu/users_clean.sql', sql);
console.log(`✓ users_clean.sql written (${sql.length} bytes)`);

// Now export all other tables normally
const otherTables = [
  'wallets','wallet_transactions','orders','order_items',
  'payments','payment_events','fulfillment_records',
  'support_tickets','ticket_messages','admin_actions'
];

for (const table of otherTables) {
  const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
  if (!rows.length) { console.log(`- ${table}: empty`); continue; }
  const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
  let tsql = `SET FOREIGN_KEY_CHECKS=0;\n-- Table: ${table} (${rows.length} rows)\n`;
  const vals = rows.map(row => `  (${Object.values(row).map(escapeVal).join(', ')})`).join(',\n');
  tsql += `INSERT INTO \`${table}\` (${cols}) VALUES\n${vals};\nSET FOREIGN_KEY_CHECKS=1;\n`;
  writeFileSync(`/home/ubuntu/${table}_clean.sql`, tsql);
  console.log(`✓ ${table}_clean.sql (${tsql.length} bytes)`);
}

await pool.end();
console.log('Done!');
