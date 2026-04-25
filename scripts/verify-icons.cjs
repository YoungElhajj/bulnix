const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const BASE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/';
  
  // Verify all 7 categories now have correct icons
  const [cats] = await conn.execute("SELECT name, imageUrl FROM categories WHERE name IN ('AI Tools','Design Tools','OnlyFans','Other Accounts','Phone & SMS','Apple','Proxies')");
  cats.forEach(c => console.log(c.name, '|', c.imageUrl ? c.imageUrl.substring(0,80) : 'NULL'));
  
  // Check total products with null/empty icons
  const [nullProds] = await conn.execute("SELECT COUNT(*) as cnt FROM products WHERE imageUrl IS NULL OR imageUrl = ''");
  console.log('Products with no icon:', nullProds[0].cnt);
  
  // Check products with broken cloudfront URLs (missing filename)
  const [brokenProds] = await conn.execute("SELECT COUNT(*) as cnt FROM products WHERE imageUrl LIKE '%6qKkSV9dybS3AerhXhrTfQ/' AND imageUrl NOT LIKE '%6qKkSV9dybS3AerhXhrTfQ/icon-%'");
  console.log('Products with broken CDN URL:', brokenProds[0].cnt);
  
  await conn.end();
})();
