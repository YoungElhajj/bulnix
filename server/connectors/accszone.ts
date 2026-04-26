/**
 * AccsZone Supplier Connector
 * Base URL: https://accszone.com/api/v1
 * Auth: X-API-Key header
 *
 * Handles: category sync, product sync, stock sync, price sync,
 *          order placement, order status checks, error logging
 */

import axios, { AxiosInstance } from "axios";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import { categories, products, providerConfigs, providerSyncLogs, supplierProducts } from "../../drizzle/schema";
import { logSystem } from "../db";

const PROVIDER_KEY = "accszone";
const BASE_URL = "https://accszone.com/api/v1";

// ─── HTTP Client Factory ───────────────────────────────────────────────────────

function createClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    timeout: 30000,
  });
}

async function getApiKey(): Promise<string | null> {
  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(providerConfigs).where(eq(providerConfigs.providerKey, PROVIDER_KEY)).limit(1);
    return result[0]?.apiKey ?? null;
  } catch {
    return null;
  }
}

// ─── API Response Types ────────────────────────────────────────────────────────

interface AccsZoneCategory {
  id: number | string;
  title: string;   // AccsZone uses 'title' not 'name'
  slug?: string;
  description?: string;
  image?: string;
  parent_id?: number | null;
}

interface AccsZoneProduct {
  id: number | string;
  title: string;   // AccsZone uses 'title' not 'name'
  description?: string;
  category?: { id: number | string; title: string; slug: string };
  subcategory?: { id: number | string; title: string; slug: string };
  price: number | string;
  available_stock?: number | string;
  sold?: number;
  image?: string;
  slug?: string;
  min_quantity?: number;
  max_quantity?: number;
  delivery_time?: string;
  status?: string;
}

interface AccsZoneOrderResponse {
  order_id?: string | number;
  status?: string;
  accounts?: Array<{ login?: string; password?: string; email?: string; data?: string; [key: string]: unknown }>;
  error?: string;
  message?: string;
}

// ─── Category Sync ────────────────────────────────────────────────────────────

export async function syncCategories(apiKey: string): Promise<{ synced: number; errors: number }> {
  const client = createClient(apiKey);
  let synced = 0;
  let errors = 0;

  try {
    const response = await client.get("/categories");
    const rawCategories: AccsZoneCategory[] = response.data?.data ?? response.data ?? [];

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    for (const cat of rawCategories) {
      try {
        const catName = cat.title; // AccsZone uses 'title'
        const slug = cat.slug ?? String(catName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const existing = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);

        if (existing[0]) {
          await db.update(categories).set({ name: catName, imageUrl: cat.image ?? null }).where(eq(categories.id, existing[0].id));
        } else {
          await db.insert(categories).values({
            name: catName,
            slug,
            description: cat.description ?? null,
            imageUrl: cat.image ?? null,
            parentId: cat.parent_id ? Number(cat.parent_id) : null,
            isVisible: true,
            sortOrder: 0,
          });
        }
        synced++;
      } catch (err: unknown) {
        errors++;
        await logSystem("error", "sync", `Failed to sync category ${cat.title}`, { error: String(err) });
      }
    }
  } catch (err: unknown) {
    await logSystem("error", "sync", "AccsZone category sync failed", { error: String(err) });
    throw err;
  }

  return { synced, errors };
}

// ─── Product Sync ─────────────────────────────────────────────────────────────

export async function syncProducts(apiKey: string, markupPercent = 20): Promise<{ synced: number; errors: number }> {
  const client = createClient(apiKey);
  let synced = 0;
  let errors = 0;

  try {
    // AccsZone uses /listings endpoint (not /products)
    // Paginate through all pages (max 100 per page)
    let allProducts: AccsZoneProduct[] = [];
    let page = 1;
    let lastPage = 1;
    do {
      const response = await client.get("/listings", { params: { per_page: 100, page } });
      const pageData: AccsZoneProduct[] = response.data?.data ?? [];
      allProducts = allProducts.concat(pageData);
      lastPage = response.data?.meta?.last_page ?? 1;
      page++;
    } while (page <= lastPage && page <= 20); // safety cap at 20 pages
    const rawProducts = allProducts;

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    for (const prod of rawProducts) {
      try {
        const supplierPrice = Number(prod.price) || 0;
        const customerPrice = supplierPrice * (1 + markupPercent / 100);
        const prodName = prod.title; // AccsZone uses 'title'
        const slug = prod.slug ?? String(prodName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        // AccsZone uses 'available_stock'; no unlimited flag in listings
        const stockQty = Number(prod.available_stock) || 0;
        const isUnlimited = stockQty === 0 && Number(prod.sold ?? 0) > 0; // heuristic: sold but 0 stock = unlimited

        // Upsert into supplier_products cache
        const existingSupplier = await db.select().from(supplierProducts)
          .where(and(eq(supplierProducts.providerKey, PROVIDER_KEY), eq(supplierProducts.supplierProductId, String(prod.id))))
          .limit(1);

        if (existingSupplier[0]) {
          await db.update(supplierProducts).set({
            rawTitle: prodName,
            rawPrice: supplierPrice.toFixed(2) as any,
            rawStock: stockQty,
            rawData: prod as any,
          }).where(eq(supplierProducts.id, existingSupplier[0].id));
        } else {
          await db.insert(supplierProducts).values({
            providerKey: PROVIDER_KEY,
            supplierProductId: String(prod.id),
            supplierCategoryId: prod.category?.id ? String(prod.category.id) : null,
            rawTitle: prodName,
            rawDescription: prod.description ?? null,
            rawPrice: supplierPrice.toFixed(2) as any,
            rawStock: stockQty,
            rawData: prod as any,
          });
        }

        // Upsert into products table (our catalog)
        const existingProduct = await db.select().from(products)
          .where(and(eq(products.providerKey, PROVIDER_KEY), eq(products.supplierProductId, Number(prod.id))))
          .limit(1);

        // Resolve category from DB (and create subcategory if present)
        let categoryId: number | null = null;
        let categoryImageUrl: string | null = null; // For fallback product icon
        if (prod.category?.id) {
          const catSlug = prod.category.slug ?? String(prod.category.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          const catRow = await db.select().from(categories).where(eq(categories.slug, catSlug)).limit(1);
          const parentCategoryId = catRow[0]?.id ?? null;
          categoryImageUrl = catRow[0]?.imageUrl ?? null; // Store parent category icon

          // If there's a subcategory, resolve or create it
          if (prod.subcategory?.id && parentCategoryId) {
            const subSlug = prod.subcategory.slug ?? String(prod.subcategory.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const subRow = await db.select().from(categories).where(eq(categories.slug, subSlug)).limit(1);
            if (subRow[0]) {
              categoryId = subRow[0].id;
              // Use subcategory icon if available, otherwise fall back to parent category icon
              categoryImageUrl = subRow[0].imageUrl ?? categoryImageUrl;
            } else {
              // Create the subcategory
              await db.insert(categories).values({
                name: prod.subcategory.title,
                slug: subSlug,
                parentId: parentCategoryId,
                isVisible: true,
                sortOrder: 0,
              });
              const newSub = await db.select().from(categories).where(eq(categories.slug, subSlug)).limit(1);
              categoryId = newSub[0]?.id ?? parentCategoryId;
            }
          } else {
            categoryId = parentCategoryId;
          }
        }
        // ── Title-based category override ──────────────────────────────────────
        // AccsZone sometimes places products in generic buckets (e.g. "Aged")
        // even when the title clearly names a specific platform. We detect the
        // platform from the title and override the category if the resolved one
        // doesn't already belong to that platform's tree.
        const PLATFORM_SLUG_MAP: Record<string, string> = {
          instagram: "buy-instagram-accounts",
          facebook:  "buy-facebook-accounts",
          tiktok:    "buy-tiktok-accounts",
          twitter:   "buy-twitter-x-accounts",
          youtube:   "buy-youtube-accounts",
          linkedin:  "buy-linkedin-accounts",
          snapchat:  "buy-snapchat-accounts",
          telegram:  "buy-telegram-accounts",
          discord:   "buy-discord-accounts",
          whatsapp:  "buy-whatsapp-accounts",
          gmail:     "buy-gmail-accounts",
          spotify:   "buy-spotify-accounts",
          netflix:   "buy-netflix-accounts",
          reddit:    "buy-reddit-accounts",
        };
        const titleLower = prodName.toLowerCase();
        for (const [platform, targetSlug] of Object.entries(PLATFORM_SLUG_MAP)) {
          if (titleLower.includes(platform)) {
            // Check if current category is already in the right platform tree
            const resolvedCatRow = categoryId
              ? await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1)
              : [];
            const resolvedSlug = resolvedCatRow[0]?.slug ?? "";
            const resolvedParentId = resolvedCatRow[0]?.parentId ?? null;
            // Get the target platform category
            const targetRow = await db.select().from(categories).where(eq(categories.slug, targetSlug)).limit(1);
            const targetId = targetRow[0]?.id ?? null;
            if (targetId) {
              // Only override if current category is NOT already under the target platform
              const alreadyCorrect =
                resolvedSlug === targetSlug ||
                resolvedParentId === targetId ||
                (resolvedCatRow[0]?.slug ?? "").includes(platform);
              if (!alreadyCorrect) {
                categoryId = targetId;
                categoryImageUrl = targetRow[0]?.imageUrl ?? categoryImageUrl;
              }
            }
            break; // Only apply the first matching platform
          }
        }
        // ── End title-based override ───────────────────────────────────────────

        // Use product's own image, or fall back to category icon
        const resolvedImageUrl = prod.image ?? categoryImageUrl;

        if (existingProduct[0]) {
          // Only update price/stock if not overridden by admin
          const updateData: Record<string, unknown> = {
            stockQuantity: stockQty,
            stockUnlimited: isUnlimited,
            supplierPrice: supplierPrice.toFixed(2),
            customerPriceUSD: customerPrice.toFixed(2),
          };
          if (categoryId) updateData.categoryId = categoryId;
          // Update imageUrl if product has no image but category has one
          if (!existingProduct[0].imageUrl && resolvedImageUrl) updateData.imageUrl = resolvedImageUrl;
          await db.update(products).set(updateData).where(eq(products.id, existingProduct[0].id));
        } else {
          await db.insert(products).values({
            providerKey: PROVIDER_KEY,
            supplierProductId: Number(prod.id),
            title: prodName,
            slug: `${slug}-${String(prod.id)}`,
            description: prod.description ?? null,
            imageUrl: resolvedImageUrl,
            categoryId: categoryId,
            supplierPrice: supplierPrice.toFixed(2) as any,
            markupPercent: markupPercent.toFixed(2) as any,
            customerPriceUSD: customerPrice.toFixed(2) as any,
            stockQuantity: stockQty,
            stockUnlimited: isUnlimited,
            isVisible: true,
            isFeatured: false,
          });
        }
        synced++;
      } catch (err: unknown) {
        errors++;
        await logSystem("error", "sync", `Failed to sync product ${prod.title}`, { error: String(err) });
      }
    }
  } catch (err: unknown) {
    await logSystem("error", "sync", "AccsZone product sync failed", { error: String(err) });
    throw err;
  }

  return { synced, errors };
}

// ─── Stock Sync ───────────────────────────────────────────────────────────────

export async function syncStock(apiKey: string): Promise<{ updated: number; errors: number }> {
  const client = createClient(apiKey);
  let updated = 0;
  let errors = 0;

  try {
    const response = await client.get("/products/stock");
    const stockData: Array<{ id: string | number; stock: number; unlimited?: boolean }> = response.data?.data ?? response.data ?? [];

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    for (const item of stockData) {
      try {
        const stockVal = item.unlimited ? 9999 : item.stock;
          await db.update(products).set({
            stockQuantity: stockVal,
            stockUnlimited: item.unlimited ?? false,
          }).where(and(eq(products.providerKey, PROVIDER_KEY), eq(products.supplierProductId, Number(item.id))));
          updated++;
      } catch (err: unknown) {
        errors++;
      }
    }
  } catch (err: unknown) {
    await logSystem("warn", "sync", "AccsZone stock sync failed, will retry", { error: String(err) });
  }

  return { updated, errors };
}

// ─── Price Sync ───────────────────────────────────────────────────────────────

export async function syncPrices(apiKey: string): Promise<{ updated: number; errors: number }> {
  const client = createClient(apiKey);
  let updated = 0;
  let errors = 0;

  try {
    const response = await client.get("/products/prices");
    const priceData: Array<{ id: string | number; price: number }> = response.data?.data ?? response.data ?? [];

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    for (const item of priceData) {
      try {
        const existing = await db.select().from(products)
          .where(and(eq(products.providerKey, PROVIDER_KEY), eq(products.supplierProductId, Number(item.id))))
          .limit(1);
        if (existing[0]) {
          const markup = Number(existing[0].markupPercent) || 20;
          const customerPrice = item.price * (1 + markup / 100);
          await db.update(products).set({
            supplierPrice: item.price.toFixed(2) as any,
            customerPriceUSD: customerPrice.toFixed(2) as any,
          }).where(eq(products.id, existing[0].id));
          updated++;
        }
      } catch (err: unknown) {
        errors++;
      }
    }
  } catch (err: unknown) {
    await logSystem("warn", "sync", "AccsZone price sync failed", { error: String(err) });
  }

  return { updated, errors };
}

// ─── Place Order ──────────────────────────────────────────────────────────────

export async function placeSupplierOrder(
  apiKey: string,
  supplierProductId: string,
  quantity: number,
  orderId: number
): Promise<{ success: boolean; supplierOrderId?: string; deliveryData?: unknown; error?: string }> {
  const client = createClient(apiKey);

  try {
    // AccsZone uses POST /purchase with ad_id (not POST /orders with product_id)
    const response = await client.post("/purchase", {
      ad_id: Number(supplierProductId),
      quantity,
      promo_code: "5%OFF", // Apply 5% discount promo code
    });

    // Response is wrapped in data: { order_id, accounts, ... }
    const responseData = response.data;
    const data: AccsZoneOrderResponse = responseData?.data ?? responseData;
    const isSuccess = responseData?.success === true || response.status === 201 || response.status === 200;

    if (!isSuccess || data.error || (responseData?.message && !responseData?.success)) {
      const errMsg = data.error ?? responseData?.message ?? "Unknown error";
      await logSystem("error", "fulfillment", `AccsZone order failed for order ${orderId}`, { error: errMsg });
      return { success: false, error: errMsg };
    }

    await logSystem("info", "fulfillment", `AccsZone order placed for order ${orderId}`, {
      supplierOrderId: data.order_id,
      accountCount: Array.isArray(data.accounts) ? data.accounts.length : 0,
    });

    return {
      success: true,
      supplierOrderId: String(data.order_id ?? ""),
      deliveryData: data.accounts ?? data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await logSystem("error", "fulfillment", `AccsZone order exception for order ${orderId}`, { error: message });
    return { success: false, error: message };
  }
}

// ─── Check Order Status ───────────────────────────────────────────────────────

export async function checkSupplierOrderStatus(
  apiKey: string,
  supplierOrderId: string
): Promise<{ status: string; deliveryData?: unknown; error?: string }> {
  const client = createClient(apiKey);

  try {
    const response = await client.get(`/orders/${supplierOrderId}`);
    const responseData = response.data;
    // AccsZone wraps response in data field
    const data = responseData?.data ?? responseData;
    return {
      status: data.status ?? (responseData?.success ? "completed" : "unknown"),
      deliveryData: data.accounts ?? data.data ?? null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "error", error: message };
  }
}

// ─── Main Sync Orchestrator ───────────────────────────────────────────────────

export async function syncProvider(providerKey: string, syncType: "categories" | "products" | "stock" | "prices" | "full"): Promise<void> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    await logSystem("warn", "sync", `No API key configured for ${providerKey}`);
    return;
  }

  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return;

  // Find the sync log entry to update
  const syncLog = await db.select().from(providerSyncLogs)
    .where(and(eq(providerSyncLogs.providerKey, providerKey), eq(providerSyncLogs.status, "running")))
    .orderBy(providerSyncLogs.startedAt)
    .limit(1);

  const logId = syncLog[0]?.id;

  try {
    let result: { synced?: number; updated?: number; errors: number } = { errors: 0 };

    if (syncType === "categories" || syncType === "full") {
      const catResult = await syncCategories(apiKey);
      result = catResult;
      await logSystem("info", "sync", `Categories synced: ${catResult.synced} ok, ${catResult.errors} errors`);
    }

    if (syncType === "products" || syncType === "full") {
      const config = await db.select().from(providerConfigs).where(eq(providerConfigs.providerKey, providerKey)).limit(1);
      const markup = Number(config[0]?.defaultMarkupPercent ?? 20);
      const prodResult = await syncProducts(apiKey, markup);
      result = prodResult;
      await logSystem("info", "sync", `Products synced: ${prodResult.synced} ok, ${prodResult.errors} errors`);
    }

    if (syncType === "stock") {
      const stockResult = await syncStock(apiKey);
      result = stockResult;
      await logSystem("info", "sync", `Stock updated: ${stockResult.updated} ok, ${stockResult.errors} errors`);
    }

    if (syncType === "prices") {
      const priceResult = await syncPrices(apiKey);
      result = priceResult;
      await logSystem("info", "sync", `Prices updated: ${priceResult.updated} ok, ${priceResult.errors} errors`);
    }

    if (logId) {
      await db.update(providerSyncLogs).set({
        status: "success",
        completedAt: new Date(),
        itemsSynced: result.synced ?? result.updated ?? 0,
        itemsFailed: result.errors,
      }).where(eq(providerSyncLogs.id, logId));
    }

    // Update last sync time
    await db.update(providerConfigs).set({ lastSyncAt: new Date() }).where(eq(providerConfigs.providerKey, providerKey));

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (logId) {
      await db.update(providerSyncLogs).set({
        status: "failed",
        completedAt: new Date(),
        errorMessage: message,
      }).where(eq(providerSyncLogs.id, logId));
    }
    await logSystem("error", "sync", `Sync failed for ${providerKey}`, { error: message });
  }
}
