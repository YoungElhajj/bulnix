/**
 * Retry fulfillment for stuck orders after fixing the autoFulfillOrder JOIN bug.
 * Clears existing failed fulfillment records, resets order status to "processing",
 * then calls autoFulfillOrder for each order.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load env
require('dotenv').config();

// We need to call the compiled server code, but since it's TypeScript we'll
// directly call the AccsZone API and insert fulfillment records ourselves.
import mysql from 'mysql2/promise';
// Using built-in fetch (Node.js 18+)

const ACCSZONE_BASE = 'https://accszone.com/api/v1';

async function placeAccsZoneOrder(apiKey, productId, quantity, orderId) {
  // AccsZone uses POST /purchase with ad_id (not POST /orders with product_id)
  const body = { ad_id: Number(productId), quantity, promo_code: '5%OFF' };
  console.log(`[AccsZone] Placing order: ad_id=${productId}, qty=${quantity}`);
  
  const res = await fetch(`${ACCSZONE_BASE}/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(body),
  });
  
  const text = await res.text();
  console.log(`[AccsZone] Response status: ${res.status}`);
  console.log(`[AccsZone] Response body: ${text}`);
  
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  
  return { status: res.status, json };
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get AccsZone API key
  const [configs] = await conn.execute("SELECT apiKey FROM provider_configs WHERE providerKey = 'accszone' LIMIT 1");
  const apiKey = configs[0]?.apiKey;
  if (!apiKey) {
    console.error('No AccsZone API key found!');
    process.exit(1);
  }
  console.log(`Using API key: ${apiKey.substring(0, 20)}...`);
  
  const stuckOrders = [120002, 150001, 150002];
  
  for (const orderId of stuckOrders) {
    console.log(`\n=== Processing order ${orderId} ===`);
    
    // Get order items
    const [items] = await conn.execute(
      'SELECT id, supplierProductId, providerKey, quantity FROM order_items WHERE orderId = ?',
      [orderId]
    );
    console.log(`Order items:`, items);
    
    // Delete existing failed fulfillment records for this order
    const [delResult] = await conn.execute(
      "DELETE FROM fulfillment_records WHERE orderId = ? AND status = 'failed'",
      [orderId]
    );
    console.log(`Deleted ${delResult.affectedRows} failed fulfillment records`);
    
    for (const item of items) {
      if (!item.supplierProductId || item.providerKey !== 'accszone') {
        console.log(`Skipping item ${item.id} — no AccsZone product ID`);
        continue;
      }
      
      const accsZoneProductId = item.supplierProductId; // This IS the AccsZone product ID
      console.log(`Placing AccsZone order for item ${item.id}: product_id=${accsZoneProductId}, qty=${item.quantity}`);
      
      const { status, json } = await placeAccsZoneOrder(apiKey, accsZoneProductId, item.quantity, orderId);
      
      // AccsZone wraps response in json.data
      const responseData = json.data ?? json;
      const isSuccess = (status >= 200 && status < 300) && json.success === true;
      if (isSuccess) {
        // Success
        const supplierOrderId = String(responseData.order_id ?? json.order_id ?? '');
        const deliveryData = responseData.accounts ?? json.accounts ?? responseData ?? json;
        const deliveryDataStr = JSON.stringify(deliveryData);
        
        await conn.execute(
          `INSERT INTO fulfillment_records (orderId, orderItemId, providerKey, supplierOrderId, status, deliveryData, rawResponse, createdAt, updatedAt)
           VALUES (?, ?, 'accszone', ?, 'success', ?, ?, NOW(), NOW())`,
          [orderId, item.id, supplierOrderId || null, deliveryDataStr, JSON.stringify(json)]
        );
        console.log(`SUCCESS: Inserted fulfillment record for item ${item.id}`);
      } else {
        // Failed
        const errorMsg = json.message ?? json.error ?? `HTTP ${status}`;
        await conn.execute(
          `INSERT INTO fulfillment_records (orderId, orderItemId, providerKey, status, errorMessage, rawResponse, createdAt, updatedAt)
           VALUES (?, ?, 'accszone', 'failed', ?, ?, NOW(), NOW())`,
          [orderId, item.id, errorMsg, JSON.stringify(json)]
        );
        console.log(`FAILED: ${errorMsg}`);
      }
    }
    
    // Update order status based on fulfillment records
    const [records] = await conn.execute(
      "SELECT status FROM fulfillment_records WHERE orderId = ?",
      [orderId]
    );
    const successCount = records.filter(r => r.status === 'success').length;
    const failCount = records.filter(r => r.status === 'failed').length;
    const finalStatus = failCount === 0 ? 'fulfilled' : successCount === 0 ? 'failed' : 'partial';
    
    await conn.execute('UPDATE orders SET status = ? WHERE id = ?', [finalStatus, orderId]);
    console.log(`Order ${orderId} status updated to: ${finalStatus} (${successCount} success, ${failCount} failed)`);
  }
  
  await conn.end();
  console.log('\n=== Retry complete ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
