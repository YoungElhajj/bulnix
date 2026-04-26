/**
 * Fix misplaced products across all social media categories.
 * 
 * Issues found:
 * 1. Snapchat products (id 10, 990003) in generic "Account" category (id=48) → move to Snapchat Accounts (id=25)
 * 2. Discord products (ids 115-122, 311, 606, 90001) in generic "Account" category (id=65) → move to Discord Accounts (id=18)
 * 3. Dating site products in generic "Account" category (id=65) → move to Dating App Accounts
 * 4. WhatsApp products (ids 180, 437) in generic "Accounts" category → move to WhatsApp Accounts (id=4)
 * 5. Telegram aged products (ids 780001, 780004, 780005, 960003) in "Aged" subcategory → move to Telegram Accounts (id=12)
 * 6. LinkedIn products in "Aged & Connections"/"New Accounts" subcategories → move to LinkedIn Accounts (id=8)
 * 7. Reddit products in "Karma"/"softreg" subcategories → move to Reddit Accounts (id=13)
 * 8. YouTube products in "Channels"/"Monetized Channels"/"Premium Subscriptions" subcategories → move to YouTube Accounts (id=6)
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

let totalFixed = 0;

async function moveProducts(ids, targetCategoryId, targetName) {
  if (ids.length === 0) return;
  const [result] = await conn.query(
    `UPDATE products SET categoryId = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
    [targetCategoryId, ...ids]
  );
  console.log(`  ✓ Moved ${result.affectedRows} products to ${targetName} (id=${targetCategoryId})`);
  totalFixed += result.affectedRows;
}

async function moveByTitlePattern(pattern, targetCategoryId, targetName, excludeCategoryIds = []) {
  const excludeClause = excludeCategoryIds.length > 0 
    ? `AND categoryId NOT IN (${excludeCategoryIds.join(',')})` 
    : '';
  const [prods] = await conn.query(
    `SELECT id FROM products WHERE LOWER(title) LIKE ? AND categoryId != ? ${excludeClause}`,
    [pattern, targetCategoryId]
  );
  if (prods.length === 0) return;
  const ids = prods.map(p => p.id);
  await moveProducts(ids, targetCategoryId, targetName);
}

console.log("=== Fixing misplaced products ===\n");

// 1. Snapchat products in generic "Account" category (id=48) → Snapchat Accounts (id=25)
console.log("1. Snapchat products:");
await moveProducts([10, 990003], 25, "Snapchat Accounts");

// 2. Discord products in generic "Account" category (id=65) → Discord Accounts (id=18)
console.log("2. Discord products:");
await moveProducts([115, 116, 117, 118, 119, 120, 121, 122, 311, 606, 90001], 18, "Discord Accounts");

// 3. Dating site products in generic "Account" category (id=65) → Dating App Accounts
// First find the Dating App Accounts category
const [datingCat] = await conn.query("SELECT id FROM categories WHERE name LIKE '%Dating%' LIMIT 1");
const datingCatId = datingCat[0]?.id;
if (datingCatId) {
  console.log(`3. Dating site products → Dating App Accounts (id=${datingCatId}):`);
  const datingIds = [467, 471, 472, 180001, 180002, 300002, 300003, 300004, 300006, 300008, 510008, 690001, 690002, 690003, 780006, 780007, 870006, 870009, 870010, 870011, 870012, 870013];
  await moveProducts(datingIds, datingCatId, "Dating App Accounts");
} else {
  console.log("3. Dating App Accounts category not found — skipping");
}

// 4. WhatsApp products in generic "Accounts" category → WhatsApp Accounts (id=4)
console.log("4. WhatsApp products:");
await moveProducts([180, 437], 4, "WhatsApp Accounts");

// 5. Telegram aged products in wrong category → Telegram Accounts (id=12)
console.log("5. Telegram aged products:");
await moveProducts([780001, 780004, 780005, 960003], 12, "Telegram Accounts");

// 6. LinkedIn products in subcategories → LinkedIn Accounts (id=8)
console.log("6. LinkedIn products:");
await moveByTitlePattern('%linkedin%', 8, "LinkedIn Accounts");

// 7. Reddit products in subcategories → Reddit Accounts (id=13)
console.log("7. Reddit products:");
await moveByTitlePattern('%reddit%', 13, "Reddit Accounts");

// 8. YouTube Accounts (not subscriptions/channels) in subcategories → YouTube Accounts (id=6)
// Only move products with "YouTube Accounts" in title (not YouTube Premium subscriptions or Monetized Channels)
console.log("8. YouTube Accounts:");
const [ytProds] = await conn.query(
  `SELECT id FROM products 
   WHERE (LOWER(title) LIKE '%youtube accounts%' OR LOWER(title) LIKE '%youtube.com accounts%')
   AND categoryId != 6`
);
if (ytProds.length > 0) {
  await moveProducts(ytProds.map(p => p.id), 6, "YouTube Accounts");
}

// 9. Also fix any remaining Snapchat products not yet in Snapchat Accounts
console.log("9. Any remaining Snapchat products:");
await moveByTitlePattern('%snapchat%', 25, "Snapchat Accounts");

// 10. Any remaining Discord products not yet in Discord Accounts
console.log("10. Any remaining Discord products:");
await moveByTitlePattern('%discord%', 18, "Discord Accounts");

// Final counts
const [finalCounts] = await conn.query(`
  SELECT c.name, COUNT(p.id) as productCount 
  FROM categories c 
  LEFT JOIN products p ON p.categoryId = c.id 
  WHERE c.name IN ('Snapchat Accounts', 'Discord Accounts', 'Instagram Accounts', 'Facebook Accounts', 
    'TikTok Accounts', 'Twitter Accounts', 'LinkedIn Accounts', 'Reddit Accounts', 
    'YouTube Accounts', 'Telegram Accounts', 'WhatsApp Accounts', 'Dating App Accounts')
  GROUP BY c.id, c.name
  ORDER BY productCount DESC
`);

console.log("\n=== Final category counts ===");
console.table(finalCounts);
console.log(`\nTotal products fixed: ${totalFixed}`);

await conn.end();
