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
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
}

interface AccsZoneProduct {
  id: number | string;
  name: string;
  description?: string;
  category_id?: number | string;
  price: number | string;
  stock?: number | string;
  unlimited_stock?: boolean;
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
        const slug = cat.slug ?? String(cat.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const existing = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);

        if (existing[0]) {
          await db.update(categories).set({ name: cat.name, description: cat.description ?? null }).where(eq(categories.id, existing[0].id));
        } else {
          await db.insert(categories).values({
            name: cat.name,
            slug,
            description: cat.description ?? null,
            parentId: cat.parent_id ? Number(cat.parent_id) : null,
            isVisible: true,
            sortOrder: 0,
          });
        }
        synced++;
      } catch (err: unknown) {
        errors++;
        await logSystem("error", "sync", `Failed to sync category ${cat.name}`, { error: String(err) });
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
    const response = await client.get("/products");
    const rawProducts: AccsZoneProduct[] = response.data?.data ?? response.data ?? [];

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    for (const prod of rawProducts) {
      try {
        const supplierPrice = Number(prod.price) || 0;
        const customerPrice = supplierPrice * (1 + markupPercent / 100);
        const slug = prod.slug ?? String(prod.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const stockQty = prod.unlimited_stock ? 9999 : (Number(prod.stock) || 0);

        // Upsert into supplier_products cache
        const existingSupplier = await db.select().from(supplierProducts)
          .where(and(eq(supplierProducts.providerKey, PROVIDER_KEY), eq(supplierProducts.supplierProductId, String(prod.id))))
          .limit(1);

        if (existingSupplier[0]) {
          await db.update(supplierProducts).set({
            rawTitle: prod.name,
            rawPrice: supplierPrice.toFixed(2) as any,
            rawStock: stockQty,
            rawData: prod as any,
          }).where(eq(supplierProducts.id, existingSupplier[0].id));
        } else {
          await db.insert(supplierProducts).values({
            providerKey: PROVIDER_KEY,
            supplierProductId: String(prod.id),
            supplierCategoryId: prod.category_id ? String(prod.category_id) : null,
            rawTitle: prod.name,
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

        if (existingProduct[0]) {
          // Only update price/stock if not overridden by admin
          const updateData: Record<string, unknown> = {
            stockQuantity: stockQty,
            stockUnlimited: prod.unlimited_stock ?? false,
            supplierPrice: supplierPrice.toFixed(2),
            customerPriceUSD: customerPrice.toFixed(2),
          };
          await db.update(products).set(updateData).where(eq(products.id, existingProduct[0].id));
        } else {
          await db.insert(products).values({
            providerKey: PROVIDER_KEY,
            supplierProductId: Number(prod.id),
            title: prod.name,
            slug: `${slug}-${String(prod.id)}`,
            description: prod.description ?? null,
            imageUrl: prod.image ?? null,
            supplierPrice: supplierPrice.toFixed(2) as any,
            markupPercent: markupPercent.toFixed(2) as any,
            customerPriceUSD: customerPrice.toFixed(2) as any,
            stockQuantity: stockQty,
            stockUnlimited: prod.unlimited_stock ?? false,
            isVisible: true,
            isFeatured: false,
          });
        }
        synced++;
      } catch (err: unknown) {
        errors++;
        await logSystem("error", "sync", `Failed to sync product ${prod.name}`, { error: String(err) });
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
    const response = await client.post("/orders", {
      product_id: supplierProductId,
      quantity,
      reference: `BULNIX-${orderId}`,
    });

    const data: AccsZoneOrderResponse = response.data;

    if (data.error || data.message?.toLowerCase().includes("error")) {
      await logSystem("error", "fulfillment", `AccsZone order failed for order ${orderId}`, { error: data.error ?? data.message });
      return { success: false, error: data.error ?? data.message ?? "Unknown error" };
    }

    await logSystem("info", "fulfillment", `AccsZone order placed for order ${orderId}`, {
      supplierOrderId: data.order_id,
      accountCount: data.accounts?.length ?? 0,
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
    const data = response.data;
    return {
      status: data.status ?? "unknown",
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
