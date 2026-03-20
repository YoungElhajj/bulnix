/**
 * AccsZone Full Sync Script
 * Run: node scripts/run-sync.mjs
 */
import axios from "axios";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = "acz_ZKQlQcCAomQZFBQfIBh2CiWEXIqqYeofKcaZXHuLNDC2pAz2";
const BASE_URL = "https://accszone.com/api/v1";
const PROVIDER_KEY = "accszone";
const MARKUP_PERCENT = 20;

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "X-API-Key": API_KEY, "Accept": "application/json" },
  timeout: 30000,
});

const db = await mysql.createConnection(process.env.DATABASE_URL);

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Sync Categories ──────────────────────────────────────────────────────────
console.log("\n📂 Syncing categories...");
const catRes = await client.get("/categories");
const categories = catRes.data?.data ?? [];
console.log(`  Found ${categories.length} categories`);

let catSynced = 0;
for (const cat of categories) {
  const slug = cat.slug ?? slugify(cat.title);
  const [existing] = await db.query("SELECT id FROM categories WHERE slug = ?", [slug]);
  if (existing.length > 0) {
    await db.query("UPDATE categories SET name = ?, imageUrl = ? WHERE slug = ?", [cat.title, cat.image ?? null, slug]);
  } else {
    await db.query(
      "INSERT INTO categories (name, slug, imageUrl, isVisible, sortOrder) VALUES (?, ?, ?, true, 0)",
      [cat.title, slug, cat.image ?? null]
    );
  }
  catSynced++;
}
console.log(`  ✅ ${catSynced} categories synced`);

// ─── Sync Products (Listings) ─────────────────────────────────────────────────
console.log("\n📦 Syncing products (listings)...");
let allListings = [];
let page = 1;
let lastPage = 1;

do {
  const res = await client.get("/listings", { params: { per_page: 100, page } });
  const pageData = res.data?.data ?? [];
  allListings = allListings.concat(pageData);
  lastPage = res.data?.meta?.last_page ?? 1;
  console.log(`  Page ${page}/${lastPage}: ${pageData.length} listings`);
  page++;
} while (page <= lastPage && page <= 20);

console.log(`  Total listings fetched: ${allListings.length}`);

let prodSynced = 0;
let prodErrors = 0;

for (const prod of allListings) {
  try {
    const supplierPrice = parseFloat(prod.price) || 0;
    const customerPrice = supplierPrice * (1 + MARKUP_PERCENT / 100);
    const prodName = prod.title;
    const slug = prod.slug ?? slugify(prodName);
    const stockQty = parseInt(prod.available_stock) || 0;
    const isUnlimited = stockQty === 0 && (prod.sold ?? 0) > 0;

    // Resolve category (and create subcategory if present)
    let categoryId = null;
    if (prod.category?.id) {
      const catSlug = (prod.category.slug ?? slugify(prod.category.title)).slice(0, 128);
      const [catRow] = await db.query("SELECT id FROM categories WHERE slug = ?", [catSlug]);
      const parentCatId = catRow[0]?.id ?? null;

      if (prod.subcategory?.id && parentCatId) {
        const subSlug = (prod.subcategory.slug ?? slugify(prod.subcategory.title)).slice(0, 128);
        const [subRow] = await db.query("SELECT id FROM categories WHERE slug = ?", [subSlug]);
        if (subRow.length > 0) {
          categoryId = subRow[0].id;
        } else {
          await db.query(
            "INSERT INTO categories (name, slug, parentId, isVisible, sortOrder) VALUES (?, ?, ?, true, 0)",
            [prod.subcategory.title, subSlug, parentCatId]
          );
          const [newSub] = await db.query("SELECT id FROM categories WHERE slug = ?", [subSlug]);
          categoryId = newSub[0]?.id ?? parentCatId;
        }
      } else {
        categoryId = parentCatId;
      }
    }

    // Upsert supplier_products
    const [existingSupplier] = await db.query(
      "SELECT id FROM supplier_products WHERE providerKey = ? AND supplierProductId = ?",
      [PROVIDER_KEY, String(prod.id)]
    );
    if (existingSupplier.length > 0) {
      await db.query(
        "UPDATE supplier_products SET rawTitle = ?, rawPrice = ?, rawStock = ?, rawData = ? WHERE id = ?",
        [prodName, supplierPrice.toFixed(2), stockQty, JSON.stringify(prod), existingSupplier[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO supplier_products (providerKey, supplierProductId, supplierCategoryId, rawTitle, rawPrice, rawStock, rawData) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [PROVIDER_KEY, String(prod.id), prod.category?.id ? String(prod.category.id) : null, prodName, supplierPrice.toFixed(2), stockQty, JSON.stringify(prod)]
      );
    }

    // Upsert products (storefront)
    const [existingProduct] = await db.query(
      "SELECT id FROM products WHERE providerKey = ? AND supplierProductId = ?",
      [PROVIDER_KEY, Number(prod.id)]
    );
    if (existingProduct.length > 0) {
      const updates = ["stockQuantity = ?", "stockUnlimited = ?", "supplierPrice = ?", "customerPriceUSD = ?"];
      const vals = [stockQty, isUnlimited, supplierPrice.toFixed(2), customerPrice.toFixed(2)];
      if (categoryId) { updates.push("categoryId = ?"); vals.push(categoryId); }
      vals.push(existingProduct[0].id);
      await db.query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, vals);
    } else {
      const productSlug = `${slug}-${prod.id}`;
      await db.query(
        `INSERT INTO products (providerKey, supplierProductId, title, slug, description, imageUrl, categoryId, supplierPrice, markupPercent, customerPriceUSD, stockQuantity, stockUnlimited, isVisible, isFeatured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, false)`,
        [PROVIDER_KEY, Number(prod.id), prodName, productSlug, prod.description ?? null, prod.image ?? null, categoryId, supplierPrice.toFixed(2), MARKUP_PERCENT.toFixed(2), customerPrice.toFixed(2), stockQty, isUnlimited]
      );
    }
    prodSynced++;
  } catch (err) {
    prodErrors++;
    console.error(`  ❌ Error syncing "${prod.title}": ${err.message}`);
  }
}

console.log(`  ✅ ${prodSynced} products synced, ${prodErrors} errors`);

// ─── Update provider config ───────────────────────────────────────────────────
await db.query("UPDATE provider_configs SET lastSyncAt = NOW() WHERE providerKey = ?", [PROVIDER_KEY]);

// ─── Summary ──────────────────────────────────────────────────────────────────
const [productCount] = await db.query("SELECT COUNT(*) as total FROM products WHERE providerKey = ?", [PROVIDER_KEY]);
const [catCount] = await db.query("SELECT COUNT(*) as total FROM categories");
console.log(`\n🎉 Sync complete!`);
console.log(`   Categories in DB: ${catCount[0].total}`);
console.log(`   Products in DB: ${productCount[0].total}`);

await db.end();
process.exit(0);
