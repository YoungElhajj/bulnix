import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Find Snapchat and Discord categories
const [cats] = await conn.query(
  "SELECT id, name, slug FROM categories WHERE name LIKE '%snap%' OR name LIKE '%discord%' OR name LIKE '%Snap%' OR name LIKE '%Discord%'"
);
console.log("=== Snapchat / Discord categories ===");
console.table(cats);

// Count products in each
for (const cat of cats) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) as cnt FROM products WHERE categoryId = ?",
    [cat.id]
  );
  console.log(`  ${cat.name} (id=${cat.id}): ${rows[0].cnt} products`);
}

// Sample products in Snapchat category
const snapCat = cats.find(c => c.name.toLowerCase().includes("snap"));
if (snapCat) {
  const [prods] = await conn.query(
    "SELECT id, title, categoryId FROM products WHERE categoryId = ? LIMIT 20",
    [snapCat.id]
  );
  console.log(`\n=== Products in ${snapCat.name} ===`);
  console.table(prods);
}

// Sample products in Discord category
const discordCat = cats.find(c => c.name.toLowerCase().includes("discord"));
if (discordCat) {
  const [prods] = await conn.query(
    "SELECT id, title, categoryId FROM products WHERE categoryId = ? LIMIT 20",
    [discordCat.id]
  );
  console.log(`\n=== Products in ${discordCat.name} ===`);
  console.table(prods);
}

// Check for products with "snapchat" in title that may be in wrong category
const [snapMisplaced] = await conn.query(
  `SELECT p.id, p.title, p.categoryId, c.name as catName 
   FROM products p 
   JOIN categories c ON c.id = p.categoryId
   WHERE (p.title LIKE '%snapchat%' OR p.title LIKE '%Snapchat%')
   AND c.name NOT LIKE '%snap%' AND c.name NOT LIKE '%Snap%'
   LIMIT 50`
);
console.log("\n=== Snapchat products in WRONG category ===");
console.table(snapMisplaced);

const [discordMisplaced] = await conn.query(
  `SELECT p.id, p.title, p.categoryId, c.name as catName 
   FROM products p 
   JOIN categories c ON c.id = p.categoryId
   WHERE (p.title LIKE '%discord%' OR p.title LIKE '%Discord%')
   AND c.name NOT LIKE '%discord%' AND c.name NOT LIKE '%Discord%'
   LIMIT 50`
);
console.log("\n=== Discord products in WRONG category ===");
console.table(discordMisplaced);

// Also check what's currently in Discord and Snapchat categories that shouldn't be there
if (discordCat) {
  const [prods] = await conn.query(
    `SELECT p.id, p.title FROM products p WHERE p.categoryId = ? AND p.title NOT LIKE '%discord%' AND p.title NOT LIKE '%Discord%' LIMIT 20`,
    [discordCat.id]
  );
  console.log(`\n=== NON-Discord products sitting in Discord category ===`);
  console.table(prods);
}

if (snapCat) {
  const [prods] = await conn.query(
    `SELECT p.id, p.title FROM products p WHERE p.categoryId = ? AND p.title NOT LIKE '%snap%' AND p.title NOT LIKE '%Snap%' LIMIT 20`,
    [snapCat.id]
  );
  console.log(`\n=== NON-Snapchat products sitting in Snapchat category ===`);
  console.table(prods);
}

await conn.end();
