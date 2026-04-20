import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('DATABASE_URL not set'); process.exit(1); }

const conn = await createConnection(dbUrl);

const migrations = [
  '0001_melted_christian_walker.sql',
  '0002_lyrical_annihilus.sql',
  '0003_giant_the_watchers.sql',
  '0004_illegal_xavin.sql',
  '0005_talented_betty_brant.sql',
  '0006_high_whirlwind.sql',
];

for (const file of migrations) {
  console.log(`\n=== Applying ${file} ===`);
  const sql = readFileSync(`/home/ubuntu/bulnix/drizzle/${file}`, 'utf8');
  // Split on statement breakpoints and semicolons
  const statements = sql
    .split(/--> statement-breakpoint/)
    .flatMap(s => s.split(/;\s*\n/))
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    const cleanStmt = stmt.endsWith(';') ? stmt : stmt + ';';
    try {
      await conn.query(cleanStmt);
      console.log(`  OK: ${cleanStmt.substring(0, 60).replace(/\n/g,' ')}...`);
    } catch (err) {
      if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME' || 
          err.code === 'ER_DUP_KEYNAME' || err.errno === 1060 || err.errno === 1061 || err.errno === 1050) {
        console.log(`  SKIP (already exists): ${cleanStmt.substring(0, 60).replace(/\n/g,' ')}...`);
      } else {
        console.error(`  ERROR: ${err.message}\n  SQL: ${cleanStmt.substring(0, 120)}`);
      }
    }
  }
}

await conn.end();
console.log('\n✅ All migrations processed.');
