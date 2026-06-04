import 'dotenv/config';
import mysql from 'mysql2/promise';
import axios from 'axios';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get AccsZone API key
const [rows] = await conn.execute("SELECT providerKey, apiKey, isEnabled FROM provider_configs WHERE providerKey = 'accszone' LIMIT 1");
const config = rows[0];
console.log('AccsZone config:', { providerKey: config?.providerKey, hasApiKey: !!config?.apiKey, isEnabled: config?.isEnabled });

// Get a sample product to test with
const [products] = await conn.execute("SELECT id, title, supplierProductId, providerKey FROM products WHERE providerKey = 'accszone' AND isVisible = 1 LIMIT 3");
console.log('Sample AccsZone products:', JSON.stringify(products, null, 2));

await conn.end();

if (!config?.apiKey) {
  console.log('ERROR: No AccsZone API key found in database!');
  process.exit(1);
}

// Test API connectivity
try {
  const resp = await axios.get('https://accszone.com/api/v1/listings', {
    headers: { 'X-API-Key': config.apiKey, 'Accept': 'application/json' },
    params: { per_page: 1, page: 1 },
    timeout: 15000
  });
  console.log('\nAPI GET /listings status:', resp.status, '✓ API is reachable');
} catch(e) {
  console.log('\nAPI GET /listings ERROR:', e.response?.status, JSON.stringify(e.response?.data ?? e.message));
}

// Test what the purchase endpoint returns for a small test (dry run - use quantity 0 or check docs)
// First let's check what endpoint AccsZone uses for purchase
console.log('\nPurchase endpoint: POST /purchase with { ad_id, quantity }');
console.log('The promo_code "5%OFF" is being sent with every order - this may be causing failures if the code is invalid/expired');
