import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get failed orders
const [orders] = await conn.execute(`
  SELECT id, orderNumber, status, adminNotes, supplierOrderId, supplierStatus, 
         fulfillmentRetries, lastFulfillmentAttempt, createdAt 
  FROM orders 
  WHERE status = 'failed' 
  ORDER BY createdAt DESC 
  LIMIT 15
`);
console.log('=== FAILED ORDERS ===');
console.log(JSON.stringify(orders, null, 2));

// Get order items for failed orders to see which products/providers
if (orders.length > 0) {
  const ids = orders.map(o => o.id).join(',');
  const [items] = await conn.execute(`
    SELECT oi.orderId, oi.productId, oi.providerKey, oi.supplierProductId, 
           oi.fulfillmentStatus, oi.fulfillmentData, oi.quantity
    FROM order_items oi
    WHERE oi.orderId IN (${ids})
    ORDER BY oi.orderId DESC
  `);
  console.log('\n=== ORDER ITEMS ===');
  console.log(JSON.stringify(items, null, 2));
}

// Get recent error logs
const [logs] = await conn.execute(`
  SELECT level, category, message, details, createdAt
  FROM system_logs
  WHERE level = 'error'
  ORDER BY createdAt DESC
  LIMIT 20
`).catch(async () => {
  // Try alternate column name
  const [r] = await conn.execute(`
    SELECT level, category, message, details, created_at as createdAt
    FROM system_logs
    WHERE level = 'error'
    ORDER BY created_at DESC
    LIMIT 20
  `).catch(() => [[]]);
  return [r];
});
console.log('\n=== RECENT ERROR LOGS ===');
console.log(JSON.stringify(logs, null, 2));

await conn.end();
