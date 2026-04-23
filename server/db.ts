import { and, asc, desc, eq, ilike, inArray, like, or, sql } from "drizzle-orm";
import { paystackInitiate, paystackVerify } from "./payments/paystack";
import { flwInitiate, flwVerify } from "./payments/flutterwave";
import { npInitiate, npGetPaymentStatus, isNowPaymentsSuccess } from "./payments/nowpayments";
import { koraInitiate, koraVerify, isKoraSuccess } from "./payments/korapay";
import { isRetryableDbError, sleep, withDbRetry } from "./db-retry";
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
  wallets,
  walletTransactions,
  supplierRefundClaims,
  type InsertUser,
  type InsertSupplierRefundClaim,
} from "../drizzle/schema";
import { nanoid } from "nanoid";
import { safeSendEmail, sendOrderConfirmationEmail, sendOrderStatusEmail, sendTicketReplyEmail, sendDeliveryEmail, sendWalletTopupReceiptEmail } from "./email";

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

  const buildPayload = () => {
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
    return { values, updateSet };
  };

  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { values, updateSet } = buildPayload();
      await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
      return; // success
    } catch (error) {
      if (attempt < MAX_RETRIES && isRetryableDbError(error)) {
        const delay = attempt * 1500; // 1.5s, 3s
        console.warn(`[Database] upsertUser transient error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
      }
    }
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await withDbRetry(
    () => db!.select().from(users).where(eq(users.openId, openId)).limit(1),
    "getUserByOpenId"
  );
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
  return withDbRetry(
    () => db!.select().from(categories).where(eq(categories.isVisible, true)).orderBy(categories.sortOrder, categories.name),
    "getCategories"
  );
}

export async function getCategoriesWithCounts() {
  const db = await getDb();
  if (!db) return [];
  const cats = await withDbRetry(
    () => db!.select().from(categories).where(eq(categories.isVisible, true)).orderBy(categories.sortOrder, categories.name),
    "getCategoriesWithCounts:cats"
  );
  const counts = await withDbRetry(
    () => db!.select({ categoryId: products.categoryId, count: sql<number>`count(*)` }).from(products).where(eq(products.isVisible, true)).groupBy(products.categoryId),
    "getCategoriesWithCounts:counts"
  );
  const countMap = new Map<number, number>();
  for (const row of counts) {
    if (row.categoryId != null) countMap.set(row.categoryId, Number(row.count));
  }
  return cats.map(cat => {
    const directCount = countMap.get(cat.id) ?? 0;
    const childCount = cats.filter(c => c.parentId === cat.id).reduce((sum, c) => sum + (countMap.get(c.id) ?? 0), 0);
    return { ...cat, productCount: directCount + childCount };
  });
}
export async function getSubcategoriesByParentId(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  const subs = await withDbRetry(
    () => db!.select().from(categories).where(and(eq(categories.parentId, parentId), eq(categories.isVisible, true))).orderBy(categories.sortOrder, categories.name),
    "getSubcategoriesByParentId:subs"
  );
  if (subs.length === 0) return [];
  const subIds = subs.map(s => s.id);
  const counts = await withDbRetry(
    () => db!.select({ categoryId: products.categoryId, count: sql<number>`count(*)` }).from(products).where(and(eq(products.isVisible, true), inArray(products.categoryId, subIds))).groupBy(products.categoryId),
    "getSubcategoriesByParentId:counts"
  );
  const countMap = new Map<number, number>();
  for (const row of counts) {
    if (row.categoryId != null) countMap.set(row.categoryId, Number(row.count));
  }
  return subs.map(s => ({ ...s, productCount: countMap.get(s.id) ?? 0 }));
}
export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await withDbRetry(
    () => db!.select().from(categories).where(eq(categories.slug, slug)).limit(1),
    "getCategoryBySlug"
  );
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
  return withDbRetry(
    () => db!.select().from(products)
      .where(and(eq(products.isVisible, true), eq(products.isFeatured, true)))
      .orderBy(desc(products.updatedAt))
      .limit(8),
    "getFeaturedProducts"
  );
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
    // Search across title AND category name so e.g. 'instagram' finds 'IG Accounts' products
    const searchTerm = `%${input.search}%`;
    const matchingCats = await withDbRetry(
      () => db!.select({ id: categories.id }).from(categories).where(like(categories.name, searchTerm)),
      "getProducts:searchCats"
    );
    const matchingCatIds = matchingCats.map(c => c.id);
    if (matchingCatIds.length > 0) {
      conditions.push(or(like(products.title, searchTerm), inArray(products.categoryId, matchingCatIds))!);
    } else {
      conditions.push(like(products.title, searchTerm));
    }
  }

  const offset = (input.page - 1) * input.limit;

  // Apply sort ordering
  let orderByClause;
  if (input.sort === "price_asc") orderByClause = asc(products.customerPriceUSD);
  else if (input.sort === "price_desc") orderByClause = desc(products.customerPriceUSD);
  else if (input.sort === "popular") orderByClause = desc(products.stockQuantity);
  else orderByClause = desc(products.updatedAt); // newest

  // Handle categorySlug lookup - include products from all subcategories
  if (input.categorySlug && !input.categoryId) {
    const cat = await getCategoryBySlug(input.categorySlug);
    if (cat) {
      const subcats = await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, cat.id));
      const allCategoryIds = [cat.id, ...subcats.map(s => s.id)];
      if (allCategoryIds.length === 1) {
        conditions.push(eq(products.categoryId, allCategoryIds[0]));
      } else {
        conditions.push(inArray(products.categoryId, allCategoryIds));
      }
    }
  }

  const items = await withDbRetry(
    () => db!.select().from(products).where(and(...conditions)).orderBy(orderByClause).limit(input.limit).offset(offset),
    "getProducts:items"
  );
  const countResult = await withDbRetry(
    () => db!.select({ count: sql<number>`count(*)` }).from(products).where(and(...conditions)),
    "getProducts:count"
  );
  const total = Number(countResult[0]?.count ?? 0);

  return { items, total, page: input.page, limit: input.limit };
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await withDbRetry(
    () => db!.select().from(products).where(and(eq(products.slug, slug), eq(products.isVisible, true))).limit(1),
    "getProductBySlug"
  );
  return result[0] ?? null;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await withDbRetry(
    () => db!.select().from(products).where(eq(products.id, id)).limit(1),
    "getProductById"
  );
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
  const itemsWithProducts: Array<{ productId: number; quantity: number; product: NonNullable<Awaited<ReturnType<typeof getProductById>>>; unitPrice: number }> = [];
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

  await withDbRetry(() => db!.insert(orders).values({
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
  }), "createOrder:insertOrder");

  const newOrder = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  const orderId = newOrder[0]!.id;

  // Insert order items
  for (const item of itemsWithProducts) {
    await withDbRetry(() => db!.insert(orderItems).values({
      orderId,
      productId: item.productId,
      productTitle: item.product.title,
      quantity: item.quantity,
      unitPriceUSD: item.unitPrice.toFixed(2) as any,
      totalPriceUSD: (item.unitPrice * item.quantity).toFixed(2) as any,
      supplierProductId: item.product.supplierProductId?.toString() ?? null,
      providerKey: item.product.providerKey,
    }), "createOrder:insertItem");
  }

  await logSystem("info", "order", `Order ${orderNumber} created for user ${userId}`, { orderId, totalUSD });

  // Send order confirmation email
  const orderUser = await db.select({ email: users.email, name: users.name, notifyOrders: users.notifyOrders }).from(users).where(eq(users.id, userId)).limit(1);
  const recipientEmail = orderUser[0]?.email ?? input.billingEmail ?? null;
  if (recipientEmail && orderUser[0]?.notifyOrders !== false) {
    safeSendEmail(() => sendOrderConfirmationEmail({
      to: recipientEmail,
      name: orderUser[0]?.name ?? "there",
      orderNumber,
      orderId,
      items: itemsWithProducts.map(i => ({ title: i.product.title, quantity: i.quantity, priceUSD: i.unitPrice })),
      totalUSD,
      currency: input.currency,
      status: "pending_payment",
    }));
  }

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
  orderId: number; gateway: "paystack" | "flutterwave" | "nowpayments"; currency: "NGN" | "USD" | "EUR" | "GBP";
}, origin?: string) {
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

  // Fetch user email for gateway
  const [orderUser] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  const userEmail = orderUser?.email ?? `user${userId}@bulnix.com`;
  const userName = orderUser?.name ?? "Bulnix Customer";

  // Determine the callback URL — use the origin passed from the request so it works in all environments
  const siteOrigin = origin ?? (process.env.NODE_ENV === "production" ? "https://bulnix.com" : "http://localhost:3000");
  const callbackUrl = `${siteOrigin}/api/payments/verify?type=order`;

  let paymentUrl = `#payment-${gatewayRef}`;
  let gatewayTransactionId: string | undefined;

  // Get NGN rate for Paystack (Paystack Nigeria only supports NGN)
  const allRates = await getExchangeRates();
  const ngnRateRow = allRates.find(r => r.fromCurrency === "USD" && r.toCurrency === "NGN");
  const usdToNgn = ngnRateRow ? Number(ngnRateRow.rate) : 1600;

  try {
    if (input.gateway === "paystack") {
      // Paystack Nigeria only supports NGN. Convert the order USD total → NGN → kobo.
      const amountNGN = Math.round(Number(order[0].totalUSD) * usdToNgn);
      const amountKobo = amountNGN * 100;
      const result = await paystackInitiate({
        email: userEmail,
        amountKobo,
        reference: gatewayRef,
        currency: "NGN",
        callbackUrl,
        metadata: { orderId: input.orderId, userId, topupRef: gatewayRef, amountUSD: Number(order[0].totalUSD) },
      });
      paymentUrl = result.authorizationUrl;
    } else if (input.gateway === "flutterwave") {
      const result = await flwInitiate({
        txRef: gatewayRef,
        amount,
        currency: input.currency,
        email: userEmail,
        name: userName,
        redirectUrl: callbackUrl,
        description: `Order #${order[0].orderNumber}`,
        meta: { orderId: input.orderId, userId },
      });
      paymentUrl = result.paymentLink;
    } else if (input.gateway === "nowpayments") {
      const result = await npInitiate({
        priceAmount: Number(order[0].totalUSD),
        priceCurrency: "usd",
        orderId: gatewayRef,
        orderDescription: `Order #${order[0].orderNumber}`,
        successUrl: `${callbackUrl}&reference=${gatewayRef}&status=success`,
        cancelUrl: `${callbackUrl}&reference=${gatewayRef}&status=cancelled`,
        ipnCallbackUrl: `${siteOrigin}/api/webhooks/nowpayments`,
      });
      paymentUrl = result.invoiceUrl;
      gatewayTransactionId = result.invoiceId;
    }
  } catch (err: any) {
    await logSystem("error", "payment", `Gateway initiation failed for order ${input.orderId}`, { gateway: input.gateway, error: err.message });
    throw new Error(`Payment gateway error: ${err.message}`);
  }

  await withDbRetry(() => db!.insert(payments).values({
    orderId: input.orderId,
    userId,
    gateway: input.gateway,
    gatewayReference: gatewayRef,
    gatewayTransactionId: gatewayTransactionId ?? null,
    status: "pending",
    amount: amount.toFixed(2) as any,
    currency: input.currency,
    amountUSD: order[0].totalUSD,
    exchangeRate: exchangeRate.toFixed(6) as any,
  }), "initiatePayment:insertPayment");
  // Lock the order
  await withDbRetry(() => db!.update(orders).set({ isLocked: true }).where(eq(orders.id, input.orderId)), "initiatePayment:lockOrder");

  await logSystem("info", "payment", `Payment initiated for order ${input.orderId}`, { gateway: input.gateway, amount, currency: input.currency, paymentUrl });

  return {
    gatewayRef,
    amount,
    currency: input.currency,
    gateway: input.gateway,
    paymentUrl,
    message: `Payment initiated. Reference: ${gatewayRef}`,
  };
}

/**
 * Called by webhooks when a payment is confirmed for an order (not a wallet topup).
 * Marks the payment as successful and updates the order status to processing.
 */
export async function fulfillOrderByReference(reference: string, gateway: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [payment] = await db.select().from(payments).where(eq(payments.gatewayReference, reference)).limit(1);
  if (!payment) throw new Error(`Payment not found for reference ${reference}`);
  if (payment.status === "success") return { success: true, alreadyProcessed: true };

  // Mark payment as success
  await withDbRetry(() => db!.update(payments).set({ status: "success", webhookVerified: true }).where(eq(payments.id, payment.id)), "fulfillOrderByReference:updatePayment");
  // Move order to processing
  await withDbRetry(() => db!.update(orders).set({ status: "processing" }).where(eq(orders.id, payment.orderId)), "fulfillOrderByReference:updateOrder");
  await logSystem("info", "payment", `Order ${payment.orderId} payment confirmed via ${gateway} webhook`, { reference, gateway });
  // Trigger auto-fulfillment asynchronously (don't block the webhook response)
  autoFulfillOrder(payment.orderId).catch(err => console.error("[AutoFulfill] Error:", err));
  return { success: true, orderId: payment.orderId };
}

/**
 * Pay for an order directly from the user's wallet balance.
 * Deducts the order total in USD from the wallet and marks the order as processing.
 */
export async function payOrderWithWallet(userId: number, orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the order and verify it belongs to this user
  const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.userId, userId))).limit(1);
  if (!order) throw new Error("Order not found");
  if (order.status !== "pending_payment") throw new Error("Order is not pending payment");

  const totalUSD = Number(order.totalUSD);

  // Get wallet and check balance
  const wallet = await getOrCreateWallet(userId);
  const currentBalance = Number(wallet.balanceUSD);
  if (currentBalance < totalUSD) {
    throw new Error(`Insufficient wallet balance. You have $${currentBalance.toFixed(2)} but need $${totalUSD.toFixed(2)}`);
  }

  // Deduct from wallet
  const newBalance = (currentBalance - totalUSD).toFixed(6);
  const newSpent = (Number(wallet.totalSpent) + totalUSD).toFixed(6);
  await withDbRetry(() => db!.update(wallets).set({ balanceUSD: newBalance, totalSpent: newSpent }).where(eq(wallets.userId, userId)), "payOrderWithWallet:deductWallet");

  // Record wallet transaction
  const txRef = `WALLET-ORDER-${orderId}-${Date.now()}`;
  await withDbRetry(() => db!.insert(walletTransactions).values({
    userId,
    type: "spend",
    amountUSD: totalUSD.toFixed(6) as any,
    balanceAfterUSD: newBalance as any,
    reference: txRef,
    gateway: "wallet",
    status: "completed",
    description: `Payment for order #${order.orderNumber}`,
    orderId,
  }), "payOrderWithWallet:insertTx");

  // Mark order as processing
  await withDbRetry(() => db!.update(orders).set({ status: "processing" }).where(eq(orders.id, orderId)), "payOrderWithWallet:updateOrder");

  // Record in payments table (gateway = 'manual' since it's a wallet deduction)
  await withDbRetry(() => db!.insert(payments).values({
    orderId,
    userId,
    gateway: "manual",
    gatewayReference: txRef,
    amount: totalUSD.toFixed(2) as any,
    currency: "USD",
    status: "success",
    webhookVerified: true,
  }), "payOrderWithWallet:insertPayment");

  await logSystem("info", "payment", `Order ${order.orderNumber} paid with wallet by user ${userId}`, { orderId, totalUSD });
  // Trigger auto-fulfillment asynchronously (don't block the payment response)
  autoFulfillOrder(orderId).catch(err => console.error("[AutoFulfill] Error:", err));
  return { success: true, orderId, orderNumber: order.orderNumber, amountDeducted: totalUSD, newBalance: Number(newBalance) };
}

/**
 * Auto-fulfill an order by calling the supplier API (AccsZone) for each order item.
 * Stores credentials in fulfillmentRecords and marks the order as fulfilled/partial/failed.
 * Called automatically after every successful payment.
 */
export async function autoFulfillOrder(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    // Get order items with their supplier product IDs
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    if (!items.length) {
      await logSystem("warn", "fulfillment", `No order items found for order ${orderId}`);
      return;
    }

    // Load API keys for all providers
    const [accsConfig] = await db.select().from(providerConfigs).where(eq(providerConfigs.providerKey, "accszone")).limit(1);
    const [faddedConfig] = await db.select().from(providerConfigs).where(eq(providerConfigs.providerKey, "fadded")).limit(1);
    const accsApiKey = accsConfig?.apiKey ?? null;
    const faddedApiKey = faddedConfig?.apiKey ?? null;

    const { placeSupplierOrder: accsPlaceOrder } = await import("./connectors/accszone");
    const { placeSupplierOrder: faddedPlaceOrder } = await import("./connectors/fadded");
    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      const itemProvider = item.providerKey ?? "accszone";
      const supplierProductId = item.supplierProductId;

      if (!supplierProductId) {
        await logSystem("warn", "fulfillment", `No supplier product ID for order item ${item.id} (order ${orderId})`);
        await withDbRetry(() => db!.insert(fulfillmentRecords).values({
          orderId,
          orderItemId: item.id,
          providerKey: itemProvider,
          status: "failed",
          errorMessage: "Supplier product ID not found — product may not be linked to a supplier",
        }), "autoFulfillOrder:insertFailedRecord");
        failCount++;
        continue;
      }

      // Route to the correct supplier connector
      let result: { success: boolean; supplierOrderId?: string; deliveryData?: unknown; error?: string };
      if (itemProvider === "fadded") {
        if (!faddedApiKey) {
          await logSystem("error", "fulfillment", `Fadded API key not configured — cannot fulfill order item ${item.id}`);
          result = { success: false, error: "Fadded API key not configured" };
        } else {
          result = await faddedPlaceOrder(faddedApiKey, supplierProductId, item.quantity, orderId);
        }
      } else {
        // Default to AccsZone
        if (!accsApiKey) {
          await logSystem("error", "fulfillment", `AccsZone API key not configured — cannot fulfill order item ${item.id}`);
          result = { success: false, error: "AccsZone API key not configured" };
        } else {
          result = await accsPlaceOrder(accsApiKey, supplierProductId, item.quantity, orderId);
        }
      }

      if (result.success) {
        const deliveryDataStr = JSON.stringify(result.deliveryData);
        await withDbRetry(() => db!.insert(fulfillmentRecords).values({
          orderId,
          orderItemId: item.id,
          providerKey: itemProvider,
          supplierOrderId: result.supplierOrderId ?? null,
          status: "success",
          deliveryData: deliveryDataStr,
          rawResponse: result.deliveryData as any,
        }), "autoFulfillOrder:insertSuccessRecord");
        successCount++;
      } else {
        await withDbRetry(() => db!.insert(fulfillmentRecords).values({
          orderId,
          orderItemId: item.id,
          providerKey: itemProvider,
          status: "failed",
          errorMessage: result.error ?? "Unknown supplier error",
        }), "autoFulfillOrder:insertFailedRecord");
        failCount++;
      }
    }

    // Update order status based on results
    const finalStatus = failCount === 0 ? "fulfilled" : successCount === 0 ? "failed" : "partial";
    await withDbRetry(() => db!.update(orders).set({ status: finalStatus }).where(eq(orders.id, orderId)), "autoFulfillOrder:updateOrderStatus");
    await logSystem("info", "fulfillment", `Order ${orderId} fulfillment complete: ${successCount} success, ${failCount} failed (status: ${finalStatus})`, { orderId, successCount, failCount });

    // Send order status update email if fulfilled
    if (finalStatus === "fulfilled" || finalStatus === "partial") {
      const [orderRow] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      const [orderUser] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, orderRow?.userId ?? 0)).limit(1);
      if (orderUser?.email && orderRow) {
        const { sendOrderStatusEmail, safeSendEmail } = await import("./email");
        safeSendEmail(() => sendOrderStatusEmail({
          to: orderUser.email!,
          name: orderUser.name ?? "there",
          orderNumber: orderRow.orderNumber,
          orderId,
          status: finalStatus,
        }));
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await logSystem("error", "fulfillment", `autoFulfillOrder exception for order ${orderId}`, { error: message });
    // Don't rethrow — fulfillment failure should not break the payment confirmation
  }
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
  await withDbRetry(() => db!.insert(supportTickets).values({
    ticketNumber,
    userId,
    orderId: input.orderId ?? null,
    subject: input.subject,
    priority: input.priority,
    status: "open",
  }), "createTicket:insertTicket");
  const ticket = await db.select().from(supportTickets).where(eq(supportTickets.ticketNumber, ticketNumber)).limit(1);
  const ticketId = ticket[0]!.id;
  await withDbRetry(() => db!.insert(ticketMessages).values({ ticketId, senderId: userId, senderRole: "user", message: input.message }), "createTicket:insertMessage");
  return { ticketId, ticketNumber };
}

export async function getUserTickets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db!.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.updatedAt)),
    "getUserTickets"
  );
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
  await withDbRetry(() => db!.insert(ticketMessages).values({ ticketId: input.ticketId, senderId: userId, senderRole: role, message: input.message }), "replyToTicket:insertMessage");
  await withDbRetry(() => db!.update(supportTickets).set({ status: role === "admin" ? "pending" : "open", updatedAt: new Date() }).where(eq(supportTickets.id, input.ticketId)), "replyToTicket:updateStatus");

  // Notify user by email when admin replies
  if (role === "admin") {
    const ticket = await db.select({ subject: supportTickets.subject, userId: supportTickets.userId }).from(supportTickets).where(eq(supportTickets.id, input.ticketId)).limit(1);
    if (ticket[0]) {
      const ticketUser = await db.select({ email: users.email, name: users.name, notifyEmail: users.notifyEmail }).from(users).where(eq(users.id, ticket[0].userId)).limit(1);
      if (ticketUser[0]?.email && ticketUser[0]?.notifyEmail !== false) {
        safeSendEmail(() => sendTicketReplyEmail({
          to: ticketUser[0].email!,
          name: ticketUser[0].name ?? "there",
          ticketId: input.ticketId,
          ticketSubject: ticket[0].subject,
          replyPreview: input.message,
        }));
      }
    }
  }

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
  return withDbRetry(
    () => db!.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50),
    "getUserNotifications"
  );
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
  await withDbRetry(() => db!.insert(notifications).values({ userId, type, title, message, relatedOrderId: relatedOrderId ?? null }), "createNotification");
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export async function getExchangeRates() {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db!.select().from(exchangeRates),
    "getExchangeRates"
  );
}

/**
 * Fetch live exchange rates from open.er-api.com (no API key required)
 * and upsert them into the exchange_rates table with source="api".
 * Only updates NGN, EUR, GBP, and GHS rates from USD base.
 * Safe to call repeatedly — idempotent upsert.
 */
export async function fetchAndCacheExchangeRates(): Promise<{ updated: number; rateNGN: number }> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
  const json = (await res.json()) as { result: string; rates: Record<string, number>; time_next_update_utc?: string };
  if (json.result !== "success") throw new Error("Exchange rate API returned non-success result");

  const targets = ["NGN", "EUR", "GBP", "GHS"];
  let updated = 0;
  for (const toCurrency of targets) {
    const rate = json.rates[toCurrency];
    if (!rate) continue;
    await upsertExchangeRateApi("USD", toCurrency, rate);
    updated++;
  }
  return { updated, rateNGN: json.rates["NGN"] ?? 0 };
}

async function upsertExchangeRateApi(fromCurrency: string, toCurrency: string, rate: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(exchangeRates)
    .where(and(eq(exchangeRates.fromCurrency, fromCurrency), eq(exchangeRates.toCurrency, toCurrency)));
  if (existing.length > 0) {
    // ONLY overwrite if the current source is "api" — never overwrite admin-set manual rates
    if (existing[0].source === "manual") return;
    await db.update(exchangeRates)
      .set({ rate: rate.toFixed(6) as any, source: "api" })
      .where(and(eq(exchangeRates.fromCurrency, fromCurrency), eq(exchangeRates.toCurrency, toCurrency)));
  } else {
    await db.insert(exchangeRates).values({
      fromCurrency,
      toCurrency,
      rate: rate.toFixed(6) as any,
      source: "api",
    });
  }
}

export async function updateExchangeRate(input: { fromCurrency: string; toCurrency: string; rate: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Try update first; if no row exists, insert a new one (upsert)
  const updated = await db.update(exchangeRates)
    .set({ rate: input.rate.toFixed(6) as any, source: "manual" })
    .where(and(eq(exchangeRates.fromCurrency, input.fromCurrency), eq(exchangeRates.toCurrency, input.toCurrency)));
  // MySQL returns affectedRows; if 0 rows were updated, insert a new row
  if ((updated as any).affectedRows === 0 || (updated as any)[0]?.affectedRows === 0) {
    await db.insert(exchangeRates).values({
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      rate: input.rate.toFixed(6) as any,
      source: "manual",
    });
  }
  return { success: true };
}

// ─── Provider Configs ─────────────────────────────────────────────────────────

export async function getProviderConfigs() {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db!.select().from(providerConfigs),
    "getProviderConfigs"
  );
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
  // Route sync to the correct connector based on providerKey
  if (providerKey === "fadded") {
    const { syncProvider } = await import("./connectors/fadded");
    syncProvider(providerKey, syncType).catch(err => console.error("[Sync] Fadded error:", err));
  } else {
    const { syncProvider } = await import("./connectors/accszone");
    syncProvider(providerKey, syncType).catch(err => console.error("[Sync] AccsZone error:", err));
  }
  return { success: true, message: `Sync triggered for ${providerKey}` };
}

export async function getProviderSyncLogs() {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db!.select().from(providerSyncLogs).orderBy(desc(providerSyncLogs.startedAt)).limit(50),
    "getProviderSyncLogs"
  );
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
  const [totalProductCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
  const [visibleProductCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isVisible, true));

  return {
    totalUsers: Number(userCount?.count ?? 0),
    totalOrders: Number(orderCount?.count ?? 0),
    totalRevenue: Number(revenue?.sum ?? 0),
    pendingOrders: Number(pendingCount?.count ?? 0),
    failedOrders: Number(failedCount?.count ?? 0),
    openTickets: Number(ticketCount?.count ?? 0),
    totalProducts: Number(totalProductCount?.count ?? 0),
    visibleProducts: Number(visibleProductCount?.count ?? 0),
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
  stockQuantity: number; stockUnlimited: boolean; deliveryNote?: string; deliveryFormat?: string;
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
    deliveryFormat: input.deliveryFormat ?? null,
    isVisible: input.isVisible,
    isFeatured: input.isFeatured,
  });
  return { success: true };
}

export async function adminUpdateProduct(input: {
  id: number; title?: string; description?: string; imageUrl?: string; markupPercent?: number;
  isVisible?: boolean; isFeatured?: boolean; categoryId?: number;
  regionRestrictions?: string[]; allowedPaymentMethods?: string[];
  deliveryNote?: string; deliveryFormat?: string; refundPolicy?: string;
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
  if (input.deliveryFormat !== undefined) updateData.deliveryFormat = input.deliveryFormat;
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
    await withDbRetry(() => db!.update(orders).set(updateData).where(eq(orders.id, input.id)), "adminUpdateOrder");
    if (input.status) {
      const updatedOrder = await withDbRetry(() => db!.select().from(orders).where(eq(orders.id, input.id)).limit(1), "adminUpdateOrder-fetch");
      if (updatedOrder[0]) {
        const user = await withDbRetry(() => db!.select().from(users).where(eq(users.id, updatedOrder[0].userId)).limit(1), "adminUpdateOrder-user");
        if (user[0]?.email) {
          safeSendEmail(() => sendOrderStatusEmail({
            to: user[0].email!,
            name: user[0].name ?? "there",
            orderNumber: updatedOrder[0].orderNumber,
            orderId: updatedOrder[0].id,
            status: input.status!,
          }));
          // Send delivery email with credentials when order is fulfilled
          if (input.status === "fulfilled") {
            try {
              const items = await withDbRetry(() => db!.select({
                title: orderItems.productTitle,
                quantity: orderItems.quantity,
                productId: orderItems.productId,
                itemId: orderItems.id,
              }).from(orderItems).where(eq(orderItems.orderId, input.id)), "adminUpdateOrder-items");
              const fulfillments = await withDbRetry(() => db!.select().from(fulfillmentRecords).where(eq(fulfillmentRecords.orderId, input.id)), "adminUpdateOrder-fulfillments");
              // Get product categories for login instructions
              const productIds = items.map(i => i.productId).filter(Boolean) as number[];
              const productDetails = productIds.length > 0 ? await withDbRetry(() => db!.select({ id: products.id, deliveryNote: products.deliveryNote, categoryId: products.categoryId }).from(products).where(inArray(products.id, productIds)), "adminUpdateOrder-products") : [];
              const categoryIds = productDetails.map(p => p.categoryId).filter(Boolean) as number[];
              const categoryDetails = categoryIds.length > 0 ? await withDbRetry(() => db!.select({ id: categories.id, name: categories.name }).from(categories).where(inArray(categories.id, categoryIds)), "adminUpdateOrder-categories") : [];
              const catMap = new Map(categoryDetails.map(c => [c.id, c.name]));
              const prodMap = new Map(productDetails.map(p => [p.id, p]));
              const deliveryItems = items.map(item => {
                const prod = item.productId ? prodMap.get(item.productId) : undefined;
                const catName = prod?.categoryId ? catMap.get(prod.categoryId) : undefined;
                const creds = fulfillments
                  .filter(f => f.orderItemId === item.itemId)
                  .map(f => {
                    try { return typeof f.deliveryData === "string" ? JSON.parse(f.deliveryData) : f.deliveryData; } catch { return f.deliveryData; }
                  })
                  .flat()
                  .filter(Boolean) as Array<{ login?: string; password?: string; email?: string; data?: string }>;
                return { title: item.title, quantity: item.quantity, categoryName: catName, deliveryNote: prod?.deliveryNote ?? undefined, credentials: creds };
              });
              safeSendEmail(() => sendDeliveryEmail({
                to: user[0].email!,
                name: user[0].name ?? "there",
                orderNumber: updatedOrder[0].orderNumber,
                orderId: updatedOrder[0].id,
                items: deliveryItems,
              }));
            } catch (err) {
              console.error("[adminUpdateOrder] Failed to build delivery email:", err);
            }
          }
        }
      }
    }
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

export async function adminOrderManualRefund(adminId: number, input: { orderId: number; amountUSD: number; reason: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Fetch the order to get the customer userId
  const orderRows = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  if (!orderRows[0]) throw new Error("Order not found");
  const order = orderRows[0];
  // Credit the customer wallet
  const wallet = await getOrCreateWallet(order.userId);
  const newBalance = Number(wallet.balanceUSD) + input.amountUSD;
  const reference = `REFUND-${input.orderId}-${Date.now()}`;
  await withDbRetry(() => db!.update(wallets).set({ balanceUSD: newBalance.toFixed(6) }).where(eq(wallets.userId, order.userId)), "adminOrderManualRefund:wallet");
  await withDbRetry(() => db!.insert(walletTransactions).values({
    userId: order.userId,
    type: "refund",
    amountUSD: input.amountUSD.toFixed(6),
    balanceAfterUSD: newBalance.toFixed(6),
    description: `Refund for order #${order.orderNumber}: ${input.reason}`,
    reference,
    orderId: input.orderId,
    status: "completed",
  }), "adminOrderManualRefund:txn");
  // Mark order as refunded
  await withDbRetry(() => db!.update(orders).set({ status: "refunded" }).where(eq(orders.id, input.orderId)), "adminOrderManualRefund:orderStatus");
  // Log admin action
  await withDbRetry(() => db!.insert(adminActions).values({
    adminId,
    action: `Manual refund of $${input.amountUSD.toFixed(2)} for order #${order.orderNumber}`,
    targetType: "order",
    targetId: input.orderId,
    details: { reason: input.reason, amountUSD: input.amountUSD, userId: order.userId, orderNumber: order.orderNumber },
  }), "adminOrderManualRefund:log");
  await logSystem("info", "order", `Admin issued manual refund of $${input.amountUSD.toFixed(2)} for order ${input.orderId}`, { adminId, orderId: input.orderId, userId: order.userId, reason: input.reason });
  // Send refund confirmation email to the customer
  const refundUser = await withDbRetry(() => db!.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, order.userId)).limit(1), "adminOrderManualRefund:user");
  if (refundUser[0]?.email) {
    const { sendRefundConfirmationEmail, safeSendEmail } = await import("./email");
    safeSendEmail(() => sendRefundConfirmationEmail({
      to: refundUser[0].email!,
      name: refundUser[0].name ?? "there",
      orderNumber: order.orderNumber ?? `#${order.id}`,
      orderId: order.id,
      amountUSD: input.amountUSD,
      reason: input.reason,
      newBalanceUSD: newBalance,
    }));
  }
  return { success: true, newBalance, orderNumber: order.orderNumber };
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
  await withDbRetry(() => db!.insert(ticketMessages).values({ ticketId: input.ticketId, senderId: adminId, senderRole: "admin", message: input.message }), "adminReplyToTicket:insertMessage");
  const newStatus = input.closeTicket ? "resolved" : "pending";
  await withDbRetry(() => db!.update(supportTickets).set({ status: newStatus, resolvedAt: input.closeTicket ? new Date() : null }).where(eq(supportTickets.id, input.ticketId)), "adminReplyToTicket:updateStatus");
  return { success: true };
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export async function getOrCreateWallet(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(wallets).values({ userId, balanceUSD: "0.000000", totalDeposited: "0.000000", totalSpent: "0.000000" });
  const created = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  return created[0]!;
}

export async function getWalletTransactions(userId: number, page: number = 1, limit: number = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const items = await db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(limit).offset(offset);
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(walletTransactions).where(eq(walletTransactions.userId, userId));
  return { items, total: Number(countRow?.count ?? 0) };
}

export async function initiateWalletTopup(userId: number, amountUSD: number, gateway: string, origin?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (amountUSD < 3) throw new Error("Minimum deposit is $3.00");
  const reference = `TOPUP-${userId}-${Date.now()}`;

  // Fetch user email for gateway
  const [topupUser] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  const userEmail = topupUser?.email ?? `user${userId}@bulnix.com`;
  const userName = topupUser?.name ?? "Bulnix Customer";

   const siteOrigin = origin ?? (process.env.NODE_ENV === "production" ? "https://bulnix.com" : "http://localhost:3000");
  const callbackUrl = `${siteOrigin}/api/payments/verify?type=topup`;
  let paymentUrl = `#topup-${reference}`;

  // Get NGN rate for Paystack/Flutterwave NGN charging
  const allRates = await getExchangeRates();
  const ngnRateRow = allRates.find(r => r.fromCurrency === "USD" && r.toCurrency === "NGN");
  // Default to 1600 NGN/USD if not set; admin can update this via the Payment Rates panel
  const usdToNgn = ngnRateRow ? Number(ngnRateRow.rate) : 1600;

  try {
    if (gateway === "paystack") {
      // Paystack is temporarily disabled — throw a user-friendly error
      throw new Error("Paystack is currently unavailable. Please use Flutterwave, Kora Pay, or Crypto.");
    } else if (gateway === "flutterwave") {
      // Charge in NGN using the admin-configured rate so the admin markup is applied
      const amountNGN = Math.round(amountUSD * usdToNgn);
      const result = await flwInitiate({
        txRef: reference,
        amount: amountNGN,
        currency: "NGN",
        email: userEmail,
        name: userName,
        redirectUrl: `${siteOrigin}/wallet?topup_ref=${reference}&status=success`,
        description: `Bulnix wallet top-up $${amountUSD.toFixed(2)}`,
        meta: { topupRef: reference, userId, type: "wallet_topup", amountUSD },
      });
      paymentUrl = result.paymentLink;
    } else if (gateway === "nowpayments") {
      // NowPayments minimum is $10 USD equivalent
      if (amountUSD < 10) throw new Error("Minimum crypto deposit is $10.00");
      const result = await npInitiate({
        priceAmount: amountUSD,
        priceCurrency: "usd",
        orderId: reference,
        orderDescription: `Bulnix wallet top-up $${amountUSD.toFixed(2)}`,
        successUrl: `${siteOrigin}/wallet?topup_ref=${reference}&status=success`,
        cancelUrl: `${siteOrigin}/wallet?topup_ref=${reference}&status=cancelled`,
        ipnCallbackUrl: `${siteOrigin}/api/webhooks/nowpayments`,
      });
      paymentUrl = result.invoiceUrl;
    } else if (gateway === "korapay") {
      const result = await koraInitiate({
        reference,
        amountUSD,
        email: userEmail,
        name: userName,
        redirectUrl: `${siteOrigin}/wallet?topup_ref=${reference}&status=success`,
        notificationUrl: `${siteOrigin}/api/webhooks/korapay`,
        description: `Bulnix wallet top-up USD ${amountUSD.toFixed(2)}`,
        metadata: { topupRef: reference, userId, type: "wallet_topup" },
      });
      paymentUrl = result.checkoutUrl;
    }
  } catch (err: any) {
    await logSystem("error", "payment", `Wallet topup gateway initiation failed`, { gateway, userId, amountUSD, error: err.message });
    throw new Error(`Payment gateway error: ${err.message}`);
  }

  // Create a pending transaction record
  await withDbRetry(() => db!.insert(walletTransactions).values({
    userId,
    type: "deposit",
    amountUSD: amountUSD.toFixed(6),
    balanceAfterUSD: "0.000000", // will be updated on confirmation
    description: `Wallet top-up via ${gateway}`,
    reference,
    status: "pending",
    gateway,
  }), "initiateWalletTopup");
  return { reference, amountUSD, paymentUrl };
}

export async function confirmWalletTopup(reference: string, skipVerify = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [txn] = await db.select().from(walletTransactions).where(eq(walletTransactions.reference, reference)).limit(1);
  if (!txn) throw new Error("Transaction not found");
  if (txn.status === "completed") return { success: true, alreadyProcessed: true };

  // For Kora Pay and Flutterwave: ALWAYS verify with the API before crediting.
  // The redirect_url fires even on cancel, so we cannot trust it.
  // Only the webhook (skipVerify=true) or a confirmed API status should credit the wallet.
  if (!skipVerify && txn.gateway === "korapay") {
    const { koraVerify } = await import("./payments/korapay");
    let verified = false;
    try {
      const result = await koraVerify(reference);
      verified = result.status === "success";
    } catch (verifyErr: any) {
      await logSystem("warn", "payment", `Kora Pay verify failed for ${reference}: ${verifyErr.message}`);
    }
    if (!verified) {
      await logSystem("warn", "payment", `Kora Pay confirmation rejected — payment not confirmed by API`, { reference });
      throw new Error("Payment has not been confirmed by Kora Pay. Your wallet will be credited automatically once payment is received.");
    }
  }

  if (!skipVerify && txn.gateway === "flutterwave") {
    // Flutterwave: verify via transaction ID stored in the payment record
    const { flwVerify } = await import("./payments/flutterwave");
    let verified = false;
    try {
      // Look up the gateway transaction ID from the payments table
      const [pmtRow] = await db!.select({ gatewayTransactionId: payments.gatewayTransactionId })
        .from(payments).where(eq(payments.gatewayReference, reference)).limit(1);
      if (pmtRow?.gatewayTransactionId) {
        const result = await flwVerify(pmtRow.gatewayTransactionId);
        verified = result.status === "successful";
      } else {
        // No transaction ID yet — payment hasn't been processed by Flutterwave
        verified = false;
      }
    } catch (verifyErr: any) {
      await logSystem("warn", "payment", `Flutterwave verify failed for ${reference}: ${verifyErr.message}`);
    }
    if (!verified) {
      await logSystem("warn", "payment", `Flutterwave confirmation rejected — payment not confirmed by API`, { reference });
      throw new Error("Payment has not been confirmed by Flutterwave. Your wallet will be credited automatically once payment is received.");
    }
  }

  const wallet = await getOrCreateWallet(txn.userId);
  const newBalance = Number(wallet.balanceUSD) + Number(txn.amountUSD);
  const newDeposited = Number(wallet.totalDeposited) + Number(txn.amountUSD);

    await withDbRetry(() => db!.update(wallets).set({
    balanceUSD: newBalance.toFixed(6),
    totalDeposited: newDeposited.toFixed(6),
  }).where(eq(wallets.userId, txn.userId)), "confirmWalletTopup:updateWallet");
  await withDbRetry(() => db!.update(walletTransactions).set({
    status: "completed",
    balanceAfterUSD: newBalance.toFixed(6),
  }).where(eq(walletTransactions.id, txn.id)), "confirmWalletTopup:updateTxn");

  // Send receipt email to customer (fire-and-forget, don't block confirmation)
  try {
    const [topupUser] = await db!.select({ email: users.email, name: users.name })
      .from(users).where(eq(users.id, txn.userId)).limit(1);
    if (topupUser?.email) {
      await sendWalletTopupReceiptEmail({
        to: topupUser.email,
        name: topupUser.name ?? "",
        amountUSD: Number(txn.amountUSD),
        reference: txn.reference ?? "",
        gateway: String(txn.gateway ?? "unknown"),
        newBalanceUSD: newBalance,
      });
    }
  } catch (emailErr: any) {
    await logSystem("warn", "email", `Failed to send wallet top-up receipt: ${emailErr.message}`);
  }

  return { success: true, newBalance };
}

export async function adminProcessRefund(adminId: number, input: { userId: number; amountUSD: number; reason: string; orderId?: number; ticketId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const wallet = await getOrCreateWallet(input.userId);
  const newBalance = Number(wallet.balanceUSD) + input.amountUSD;
  const reference = `REFUND-${input.orderId ?? "MANUAL"}-${Date.now()}`;

  await withDbRetry(() => db!.update(wallets).set({ balanceUSD: newBalance.toFixed(6) }).where(eq(wallets.userId, input.userId)), "adminProcessRefund:updateWallet");
  await withDbRetry(() => db!.insert(walletTransactions).values({
    userId: input.userId,
    type: "refund",
    amountUSD: input.amountUSD.toFixed(6),
    balanceAfterUSD: newBalance.toFixed(6),
    description: `Refund: ${input.reason}`,
    reference,
    orderId: input.orderId ?? null,
    status: "completed",
  }), "adminProcessRefund:insertTxn");
  // Log admin action
   await withDbRetry(() => db!.insert(adminActions).values({
    adminId,
    action: `Processed refund of $${input.amountUSD} to user ${input.userId}`,
    targetType: "user",
    targetId: input.userId,
    details: { reason: input.reason, amountUSD: input.amountUSD, orderId: input.orderId, ticketId: input.ticketId },
  }), "adminProcessRefund:logAction");

  // Update ticket status if provided
  if (input.ticketId) {
    await withDbRetry(() => db!.update(supportTickets).set({ status: "resolved", resolvedAt: new Date() }).where(eq(supportTickets.id, input.ticketId!)), "adminProcessRefund:closeTicket");
  }

  return { success: true, newBalance };
}


// ─── Supplier Refund Claims ──────────────────────────────────────────────────

export async function createSupplierRefundClaim(
  adminId: number,
  input: {
    ticketId?: number;
    orderId?: number;
    providerKey: string;
    supplierOrderId?: string;
    claimAmountUSD: number;
    reason: string;
    adminNotes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(supplierRefundClaims).values({
    raisedByAdminId: adminId,
    ticketId: input.ticketId ?? null,
    orderId: input.orderId ?? null,
    providerKey: input.providerKey,
    supplierOrderId: input.supplierOrderId ?? null,
    claimAmountUSD: String(input.claimAmountUSD),
    reason: input.reason,
    adminNotes: input.adminNotes ?? null,
    status: "draft",
    communicationLog: JSON.stringify([]),
    creditedToCustomer: false,
  });

  await logSystem("info", "supplier_refund", `Supplier refund claim created for provider ${input.providerKey}`, { adminId, claimAmountUSD: input.claimAmountUSD, orderId: input.orderId, ticketId: input.ticketId });

  return { success: true, claimId: (result as any).insertId };
}

export async function submitSupplierRefundClaim(
  adminId: number,
  claimId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [claim] = await db.select().from(supplierRefundClaims).where(eq(supplierRefundClaims.id, claimId)).limit(1);
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "draft") throw new Error("Only draft claims can be submitted");

  // Build a formatted refund request message for AccsZone support
  const requestMessage = buildSupplierRefundMessage(claim);

  // Log the submission in the communication log
  const log = JSON.parse((claim.communicationLog as string) || "[]");
  log.push({
    direction: "outbound",
    timestamp: new Date().toISOString(),
    message: requestMessage,
    actor: `Admin #${adminId}`,
    type: "submission",
  });

  await db.update(supplierRefundClaims)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      communicationLog: JSON.stringify(log),
    })
    .where(eq(supplierRefundClaims.id, claimId));

  await logSystem("info", "supplier_refund", `Supplier refund claim #${claimId} submitted`, { adminId, claimId, providerKey: claim.providerKey });

  return { success: true, requestMessage };
}

export async function updateSupplierRefundClaim(
  adminId: number,
  input: {
    claimId: number;
    status?: "acknowledged" | "approved" | "partially_approved" | "rejected" | "resolved" | "cancelled";
    approvedAmountUSD?: number;
    supplierResponse?: string;
    supplierRefundRef?: string;
    adminNotes?: string;
    addLogEntry?: { message: string; direction: "inbound" | "outbound"; type: string };
    creditToCustomer?: boolean;
    customerUserId?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [claim] = await db.select().from(supplierRefundClaims).where(eq(supplierRefundClaims.id, input.claimId)).limit(1);
  if (!claim) throw new Error("Claim not found");

  const log = JSON.parse((claim.communicationLog as string) || "[]");
  if (input.addLogEntry) {
    log.push({
      direction: input.addLogEntry.direction,
      timestamp: new Date().toISOString(),
      message: input.addLogEntry.message,
      actor: input.addLogEntry.direction === "inbound" ? claim.providerKey : `Admin #${adminId}`,
      type: input.addLogEntry.type,
    });
  }

  const updateData: Record<string, unknown> = {
    communicationLog: JSON.stringify(log),
  };
  if (input.status) updateData.status = input.status;
  if (input.approvedAmountUSD !== undefined) updateData.approvedAmountUSD = String(input.approvedAmountUSD);
  if (input.supplierResponse !== undefined) updateData.supplierResponse = input.supplierResponse;
  if (input.supplierRefundRef !== undefined) updateData.supplierRefundRef = input.supplierRefundRef;
  if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes;
  if (input.status === "resolved" || input.status === "approved") updateData.resolvedAt = new Date();

  await db.update(supplierRefundClaims).set(updateData).where(eq(supplierRefundClaims.id, input.claimId));

  // If admin wants to credit the approved amount to the customer's wallet
  if (input.creditToCustomer && input.customerUserId && input.approvedAmountUSD) {
    const creditAmount = input.approvedAmountUSD;
    const wallet = await getOrCreateWallet(input.customerUserId);
    const newBalance = parseFloat(wallet.balanceUSD as string) + creditAmount;
    await db.update(wallets).set({ balanceUSD: String(newBalance), totalDeposited: String(parseFloat(wallet.totalDeposited as string) + creditAmount) }).where(eq(wallets.userId, input.customerUserId));
    await db.insert(walletTransactions).values({
      userId: input.customerUserId,
      type: "refund",
      amountUSD: String(creditAmount),
      balanceAfterUSD: String(newBalance),
      description: `Supplier refund credited (Claim #${input.claimId})`,
      reference: `supplier-refund-${input.claimId}`,
      status: "completed",
    });
    await db.update(supplierRefundClaims).set({ creditedToCustomer: true }).where(eq(supplierRefundClaims.id, input.claimId));
  }

  await logSystem("info", "supplier_refund", `Supplier refund claim #${input.claimId} updated to status: ${input.status ?? "unchanged"}`, { adminId, claimId: input.claimId });

  return { success: true };
}

export async function listSupplierRefundClaims(input: {
  page: number;
  limit: number;
  status?: string;
  providerKey?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];
  if (input.status) conditions.push(eq(supplierRefundClaims.status, input.status as any));
  if (input.providerKey) conditions.push(eq(supplierRefundClaims.providerKey, input.providerKey));

  const offset = (input.page - 1) * input.limit;
  const query = db.select().from(supplierRefundClaims);
  const items = conditions.length > 0
    ? await query.where(and(...conditions)).limit(input.limit).offset(offset)
    : await query.limit(input.limit).offset(offset);

  return { items, total: items.length };
}

export async function getSupplierRefundClaim(claimId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [claim] = await db.select().from(supplierRefundClaims).where(eq(supplierRefundClaims.id, claimId)).limit(1);
  if (!claim) throw new Error("Claim not found");
  return { ...claim, communicationLog: JSON.parse((claim.communicationLog as string) || "[]") };
}

function buildSupplierRefundMessage(claim: any): string {
  return `REFUND REQUEST — Bulnix Marketplace

Dear ${claim.providerKey.charAt(0).toUpperCase() + claim.providerKey.slice(1)} Support Team,

We are writing to formally request a refund for the following order placed through your platform.

Order Reference: ${claim.supplierOrderId ?? "N/A"}
Claim Amount: $${parseFloat(claim.claimAmountUSD).toFixed(2)} USD
Internal Claim ID: #${claim.id}

Reason for Refund:
${claim.reason}

Please confirm receipt of this request and provide a refund reference number at your earliest convenience. We expect a response within 2 business days.

Thank you for your cooperation.

Best regards,
Bulnix Support Team
support@bulnix.com`;
}

export async function adminGetUserDetail(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");

  const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(20);
  const userTickets = await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt)).limit(10);
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  const walletTxns = await db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(10);

  return { user, orders: userOrders, tickets: userTickets, wallet: wallet ?? null, walletTransactions: walletTxns };
}

// ─── AccsZone Balance ─────────────────────────────────────────────────────────

export async function getAccsZoneBalance(): Promise<{ balance: number; referralBalance: number; lowBalance: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { balance: 0, referralBalance: 0, lowBalance: true, error: "Database unavailable" };
    const [config] = await db.select().from(providerConfigs).where(eq(providerConfigs.providerKey, "accszone")).limit(1);
    if (!config?.apiKey) return { balance: 0, referralBalance: 0, lowBalance: true, error: "AccsZone API key not configured" };

    const response = await fetch("https://accszone.com/api/v1/user/balance", {
      headers: { "X-API-Key": config.apiKey, "Accept": "application/json" },
    });
    if (!response.ok) return { balance: 0, referralBalance: 0, lowBalance: true, error: `AccsZone API error: ${response.status}` };
    const json = await response.json() as any;
    const balance = parseFloat(json?.data?.balance ?? "0");
    const referralBalance = parseFloat(json?.data?.referral_balance ?? "0");
    const lowBalance = balance < 5;

    // Send low-balance email alert if balance drops below $5
    if (lowBalance) {
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({
        title: "⚠️ AccsZone Low Balance Alert",
        content: `Your AccsZone reseller account balance is critically low: $${balance.toFixed(2)}. Please top up your AccsZone account to avoid order fulfillment failures. Current balance: $${balance.toFixed(2)} USD.`,
      }).catch(() => {/* silent */});
    }

    return { balance, referralBalance, lowBalance };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { balance: 0, referralBalance: 0, lowBalance: true, error: msg };
  }
}

// ─── Fadded Balance ───────────────────────────────────────────────────────────
export async function getFaddedBalance(): Promise<{ balance: number; currency: string; lowBalance: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { balance: 0, currency: "NGN", lowBalance: true, error: "Database unavailable" };
    const [config] = await db.select().from(providerConfigs).where(eq(providerConfigs.providerKey, "fadded")).limit(1);
    if (!config?.apiKey) return { balance: 0, currency: "NGN", lowBalance: true, error: "Fadded API key not configured" };
    const response = await fetch(`${config.baseUrl ?? "https://fadded.net/api/v1"}/reseller/balance`, {
      headers: { "X-Api-Key": config.apiKey, "Accept": "application/json" },
    });
    if (!response.ok) return { balance: 0, currency: "NGN", lowBalance: true, error: `Fadded API error: ${response.status}` };
    const json = await response.json() as any;
    const balance = parseFloat(json?.data?.balance ?? "0");
    const currency = json?.data?.currency ?? "NGN";
    const lowBalance = balance < 10000; // Alert threshold: 10,000 NGN
    // Send low-balance notification if balance drops below 10,000 NGN
    if (lowBalance) {
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({
        title: "⚠️ Fadded Low Balance Alert",
        content: `Your Fadded reseller account balance is critically low: ₦${balance.toLocaleString()} NGN. Please top up your Fadded account to avoid order fulfillment failures. Current balance: ₦${balance.toLocaleString()} NGN.`,
      }).catch(() => {/* silent */});
    }
    return { balance, currency, lowBalance };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { balance: 0, currency: "NGN", lowBalance: true, error: msg };
  }
}

export async function applyMarkupToAllProducts(providerKey: string, markupPercent: number): Promise<{ updated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Get all products for this provider
  const providerProducts = await db.select({ id: products.id, supplierPrice: products.supplierPrice })
    .from(products)
    .where(eq(products.providerKey, providerKey));
  let updated = 0;
  for (const p of providerProducts) {
    const newPrice = Number(p.supplierPrice) * (1 + markupPercent / 100);
    await db.update(products).set({
      markupPercent: markupPercent.toFixed(2) as any,
      customerPriceUSD: newPrice.toFixed(2) as any,
    }).where(eq(products.id, p.id));
    updated++;
  }
  return { updated };
}

// ─── Auto-Retry Processing Orders ─────────────────────────────────────────────

export async function retryAllProcessingOrders(): Promise<{ retried: number; skipped: number }> {
  const db = await getDb();
  if (!db) return { retried: 0, skipped: 0 };
  try {
    // Get all orders stuck in processing
    const processingOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.status, "processing")).limit(50);
    if (processingOrders.length === 0) return { retried: 0, skipped: 0 };

    let retried = 0;
    for (const order of processingOrders) {
      await db.update(orders).set({ fulfillmentRetries: sql`COALESCE(fulfillmentRetries, 0) + 1` }).where(eq(orders.id, order.id));
      retried++;
    }
    await logSystem("info", "fulfillment", `Auto-retry triggered for ${retried} processing orders`, { orderIds: processingOrders.map(o => o.id) });
    return { retried, skipped: 0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSystem("error", "fulfillment", `Auto-retry failed: ${msg}`, {});
    return { retried: 0, skipped: 0 };
  }
}
