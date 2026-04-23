const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  const emptyFaddedCatIds = [420005,420004,420018,420012,420006,420020,420019,420003,420022,420017,420016,420013,420014,420024,420007,420015,420021];
  
  // Verify they're empty first
  const placeholders = emptyFaddedCatIds.map(() => '?').join(',');
  const [check] = await conn.execute(`SELECT categoryId, COUNT(*) as cnt FROM products WHERE categoryId IN (${placeholders}) GROUP BY categoryId`, emptyFaddedCatIds);
  if (check.length > 0) {
    console.log('WARNING: Some categories still have products:', check);
  } else {
    console.log('All categories confirmed empty, deleting...');
    const [del] = await conn.execute(`DELETE FROM categories WHERE id IN (${placeholders})`, emptyFaddedCatIds);
    console.log('Deleted', del.affectedRows, 'empty Fadded categories');
  }
  
  // Check merged categories icon status
  const mergedCatIds = [1,7,5,10,13,25,8,18,6,16,28,34,36,23,35,29];
  const mergedPlaceholders = mergedCatIds.map(() => '?').join(',');
  const [catIcons] = await conn.execute(`SELECT id, name, imageUrl FROM categories WHERE id IN (${mergedPlaceholders})`, mergedCatIds);
  catIcons.forEach(c => console.log(c.id, c.name, '| icon:', c.imageUrl ? c.imageUrl.substring(0,60) : 'MISSING'));
  
  // Also update the products that were moved to have the AccsZone category icon
  // (they currently have the Fadded icon URL - update to match their new category)
  for (const cat of catIcons) {
    if (cat.imageUrl) {
      const [upd] = await conn.execute(
        `UPDATE products SET imageUrl = ? WHERE categoryId = ? AND providerKey = 'fadded'`,
        [cat.imageUrl, cat.id]
      );
      if (upd.affectedRows > 0) console.log('  Updated', upd.affectedRows, 'Fadded products in', cat.name, 'to use category icon');
    }
  }
  
  await conn.end();
  console.log('Done!');
})();
