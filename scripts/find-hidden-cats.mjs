import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

// Read DATABASE_URL from environment
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await createConnection(dbUrl);

const [rows] = await conn.execute(
  "SELECT id, name, slug, isVisible FROM categories WHERE isVisible = 0 ORDER BY name"
);

console.log(`Hidden categories (${rows.length}):`);
for (const row of rows) {
  console.log(`  ID: ${row.id} | Name: ${row.name} | Slug: ${row.slug}`);
}

if (rows.length === 0) {
  console.log("  (none hidden)");
  // Also show all categories to help debug
  const [all] = await conn.execute("SELECT id, name, slug, isVisible FROM categories ORDER BY name LIMIT 30");
  console.log("\nAll categories (first 30):");
  for (const row of all) {
    console.log(`  ID: ${row.id} | Name: ${row.name} | Visible: ${row.isVisible}`);
  }
}

await conn.end();
