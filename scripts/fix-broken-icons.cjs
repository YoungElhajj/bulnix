const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const BASE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/';
  
  // Find ALL categories with broken URLs (ending with / but no filename)
  const [broken] = await conn.execute(
    "SELECT id, name, imageUrl FROM categories WHERE imageUrl LIKE '%6qKkSV9dybS3AerhXhrTfQ/' OR imageUrl IS NULL OR imageUrl = ''"
  );
  console.log('Categories with broken/missing icons:', broken.length);
  broken.forEach(c => console.log(' ', c.id, c.name));
  
  // Map category names to new icon files
  const iconMap = {
    'AI Tools': 'icon-ai-tools_9b4d940c.png',
    'Design Tools': 'icon-design-tools_c32af052.png',
    'OnlyFans': 'icon-onlyfans_9f1d0fa2.png',
    'Phone & SMS': 'icon-phone-sms_05d7c1aa.png',
    'Apple': 'icon-apple_645029f2.png',
    'Proxies': 'icon-proxies_83db1a37.png',
    'Other Accounts': 'icon-other-accounts_f1572dfa.png',
  };
  
  let fixed = 0;
  for (const cat of broken) {
    const file = iconMap[cat.name];
    if (file) {
      const url = BASE + file;
      await conn.execute('UPDATE categories SET imageUrl = ? WHERE id = ?', [url, cat.id]);
      // Also fix products in this category
      await conn.execute(
        "UPDATE products SET imageUrl = ? WHERE categoryId = ? AND (imageUrl IS NULL OR imageUrl = '' OR imageUrl LIKE '%6qKkSV9dybS3AerhXhrTfQ/')",
        [url, cat.id]
      );
      console.log('Fixed:', cat.name, '->', url.substring(0, 80));
      fixed++;
    } else {
      console.log('No icon mapping for:', cat.name, '(id:', cat.id, ')');
    }
  }
  
  console.log('\nTotal fixed:', fixed);
  
  // Final verification
  const [stillBroken] = await conn.execute(
    "SELECT id, name FROM categories WHERE imageUrl LIKE '%6qKkSV9dybS3AerhXhrTfQ/' OR imageUrl IS NULL OR imageUrl = ''"
  );
  console.log('Still broken after fix:', stillBroken.length);
  stillBroken.forEach(c => console.log(' ', c.id, c.name));
  
  await conn.end();
})();
