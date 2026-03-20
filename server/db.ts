import { and, desc, eq, ilike, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  adminActions,
  categories,
  coupons,
  exchangeRates,
  fulfillmentRecords,
  notifications,
  orderItems,
  orders,
  payments,
  paymentEvents,
  products,
  providerConfigs,
  providerSyncLogs,
  savedProducts,
  supplierProducts,
  supportTickets,
  systemLogs,
  ticketMessages,
  users,
  type InsertUser,
} from "../drizzle/schema";
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: {
  name?: string; country?: string; preferredCurrency?: "NGN" | "USD" | "EUR" | "GBP";
  notifyEmail?: boolean; notifyOrders?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.preferredCurrency !== undefined) updateData.preferredCurrency = data.preferredCurrency;
  if (data.notifyEmail !== undefined) updateData.notifyEmail = data.notifyEmail;
  if (data.notifyOrders !== undefined) updateData.notifyOrders = data.notifyOrders;
  if (Object.keys(updateData).length === 0) return { success: true };
  await db.update(users).set(updateData).where(eq(users.id, userId));
  return { success: true };
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isVisible, true)).orderBy(categories.sortOrder, categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function createCategory(data: { name: string; slug: string; description?: string; parentId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(categories).values({ name: data.name, slug: data.slug, description: data.description ?? null, parentId: data.parentId ?? null });
  return { success: true };
}

export async function updateCategory(data: {
  id: number; name?: string; slug?: string; description?: string;
  imageUrl?: string; parentId?: number | null; isVisible?: boolean; sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.parentId !== undefined) updateData.parentId = data.parentId;
  if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (Object.keys(updateData).length > 0) {
    await db.update(categories).set(updateData).where(eq(categories.id, data.id));
  }
  return { success: true };
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Move products to uncategorized before deleting
  await db.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  return { success: true };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products)
    .where(and(eq(products.isVisible, true), eq(products.isFeatured, true)))
    .orderBy(desc(products.updatedAt))
    .limit(8);
}

export async function getProducts(input: {
  categoryId?: number; categorySlug?: string; search?: string;
  sort?: string; featured?: boolean; page: number; limit: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [eq(products.isVisible, true)];
  if (input.categoryId) conditions.push(eq(products.categoryId, input.categoryId));
  if (input.featured) conditions.push(eq(products.isFeatured, true));
  if (input.search) {
    conditions.push(like(products.title, `%${input.search}%`));
  }

  const offset = (input.page - 1) * input.limit;
  let query = db.select().from(products).where(and(...conditions)).limit(input.limit).offset(offset);

  const items = await query;
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(...conditions));
  const total = Number(countResult[0]?.count ?? 0);

  return { items, total, page: input.page, limit: input.limit };
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.isVisible, true))).limit(1);
  return result[0] ?? null;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] ?? null;
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export async function validateCoupon(code: string, subtotalUSD: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(coupons).where(and(eq(coupons.code, code.toUpperCase()), eq(coupons.isActive, true))).limit(1);
  const coupon = result[0];
  if (!coupon) return { valid: false, message: "Invalid coupon code" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, message: "Coupon has expired" };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, message: "Coupon usage limit reached" };
  if (coupon.minOrderUSD && subtotalUSD < Number(coupon.minOrderUSD)) return { valid: false, message: `Minimum order of $${coupon.minOrderUSD} required` };
  const discount = coupon.discountType === "percent"
    ? (subtotalUSD * Number(coupon.discountValue)) / 100
    : Number(coupon.discountValue);
  return { valid: true, discount: Math.min(discount, subtotalUSD), coupon };
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(userId: number, input: {
  items: { productId: number; quantity: number }[];
  currency: "NGN" | "USD" | "EUR" | "GBP";
  couponCode?: string;
  billingEmail?: string;
  billingCountry?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch products and calculate totals
  let subtotalUSD = 0;
  const itemsWithProducts = [];
  for (const item of input.items) {
    const product = await getProductById(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    if (!product.isVisible) throw new Error(`Product ${product.title} is not available`);
    if (!product.stockUnlimited && product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product.title}`);
    }
    const unitPrice = Number(product.customerPriceUSD);
    subtotalUSD += unitPrice * item.quantity;
    itemsWithProducts.push({ ...item, product, unitPrice });
  }

  // Apply coupon
  let discountUSD = 0;
  let couponDiscountUSD = 0;
  if (input.couponCode) {
    const couponResult = await validateCoupon(input.couponCode, subtotalUSD);
    if (couponResult.valid) {
      couponDiscountUSD = couponResult.discount ?? 0;
      discountUSD = couponDiscountUSD;
    }
  }

  // Get exchange rate
  const rates = await getExchangeRates();
  const rate = rates.find(r => r.fromCurrency === "USD" && r.toCurrency === input.currency);
  const exchangeRate = rate ? Number(rate.rate) : 1;
  const totalUSD = subtotalUSD - discountUSD;
  const totalInCurrency = totalUSD * exchangeRate;

  const orderNumber = `BLX-${Date.now()}-${nanoid(6).toUpperCase()}`;

  await db.insert(orders).values({
    orderNumber,
    userId,
    status: "pending_payment",
    subtotalUSD: subtotalUSD.toFixed(2) as any,
    discountUSD: discountUSD.toFixed(2) as any,
    totalUSD: totalUSD.toFixed(2) as any,
    currency: input.currency,
    totalInCurrency: totalInCurrency.toFixed(2) as any,
    exchangeRateSnapshot: exchangeRate.toFixed(6) as any,
    couponCode: input.couponCode ?? null,
    couponDiscountUSD: couponDiscountUSD.toFixed(2) as any,
    billingEmail: input.billingEmail ?? null,
    billingCountry: input.billingCountry ?? null,
  });

  const newOrder = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  const orderId = newOrder[0]!.id;

  // Insert order items
  for (const item of itemsWithProducts) {
    await db.insert(orderItems).values({
      orderId,
      productId: item.productId,
      productTitle: item.product.title,
      quantity: item.quantity,
      unitPriceUSD: item.unitPrice.toFixed(2) as any,
      totalPriceUSD: (item.unitPrice * item.quantity).toFixed(2) as any,
      supplierProductId: item.product.supplierProductId?.toString() ?? null,
      providerKey: item.product.providerKey,
    });
  }

  await logSystem("info", "order", `Order ${orderNumber} created for user ${userId}`, { orderId, totalUSD });

  return { orderId, orderNumber, totalUSD, totalInCurrency, currency: input.currency };
}

export async function getUserOrders(userId: number, input: { status?: string; page: number; limit: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(orders.userId, userId)];
  if (input.status) conditions.push(eq(orders.status, input.status as any));
  const offset = (input.page - 1) * input.limit;
  const items = await db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt)).limit(input.limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(orders).where(and(...conditions));
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getUserOrderById(userId: number, orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
  if (!result[0]) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return { ...result[0], items };
}

export async function getOrderDelivery(userId: number, orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const order = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
  if (!order[0]) return null;
  const records = await db.select().from(fulfillmentRecords).where(eq(fulfillmentRecords.orderId, orderId));
  // Mark as viewed
  await db.update(fulfillmentRecords).set({ userViewed: true }).where(eq(fulfillmentRecords.orderId, orderId));
  return records;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function initiatePayment(userId: number, input: {
  orderId: number; gateway: "paystack" | "monnify" | "nowpayments"; currency: "NGN" | "USD" | "EUR" | "GBP";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const order = await db.select().from(orders).where(and(eq(orders.id, input.orderId), eq(orders.userId, userId))).limit(1);
  if (!order[0]) throw new Error("Order not found");
  if (order[0].status !== "pending_payment") throw new Error("Order is not in pending payment state");

  const gatewayRef = `BLX-PAY-${nanoid(16).toUpperCase()}`;
  const rates = await getExchangeRates();
  const rate = rates.find(r => r.fromCurrency === "USD" && r.toCurrency === input.currency);
  const exchangeRate = rate ? Number(rate.rate) : 1;
  const amount = Number(order[0].totalUSD) * exchangeRate;

  await db.insert(payments).values({
    orderId: input.orderId,
    userId,
    gateway: input.gateway,
    gatewayReference: gatewayRef,
    status: "pending",
    amount: amount.toFixed(2) as any,
    currency: input.currency,
    amountUSD: order[0].totalUSD,
    exchangeRate: exchangeRate.toFixed(6) as any,
  });

  // Lock the order
  await db.update(orders).set({ isLocked: true }).where(eq(orders.id, input.orderId));

  await logSystem("info", "payment", `Payment initiated for order ${input.orderId}`, { gateway: input.gateway, amount, currency: input.currency });

  return {
    gatewayRef,
    amount,
    currency: input.currency,
    gateway: input.gateway,
    // In production these would be real gateway URLs
    paymentUrl: `#payment-${gatewayRef}`,
    message: `Payment initiated. Reference: ${gatewayRef}`,
  };
}

export async function getPaymentStatus(userId: number, orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments).where(and(eq(payments.orderId, orderId), eq(payments.userId, userId))).orderBy(desc(payments.createdAt)).limit(1);
  return result[0] ?? null;
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

export async function createTicket(userId: number, input: {
  subject: string; message: string; orderId?: number; priority: "low" | "medium" | "high" | "urgent";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ticketNumber = `TKT-${Date.now()}-${nanoid(4).toUpperCase()}`;
  await db.insert(supportTickets).values({
    ticketNumber,
    userId,
    orderId: input.orderId ?? null,
    subject: input.subject,
    priority: input.priority,
    status: "open",
  });
  const ticket = await db.select().from(supportTickets).where(eq(supportTickets.ticketNumber, ticketNumber)).limit(1);
  const ticketId = ticket[0]!.id;
  await db.insert(ticketMessages).values({ ticketId, senderId: userId, senderRole: "user", message: input.message });
  return { ticketId, ticketNumber };
}

export async function getUserTickets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.updatedAt));
}

export async function getTicketById(userId: number, ticketId: number) {
  const db = await getDb();
  if (!db) return null;
  const ticket = await db.select().from(supportTickets).where(and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, userId))).limit(1);
  if (!ticket[0]) return null;
  const messages = await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticketId)).orderBy(ticketMessages.createdAt);
  return { ...ticket[0], messages };
}

export async function replyToTicket(userId: number, role: "user" | "admin", input: { ticketId: number; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ticketMessages).values({ ticketId: input.ticketId, senderId: userId, senderRole: role, message: input.message });
  await db.update(supportTickets).set({ status: role === "admin" ? "pending" : "open", updatedAt: new Date() }).where(eq(supportTickets.id, input.ticketId));
  return { success: true };
}

// ─── Saved Products ───────────────────────────────────────────────────────────

export async function getSavedProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const saved = await db.select().from(savedProducts).where(eq(savedProducts.userId, userId));
  if (saved.length === 0) return [];
  const productIds = saved.map(s => s.productId);
  const prods = await db.select().from(products).where(sql`${products.id} IN (${productIds.join(",")})`);
  return prods;
}

export async function toggleSavedProduct(userId: number, productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(savedProducts).where(and(eq(savedProducts.userId, userId), eq(savedProducts.productId, productId))).limit(1);
  if (existing[0]) {
    await db.delete(savedProducts).where(and(eq(savedProducts.userId, userId), eq(savedProducts.productId, productId)));
    return { saved: false };
  } else {
    await db.insert(savedProducts).values({ userId, productId });
    return { saved: true };
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(userId: number, notifId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notifId), eq(notifications.userId, userId)));
  return { success: true };
}

export async function createNotification(userId: number, type: string, title: string, message: string, relatedOrderId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ userId, type, title, message, relatedOrderId: relatedOrderId ?? null });
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export async function getExchangeRates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exchangeRates);
}

export async function updateExchangeRate(input: { fromCurrency: string; toCurrency: string; rate: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(exchangeRates)
    .set({ rate: input.rate.toFixed(6) as any, source: "manual" })
    .where(and(eq(exchangeRates.fromCurrency, input.fromCurrency), eq(exchangeRates.toCurrency, input.toCurrency)));
  return { success: true };
}

// ─── Provider Configs ─────────────────────────────────────────────────────────

export async function getProviderConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(providerConfigs);
}

export async function updateProviderConfig(input: {
  providerKey: string; apiKey?: string; isEnabled?: boolean; syncIntervalMinutes?: number; defaultMarkupPercent?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (input.apiKey !== undefined) updateData.apiKey = input.apiKey;
  if (input.isEnabled !== undefined) updateData.isEnabled = input.isEnabled;
  if (input.syncIntervalMinutes !== undefined) updateData.syncIntervalMinutes = input.syncIntervalMinutes;
  if (input.defaultMarkupPercent !== undefined) updateData.defaultMarkupPercent = input.defaultMarkupPercent.toFixed(2);
  if (Object.keys(updateData).length > 0) {
    await db.update(providerConfigs).set(updateData).where(eq(providerConfigs.providerKey, input.providerKey));
  }
  return { success: true };
}

export async function triggerProviderSync(providerKey: string, syncType: "categories" | "products" | "stock" | "prices" | "full") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(providerSyncLogs).values({ providerKey, syncType, status: "running" });
  // The actual sync is handled by the AccsZone connector
  const { syncProvider } = await import("./connectors/accszone");
  syncProvider(providerKey, syncType).catch(err => console.error("[Sync] Error:", err));
  return { success: true, message: `Sync triggered for ${providerKey}` };
}

export async function getProviderSyncLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(providerSyncLogs).orderBy(desc(providerSyncLogs.startedAt)).limit(50);
}

// ─── System Logs ──────────────────────────────────────────────────────────────

export async function logSystem(level: "info" | "warn" | "error" | "critical", category: string, message: string, details?: object, userId?: number, orderId?: number) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(systemLogs).values({ level, category, message, details: details ?? null, userId: userId ?? null, orderId: orderId ?? null });
  } catch { /* silent */ }
}

export async function getSystemLogs(input: { page: number; limit: number; level?: string; category?: string }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (input.level) conditions.push(eq(systemLogs.level, input.level as any));
  if (input.category) conditions.push(eq(systemLogs.category, input.category));
  const offset = (input.page - 1) * input.limit;
  const items = conditions.length > 0
    ? await db.select().from(systemLogs).where(and(...conditions)).orderBy(desc(systemLogs.createdAt)).limit(input.limit).offset(offset)
    : await db.select().from(systemLogs).orderBy(desc(systemLogs.createdAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0
    ? await db.select({ count: sql<number>`count(*)` }).from(systemLogs).where(and(...conditions))
    : await db.select({ count: sql<number>`count(*)` }).from(systemLogs);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0, failedOrders: 0, openTickets: 0 };

  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [revenue] = await db.select({ sum: sql<number>`COALESCE(sum(totalUSD), 0)` }).from(orders).where(eq(orders.status, "fulfilled"));
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "pending_payment"));
  const [failedCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "failed"));
  const [ticketCount] = await db.select({ count: sql<number>`count(*)` }).from(supportTickets).where(eq(supportTickets.status, "open"));

  return {
    totalUsers: Number(userCount?.count ?? 0),
    totalOrders: Number(orderCount?.count ?? 0),
    totalRevenue: Number(revenue?.sum ?? 0),
    pendingOrders: Number(pendingCount?.count ?? 0),
    failedOrders: Number(failedCount?.count ?? 0),
    openTickets: Number(ticketCount?.count ?? 0),
  };
}

export async function adminGetProducts(input: { page: number; limit: number; search?: string }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (input.page - 1) * input.limit;
  const conditions = input.search ? [like(products.title, `%${input.search}%`)] : [];
  const items = conditions.length > 0
    ? await db.select().from(products).where(and(...conditions)).orderBy(desc(products.updatedAt)).limit(input.limit).offset(offset)
    : await db.select().from(products).orderBy(desc(products.updatedAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0
    ? await db.select({ count: sql<number>`count(*)` }).from(products).where(and(...conditions))
    : await db.select({ count: sql<number>`count(*)` }).from(products);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function adminCreateProduct(input: {
  title: string; slug: string; description?: string; imageUrl?: string;
  categoryId?: number; supplierPrice: number; markupPercent: number;
  stockQuantity: number; stockUnlimited: boolean; deliveryNote?: string;
  isVisible: boolean; isFeatured: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const customerPrice = input.supplierPrice * (1 + input.markupPercent / 100);
  await db.insert(products).values({
    title: input.title,
    slug: input.slug,
    description: input.description ?? null,
    imageUrl: input.imageUrl ?? null,
    categoryId: input.categoryId ?? null,
    providerKey: "manual",
    supplierProductId: null,
    supplierPrice: input.supplierPrice.toFixed(8) as any,
    customerPriceUSD: customerPrice.toFixed(2) as any,
    markupPercent: input.markupPercent.toFixed(2) as any,
    stockQuantity: input.stockQuantity,
    stockUnlimited: input.stockUnlimited,
    deliveryNote: input.deliveryNote ?? null,
    isVisible: input.isVisible,
    isFeatured: input.isFeatured,
  });
  return { success: true };
}

export async function adminUpdateProduct(input: {
  id: number; title?: string; description?: string; imageUrl?: string; markupPercent?: number;
  isVisible?: boolean; isFeatured?: boolean; categoryId?: number;
  regionRestrictions?: string[]; allowedPaymentMethods?: string[];
  deliveryNote?: string; refundPolicy?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
  if (input.isVisible !== undefined) updateData.isVisible = input.isVisible;
  if (input.isFeatured !== undefined) updateData.isFeatured = input.isFeatured;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.regionRestrictions !== undefined) updateData.regionRestrictions = input.regionRestrictions;
  if (input.allowedPaymentMethods !== undefined) updateData.allowedPaymentMethods = input.allowedPaymentMethods;
  if (input.deliveryNote !== undefined) updateData.deliveryNote = input.deliveryNote;
  if (input.refundPolicy !== undefined) updateData.refundPolicy = input.refundPolicy;
  if (input.markupPercent !== undefined) {
    updateData.markupPercent = input.markupPercent.toFixed(2);
    // Recalculate customer price
    const product = await getProductById(input.id);
    if (product) {
      const newPrice = Number(product.supplierPrice) * (1 + input.markupPercent / 100);
      updateData.customerPriceUSD = newPrice.toFixed(2);
    }
  }
  if (Object.keys(updateData).length > 0) {
    await db.update(products).set(updateData).where(eq(products.id, input.id));
  }
  return { success: true };
}

export async function adminGetOrders(input: { page: number; limit: number; status?: string }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (input.page - 1) * input.limit;
  const conditions = input.status ? [eq(orders.status, input.status as any)] : [];
  const items = conditions.length > 0
    ? await db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt)).limit(input.limit).offset(offset)
    : await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0
    ? await db.select({ count: sql<number>`count(*)` }).from(orders).where(and(...conditions))
    : await db.select({ count: sql<number>`count(*)` }).from(orders);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function adminUpdateOrder(input: { id: number; status?: string; adminNotes?: string; fraudFlag?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (input.status !== undefined) updateData.status = input.status;
  if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes;
  if (input.fraudFlag !== undefined) updateData.fraudFlag = input.fraudFlag;
  if (Object.keys(updateData).length > 0) {
    await db.update(orders).set(updateData).where(eq(orders.id, input.id));
  }
  return { success: true };
}

export async function adminRetryFulfillment(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order[0]) throw new Error("Order not found");
  await db.update(orders).set({ status: "processing", fulfillmentRetries: (order[0].fulfillmentRetries ?? 0) + 1 }).where(eq(orders.id, orderId));
  await logSystem("info", "order", `Admin retrying fulfillment for order ${orderId}`, { orderId });
  return { success: true };
}

export async function adminGetUsers(input: { page: number; limit: number; search?: string }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (input.page - 1) * input.limit;
  const conditions = input.search
    ? [or(like(users.email, `%${input.search}%`), like(users.name, `%${input.search}%`))]
    : [];
  const items = conditions.length > 0
    ? await db.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt)).limit(input.limit).offset(offset)
    : await db.select().from(users).orderBy(desc(users.createdAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0
    ? await db.select({ count: sql<number>`count(*)` }).from(users).where(and(...conditions))
    : await db.select({ count: sql<number>`count(*)` }).from(users);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function adminSuspendUser(userId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isSuspended: true, suspendedReason: reason ?? null }).where(eq(users.id, userId));
  return { success: true };
}

export async function adminReactivateUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isSuspended: false, suspendedReason: null }).where(eq(users.id, userId));
  return { success: true };
}

export async function adminGetTickets(input: { page: number; limit: number; status?: string }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (input.page - 1) * input.limit;
  const conditions = input.status ? [eq(supportTickets.status, input.status as any)] : [];
  const items = conditions.length > 0
    ? await db.select().from(supportTickets).where(and(...conditions)).orderBy(desc(supportTickets.updatedAt)).limit(input.limit).offset(offset)
    : await db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0
    ? await db.select({ count: sql<number>`count(*)` }).from(supportTickets).where(and(...conditions))
    : await db.select({ count: sql<number>`count(*)` }).from(supportTickets);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function adminReplyToTicket(adminId: number, input: { ticketId: number; message: string; closeTicket?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ticketMessages).values({ ticketId: input.ticketId, senderId: adminId, senderRole: "admin", message: input.message });
  const newStatus = input.closeTicket ? "resolved" : "pending";
  await db.update(supportTickets).set({ status: newStatus, resolvedAt: input.closeTicket ? new Date() : null }).where(eq(supportTickets.id, input.ticketId));
  return { success: true };
}
