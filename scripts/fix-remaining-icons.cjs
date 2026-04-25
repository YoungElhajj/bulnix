const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const BASE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/';
  
  // Fix nnd - use Other Accounts icon (generic)
  await conn.execute("UPDATE categories SET imageUrl = ? WHERE id = 43", [BASE + 'icon-other-accounts_f1572dfa.png']);
  // Fix MIX Countries IP - use Proxies icon
  await conn.execute("UPDATE categories SET imageUrl = ? WHERE id = 450001", [BASE + 'icon-proxies_83db1a37.png']);
  
  // Also fix products in these categories
  await conn.execute("UPDATE products SET imageUrl = ? WHERE categoryId = 43 AND (imageUrl IS NULL OR imageUrl = '' OR imageUrl LIKE '%6qKkSV9dybS3AerhXhrTfQ/')", [BASE + 'icon-other-accounts_f1572dfa.png']);
  await conn.execute("UPDATE products SET imageUrl = ? WHERE categoryId = 450001 AND (imageUrl IS NULL OR imageUrl = '' OR imageUrl LIKE '%6qKkSV9dybS3AerhXhrTfQ/')", [BASE + 'icon-proxies_83db1a37.png']);
  
  console.log('Fixed nnd and MIX Countries IP');
  
  // Verify the 7 main Fadded categories by checking their actual current URLs
  const [cats] = await conn.execute(
    "SELECT id, name, LEFT(imageUrl, 90) as url FROM categories WHERE name IN ('AI Tools','Design Tools','OnlyFans','Other Accounts','Phone & SMS','Apple','Proxies') ORDER BY name"
  );
  console.log('\nFadded category icon status:');
  cats.forEach(c => console.log(' ', c.name, '|', c.url || 'NULL'));
  
  // Check if the issue is that there are MULTIPLE categories with these names
  const [dupes] = await conn.execute(
    "SELECT name, COUNT(*) as cnt FROM categories WHERE name IN ('AI Tools','Design Tools','OnlyFans','Other Accounts','Phone & SMS','Apple','Proxies') GROUP BY name HAVING cnt > 1"
  );
  if (dupes.length > 0) {
    console.log('\nDuplicate categories found:');
    dupes.forEach(d => console.log(' ', d.name, 'x', d.cnt));
  } else {
    console.log('\nNo duplicate categories.');
  }
  
  await conn.end();
})();
