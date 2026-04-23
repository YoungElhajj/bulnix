/**
 * Fadded Supplier Connector
 * Base URL: https://www.fadded.net/api/v1/reseller
 * Auth: X-Api-Key header
 *
 * Handles: category inference, product sync, stock sync, price sync,
 *          order placement, error logging
 *
 * Notes:
 *  - Fadded has no separate /categories endpoint; categories are inferred from product names
 *  - Prices are in NGN; converted to USD using a configurable exchange rate
 *  - Orders return items[].details (pipe-separated credential string)
 *  - Idempotent orders via external_order_id
 */

import axios, { AxiosInstance } from "axios";
import { eq, and } from "drizzle-orm";
import { categories, products, providerConfigs, providerSyncLogs, supplierProducts } from "../../drizzle/schema";
import { logSystem } from "../db";

const PROVIDER_KEY = "fadded";
const BASE_URL = "https://www.fadded.net/api/v1/reseller";

// Default NGN to USD exchange rate (admin can override via markup settings)
// 1 USD ≈ 1600 NGN (approximate mid-2025 rate)
const DEFAULT_NGN_TO_USD = 1600;

// ─── HTTP Client Factory ───────────────────────────────────────────────────────

function createClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "X-Api-Key": apiKey,
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

interface FaddedProduct {
  product_id: number;
  product_key: string;
  name: string;
  description?: string;
  base_api_price: number;
  discount_percent: number;
  unit_price: number;
  in_stock: number;
  selected?: boolean;
}

interface FaddedOrderItem {
  product_detail_id: number;
  details: string;
}

interface FaddedOrderResponse {
  success: boolean;
  data?: {
    product_id: number;
    product_key: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    currency: string;
    items: FaddedOrderItem[];
  };
  code?: string;
  message?: string;
}

// ─── Category Inference ────────────────────────────────────────────────────────

/**
 * Infer a category name and slug from a Fadded product name.
 * High-demand categories are assigned first so they get lower sort orders.
 */
function inferCategory(productName: string): { name: string; slug: string; sortOrder: number } {
  const name = productName.toUpperCase();
  // ── Social Media (map to AccsZone unified category slugs) ──
  if (name.includes("INSTAGRAM")) return { name: "Instagram Accounts", slug: "buy-instagram-accounts", sortOrder: 0 };
  if (name.includes("FACEBOOK") || name.includes("FB")) return { name: "Facebook Accounts", slug: "buy-facebook-accounts", sortOrder: 1 };
  if (name.includes("TIKTOK") || name.includes("TIK TOK")) return { name: "TikTok Accounts & Followers", slug: "buy-tiktok-accounts", sortOrder: 2 };
  if (name.includes("DISCORD")) return { name: "Discord Accounts", slug: "buy-discord-accounts", sortOrder: 3 };
  if (name.includes("TWITTER") || name.includes(" X ") || name.startsWith("X ") || name.includes("X OLD") || name.includes("X ACCOUNT")) return { name: "Twitter/X Accounts", slug: "buy-twitter-x-accounts", sortOrder: 4 };
  if (name.includes("YOUTUBE")) return { name: "YouTube Accounts & Channels", slug: "buy-youtube-accounts", sortOrder: 5 };
  if (name.includes("SNAPCHAT")) return { name: "Snapchat Accounts", slug: "buy-snapchat-accounts", sortOrder: 6 };
  if (name.includes("REDDIT")) return { name: "Reddit Accounts", slug: "buy-reddit-accounts", sortOrder: 7 };
  if (name.includes("ONLY FANS") || name.includes("ONLYFANS")) return { name: "OnlyFans", slug: "onlyfans", sortOrder: 8 };
  if (name.includes("LINKEDIN")) return { name: "LinkedIn Accounts", slug: "buy-linkedin-accounts", sortOrder: 9 };
  if (name.includes("WHATSAPP")) return { name: "WhatsApp Accounts", slug: "buy-whatsapp-accounts", sortOrder: 10 };
  if (name.includes("TELEGRAM")) return { name: "Telegram Accounts", slug: "buy-telegram-accounts", sortOrder: 11 };
  if (name.includes("PINTEREST")) return { name: "Pinterest Accounts", slug: "buy-pinterest-accounts", sortOrder: 12 };
  if (name.includes("TRUSTPILOT")) return { name: "Trustpilot Accounts", slug: "buy-trustpilot-accounts", sortOrder: 13 };
  if (name.includes("QUORA")) return { name: "Quora Accounts", slug: "buy-quora-accounts", sortOrder: 14 };
  // ── Streaming & Entertainment ──
  if (name.includes("NETFLIX") || name.includes("DISNEY") || name.includes("HULU") || name.includes("HBO") || name.includes("PRIME VIDEO")) return { name: "Netflix Accounts & Gift Cards", slug: "buy-netflix-accounts", sortOrder: 20 };
  if (name.includes("STEAM") || name.includes("GAMING") || name.includes("XBOX") || name.includes("PLAYSTATION") || name.includes("PS4") || name.includes("PS5")) return { name: "Steam Gift Cards", slug: "buy-steam-gift-cards", sortOrder: 21 };
  if (name.includes("SPOTIFY")) return { name: "Streaming", slug: "streaming", sortOrder: 22 };
  // ── Apple & Amazon ──
  if (name.includes("APPLE MUSIC") || name.includes("APPLE TV") || name.includes("APPLE ID") || name.includes("ICLOUD") || name.includes("ITUNES")) return { name: "Apple", slug: "apple-gift-card-digital-code", sortOrder: 23 };
  if (name.includes("AMAZON") || name.includes("PRIME")) return { name: "Amazon Accounts", slug: "amazon-accounts", sortOrder: 24 };
  // ── Software & Productivity ──
  if (name.includes("CANVA") || name.includes("FIGMA") || name.includes("ADOBE")) return { name: "Design Tools", slug: "design-tools", sortOrder: 30 };
  if (name.includes("CHATGPT") || name.includes("OPENAI") || name.includes("DEEP SEEK") || name.includes("DEEPSEEK") || name.includes("CLAUDE") || name.includes("GEMINI")) return { name: "AI Tools", slug: "ai-tools", sortOrder: 31 };
  if (name.includes("GMAIL") || name.includes("GOOGLE VOICE") || name.includes("GOOGLE ADS")) return { name: "Google Voice Accounts", slug: "buy-google-voice-accounts", sortOrder: 32 };
  if (name.includes("MICROSOFT") || name.includes("OUTLOOK") || name.includes("OFFICE")) return { name: "Outlook Email Accounts", slug: "buy-outlook-accounts", sortOrder: 33 };
  // ── VPN & Proxy ──
  if (name.includes("VPN") || name.includes("NORDVPN") || name.includes("EXPRESSVPN") || name.includes("HMA") || name.includes("IP VANISH") || name.includes("IPVANISH")) return { name: "VPN Premium", slug: "buy-vpn-accounts", sortOrder: 40 };
  if (name.includes("PROXY") || name.includes("SOCKS") || name.includes("SOCK 5") || name.includes("9PROXY") || name.includes("PIA SOCK")) return { name: "Mobile Proxies", slug: "buy-mobile-proxies", sortOrder: 41 };
  // ── Dating ──
  if (name.includes("DATING") || name.includes("TINDER") || name.includes("BUMBLE") || name.includes("GRINDR") || name.includes("HINGE")) return { name: "Dating App Accounts", slug: "buy-dating-accounts", sortOrder: 50 };
  // ── Communication ──
  if (name.includes("TALKATONE") || name.includes("TEXT FREE") || name.includes("TEXTPLUS") || name.includes("TEXT NOW") || name.includes("SMS") || name.includes("PHONE NUMBER")) return { name: "Phone & SMS", slug: "phone-sms", sortOrder: 60 };
  // ── Other / Misc (sort order 90+) ──
  return { name: "Other Accounts", slug: "other-accounts", sortOrder: 90 };
}
/**
 * Extract delivery format from Fadded product description.
 * Fadded descriptions often contain pipe-separated format hints like:
 * "Account format | username | passwords | Mail | Mailpassword | Recovery mail"
 */
function extractDeliveryFormat(description: string | null | undefined): string | null {
  if (!description) return null;
  // Strip HTML tags
  const stripped = description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  // Look for "Account format | ..." or "Format: ..." or "Number | password | 2FA | Cookies"
  const formatMatch = stripped.match(/(?:account\s+format\s*[|:]\s*|format\s*[|:]\s*|delivery\s+format\s*[|:]\s*)([^.\n<]+)/i);
  if (formatMatch) {
    return formatMatch[1].trim().replace(/\s*\|\s*/g, " : ");
  }
  // Look for pipe-separated credential patterns
  const pipeMatch = stripped.match(/\b((?:(?:email|password|username|login|mail|2fa|cookie|number|phone|recovery|id|key|token|code)\s*[|:]\s*){2,}[a-z0-9 |:]+)/i);
  if (pipeMatch) {
    return pipeMatch[1].trim().replace(/\s*\|\s*/g, " : ").replace(/\s*:\s*/g, " : ");
  }
  return null;
}
// ─── Category Sync (inferred from products) ────────────────────────────────────

export async function syncCategories(apiKey: string): Promise<{ synced: number; errors: number }> {
  const client = createClient(apiKey);
  let synced = 0;
  let errors = 0;

  try {
    const response = await client.get("/products");
    const rawProducts: FaddedProduct[] = response.data?.data ?? [];

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Collect unique categories
    const seen = new Set<string>();
    for (const prod of rawProducts) {
      const cat = inferCategory(prod.name);
      if (seen.has(cat.slug)) continue;
      seen.add(cat.slug);

      try {
        const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
        if (!existing[0]) {
          await db.insert(categories).values({
            name: cat.name,
            slug: cat.slug,
            description: null,
            imageUrl: null,
            parentId: null,
            isVisible: true,
            sortOrder: cat.sortOrder,
          });
          synced++;
        } else {
          // Update sort order if it's a high-demand category and current sort order is higher
          if (existing[0].sortOrder > cat.sortOrder) {
            await db.update(categories).set({ sortOrder: cat.sortOrder }).where(eq(categories.id, existing[0].id));
          }
        }
      } catch (err: unknown) {
        errors++;
        await logSystem("error", "sync", `Failed to sync Fadded category ${cat.name}`, { error: String(err) });
      }
    }
  } catch (err: unknown) {
    await logSystem("error", "sync", "Fadded category sync failed", { error: String(err) });
    throw err;
  }

  return { synced, errors };
}

// ─── Product Sync ─────────────────────────────────────────────────────────────

export async function syncProducts(apiKey: string, markupPercent = 20, ngnToUsd = DEFAULT_NGN_TO_USD): Promise<{ synced: number; errors: number }> {
  const client = createClient(apiKey);
  let synced = 0;
  let errors = 0;

  try {
    const response = await client.get("/products");
    const rawProducts: FaddedProduct[] = response.data?.data ?? [];

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    for (const prod of rawProducts) {
      try {
        // Convert NGN price to USD
        const supplierPriceNGN = Number(prod.unit_price) || 0;
        const supplierPriceUSD = supplierPriceNGN / ngnToUsd;
        const customerPriceUSD = supplierPriceUSD * (1 + markupPercent / 100);

        const prodName = prod.name;
        const slug = prodName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const stockQty = Number(prod.in_stock) || 0;
        const cat = inferCategory(prodName);
        const deliveryFormat = extractDeliveryFormat(prod.description);

        // Upsert into supplier_products cache
        const existingSupplier = await db.select().from(supplierProducts)
          .where(and(eq(supplierProducts.providerKey, PROVIDER_KEY), eq(supplierProducts.supplierProductId, String(prod.product_id))))
          .limit(1);

        if (existingSupplier[0]) {
          await db.update(supplierProducts).set({
            rawTitle: prodName,
            rawPrice: supplierPriceUSD.toFixed(4) as any,
            rawStock: stockQty,
            rawData: prod as any,
          }).where(eq(supplierProducts.id, existingSupplier[0].id));
        } else {
          await db.insert(supplierProducts).values({
            providerKey: PROVIDER_KEY,
            supplierProductId: String(prod.product_id),
            supplierCategoryId: cat.slug,
            rawTitle: prodName,
            rawDescription: prod.description ?? null,
            rawPrice: supplierPriceUSD.toFixed(4) as any,
            rawStock: stockQty,
            rawData: prod as any,
          });
        }

        // Resolve or create category
        const catRow = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
        let categoryId: number | null = catRow[0]?.id ?? null;
        let categoryImageUrl: string | null = catRow[0]?.imageUrl ?? null;
        if (!categoryId) {
          await db.insert(categories).values({
            name: cat.name,
            slug: cat.slug,
            isVisible: true,
            sortOrder: cat.sortOrder,
          });
          const newCat = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
          categoryId = newCat[0]?.id ?? null;
          categoryImageUrl = newCat[0]?.imageUrl ?? null;
        }

        // Upsert into products table
        const existingProduct = await db.select().from(products)
          .where(and(eq(products.providerKey, PROVIDER_KEY), eq(products.supplierProductId, prod.product_id)))
          .limit(1);

        if (existingProduct[0]) {
          const updateData: Record<string, unknown> = {
            stockQuantity: stockQty,
            stockUnlimited: false,
            supplierPrice: supplierPriceUSD.toFixed(4),
            customerPriceUSD: customerPriceUSD.toFixed(4),
          };
          if (categoryId) updateData.categoryId = categoryId;
          // Assign category icon if product has no image
          if (!existingProduct[0].imageUrl && categoryImageUrl) {
            updateData.imageUrl = categoryImageUrl;
          }
          // Update delivery format if we extracted one and product doesn't have a manual override
          if (deliveryFormat && !existingProduct[0].deliveryFormat) {
            updateData.deliveryFormat = deliveryFormat;
          }
          await db.update(products).set(updateData).where(eq(products.id, existingProduct[0].id));
        } else {
          await db.insert(products).values({
            providerKey: PROVIDER_KEY,
            supplierProductId: prod.product_id,
            title: prodName,
            slug: `${slug}-fadded-${prod.product_id}`,
            description: prod.description ?? null,
            imageUrl: categoryImageUrl,
            categoryId,
            supplierPrice: supplierPriceUSD.toFixed(4) as any,
            markupPercent: markupPercent.toFixed(2) as any,
            customerPriceUSD: customerPriceUSD.toFixed(4) as any,
            stockQuantity: stockQty,
            stockUnlimited: false,
            isVisible: stockQty > 0, // Only show in-stock products by default
            isFeatured: false,
            deliveryFormat: deliveryFormat ?? null,
          });
        }
        synced++;
      } catch (err: unknown) {
        errors++;
        await logSystem("error", "sync", `Failed to sync Fadded product ${prod.name}`, { error: String(err) });
      }
    }
  } catch (err: unknown) {
    await logSystem("error", "sync", "Fadded product sync failed", { error: String(err) });
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
    const response = await client.get("/products");
    const rawProducts: FaddedProduct[] = response.data?.data ?? [];

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    for (const prod of rawProducts) {
      try {
        const stockQty = Number(prod.in_stock) || 0;
        await db.update(products).set({
          stockQuantity: stockQty,
          stockUnlimited: false,
          // Auto-hide out-of-stock products, auto-show when back in stock
          isVisible: stockQty > 0,
        }).where(and(eq(products.providerKey, PROVIDER_KEY), eq(products.supplierProductId, prod.product_id)));
        updated++;
      } catch (err: unknown) {
        errors++;
      }
    }
  } catch (err: unknown) {
    await logSystem("warn", "sync", "Fadded stock sync failed, will retry", { error: String(err) });
  }

  return { updated, errors };
}

// ─── Price Sync ───────────────────────────────────────────────────────────────

export async function syncPrices(apiKey: string, ngnToUsd = DEFAULT_NGN_TO_USD): Promise<{ updated: number; errors: number }> {
  const client = createClient(apiKey);
  let updated = 0;
  let errors = 0;

  try {
    const response = await client.get("/products");
    const rawProducts: FaddedProduct[] = response.data?.data ?? [];

    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    for (const prod of rawProducts) {
      try {
        const existing = await db.select().from(products)
          .where(and(eq(products.providerKey, PROVIDER_KEY), eq(products.supplierProductId, prod.product_id)))
          .limit(1);
        if (existing[0]) {
          const supplierPriceUSD = Number(prod.unit_price) / ngnToUsd;
          const markup = Number(existing[0].markupPercent) || 20;
          const customerPrice = supplierPriceUSD * (1 + markup / 100);
          await db.update(products).set({
            supplierPrice: supplierPriceUSD.toFixed(4) as any,
            customerPriceUSD: customerPrice.toFixed(4) as any,
          }).where(eq(products.id, existing[0].id));
          updated++;
        }
      } catch (err: unknown) {
        errors++;
      }
    }
  } catch (err: unknown) {
    await logSystem("warn", "sync", "Fadded price sync failed", { error: String(err) });
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
    const response = await client.post("/order", {
      product_key: `prod_${supplierProductId}`,
      quantity,
      external_order_id: `BULNIX-${orderId}`,
      customer_info: { order_id: orderId },
    });

    const responseData: FaddedOrderResponse = response.data;

    if (!responseData.success) {
      const errMsg = responseData.message ?? responseData.code ?? "Unknown error from Fadded";
      await logSystem("error", "fulfillment", `Fadded order failed for order ${orderId}`, { error: errMsg, code: responseData.code });
      return { success: false, error: errMsg };
    }

    const orderData = responseData.data!;

    await logSystem("info", "fulfillment", `Fadded order placed for order ${orderId}`, {
      supplierOrderId: `fadded-${orderId}`,
      itemCount: orderData.items?.length ?? 0,
    });

    // Transform items into the same format as AccsZone accounts
    // Each item has: { product_detail_id, details } where details is a pipe-separated string
    const deliveryData = (orderData.items ?? []).map((item) => ({
      product_detail_id: item.product_detail_id,
      details: item.details,
      // Parse the pipe-separated details into structured fields
      ...parseItemDetails(item.details),
    }));

    return {
      success: true,
      supplierOrderId: `fadded-${orderId}`,
      deliveryData,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await logSystem("error", "fulfillment", `Fadded order exception for order ${orderId}`, { error: message });
    return { success: false, error: message };
  }
}

/**
 * Parse a Fadded item details string into structured fields.
 * Fadded returns details like: "Username: abc | Password: xyz | Email: test@test.com"
 * or pipe-separated values without labels.
 */
function parseItemDetails(details: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!details) return result;

  // Try "Key: Value | Key: Value" format first
  if (details.includes(":")) {
    const parts = details.split(/\s*\|\s*/);
    for (const part of parts) {
      const colonIdx = part.indexOf(":");
      if (colonIdx > 0) {
        const key = part.slice(0, colonIdx).trim().toLowerCase().replace(/\s+/g, "_");
        const value = part.slice(colonIdx + 1).trim();
        if (key && value) result[key] = value;
      }
    }
    if (Object.keys(result).length > 0) return result;
  }

  // Fall back: store as raw details
  result["details"] = details;
  return result;
}

// ─── Check Order Status ───────────────────────────────────────────────────────
// Fadded API is synchronous (order + delivery in one call), so status is always completed

export async function checkSupplierOrderStatus(
  _apiKey: string,
  supplierOrderId: string
): Promise<{ status: string; deliveryData?: unknown; error?: string }> {
  // Fadded delivers synchronously; if we have a supplierOrderId, it's completed
  if (supplierOrderId && supplierOrderId.startsWith("fadded-")) {
    return { status: "completed" };
  }
  return { status: "unknown" };
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
      await logSystem("info", "sync", `Fadded categories synced: ${catResult.synced} ok, ${catResult.errors} errors`);
    }

    if (syncType === "products" || syncType === "full") {
      const config = await db.select().from(providerConfigs).where(eq(providerConfigs.providerKey, providerKey)).limit(1);
      const markup = Number(config[0]?.defaultMarkupPercent ?? 20);
      const prodResult = await syncProducts(apiKey, markup);
      result = prodResult;
      await logSystem("info", "sync", `Fadded products synced: ${prodResult.synced} ok, ${prodResult.errors} errors`);
    }

    if (syncType === "stock") {
      const stockResult = await syncStock(apiKey);
      result = stockResult;
      await logSystem("info", "sync", `Fadded stock updated: ${stockResult.updated} ok, ${stockResult.errors} errors`);
    }

    if (syncType === "prices") {
      const priceResult = await syncPrices(apiKey);
      result = priceResult;
      await logSystem("info", "sync", `Fadded prices updated: ${priceResult.updated} ok, ${priceResult.errors} errors`);
    }

    if (logId) {
      await db.update(providerSyncLogs).set({
        status: "success",
        completedAt: new Date(),
        itemsSynced: result.synced ?? result.updated ?? 0,
        itemsFailed: result.errors,
      }).where(eq(providerSyncLogs.id, logId));
    }

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
    await logSystem("error", "sync", `Fadded sync failed for ${providerKey}`, { error: message });
  }
}
