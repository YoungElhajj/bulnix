import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all Fadded products with null imageUrl and their category's imageUrl
const [prods] = await conn.execute(`
  SELECT p.id, p.title, c.imageUrl as catImage 
  FROM products p 
  JOIN categories c ON p.categoryId = c.id 
  WHERE p.providerKey = 'fadded' 
  AND (p.imageUrl IS NULL OR p.imageUrl = '') 
  AND c.imageUrl IS NOT NULL
`);
console.log('Fadded products needing icons:', prods.length);

// Bulk update
if (prods.length > 0) {
  for (const prod of prods) {
    await conn.execute('UPDATE products SET imageUrl = ? WHERE id = ?', [prod.catImage, prod.id]);
  }
  console.log('Updated', prods.length, 'products with category icons');
}

// Verify
const [check] = await conn.execute(`
  SELECT COUNT(*) as cnt FROM products WHERE providerKey = 'fadded' AND imageUrl IS NOT NULL
`);
console.log('Fadded products with icons now:', check[0].cnt);

await conn.end();
