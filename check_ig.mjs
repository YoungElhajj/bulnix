import { createPool } from 'mysql2/promise';

const pool = createPool(process.env.DATABASE_URL);

// Count all products with instagram in title by category and provider
const [byCategory] = await pool.query(`
  SELECT c.name as category, c.slug, p.providerKey, COUNT(p.id) as count
  FROM products p
  LEFT JOIN categories c ON p.categoryId = c.id
  WHERE LOWER(p.title) LIKE '%instagram%'
  GROUP BY c.id, c.name, c.slug, p.providerKey
  ORDER BY count DESC
`);
console.log('=== Products with "instagram" in title by category+provider ===');
console.table(byCategory);

// Count all products in the instagram category
const [inCat] = await pool.query(`
  SELECT p.providerKey, COUNT(*) as count
  FROM products p
  JOIN categories c ON p.categoryId = c.id
  WHERE c.slug LIKE '%instagram%'
  GROUP BY p.providerKey
`);
console.log('\n=== Products currently IN instagram category by provider ===');
console.table(inCat);

// Check how many instagram products are in WRONG categories
const [wrongCat] = await pool.query(`
  SELECT c.name as wrongCategory, c.slug, p.providerKey, COUNT(*) as count
  FROM products p
  JOIN categories c ON p.categoryId = c.id
  WHERE LOWER(p.title) LIKE '%instagram%'
    AND c.slug NOT LIKE '%instagram%'
  GROUP BY c.id, c.name, c.slug, p.providerKey
  ORDER BY count DESC
`);
console.log('\n=== Instagram products in WRONG categories ===');
console.table(wrongCat);

// Total count
const [total] = await pool.query(`SELECT COUNT(*) as total FROM products WHERE LOWER(title) LIKE '%instagram%'`);
console.log('\n=== Total products with instagram in title ===', total[0].total);

// Check the instagram category id
const [igCat] = await pool.query(`SELECT id, name, slug FROM categories WHERE slug LIKE '%instagram%'`);
console.log('\n=== Instagram categories ===');
console.table(igCat);

await pool.end();
