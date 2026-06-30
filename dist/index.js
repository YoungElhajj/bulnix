var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      // Payment gateways
      paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY ?? "",
      flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY ?? "",
      flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY ?? "",
      // Flutterwave webhook hash — set this in your Flutterwave dashboard under Webhooks > Secret Hash
      // It is a SEPARATE value from the API secret key
      flutterwaveWebhookHash: process.env.FLUTTERWAVE_WEBHOOK_HASH ?? "",
      nowpaymentsApiKey: process.env.NOWPAYMENTS_API_KEY ?? "",
      nowpaymentsIpnSecret: process.env.NOWPAYMENTS_IPN_SECRET ?? "",
      nowpaymentsCurrency: process.env.NOWPAYMENTS_CURRENCY ?? "usdttrc20",
      // Kora Pay
      korapaySecretKey: process.env.KORAPAY_SECRET_KEY ?? "",
      korapayPublicKey: process.env.KORAPAY_PUBLIC_KEY ?? "",
      korapayWebhookSecret: process.env.KORAPAY_WEBHOOK_SECRET ?? "",
      // Google OAuth
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    };
  }
});

// server/payments/paystack.ts
import { createHmac } from "crypto";
async function paystackRequest(method, path3, body) {
  const res = await fetch(`${BASE_URL}${path3}`, {
    method,
    headers: {
      Authorization: `Bearer ${ENV.paystackSecretKey}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : void 0
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message ?? "Paystack API error");
  }
  return data.data;
}
async function paystackInitiate(params) {
  const data = await paystackRequest("POST", "/transaction/initialize", {
    email: params.email,
    amount: Math.round(params.amountKobo),
    reference: params.reference,
    currency: params.currency,
    callback_url: params.callbackUrl,
    metadata: params.metadata ?? {}
  });
  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference
  };
}
function verifyPaystackSignature(rawBody, signature) {
  const hash = createHmac("sha512", ENV.paystackSecretKey).update(rawBody).digest("hex");
  return hash === signature;
}
var BASE_URL;
var init_paystack = __esm({
  "server/payments/paystack.ts"() {
    "use strict";
    init_env();
    BASE_URL = "https://api.paystack.co";
  }
});

// server/payments/flutterwave.ts
var flutterwave_exports = {};
__export(flutterwave_exports, {
  flwInitiate: () => flwInitiate,
  flwVerify: () => flwVerify,
  verifyFlwSignature: () => verifyFlwSignature
});
async function flwRequest(method, path3, body) {
  const res = await fetch(`${BASE_URL2}${path3}`, {
    method,
    headers: {
      Authorization: `Bearer ${ENV.flutterwaveSecretKey}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : void 0
  });
  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    throw new Error(data.message ?? "Flutterwave API error");
  }
  return data.data;
}
async function flwInitiate(params) {
  const data = await flwRequest("POST", "/payments", {
    tx_ref: params.txRef,
    amount: params.amount,
    currency: params.currency,
    redirect_url: params.redirectUrl,
    customer: {
      email: params.email,
      name: params.name,
      phonenumber: params.phone ?? ""
    },
    customizations: {
      title: "Bulnix Store",
      description: params.description ?? "Digital account purchase",
      logo: "https://bulnix.com/favicon.ico"
    },
    meta: params.meta ?? {}
  });
  return {
    paymentLink: data.link,
    txRef: params.txRef
  };
}
async function flwVerify(transactionId) {
  const data = await flwRequest("GET", `/transactions/${encodeURIComponent(transactionId)}/verify`);
  return {
    status: data.status,
    txRef: data.tx_ref,
    flwRef: data.flw_ref,
    amount: data.amount,
    chargedAmount: data.charged_amount,
    currency: data.currency,
    processorResponse: data.processor_response
  };
}
function verifyFlwSignature(receivedHash) {
  const webhookHash = ENV.flutterwaveWebhookHash;
  if (!webhookHash) return true;
  return receivedHash === webhookHash;
}
var BASE_URL2;
var init_flutterwave = __esm({
  "server/payments/flutterwave.ts"() {
    "use strict";
    init_env();
    BASE_URL2 = "https://api.flutterwave.com/v3";
  }
});

// server/payments/nowpayments.ts
import { createHmac as createHmac2 } from "crypto";
async function npRequest(method, path3, body) {
  const res = await fetch(`${BASE_URL3}${path3}`, {
    method,
    headers: {
      "x-api-key": ENV.nowpaymentsApiKey,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : void 0
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "NowPayments API error");
  }
  return data;
}
async function npInitiate(params) {
  const data = await npRequest("POST", "/invoice", {
    price_amount: params.priceAmount,
    price_currency: params.priceCurrency.toLowerCase(),
    pay_currency: (params.payCurrency ?? ENV.nowpaymentsCurrency).toLowerCase(),
    order_id: params.orderId,
    order_description: params.orderDescription ?? "Bulnix digital account purchase",
    success_url: params.successUrl ?? "",
    cancel_url: params.cancelUrl ?? "",
    ipn_callback_url: params.ipnCallbackUrl ?? ""
  });
  return {
    invoiceId: data.id,
    invoiceUrl: data.invoice_url
  };
}
function verifyNowPaymentsIpn(rawBody, signature) {
  try {
    const parsed = JSON.parse(rawBody);
    const sorted = Object.keys(parsed).sort().reduce((acc, key) => {
      acc[key] = parsed[key];
      return acc;
    }, {});
    const hash = createHmac2("sha512", ENV.nowpaymentsIpnSecret).update(JSON.stringify(sorted)).digest("hex");
    return hash === signature;
  } catch {
    return false;
  }
}
function isNowPaymentsSuccess(status) {
  return status === "finished" || status === "confirmed" || status === "partially_paid";
}
function isNowPaymentsPartial(status) {
  return status === "partially_paid";
}
var BASE_URL3;
var init_nowpayments = __esm({
  "server/payments/nowpayments.ts"() {
    "use strict";
    init_env();
    BASE_URL3 = "https://api.nowpayments.io/v1";
  }
});

// server/payments/korapay.ts
var korapay_exports = {};
__export(korapay_exports, {
  isKoraSuccess: () => isKoraSuccess,
  koraInitiate: () => koraInitiate,
  koraVerify: () => koraVerify,
  verifyKoraSignature: () => verifyKoraSignature
});
import { createHmac as createHmac3 } from "crypto";
async function koraRequest(method, path3, body) {
  const bodyStr = body ? JSON.stringify(body) : void 0;
  console.log(`[KoraPay] ${method} ${path3} payload:`, bodyStr);
  const res = await fetch(`${BASE_URL4}${path3}`, {
    method,
    headers: {
      Authorization: `Bearer ${ENV.korapaySecretKey}`,
      "Content-Type": "application/json"
    },
    body: bodyStr
  });
  const rawText = await res.text();
  console.log(`[KoraPay] ${method} ${path3} status=${res.status} response:`, rawText);
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Kora Pay returned non-JSON response (${res.status}): ${rawText.slice(0, 200)}`);
  }
  if (!res.ok || data.status === false) {
    throw new Error(data.message ?? "Kora Pay API error");
  }
  return data.data ?? data;
}
async function getLiveNgnRate() {
  try {
    const rates = await getExchangeRates();
    const row = rates.find((r) => r.fromCurrency === "USD" && r.toCurrency === "NGN");
    if (row && Number(row.rate) > 0) return Number(row.rate);
  } catch {
  }
  return FALLBACK_USD_TO_NGN;
}
async function koraInitiate(params) {
  const usdToNgn = await getLiveNgnRate();
  const amountNGN = Math.round(params.amountUSD * usdToNgn);
  if (amountNGN > KORA_MAX_NGN) {
    throw new Error(
      `Kora Pay maximum per transaction is NGN ${KORA_MAX_NGN.toLocaleString()} (~$${(KORA_MAX_NGN / usdToNgn).toFixed(0)} USD). Please use Flutterwave or Crypto for larger amounts.`
    );
  }
  const data = await koraRequest("POST", "/charges/initialize", {
    reference: params.reference,
    amount: amountNGN,
    currency: "NGN",
    redirect_url: params.redirectUrl,
    // notification_url is required by Kora Pay API
    ...params.notificationUrl ? { notification_url: params.notificationUrl } : {},
    customer: {
      email: params.email,
      name: params.name
    },
    // Strip characters Kora Pay rejects as unsafe (e.g. $, #, &, etc.)
    narration: (params.description ?? "Bulnix wallet top-up").replace(/[^a-zA-Z0-9 .,'\-_]/g, ""),
    // metadata must not be an empty object — omit if no keys
    ...params.metadata && Object.keys(params.metadata).length > 0 ? { metadata: params.metadata } : {}
  });
  return {
    checkoutUrl: data.checkout_url ?? data.authorization_url,
    reference: params.reference
  };
}
async function koraVerify(reference) {
  const data = await koraRequest("GET", `/charges/${encodeURIComponent(reference)}`);
  const statusRaw = data.status?.toLowerCase();
  let status = "pending";
  if (statusRaw === "success") status = "success";
  else if (statusRaw === "failed") status = "failed";
  else if (statusRaw === "processing") status = "processing";
  return {
    status,
    reference: data.reference,
    // Kora returns amount in major units (naira), not kobo
    amount: data.amount,
    currency: data.currency,
    fee: data.fee ?? 0,
    narration: data.narration ?? ""
  };
}
function verifyKoraSignature(rawBody, signature) {
  try {
    const secret = ENV.korapaySecretKey;
    if (!secret) return true;
    const parsed = JSON.parse(rawBody);
    const dataObj = parsed.data ?? {};
    const hash = createHmac3("sha256", secret).update(JSON.stringify(dataObj)).digest("hex");
    return hash === signature;
  } catch {
    return false;
  }
}
function isKoraSuccess(status) {
  return status === "success";
}
var BASE_URL4, KORA_MAX_NGN, FALLBACK_USD_TO_NGN;
var init_korapay = __esm({
  "server/payments/korapay.ts"() {
    "use strict";
    init_env();
    init_db();
    BASE_URL4 = "https://api.korapay.com/merchant/api/v1";
    KORA_MAX_NGN = 2e5;
    FALLBACK_USD_TO_NGN = 1600;
  }
});

// server/db-retry.ts
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRetryableDbError(error) {
  const RETRYABLE = [
    "information schema is out of date",
    "schema failed to update",
    "try again",
    "deadlock",
    "lock wait timeout",
    "pd server timeout",
    "tikv server timeout",
    "tidb server timeout",
    "region is unavailable",
    "hy000",
    "connection lost",
    "econnreset",
    "econnrefused",
    "etimedout",
    "tiproxy fails to connect",
    "tidb server is busy",
    "server is overloaded"
  ];
  const check = (e) => {
    if (!e || typeof e !== "object") return false;
    const err = e;
    const text2 = (err.sqlMessage ?? err.message ?? "").toLowerCase();
    if (RETRYABLE.some((s) => text2.includes(s))) return true;
    if (err.cause) return check(err.cause);
    return false;
  };
  return check(error);
}
async function withDbRetry(fn, label, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < maxRetries && isRetryableDbError(error)) {
        const delay = Math.min(attempt * 1500, 6e3);
        console.warn(
          `[DB] ${label} transient error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`
        );
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  throw new Error(`[DB] ${label} failed after ${maxRetries} attempts`);
}
var init_db_retry = __esm({
  "server/db-retry.ts"() {
    "use strict";
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminActions: () => adminActions,
  affiliateBalances: () => affiliateBalances,
  affiliateTransactions: () => affiliateTransactions,
  affiliateWithdrawals: () => affiliateWithdrawals,
  apiKeys: () => apiKeys,
  categories: () => categories,
  coupons: () => coupons,
  exchangeRates: () => exchangeRates,
  fulfillmentRecords: () => fulfillmentRecords,
  notifications: () => notifications,
  orderItems: () => orderItems,
  orders: () => orders,
  paymentEvents: () => paymentEvents,
  payments: () => payments,
  productCredentials: () => productCredentials,
  products: () => products,
  providerConfigs: () => providerConfigs,
  providerSyncLogs: () => providerSyncLogs,
  rewardPoints: () => rewardPoints,
  rewardSettings: () => rewardSettings,
  rewardTransactions: () => rewardTransactions,
  savedProducts: () => savedProducts,
  supplierProducts: () => supplierProducts,
  supplierRefundClaims: () => supplierRefundClaims,
  supportTickets: () => supportTickets,
  systemLogs: () => systemLogs,
  ticketMessages: () => ticketMessages,
  userSessions: () => userSessions,
  users: () => users,
  walletTransactions: () => walletTransactions,
  wallets: () => wallets
});
import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar
} from "drizzle-orm/mysql-core";
var users, userSessions, categories, providerConfigs, providerSyncLogs, supplierProducts, products, orders, orderItems, fulfillmentRecords, payments, paymentEvents, coupons, supportTickets, ticketMessages, notifications, adminActions, systemLogs, savedProducts, exchangeRates, wallets, walletTransactions, supplierRefundClaims, productCredentials, rewardPoints, rewardTransactions, rewardSettings, affiliateBalances, affiliateTransactions, affiliateWithdrawals, apiKeys;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      username: varchar("username", { length: 64 }).unique(),
      email: varchar("email", { length: 320 }),
      passwordHash: text("passwordHash"),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      country: varchar("country", { length: 64 }),
      signupCountry: varchar("signupCountry", { length: 64 }),
      signupIp: varchar("signupIp", { length: 64 }),
      referralCode: varchar("referralCode", { length: 32 }),
      referredBy: varchar("referredBy", { length: 32 }),
      emailVerified: boolean("emailVerified").default(false).notNull(),
      emailVerifyToken: varchar("emailVerifyToken", { length: 128 }),
      passwordResetToken: varchar("passwordResetToken", { length: 128 }),
      passwordResetExpiry: timestamp("passwordResetExpiry"),
      otpCode: varchar("otpCode", { length: 6 }),
      otpExpiry: timestamp("otpExpiry"),
      otpPurpose: varchar("otpPurpose", { length: 16 }),
      isSuspended: boolean("isSuspended").default(false).notNull(),
      suspendedReason: text("suspendedReason"),
      twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
      twoFactorSecret: varchar("twoFactorSecret", { length: 64 }),
      telegramBonusClaimed: boolean("telegramBonusClaimed").default(false).notNull(),
      notifyEmail: boolean("notifyEmail").default(true).notNull(),
      notifyOrders: boolean("notifyOrders").default(true).notNull(),
      preferredCurrency: mysqlEnum("preferredCurrency", ["NGN", "USD", "EUR", "GBP"]).default("USD").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
      lastLoginIp: varchar("lastLoginIp", { length: 64 })
    });
    userSessions = mysqlTable("user_sessions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      sessionToken: varchar("sessionToken", { length: 256 }).notNull().unique(),
      ipAddress: varchar("ipAddress", { length: 64 }),
      userAgent: text("userAgent"),
      expiresAt: timestamp("expiresAt").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    categories = mysqlTable("categories", {
      id: int("id").autoincrement().primaryKey(),
      slug: varchar("slug", { length: 128 }).notNull().unique(),
      name: varchar("name", { length: 256 }).notNull(),
      description: text("description"),
      imageUrl: text("imageUrl"),
      parentId: int("parentId"),
      isVisible: boolean("isVisible").default(true).notNull(),
      sortOrder: int("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    providerConfigs = mysqlTable("provider_configs", {
      id: int("id").autoincrement().primaryKey(),
      providerKey: varchar("providerKey", { length: 64 }).notNull().unique(),
      // "accszone" | "accsbulk"
      displayName: varchar("displayName", { length: 128 }).notNull(),
      baseUrl: text("baseUrl").notNull(),
      apiKey: text("apiKey"),
      // encrypted at rest
      webhookSecret: text("webhookSecret"),
      isEnabled: boolean("isEnabled").default(true).notNull(),
      syncIntervalMinutes: int("syncIntervalMinutes").default(30).notNull(),
      lastSyncAt: timestamp("lastSyncAt"),
      defaultMarkupPercent: decimal("defaultMarkupPercent", { precision: 10, scale: 2 }).default("20.00").notNull(),
      settings: json("settings"),
      // extra provider-specific config
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    providerSyncLogs = mysqlTable("provider_sync_logs", {
      id: int("id").autoincrement().primaryKey(),
      providerKey: varchar("providerKey", { length: 64 }).notNull(),
      syncType: mysqlEnum("syncType", ["categories", "products", "stock", "prices", "full"]).notNull(),
      status: mysqlEnum("status", ["running", "success", "failed", "partial"]).notNull(),
      itemsSynced: int("itemsSynced").default(0),
      itemsFailed: int("itemsFailed").default(0),
      errorMessage: text("errorMessage"),
      startedAt: timestamp("startedAt").defaultNow().notNull(),
      completedAt: timestamp("completedAt")
    });
    supplierProducts = mysqlTable("supplier_products", {
      id: int("id").autoincrement().primaryKey(),
      providerKey: varchar("providerKey", { length: 64 }).notNull(),
      supplierProductId: varchar("supplierProductId", { length: 256 }).notNull(),
      supplierCategoryId: varchar("supplierCategoryId", { length: 128 }),
      supplierSlug: varchar("supplierSlug", { length: 256 }),
      rawTitle: text("rawTitle"),
      rawDescription: text("rawDescription"),
      rawPrice: decimal("rawPrice", { precision: 18, scale: 8 }),
      rawCurrency: varchar("rawCurrency", { length: 16 }),
      rawStock: int("rawStock").default(0),
      rawData: json("rawData"),
      // full supplier API response
      lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    products = mysqlTable("products", {
      id: int("id").autoincrement().primaryKey(),
      slug: varchar("slug", { length: 256 }).notNull().unique(),
      supplierProductId: int("supplierProductId"),
      // FK to supplierProducts.id
      providerKey: varchar("providerKey", { length: 64 }).notNull(),
      categoryId: int("categoryId"),
      // Manual product flags
      isManual: boolean("isManual").default(false).notNull(),
      isSubscription: boolean("isSubscription").default(false).notNull(),
      // Overrideable fields
      title: varchar("title", { length: 512 }).notNull(),
      description: text("description"),
      shortDescription: text("shortDescription"),
      imageUrl: text("imageUrl"),
      tags: json("tags"),
      // string[]
      // Pricing
      supplierPrice: decimal("supplierPrice", { precision: 18, scale: 8 }).notNull(),
      supplierCurrency: varchar("supplierCurrency", { length: 16 }).default("USD").notNull(),
      markupPercent: decimal("markupPercent", { precision: 10, scale: 2 }).default("20.00").notNull(),
      customerPriceUSD: decimal("customerPriceUSD", { precision: 18, scale: 2 }).notNull(),
      customerPriceNGN: decimal("customerPriceNGN", { precision: 18, scale: 2 }),
      // Stock
      stockQuantity: int("stockQuantity").default(0).notNull(),
      stockUnlimited: boolean("stockUnlimited").default(false).notNull(),
      // Controls
      isVisible: boolean("isVisible").default(true).notNull(),
      isFeatured: boolean("isFeatured").default(false).notNull(),
      isDigital: boolean("isDigital").default(true).notNull(),
      regionRestrictions: json("regionRestrictions"),
      // string[] of blocked country codes
      allowedPaymentMethods: json("allowedPaymentMethods"),
      // string[] e.g. ["card","crypto","bank"]
      riskFlag: boolean("riskFlag").default(false).notNull(),
      requiresAgeVerification: boolean("requiresAgeVerification").default(false).notNull(),
      deliveryNote: text("deliveryNote"),
      deliveryFormat: text("deliveryFormat"),
      // Override auto-detected credential format, e.g. "Email : Password : 2FA : Facebook ID"
      refundPolicy: text("refundPolicy"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    orders = mysqlTable("orders", {
      id: int("id").autoincrement().primaryKey(),
      orderNumber: varchar("orderNumber", { length: 64 }).notNull().unique(),
      userId: int("userId").notNull(),
      status: mysqlEnum("status", [
        "pending_payment",
        "paid",
        "processing",
        "fulfilled",
        "partial",
        "failed",
        "cancelled",
        "refunded",
        "disputed"
      ]).default("pending_payment").notNull(),
      // Pricing snapshot
      subtotalUSD: decimal("subtotalUSD", { precision: 18, scale: 2 }).notNull(),
      discountUSD: decimal("discountUSD", { precision: 18, scale: 2 }).default("0.00").notNull(),
      totalUSD: decimal("totalUSD", { precision: 18, scale: 2 }).notNull(),
      currency: mysqlEnum("currency", ["NGN", "USD", "EUR", "GBP"]).default("USD").notNull(),
      totalInCurrency: decimal("totalInCurrency", { precision: 18, scale: 2 }).notNull(),
      exchangeRateSnapshot: decimal("exchangeRateSnapshot", { precision: 18, scale: 6 }),
      // Coupon
      couponCode: varchar("couponCode", { length: 64 }),
      couponDiscountUSD: decimal("couponDiscountUSD", { precision: 18, scale: 2 }).default("0.00"),
      // Billing
      billingEmail: varchar("billingEmail", { length: 320 }),
      billingCountry: varchar("billingCountry", { length: 64 }),
      // Flags
      fraudFlag: boolean("fraudFlag").default(false).notNull(),
      fraudReason: text("fraudReason"),
      isLocked: boolean("isLocked").default(false).notNull(),
      adminNotes: text("adminNotes"),
      // Supplier fulfillment
      supplierOrderId: varchar("supplierOrderId", { length: 256 }),
      supplierStatus: varchar("supplierStatus", { length: 64 }),
      fulfillmentRetries: int("fulfillmentRetries").default(0).notNull(),
      lastFulfillmentAttempt: timestamp("lastFulfillmentAttempt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    orderItems = mysqlTable("order_items", {
      id: int("id").autoincrement().primaryKey(),
      orderId: int("orderId").notNull(),
      productId: int("productId").notNull(),
      productTitle: varchar("productTitle", { length: 512 }).notNull(),
      quantity: int("quantity").notNull(),
      unitPriceUSD: decimal("unitPriceUSD", { precision: 18, scale: 2 }).notNull(),
      totalPriceUSD: decimal("totalPriceUSD", { precision: 18, scale: 2 }).notNull(),
      supplierProductId: varchar("supplierProductId", { length: 256 }),
      providerKey: varchar("providerKey", { length: 64 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    fulfillmentRecords = mysqlTable("fulfillment_records", {
      id: int("id").autoincrement().primaryKey(),
      orderId: int("orderId").notNull(),
      orderItemId: int("orderItemId"),
      providerKey: varchar("providerKey", { length: 64 }).notNull(),
      supplierOrderId: varchar("supplierOrderId", { length: 256 }),
      status: mysqlEnum("status", ["pending", "success", "failed", "partial"]).notNull(),
      deliveryData: text("deliveryData"),
      // encrypted JSON - account credentials etc.
      rawResponse: json("rawResponse"),
      errorMessage: text("errorMessage"),
      userViewed: boolean("userViewed").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    payments = mysqlTable("payments", {
      id: int("id").autoincrement().primaryKey(),
      orderId: int("orderId").notNull(),
      userId: int("userId").notNull(),
      gateway: mysqlEnum("gateway", ["paystack", "flutterwave", "nowpayments", "manual"]).notNull(),
      gatewayReference: varchar("gatewayReference", { length: 256 }).unique(),
      gatewayTransactionId: varchar("gatewayTransactionId", { length: 256 }),
      status: mysqlEnum("status", ["pending", "success", "failed", "refunded", "disputed"]).default("pending").notNull(),
      amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
      currency: mysqlEnum("currency", ["NGN", "USD", "EUR", "GBP"]).notNull(),
      amountUSD: decimal("amountUSD", { precision: 18, scale: 2 }),
      exchangeRate: decimal("exchangeRate", { precision: 18, scale: 6 }),
      paymentMethod: varchar("paymentMethod", { length: 64 }),
      // card, bank_transfer, crypto
      metadata: json("metadata"),
      webhookVerified: boolean("webhookVerified").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    paymentEvents = mysqlTable("payment_events", {
      id: int("id").autoincrement().primaryKey(),
      paymentId: int("paymentId"),
      orderId: int("orderId"),
      gateway: varchar("gateway", { length: 64 }).notNull(),
      eventType: varchar("eventType", { length: 128 }).notNull(),
      payload: json("payload"),
      isProcessed: boolean("isProcessed").default(false).notNull(),
      isDuplicate: boolean("isDuplicate").default(false).notNull(),
      processedAt: timestamp("processedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    coupons = mysqlTable("coupons", {
      id: int("id").autoincrement().primaryKey(),
      code: varchar("code", { length: 64 }).notNull().unique(),
      discountType: mysqlEnum("discountType", ["percent", "fixed_usd"]).notNull(),
      discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
      maxUses: int("maxUses"),
      usedCount: int("usedCount").default(0).notNull(),
      minOrderUSD: decimal("minOrderUSD", { precision: 10, scale: 2 }).default("0.00"),
      expiresAt: timestamp("expiresAt"),
      isActive: boolean("isActive").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    supportTickets = mysqlTable("support_tickets", {
      id: int("id").autoincrement().primaryKey(),
      ticketNumber: varchar("ticketNumber", { length: 32 }).notNull().unique(),
      userId: int("userId").notNull(),
      orderId: int("orderId"),
      subject: varchar("subject", { length: 512 }).notNull(),
      status: mysqlEnum("status", ["open", "pending", "resolved", "closed"]).default("open").notNull(),
      priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      resolvedAt: timestamp("resolvedAt")
    });
    ticketMessages = mysqlTable("ticket_messages", {
      id: int("id").autoincrement().primaryKey(),
      ticketId: int("ticketId").notNull(),
      senderId: int("senderId").notNull(),
      senderRole: mysqlEnum("senderRole", ["user", "admin"]).notNull(),
      message: text("message").notNull(),
      attachmentUrl: text("attachmentUrl"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    notifications = mysqlTable("notifications", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      type: varchar("type", { length: 64 }).notNull(),
      // "order_update" | "ticket_reply" | "payment" etc.
      title: varchar("title", { length: 256 }).notNull(),
      message: text("message").notNull(),
      isRead: boolean("isRead").default(false).notNull(),
      relatedOrderId: int("relatedOrderId"),
      relatedTicketId: int("relatedTicketId"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    adminActions = mysqlTable("admin_actions", {
      id: int("id").autoincrement().primaryKey(),
      adminId: int("adminId").notNull(),
      action: varchar("action", { length: 256 }).notNull(),
      targetType: varchar("targetType", { length: 64 }),
      // "user" | "order" | "product" | "ticket"
      targetId: int("targetId"),
      details: json("details"),
      ipAddress: varchar("ipAddress", { length: 64 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    systemLogs = mysqlTable("system_logs", {
      id: int("id").autoincrement().primaryKey(),
      level: mysqlEnum("level", ["info", "warn", "error", "critical"]).notNull(),
      category: varchar("category", { length: 64 }).notNull(),
      // "payment" | "supplier" | "auth" | "order"
      message: text("message").notNull(),
      details: json("details"),
      userId: int("userId"),
      orderId: int("orderId"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    savedProducts = mysqlTable("saved_products", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      productId: int("productId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    exchangeRates = mysqlTable("exchange_rates", {
      id: int("id").autoincrement().primaryKey(),
      fromCurrency: varchar("fromCurrency", { length: 8 }).notNull(),
      toCurrency: varchar("toCurrency", { length: 8 }).notNull(),
      rate: decimal("rate", { precision: 18, scale: 6 }).notNull(),
      source: varchar("source", { length: 64 }).default("manual").notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    wallets = mysqlTable("wallets", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      balanceUSD: decimal("balanceUSD", { precision: 18, scale: 6 }).default("0.000000").notNull(),
      totalDeposited: decimal("totalDeposited", { precision: 18, scale: 6 }).default("0.000000").notNull(),
      totalSpent: decimal("totalSpent", { precision: 18, scale: 6 }).default("0.000000").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    walletTransactions = mysqlTable("wallet_transactions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      type: mysqlEnum("type", ["deposit", "spend", "refund", "adjustment"]).notNull(),
      amountUSD: decimal("amountUSD", { precision: 18, scale: 6 }).notNull(),
      balanceAfterUSD: decimal("balanceAfterUSD", { precision: 18, scale: 6 }).notNull(),
      description: varchar("description", { length: 512 }).notNull(),
      reference: varchar("reference", { length: 256 }),
      orderId: int("orderId"),
      paymentId: int("paymentId"),
      status: mysqlEnum("status", ["pending", "completed", "failed", "reversed", "partial"]).default("completed").notNull(),
      gateway: varchar("gateway", { length: 64 }),
      gatewayRef: varchar("gatewayRef", { length: 256 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    supplierRefundClaims = mysqlTable("supplier_refund_claims", {
      id: int("id").autoincrement().primaryKey(),
      /** Admin who raised the claim */
      raisedByAdminId: int("raisedByAdminId").notNull(),
      /** The customer ticket this claim was raised from */
      ticketId: int("ticketId"),
      /** The order this claim relates to */
      orderId: int("orderId"),
      /** The supplier provider key (e.g. "accszone") */
      providerKey: varchar("providerKey", { length: 64 }).notNull(),
      /** The supplier's own order/transaction ID to reference in the claim */
      supplierOrderId: varchar("supplierOrderId", { length: 256 }),
      /** Amount being claimed back from the supplier (in USD) */
      claimAmountUSD: decimal("claimAmountUSD", { precision: 18, scale: 6 }).notNull(),
      /** Admin's reason for the claim */
      reason: text("reason").notNull(),
      /** Current status of the claim */
      status: mysqlEnum("status", [
        "draft",
        "submitted",
        "acknowledged",
        "approved",
        "partially_approved",
        "rejected",
        "resolved",
        "cancelled"
      ]).default("draft").notNull(),
      /** Amount the supplier actually approved (may differ from claim amount) */
      approvedAmountUSD: decimal("approvedAmountUSD", { precision: 18, scale: 6 }),
      /** Supplier's response message or reference number */
      supplierResponse: text("supplierResponse"),
      /** Supplier's refund reference/ticket number */
      supplierRefundRef: varchar("supplierRefundRef", { length: 256 }),
      /** Internal admin notes (not sent to supplier) */
      adminNotes: text("adminNotes"),
      /** Full log of all communications with supplier as JSON array */
      communicationLog: json("communicationLog"),
      /** Whether the approved amount has been credited back to the customer's wallet */
      creditedToCustomer: boolean("creditedToCustomer").default(false).notNull(),
      submittedAt: timestamp("submittedAt"),
      resolvedAt: timestamp("resolvedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    productCredentials = mysqlTable("product_credentials", {
      id: int("id").autoincrement().primaryKey(),
      productId: int("productId").notNull(),
      data: text("data").notNull(),
      // raw credential string e.g. "email:pass:2fa" or JSON
      isUsed: boolean("isUsed").default(false).notNull(),
      usedByOrderId: int("usedByOrderId"),
      usedByUserId: int("usedByUserId"),
      usedAt: timestamp("usedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    rewardPoints = mysqlTable("reward_points", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      points: int("points").default(0).notNull(),
      // 1 point = $0.01
      lifetimeEarned: int("lifetimeEarned").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    rewardTransactions = mysqlTable("reward_transactions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      type: mysqlEnum("type", ["earn", "redeem"]).notNull(),
      points: int("points").notNull(),
      description: varchar("description", { length: 256 }).notNull(),
      orderId: int("orderId"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    rewardSettings = mysqlTable("reward_settings", {
      id: int("id").autoincrement().primaryKey(),
      tier: varchar("tier", { length: 32 }).notNull().unique(),
      // gold | platinum | diamond
      cashbackPercent: decimal("cashbackPercent", { precision: 5, scale: 2 }).notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    affiliateBalances = mysqlTable("affiliate_balances", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      balanceUSD: decimal("balanceUSD", { precision: 18, scale: 6 }).default("0.000000").notNull(),
      totalEarned: decimal("totalEarned", { precision: 18, scale: 6 }).default("0.000000").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    affiliateTransactions = mysqlTable("affiliate_transactions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      type: mysqlEnum("type", ["signup_bonus", "withdrawal"]).notNull(),
      amountUSD: decimal("amountUSD", { precision: 18, scale: 6 }).notNull(),
      description: varchar("description", { length: 256 }).notNull(),
      referredUserId: int("referredUserId"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    affiliateWithdrawals = mysqlTable("affiliate_withdrawals", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      amountUSD: decimal("amountUSD", { precision: 18, scale: 6 }).notNull(),
      bankName: varchar("bankName", { length: 128 }).notNull(),
      accountNumber: varchar("accountNumber", { length: 64 }).notNull(),
      accountName: varchar("accountName", { length: 128 }).notNull(),
      status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
      adminNote: text("adminNote"),
      processedAt: timestamp("processedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    apiKeys = mysqlTable("api_keys", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      keyHash: varchar("keyHash", { length: 256 }).notNull().unique(),
      // SHA-256 of the key (empty for pending requests)
      keyPrefix: varchar("keyPrefix", { length: 16 }).notNull(),
      // first 8 chars for display (empty for pending)
      label: varchar("label", { length: 128 }).default("Default").notNull(),
      status: mysqlEnum("status", ["pending", "active", "rejected"]).default("pending").notNull(),
      isEnabled: boolean("isEnabled").default(true).notNull(),
      adminEnabled: boolean("adminEnabled").default(true).notNull(),
      // admin can disable
      adminNote: varchar("adminNote", { length: 256 }),
      // admin rejection reason
      rawKeyOnce: varchar("rawKeyOnce", { length: 128 }),
      // full key shown once to user, then cleared
      lastUsedAt: timestamp("lastUsedAt"),
      requestCount: int("requestCount").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// server/email.ts
var email_exports = {};
__export(email_exports, {
  safeSendEmail: () => safeSendEmail,
  sendBackupEmail: () => sendBackupEmail,
  sendBackupFailedEmail: () => sendBackupFailedEmail,
  sendDeliveryEmail: () => sendDeliveryEmail,
  sendOrderConfirmationEmail: () => sendOrderConfirmationEmail,
  sendOrderStatusEmail: () => sendOrderStatusEmail,
  sendOtpEmail: () => sendOtpEmail,
  sendPasswordResetEmail: () => sendPasswordResetEmail,
  sendRefundConfirmationEmail: () => sendRefundConfirmationEmail,
  sendTicketReplyEmail: () => sendTicketReplyEmail,
  sendWalletTopupReceiptEmail: () => sendWalletTopupReceiptEmail,
  sendWelcomeEmail: () => sendWelcomeEmail
});
import { Resend } from "resend";
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
function baseTemplate(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #0F172A; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo img { height: 40px; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
    .btn { display: inline-block; background: #00B9E9; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 28px 0; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin-bottom: 4px; }
    .value { font-size: 15px; color: #e2e8f0; margin-bottom: 16px; }
    .highlight { background: rgba(0,185,233,0.08); border: 1px solid rgba(0,185,233,0.2); border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
    .highlight .code { font-size: 32px; font-weight: 800; color: #00B9E9; letter-spacing: 0.15em; text-align: center; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-paid { background: rgba(34,197,94,0.15); color: #22C55E; }
    .status-processing { background: rgba(251,191,36,0.15); color: #FBBF24; }
    .status-completed { background: rgba(0,185,233,0.15); color: #00B9E9; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #334155; }
    .footer a { color: #475569; text-decoration: none; }
    .social-row { text-align: center; margin: 20px 0 0; }
    .social-row a { display: inline-block; margin: 0 8px; color: #475569; font-size: 13px; text-decoration: none; }
    table.order-items { width: 100%; border-collapse: collapse; margin: 16px 0; }
    table.order-items th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; padding: 0 0 10px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    table.order-items td { padding: 10px 0; font-size: 14px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: top; }
    table.order-items td.name { color: #e2e8f0; }
    table.order-items td.price { text-align: right; color: #22C55E; font-weight: 600; white-space: nowrap; }
    .total-row { display: flex; justify-content: space-between; padding: 14px 0 0; font-size: 16px; font-weight: 700; color: #ffffff; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo">
      <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg" alt="Bulnix" />
    </div>
    <div class="card">
      ${body}
    </div>
    <div class="footer">
      <p style="margin-bottom:8px;">\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Bulnix. All rights reserved.</p>
      <div class="social-row">
        <a href="https://t.me/bulnixupdates">Telegram</a>
        <a href="https://wa.me/447988531474">WhatsApp</a>
        <a href="https://bulnix.com/privacy">Privacy</a>
        <a href="https://bulnix.com/terms">Terms</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
async function sendWelcomeEmail(opts) {
  const body = `
    <h1>Welcome to Bulnix, ${opts.name || "there"}! \u{1F389}</h1>
    <p>Your account is ready. You now have access to thousands of premium digital products \u2014 social media accounts, streaming services, gaming credits, VPNs, and more.</p>
    <a href="https://bulnix.com/categories" class="btn">Browse Products \u2192</a>
    <hr class="divider" />
    <p style="font-size:13px;">Need help getting started? Our support team is available 24/7 via <a href="https://wa.me/447988531474" style="color:#00B9E9;">WhatsApp</a> or by opening a <a href="https://bulnix.com/support" style="color:#00B9E9;">support ticket</a>.</p>
    <p style="font-size:13px;">Join our Telegram channel for exclusive deals and updates: <a href="https://t.me/bulnixupdates" style="color:#00B9E9;">t.me/bulnixupdates</a></p>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping welcome email");
    return;
  }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: "Welcome to Bulnix \u2014 Your account is ready",
    html: baseTemplate("Welcome to Bulnix", body)
  });
}
async function sendOtpEmail(opts) {
  const purposeLabels = {
    register: {
      subject: "Verify your email \u2014 Bulnix",
      heading: "Verify your email address",
      desc: "You're almost there! Enter the code below to verify your email and activate your Bulnix account."
    },
    login: {
      subject: "Your Bulnix sign-in code",
      heading: "Sign-in verification code",
      desc: "Use the code below to complete your sign-in. This code expires in 10 minutes."
    },
    reset: {
      subject: "Reset your Bulnix password",
      heading: "Password reset code",
      desc: "Use the code below to reset your password. This code expires in 10 minutes."
    }
  };
  const { subject, heading, desc: desc2 } = purposeLabels[opts.purpose];
  const body = `
    <h1>${heading}</h1>
    <p>Hi ${opts.name || "there"},</p>
    <p>${desc2}</p>
    <div class="highlight" style="text-align:center;">
      <div class="code" style="font-size:40px;font-weight:800;letter-spacing:14px;color:#00B9E9;font-family:monospace;">${opts.otp}</div>
    </div>
    <p style="font-size:13px;color:#94a3b8;">This code expires in <strong style="color:#e2e8f0;">10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
    <hr class="divider" />
    <p style="font-size:13px;">Need help? Contact us on <a href="https://wa.me/447988531474" style="color:#00B9E9;">WhatsApp</a> or open a <a href="https://bulnix.com/support" style="color:#00B9E9;">support ticket</a>.</p>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping OTP email");
    return;
  }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject,
    html: baseTemplate(subject, body)
  });
}
async function sendOrderConfirmationEmail(opts) {
  const itemRows = opts.items.map((item) => `
    <tr>
      <td class="name">${item.title}</td>
      <td style="text-align:center;color:#94a3b8;">\xD7${item.quantity}</td>
      <td class="price">$${(item.priceUSD * item.quantity).toFixed(2)}</td>
    </tr>`).join("");
  const body = `
    <h1>Order Confirmed \u2705</h1>
    <p>Hi ${opts.name || "there"}, your order has been received and is being processed.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Order Number</div>
      <div class="code">${opts.orderNumber}</div>
    </div>
    <table class="order-items">
      <thead><tr><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="total-row"><span>Total</span><span style="color:#22C55E;">$${opts.totalUSD.toFixed(2)}</span></div>
    <hr class="divider" />
    <a href="https://bulnix.com/orders/${opts.orderId}" class="btn">View Order Details \u2192</a>
    <p style="font-size:13px;">Digital products are delivered automatically once payment is confirmed. Check your order page for delivery details.</p>
    <p style="font-size:13px;">Questions? Contact us on <a href="https://wa.me/447988531474" style="color:#00B9E9;">WhatsApp</a> or open a <a href="https://bulnix.com/support" style="color:#00B9E9;">support ticket</a>.</p>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping order confirmation email");
    return;
  }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Order ${opts.orderNumber} confirmed \u2014 Bulnix`,
    html: baseTemplate("Order Confirmed", body)
  });
}
async function sendOrderStatusEmail(opts) {
  const statusLabel = {
    processing: "Processing",
    paid: "Payment Received",
    fulfilled: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded"
  };
  const statusClass = {
    paid: "status-paid",
    fulfilled: "status-completed",
    completed: "status-completed",
    processing: "status-processing"
  };
  const label = statusLabel[opts.status] ?? opts.status;
  const cls = statusClass[opts.status] ?? "status-processing";
  const body = `
    <h1>Order Update</h1>
    <p>Hi ${opts.name || "there"}, your order status has been updated.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Order ${opts.orderNumber}</div>
      <div style="text-align:center;margin-top:8px;"><span class="status-badge ${cls}">${label}</span></div>
    </div>
    ${opts.message ? `<p>${opts.message}</p>` : ""}
    <a href="https://bulnix.com/orders/${opts.orderId}" class="btn">View Order \u2192</a>
    <p style="font-size:13px;">Need help? Contact us on <a href="https://wa.me/447988531474" style="color:#00B9E9;">WhatsApp</a> or open a <a href="https://bulnix.com/support" style="color:#00B9E9;">support ticket</a>.</p>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping order status email");
    return;
  }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Order ${opts.orderNumber} \u2014 ${label} | Bulnix`,
    html: baseTemplate("Order Update", body)
  });
}
async function sendTicketReplyEmail(opts) {
  const body = `
    <h1>New reply on your ticket</h1>
    <p>Hi ${opts.name || "there"}, our support team has replied to your ticket.</p>
    <div class="highlight">
      <div class="label">Ticket Subject</div>
      <div style="color:#e2e8f0;font-size:15px;margin-bottom:12px;">${opts.ticketSubject}</div>
      <div class="label">Reply Preview</div>
      <div style="color:#94a3b8;font-size:14px;line-height:1.6;">${opts.replyPreview.slice(0, 200)}${opts.replyPreview.length > 200 ? "\u2026" : ""}</div>
    </div>
    <a href="https://bulnix.com/support/${opts.ticketId}" class="btn">View Full Reply \u2192</a>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping ticket reply email");
    return;
  }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Re: ${opts.ticketSubject} \u2014 Bulnix Support`,
    html: baseTemplate("Support Reply", body)
  });
}
async function sendPasswordResetEmail(opts) {
  const body = `
    <h1>Reset your password</h1>
    <p>Hi ${opts.name || "there"}, we received a request to reset your Bulnix password. Click the button below to set a new password.</p>
    <a href="${opts.resetUrl}" class="btn">Reset Password \u2192</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#475569;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping password reset email");
    return;
  }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: "Reset your Bulnix password",
    html: baseTemplate("Password Reset", body)
  });
}
async function sendDeliveryEmail(opts) {
  const itemSections = opts.items.map((item) => {
    const credRows = (item.credentials ?? []).map((cred, idx) => {
      const fields = Object.entries(cred).filter(([k, v]) => v && typeof v === "string" && v.trim() !== "").map(([k, v]) => `<tr><td class="label" style="padding:4px 0;width:120px;">${k.charAt(0).toUpperCase() + k.slice(1)}</td><td style="padding:4px 0;color:#e2e8f0;font-family:monospace;font-size:13px;word-break:break-all;">${v}</td></tr>`).join("");
      return `<div style="background:rgba(0,185,233,0.06);border:1px solid rgba(0,185,233,0.15);border-radius:8px;padding:14px 18px;margin:8px 0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#00B9E9;margin-bottom:8px;">Account ${idx + 1}</div>
        <table style="width:100%;border-collapse:collapse;">${fields}</table>
      </div>`;
    }).join("");
    const loginGuide = getLoginInstructions(item.categoryName ?? "", item.title);
    const deliveryNote = item.deliveryNote ? `<p style="font-size:13px;color:#94a3b8;margin:8px 0;">${item.deliveryNote}</p>` : "";
    return `
      <div style="margin:20px 0;padding:20px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.07);">
        <h3 style="font-size:16px;font-weight:700;color:#ffffff;margin:0 0 8px;">${item.title} \xD7${item.quantity}</h3>
        ${deliveryNote}
        ${credRows ? `<div style="margin:12px 0;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#475569;margin-bottom:8px;">Your Account Credentials</div>${credRows}</div>` : ""}
        ${loginGuide}
      </div>`;
  }).join("");
  const body = `
    <h1>\u{1F389} Your Order Has Been Delivered!</h1>
    <p>Hi ${opts.name || "there"}, great news \u2014 your Bulnix order is ready. Your account credentials are below.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Order Number</div>
      <div class="code">${opts.orderNumber}</div>
    </div>
    ${itemSections}
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">\u26A0\uFE0F <strong style="color:#e2e8f0;">Keep these credentials safe.</strong> Do not share them with anyone. If you have any issues accessing your account, please open a support ticket.</p>
    <a href="https://bulnix.com/orders/${opts.orderId}" class="btn">View Full Order \u2192</a>
    <p style="font-size:13px;">Need help? Contact us on <a href="https://wa.me/447988531474" style="color:#00B9E9;">WhatsApp</a> or open a <a href="https://bulnix.com/tickets" style="color:#00B9E9;">support ticket</a>.</p>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping delivery email");
    return;
  }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `\u2705 Your Bulnix order ${opts.orderNumber} has been delivered`,
    html: baseTemplate("Order Delivered", body)
  });
}
function getLoginInstructions(categoryName, productTitle) {
  const cat = (categoryName + " " + productTitle).toLowerCase();
  let steps = [];
  if (cat.includes("netflix")) {
    steps = [
      "Go to <a href='https://netflix.com' style='color:#00B9E9;'>netflix.com</a> and click <strong>Sign In</strong>.",
      "Enter the email and password provided above.",
      "If prompted, choose <strong>Use a sign-in link</strong> or enter the password directly.",
      "Go to <strong>Account \u2192 Profile & Parental Controls</strong> to set up your profile.",
      "\u26A0\uFE0F Do NOT change the email or password \u2014 this will lock out other users on the account."
    ];
  } else if (cat.includes("spotify")) {
    steps = [
      "Go to <a href='https://spotify.com' style='color:#00B9E9;'>spotify.com</a> and click <strong>Log In</strong>.",
      "Enter the email and password provided above.",
      "Download the Spotify app on your device for the best experience.",
      "\u26A0\uFE0F Do NOT change the account password or email."
    ];
  } else if (cat.includes("youtube") || cat.includes("google")) {
    steps = [
      "Open a browser and go to <a href='https://accounts.google.com' style='color:#00B9E9;'>accounts.google.com</a>.",
      "Sign in with the email and password provided above.",
      "If asked for 2FA, check the <strong>data</strong> field above for the recovery code.",
      "Go to YouTube and click your profile icon to confirm Premium is active.",
      "\u26A0\uFE0F Do NOT change the password or recovery email."
    ];
  } else if (cat.includes("disney") || cat.includes("hulu") || cat.includes("hbo") || cat.includes("max")) {
    steps = [
      "Go to the streaming service website or app.",
      "Click <strong>Log In</strong> and enter the email and password above.",
      "Create your own profile within the account.",
      "\u26A0\uFE0F Do NOT change the main account password or email."
    ];
  } else if (cat.includes("instagram") || cat.includes("facebook") || cat.includes("tiktok") || cat.includes("twitter") || cat.includes("x.com")) {
    steps = [
      "Open the app or website and click <strong>Log In</strong>.",
      "Enter the username/email and password provided above.",
      "If asked for 2FA, use the code in the <strong>data</strong> field above.",
      "Update your profile name and bio as desired.",
      "\u26A0\uFE0F Do NOT change the account email or phone number."
    ];
  } else if (cat.includes("amazon") || cat.includes("prime")) {
    steps = [
      "Go to <a href='https://amazon.com' style='color:#00B9E9;'>amazon.com</a> and click <strong>Sign In</strong>.",
      "Enter the email and password provided above.",
      "Go to <strong>Prime Video</strong> to access your subscription.",
      "\u26A0\uFE0F Do NOT change the account password."
    ];
  } else if (cat.includes("vpn") || cat.includes("nordvpn") || cat.includes("expressvpn")) {
    steps = [
      "Download the VPN app from the official website.",
      "Open the app and click <strong>Sign In</strong>.",
      "Enter the email and password provided above.",
      "Choose a server location and click <strong>Connect</strong>."
    ];
  } else if (cat.includes("gaming") || cat.includes("steam") || cat.includes("xbox") || cat.includes("playstation") || cat.includes("psn")) {
    steps = [
      "Open the gaming platform app or website.",
      "Click <strong>Sign In</strong> and enter the credentials above.",
      "If prompted for 2FA, use the code in the <strong>data</strong> field.",
      "\u26A0\uFE0F Do NOT change the password or linked email."
    ];
  } else {
    steps = [
      "Use the credentials above to log in to the service.",
      "Visit the official website or app and click <strong>Sign In / Log In</strong>.",
      "Enter the email/username and password exactly as shown.",
      "If 2FA is required, check the <strong>data</strong> field for the recovery code.",
      "\u26A0\uFE0F Do NOT change the account password, email, or phone number."
    ];
  }
  const stepsHtml = steps.map((s, i) => `<li style="padding:5px 0;font-size:13px;color:#94a3b8;">${s}</li>`).join("");
  return `<div style="margin-top:14px;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#475569;margin-bottom:8px;">How to Login</div>
    <ol style="margin:0;padding-left:20px;">${stepsHtml}</ol>
  </div>`;
}
async function sendRefundConfirmationEmail(opts) {
  const body = `
    <h1>Refund Issued \u2014 $${opts.amountUSD.toFixed(2)} Credited</h1>
    <p>Hi ${opts.name || "there"}, we have processed a refund for your order. The amount has been credited to your Bulnix wallet and is ready to use immediately.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Refund Amount</div>
      <div class="code" style="color:#22C55E;">$${opts.amountUSD.toFixed(2)} USD</div>
      <div style="text-align:center;margin-top:4px;font-size:13px;color:#94a3b8;">Credited to your Bulnix wallet</div>
    </div>
    <div style="margin:16px 0;">
      <div class="label">Order Number</div>
      <div class="value">${opts.orderNumber}</div>
      <div class="label">Reason</div>
      <div class="value">${opts.reason}</div>
      <div class="label">New Wallet Balance</div>
      <div class="value" style="color:#22C55E;font-weight:700;">$${opts.newBalanceUSD.toFixed(2)} USD</div>
    </div>
    <a href="https://bulnix.com/wallet" class="btn">View Wallet \u2192</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Your refund is available in your wallet and can be used on your next purchase. If you have any questions, please <a href="https://bulnix.com/tickets" style="color:#00B9E9;">open a support ticket</a>.</p>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping refund confirmation email");
    return;
  }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Refund of $${opts.amountUSD.toFixed(2)} credited \u2014 Order ${opts.orderNumber} | Bulnix`,
    html: baseTemplate("Refund Confirmation", body)
  });
}
async function sendWalletTopupReceiptEmail(opts) {
  const gatewayLabel = opts.gateway === "korapay" ? "Kora Pay" : opts.gateway === "flutterwave" ? "Flutterwave" : opts.gateway === "nowpayments" ? "Crypto" : opts.gateway === "paystack" ? "Paystack" : opts.gateway;
  const body = `
    <h1>Wallet Funded Successfully</h1>
    <p>Hi ${opts.name || "there"}, your Bulnix wallet has been topped up. Your funds are ready to use.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Amount Added</div>
      <div class="code" style="color:#22C55E;">$${opts.amountUSD.toFixed(2)} USD</div>
    </div>
    <div style="margin:16px 0;">
      <div class="label">Reference</div>
      <div class="value">${opts.reference}</div>
      <div class="label">Payment Method</div>
      <div class="value">${gatewayLabel}</div>
      <div class="label">New Wallet Balance</div>
      <div class="value" style="color:#22C55E;font-weight:700;">$${opts.newBalanceUSD.toFixed(2)} USD</div>
    </div>
    <a href="https://bulnix.com/wallet" class="btn">View Wallet</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Your wallet is ready to use. Browse our products and place your order. If you did not make this top-up, please <a href="https://bulnix.com/tickets" style="color:#00B9E9;">contact support</a> immediately.</p>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping wallet top-up receipt email");
    return;
  }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Wallet funded: $${opts.amountUSD.toFixed(2)} added to your Bulnix wallet`,
    html: baseTemplate("Wallet Funded", body)
  });
}
async function sendBackupEmail(opts) {
  const body = `
    <h1>&#x2705; Daily Backup Complete</h1>
    <p>Your automatic database backup ran successfully and has been stored securely in S3.</p>
    <div style="margin:16px 0;background:#0f172a;border-radius:8px;padding:16px;">
      <div style="margin-bottom:8px;"><span style="color:#94a3b8;">Date:</span> <strong style="color:#f1f5f9;">${opts.date}</strong></div>
      <div style="margin-bottom:8px;"><span style="color:#94a3b8;">Tables backed up:</span> <strong style="color:#f1f5f9;">${opts.tableCount}</strong></div>
      <div style="margin-bottom:8px;"><span style="color:#94a3b8;">Backup size:</span> <strong style="color:#f1f5f9;">${opts.sizeKb} KB</strong></div>
    </div>
    <a href="${opts.downloadUrl}" class="btn">Download Backup File</a>
    <p style="font-size:12px;color:#475569;margin-top:16px;">Backups are stored in your Bulnix S3 storage. Keep copies in a safe place for disaster recovery.</p>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping backup email");
    return;
  }
  await client.emails.send({ from: FROM, replyTo: REPLY_TO, to: opts.to, subject: `\u2705 Bulnix Daily Backup Complete \u2014 ${opts.date.slice(0, 10)}`, html: baseTemplate("Daily Backup Complete", body) });
}
async function sendBackupFailedEmail(opts) {
  const body = `
    <h1 style="color:#ef4444;">&#x274c; Daily Backup FAILED</h1>
    <p>Your automatic database backup encountered an error and did not complete. Please take action immediately.</p>
    <div style="background:#1f2937;color:#f87171;padding:12px;border-radius:6px;font-family:monospace;font-size:13px;margin:16px 0;">${opts.errorMessage}</div>
    <p>Please log in to your admin panel and trigger a manual backup, or contact Manus support.</p>
    <a href="https://help.manus.im" class="btn" style="background:#ef4444;">Contact Support</a>`;
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set \u2014 skipping backup failure email");
    return;
  }
  await client.emails.send({ from: FROM, replyTo: REPLY_TO, to: opts.to, subject: `\u274C Bulnix Daily Backup FAILED \u2014 ${opts.date}`, html: baseTemplate("Backup Failed", body) });
}
async function safeSendEmail(fn) {
  try {
    await fn();
  } catch (err) {
    console.error("[Email] Failed to send email:", err);
  }
}
var _resend, FROM_EMAIL, REPLY_TO, FROM_NAME, FROM;
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
    _resend = null;
    FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@support.bulnix.com";
    REPLY_TO = process.env.EMAIL_REPLY_TO ?? "support@bulnix.com";
    FROM_NAME = process.env.EMAIL_FROM_NAME ?? "Bulnix";
    FROM = `${FROM_NAME} <${FROM_EMAIL}>`;
  }
});

// server/_core/notification.ts
var notification_exports = {};
__export(notification_exports, {
  notifyOwner: () => notifyOwner
});
import { TRPCError } from "@trpc/server";
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "bulnixsupport@gmail.com";
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || "noreply@support.bulnix.com";
  if (!resendApiKey) {
    console.warn("[Notification] RESEND_API_KEY not set \u2014 skipping owner notification.");
    return false;
  }
  try {
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#0F3D5E;padding:16px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#00C2FF;margin:0;font-size:18px;">\u{1F514} ${title}</h2>
        </div>
        <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
          <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px;color:#333;margin:0;">${content}</pre>
          <hr style="margin:20px 0;border:none;border-top:1px solid #e0e0e0;">
          <p style="color:#888;font-size:12px;margin:0;">Bulnix Admin Notification \u2014 ${(/* @__PURE__ */ new Date()).toUTCString()}</p>
        </div>
      </div>
    `;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: `Bulnix Alerts <${emailFrom}>`,
        to: [adminEmail],
        subject: `[Bulnix Alert] ${title}`,
        html: htmlContent
      })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[Notification] Failed to send owner email (${response.status})${detail ? `: ${detail}` : ""}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error sending owner notification email:", error);
    return false;
  }
}
var TITLE_MAX_LENGTH, CONTENT_MAX_LENGTH, trimValue, isNonEmptyString, validatePayload;
var init_notification = __esm({
  "server/_core/notification.ts"() {
    "use strict";
    TITLE_MAX_LENGTH = 1200;
    CONTENT_MAX_LENGTH = 2e4;
    trimValue = (value) => value.trim();
    isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
    validatePayload = (input) => {
      if (!isNonEmptyString(input.title)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification title is required."
        });
      }
      if (!isNonEmptyString(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification content is required."
        });
      }
      const title = trimValue(input.title);
      const content = trimValue(input.content);
      if (title.length > TITLE_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
        });
      }
      if (content.length > CONTENT_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
        });
      }
      return { title, content };
    };
  }
});

// server/connectors/accszone.ts
var accszone_exports = {};
__export(accszone_exports, {
  checkSupplierOrderStatus: () => checkSupplierOrderStatus,
  placeSupplierOrder: () => placeSupplierOrder,
  syncCategories: () => syncCategories,
  syncPrices: () => syncPrices,
  syncProducts: () => syncProducts,
  syncProvider: () => syncProvider,
  syncStock: () => syncStock
});
import axios from "axios";
import { eq, and } from "drizzle-orm";
function createClient(apiKey) {
  return axios.create({
    baseURL: BASE_URL5,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    timeout: 3e4
  });
}
async function getApiKey() {
  try {
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) return null;
    const result = await db.select().from(providerConfigs).where(eq(providerConfigs.providerKey, PROVIDER_KEY)).limit(1);
    return result[0]?.apiKey ?? null;
  } catch {
    return null;
  }
}
async function syncCategories(apiKey) {
  const client = createClient(apiKey);
  let synced = 0;
  let errors = 0;
  try {
    const response = await client.get("/categories");
    const rawCategories = response.data?.data ?? response.data ?? [];
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    for (const cat of rawCategories) {
      try {
        const catName = cat.title;
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
            sortOrder: 0
          });
        }
        synced++;
      } catch (err) {
        errors++;
        await logSystem("error", "sync", `Failed to sync category ${cat.title}`, { error: String(err) });
      }
    }
  } catch (err) {
    await logSystem("error", "sync", "AccsZone category sync failed", { error: String(err) });
    throw err;
  }
  return { synced, errors };
}
async function syncProducts(apiKey, markupPercent = 20) {
  const client = createClient(apiKey);
  let synced = 0;
  let errors = 0;
  try {
    let allProducts = [];
    let page = 1;
    let lastPage = 1;
    do {
      const response = await client.get("/listings", { params: { per_page: 100, page } });
      const pageData = response.data?.data ?? [];
      allProducts = allProducts.concat(pageData);
      lastPage = response.data?.meta?.last_page ?? 1;
      page++;
    } while (page <= lastPage && page <= 20);
    const rawProducts = allProducts;
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    for (const prod of rawProducts) {
      try {
        const supplierPrice = Number(prod.price) || 0;
        const customerPrice = supplierPrice * (1 + markupPercent / 100);
        const prodName = prod.title;
        const slug = prod.slug ?? String(prodName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const stockQty = Number(prod.available_stock) || 0;
        const isUnlimited = false;
        const existingSupplier = await db.select().from(supplierProducts).where(and(eq(supplierProducts.providerKey, PROVIDER_KEY), eq(supplierProducts.supplierProductId, String(prod.id)))).limit(1);
        if (existingSupplier[0]) {
          await db.update(supplierProducts).set({
            rawTitle: prodName,
            rawPrice: supplierPrice.toFixed(2),
            rawStock: stockQty,
            rawData: prod
          }).where(eq(supplierProducts.id, existingSupplier[0].id));
        } else {
          await db.insert(supplierProducts).values({
            providerKey: PROVIDER_KEY,
            supplierProductId: String(prod.id),
            supplierCategoryId: prod.category?.id ? String(prod.category.id) : null,
            rawTitle: prodName,
            rawDescription: prod.description ?? null,
            rawPrice: supplierPrice.toFixed(2),
            rawStock: stockQty,
            rawData: prod
          });
        }
        const existingProduct = await db.select().from(products).where(and(eq(products.providerKey, PROVIDER_KEY), eq(products.supplierProductId, Number(prod.id)))).limit(1);
        let categoryId = null;
        let categoryImageUrl = null;
        if (prod.category?.id) {
          const catSlug = prod.category.slug ?? String(prod.category.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          const catRow = await db.select().from(categories).where(eq(categories.slug, catSlug)).limit(1);
          const parentCategoryId = catRow[0]?.id ?? null;
          categoryImageUrl = catRow[0]?.imageUrl ?? null;
          if (prod.subcategory?.id && parentCategoryId) {
            const subSlug = prod.subcategory.slug ?? String(prod.subcategory.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const subRow = await db.select().from(categories).where(eq(categories.slug, subSlug)).limit(1);
            if (subRow[0]) {
              categoryId = subRow[0].id;
              categoryImageUrl = subRow[0].imageUrl ?? categoryImageUrl;
            } else {
              await db.insert(categories).values({
                name: prod.subcategory.title,
                slug: subSlug,
                parentId: parentCategoryId,
                isVisible: true,
                sortOrder: 0
              });
              const newSub = await db.select().from(categories).where(eq(categories.slug, subSlug)).limit(1);
              categoryId = newSub[0]?.id ?? parentCategoryId;
            }
          } else {
            categoryId = parentCategoryId;
          }
        }
        const PLATFORM_SLUG_MAP = {
          instagram: "buy-instagram-accounts",
          facebook: "buy-facebook-accounts",
          tiktok: "buy-tiktok-accounts",
          twitter: "buy-twitter-x-accounts",
          youtube: "buy-youtube-accounts",
          linkedin: "buy-linkedin-accounts",
          snapchat: "buy-snapchat-accounts",
          telegram: "buy-telegram-accounts",
          discord: "buy-discord-accounts",
          whatsapp: "buy-whatsapp-accounts",
          gmail: "buy-gmail-accounts",
          spotify: "buy-spotify-accounts",
          netflix: "buy-netflix-accounts",
          reddit: "buy-reddit-accounts"
        };
        const titleNormalised = prodName.replace(/\bIG Accounts?\b/gi, "Instagram Accounts").replace(/\bIG\b/g, "Instagram").replace(/\bX\/Twitter\b/gi, "Twitter").replace(/\bX OLD\b/gi, "Twitter OLD").replace(/\bX Account/gi, "Twitter Account");
        const titleLower = titleNormalised.toLowerCase();
        for (const [platform, targetSlug] of Object.entries(PLATFORM_SLUG_MAP)) {
          if (titleLower.includes(platform)) {
            const resolvedCatRow = categoryId ? await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1) : [];
            const resolvedSlug = resolvedCatRow[0]?.slug ?? "";
            const resolvedParentId = resolvedCatRow[0]?.parentId ?? null;
            const targetRow = await db.select().from(categories).where(eq(categories.slug, targetSlug)).limit(1);
            const targetId = targetRow[0]?.id ?? null;
            if (targetId) {
              const alreadyCorrect = resolvedSlug === targetSlug || resolvedParentId === targetId || (resolvedCatRow[0]?.slug ?? "").includes(platform);
              if (!alreadyCorrect) {
                categoryId = targetId;
                categoryImageUrl = targetRow[0]?.imageUrl ?? categoryImageUrl;
              }
            }
            break;
          }
        }
        const resolvedImageUrl = prod.image ?? categoryImageUrl;
        if (existingProduct[0]) {
          const updateData = {
            stockQuantity: stockQty,
            stockUnlimited: isUnlimited,
            supplierPrice: supplierPrice.toFixed(2),
            customerPriceUSD: customerPrice.toFixed(2)
          };
          if (categoryId) updateData.categoryId = categoryId;
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
            categoryId,
            supplierPrice: supplierPrice.toFixed(2),
            markupPercent: markupPercent.toFixed(2),
            customerPriceUSD: customerPrice.toFixed(2),
            stockQuantity: stockQty,
            stockUnlimited: isUnlimited,
            isVisible: true,
            isFeatured: false
          });
        }
        synced++;
      } catch (err) {
        errors++;
        await logSystem("error", "sync", `Failed to sync product ${prod.title}`, { error: String(err) });
      }
    }
  } catch (err) {
    await logSystem("error", "sync", "AccsZone product sync failed", { error: String(err) });
    throw err;
  }
  return { synced, errors };
}
async function syncStock(apiKey) {
  const client = createClient(apiKey);
  let updated = 0;
  let errors = 0;
  try {
    const response = await client.get("/products/stock");
    const stockData = response.data?.data ?? response.data ?? [];
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    for (const item of stockData) {
      try {
        const stockVal = Number(item.stock) || 0;
        await db.update(products).set({
          stockQuantity: stockVal,
          stockUnlimited: false
        }).where(and(eq(products.providerKey, PROVIDER_KEY), eq(products.supplierProductId, Number(item.id))));
        updated++;
      } catch (err) {
        errors++;
      }
    }
  } catch (err) {
    await logSystem("warn", "sync", "AccsZone stock sync failed, will retry", { error: String(err) });
  }
  return { updated, errors };
}
async function syncPrices(apiKey) {
  const client = createClient(apiKey);
  let updated = 0;
  let errors = 0;
  try {
    const response = await client.get("/products/prices");
    const priceData = response.data?.data ?? response.data ?? [];
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    for (const item of priceData) {
      try {
        const existing = await db.select().from(products).where(and(eq(products.providerKey, PROVIDER_KEY), eq(products.supplierProductId, Number(item.id)))).limit(1);
        if (existing[0]) {
          const markup = Number(existing[0].markupPercent) || 20;
          const customerPrice = item.price * (1 + markup / 100);
          await db.update(products).set({
            supplierPrice: item.price.toFixed(2),
            customerPriceUSD: customerPrice.toFixed(2)
          }).where(eq(products.id, existing[0].id));
          updated++;
        }
      } catch (err) {
        errors++;
      }
    }
  } catch (err) {
    await logSystem("warn", "sync", "AccsZone price sync failed", { error: String(err) });
  }
  return { updated, errors };
}
async function placeSupplierOrder(apiKey, supplierProductId, quantity, orderId) {
  const client = createClient(apiKey);
  try {
    const response = await client.post("/purchase", {
      ad_id: Number(supplierProductId),
      quantity,
      promo_code: "young5"
      // 5% discount promo code from AccsZone
    });
    const responseData = response.data;
    const data = responseData?.data ?? responseData;
    const isSuccess = responseData?.success === true || response.status === 201 || response.status === 200;
    if (!isSuccess || data.error || responseData?.message && !responseData?.success) {
      const errMsg = data.error ?? responseData?.message ?? "Unknown error";
      await logSystem("error", "fulfillment", `AccsZone order failed for order ${orderId}`, { error: errMsg });
      return { success: false, error: errMsg };
    }
    await logSystem("info", "fulfillment", `AccsZone order placed for order ${orderId}`, {
      supplierOrderId: data.order_id,
      accountCount: Array.isArray(data.accounts) ? data.accounts.length : 0
    });
    return {
      success: true,
      supplierOrderId: String(data.order_id ?? ""),
      deliveryData: data.accounts ?? data
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logSystem("error", "fulfillment", `AccsZone order exception for order ${orderId}`, { error: message });
    return { success: false, error: message };
  }
}
async function checkSupplierOrderStatus(apiKey, supplierOrderId) {
  const client = createClient(apiKey);
  try {
    const response = await client.get(`/orders/${supplierOrderId}`);
    const responseData = response.data;
    const data = responseData?.data ?? responseData;
    return {
      status: data.status ?? (responseData?.success ? "completed" : "unknown"),
      deliveryData: data.accounts ?? data.data ?? null
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "error", error: message };
  }
}
async function syncProvider(providerKey, syncType) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    await logSystem("warn", "sync", `No API key configured for ${providerKey}`);
    return;
  }
  const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
  const db = await getDb2();
  if (!db) return;
  const syncLog = await db.select().from(providerSyncLogs).where(and(eq(providerSyncLogs.providerKey, providerKey), eq(providerSyncLogs.status, "running"))).orderBy(providerSyncLogs.startedAt).limit(1);
  const logId = syncLog[0]?.id;
  try {
    let result = { errors: 0 };
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
        completedAt: /* @__PURE__ */ new Date(),
        itemsSynced: result.synced ?? result.updated ?? 0,
        itemsFailed: result.errors
      }).where(eq(providerSyncLogs.id, logId));
    }
    await db.update(providerConfigs).set({ lastSyncAt: /* @__PURE__ */ new Date() }).where(eq(providerConfigs.providerKey, providerKey));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (logId) {
      await db.update(providerSyncLogs).set({
        status: "failed",
        completedAt: /* @__PURE__ */ new Date(),
        errorMessage: message
      }).where(eq(providerSyncLogs.id, logId));
    }
    await logSystem("error", "sync", `Sync failed for ${providerKey}`, { error: message });
  }
}
var PROVIDER_KEY, BASE_URL5;
var init_accszone = __esm({
  "server/connectors/accszone.ts"() {
    "use strict";
    init_schema();
    init_db();
    PROVIDER_KEY = "accszone";
    BASE_URL5 = "https://accszone.com/api/v1";
  }
});

// server/_core/llm.ts
var llm_exports = {};
__export(llm_exports, {
  invokeLLM: () => invokeLLM
});
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${resolveApiKey()}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}
var ensureArray, normalizeContentPart, normalizeMessage, normalizeToolChoice, resolveApiUrl, assertApiKey, resolveApiKey, normalizeResponseFormat;
var init_llm = __esm({
  "server/_core/llm.ts"() {
    "use strict";
    init_env();
    ensureArray = (value) => Array.isArray(value) ? value : [value];
    normalizeContentPart = (part) => {
      if (typeof part === "string") {
        return { type: "text", text: part };
      }
      if (part.type === "text") {
        return part;
      }
      if (part.type === "image_url") {
        return part;
      }
      if (part.type === "file_url") {
        return part;
      }
      throw new Error("Unsupported message content part");
    };
    normalizeMessage = (message) => {
      const { role, name, tool_call_id } = message;
      if (role === "tool" || role === "function") {
        const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
        return {
          role,
          name,
          tool_call_id,
          content
        };
      }
      const contentParts = ensureArray(message.content).map(normalizeContentPart);
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        return {
          role,
          name,
          content: contentParts[0].text
        };
      }
      return {
        role,
        name,
        content: contentParts
      };
    };
    normalizeToolChoice = (toolChoice, tools) => {
      if (!toolChoice) return void 0;
      if (toolChoice === "none" || toolChoice === "auto") {
        return toolChoice;
      }
      if (toolChoice === "required") {
        if (!tools || tools.length === 0) {
          throw new Error(
            "tool_choice 'required' was provided but no tools were configured"
          );
        }
        if (tools.length > 1) {
          throw new Error(
            "tool_choice 'required' needs a single tool or specify the tool name explicitly"
          );
        }
        return {
          type: "function",
          function: { name: tools[0].function.name }
        };
      }
      if ("name" in toolChoice) {
        return {
          type: "function",
          function: { name: toolChoice.name }
        };
      }
      return toolChoice;
    };
    resolveApiUrl = () => {
      if (ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0) {
        return `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`;
      }
      return "https://api.openai.com/v1/chat/completions";
    };
    assertApiKey = () => {
      const key = ENV.forgeApiKey || process.env.OPENAI_API_KEY || "";
      if (!key) {
        throw new Error("LLM API key not configured. Set OPENAI_API_KEY in environment variables.");
      }
    };
    resolveApiKey = () => ENV.forgeApiKey || process.env.OPENAI_API_KEY || "";
    normalizeResponseFormat = ({
      responseFormat,
      response_format,
      outputSchema,
      output_schema
    }) => {
      const explicitFormat = responseFormat || response_format;
      if (explicitFormat) {
        if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
          throw new Error(
            "responseFormat json_schema requires a defined schema object"
          );
        }
        return explicitFormat;
      }
      const schema = outputSchema || output_schema;
      if (!schema) return void 0;
      if (!schema.name || !schema.schema) {
        throw new Error("outputSchema requires both name and schema");
      }
      return {
        type: "json_schema",
        json_schema: {
          name: schema.name,
          schema: schema.schema,
          ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
        }
      };
    };
  }
});

// server/connectors/fadded.ts
var fadded_exports = {};
__export(fadded_exports, {
  checkSupplierOrderStatus: () => checkSupplierOrderStatus2,
  placeSupplierOrder: () => placeSupplierOrder2,
  syncCategories: () => syncCategories2,
  syncPrices: () => syncPrices2,
  syncProducts: () => syncProducts2,
  syncProvider: () => syncProvider2,
  syncStock: () => syncStock2
});
import axios2 from "axios";
import { eq as eq2, and as and2 } from "drizzle-orm";
function createClient2(apiKey) {
  return axios2.create({
    baseURL: BASE_URL6,
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    timeout: 3e4
  });
}
async function getApiKey2() {
  try {
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) return null;
    const result = await db.select().from(providerConfigs).where(eq2(providerConfigs.providerKey, PROVIDER_KEY2)).limit(1);
    return result[0]?.apiKey ?? null;
  } catch {
    return null;
  }
}
function inferCategory(productName) {
  const name = productName.toUpperCase();
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
  if (name.includes("NETFLIX") || name.includes("DISNEY") || name.includes("HULU") || name.includes("HBO") || name.includes("PRIME VIDEO")) return { name: "Netflix Accounts & Gift Cards", slug: "buy-netflix-accounts", sortOrder: 20 };
  if (name.includes("STEAM") || name.includes("GAMING") || name.includes("XBOX") || name.includes("PLAYSTATION") || name.includes("PS4") || name.includes("PS5")) return { name: "Steam Gift Cards", slug: "buy-steam-gift-cards", sortOrder: 21 };
  if (name.includes("SPOTIFY")) return { name: "Streaming", slug: "streaming", sortOrder: 22 };
  if (name.includes("APPLE MUSIC") || name.includes("APPLE TV") || name.includes("APPLE ID") || name.includes("ICLOUD") || name.includes("ITUNES")) return { name: "Apple", slug: "apple-gift-card-digital-code", sortOrder: 23 };
  if (name.includes("AMAZON") || name.includes("PRIME")) return { name: "Amazon Accounts", slug: "amazon-accounts", sortOrder: 24 };
  if (name.includes("CANVA") || name.includes("FIGMA") || name.includes("ADOBE")) return { name: "Design Tools", slug: "design-tools", sortOrder: 30 };
  if (name.includes("CHATGPT") || name.includes("OPENAI") || name.includes("DEEP SEEK") || name.includes("DEEPSEEK") || name.includes("CLAUDE") || name.includes("GEMINI")) return { name: "AI Tools", slug: "ai-tools", sortOrder: 31 };
  if (name.includes("GMAIL") || name.includes("GOOGLE VOICE") || name.includes("GOOGLE ADS")) return { name: "Google Voice Accounts", slug: "buy-google-voice-accounts", sortOrder: 32 };
  if (name.includes("MICROSOFT") || name.includes("OUTLOOK") || name.includes("OFFICE")) return { name: "Outlook Email Accounts", slug: "buy-outlook-accounts", sortOrder: 33 };
  if (name.includes("VPN") || name.includes("NORDVPN") || name.includes("EXPRESSVPN") || name.includes("HMA") || name.includes("IP VANISH") || name.includes("IPVANISH")) return { name: "VPN Premium", slug: "buy-vpn-accounts", sortOrder: 40 };
  if (name.includes("PROXY") || name.includes("SOCKS") || name.includes("SOCK 5") || name.includes("9PROXY") || name.includes("PIA SOCK")) return { name: "Mobile Proxies", slug: "buy-mobile-proxies", sortOrder: 41 };
  if (name.includes("DATING") || name.includes("TINDER") || name.includes("BUMBLE") || name.includes("GRINDR") || name.includes("HINGE")) return { name: "Dating App Accounts", slug: "buy-dating-accounts", sortOrder: 50 };
  if (name.includes("TALKATONE") || name.includes("TEXT FREE") || name.includes("TEXTPLUS") || name.includes("TEXT NOW") || name.includes("SMS") || name.includes("PHONE NUMBER")) return { name: "Phone & SMS", slug: "phone-sms", sortOrder: 60 };
  return { name: "Other Accounts", slug: "other-accounts", sortOrder: 90 };
}
function extractDeliveryFormat(description) {
  if (!description) return null;
  const stripped = description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const formatMatch = stripped.match(/(?:account\s+format\s*[|:]\s*|format\s*[|:]\s*|delivery\s+format\s*[|:]\s*)([^.\n<]+)/i);
  if (formatMatch) {
    return formatMatch[1].trim().replace(/\s*\|\s*/g, " : ");
  }
  const pipeMatch = stripped.match(/\b((?:(?:email|password|username|login|mail|2fa|cookie|number|phone|recovery|id|key|token|code)\s*[|:]\s*){2,}[a-z0-9 |:]+)/i);
  if (pipeMatch) {
    return pipeMatch[1].trim().replace(/\s*\|\s*/g, " : ").replace(/\s*:\s*/g, " : ");
  }
  return null;
}
async function generateProductDescription(productName) {
  try {
    const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
    const response = await invokeLLM2({
      messages: [
        {
          role: "system",
          content: "You are a product content writer for Bulnix, a digital accounts marketplace. Write natural, professional product descriptions without em-dashes, hyphens used as pauses, or AI-sounding phrases. Be direct and helpful. Output JSON only."
        },
        {
          role: "user",
          content: `Write a product description and how-to-use guide for: "${productName}". This is a digital product (account, subscription, or service). Return JSON with exactly two fields: "description" (2-3 sentences about what the product is and its benefits) and "howToUse" (3-5 numbered steps explaining how to use it after purchase, starting from receiving the credentials).`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_content",
          strict: true,
          schema: {
            type: "object",
            properties: {
              description: { type: "string" },
              howToUse: { type: "string" }
            },
            required: ["description", "howToUse"],
            additionalProperties: false
          }
        }
      }
    });
    const raw = response.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      description: parsed.description?.trim() || null,
      howToUse: parsed.howToUse?.trim() || null
    };
  } catch (err) {
    console.warn("[Fadded] generateProductDescription failed for:", productName, err);
    return null;
  }
}
async function syncCategories2(apiKey) {
  const client = createClient2(apiKey);
  let synced = 0;
  let errors = 0;
  try {
    const response = await client.get("/products");
    const rawProducts = response.data?.data ?? [];
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    const seen = /* @__PURE__ */ new Set();
    for (const prod of rawProducts) {
      const cat = inferCategory(prod.name);
      if (seen.has(cat.slug)) continue;
      seen.add(cat.slug);
      try {
        const existing = await db.select().from(categories).where(eq2(categories.slug, cat.slug)).limit(1);
        if (!existing[0]) {
          await db.insert(categories).values({
            name: cat.name,
            slug: cat.slug,
            description: null,
            imageUrl: null,
            parentId: null,
            isVisible: true,
            sortOrder: cat.sortOrder
          });
          synced++;
        } else {
          if (existing[0].sortOrder > cat.sortOrder) {
            await db.update(categories).set({ sortOrder: cat.sortOrder }).where(eq2(categories.id, existing[0].id));
          }
        }
      } catch (err) {
        errors++;
        await logSystem("error", "sync", `Failed to sync Fadded category ${cat.name}`, { error: String(err) });
      }
    }
  } catch (err) {
    await logSystem("error", "sync", "Fadded category sync failed", { error: String(err) });
    throw err;
  }
  return { synced, errors };
}
async function syncProducts2(apiKey, markupPercent = 20, ngnToUsd = DEFAULT_NGN_TO_USD) {
  const client = createClient2(apiKey);
  let synced = 0;
  let errors = 0;
  try {
    const response = await client.get("/products");
    const rawProducts = response.data?.data ?? [];
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    for (const prod of rawProducts) {
      try {
        const supplierPriceNGN = Number(prod.unit_price) || 0;
        const supplierPriceUSD = supplierPriceNGN / ngnToUsd;
        const customerPriceUSD = supplierPriceUSD * (1 + markupPercent / 100);
        const prodName = prod.name;
        const slug = prodName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const stockQty = Number(prod.in_stock) || 0;
        const cat = inferCategory(prodName);
        const deliveryFormat = extractDeliveryFormat(prod.description);
        const existingSupplier = await db.select().from(supplierProducts).where(and2(eq2(supplierProducts.providerKey, PROVIDER_KEY2), eq2(supplierProducts.supplierProductId, String(prod.product_id)))).limit(1);
        if (existingSupplier[0]) {
          await db.update(supplierProducts).set({
            rawTitle: prodName,
            rawPrice: supplierPriceUSD.toFixed(4),
            rawStock: stockQty,
            rawData: prod
          }).where(eq2(supplierProducts.id, existingSupplier[0].id));
        } else {
          await db.insert(supplierProducts).values({
            providerKey: PROVIDER_KEY2,
            supplierProductId: String(prod.product_id),
            supplierCategoryId: cat.slug,
            rawTitle: prodName,
            rawDescription: prod.description ?? null,
            rawPrice: supplierPriceUSD.toFixed(4),
            rawStock: stockQty,
            rawData: prod
          });
        }
        const catRow = await db.select().from(categories).where(eq2(categories.slug, cat.slug)).limit(1);
        let categoryId = catRow[0]?.id ?? null;
        let categoryImageUrl = catRow[0]?.imageUrl ?? null;
        if (!categoryId) {
          await db.insert(categories).values({
            name: cat.name,
            slug: cat.slug,
            isVisible: true,
            sortOrder: cat.sortOrder
          });
          const newCat = await db.select().from(categories).where(eq2(categories.slug, cat.slug)).limit(1);
          categoryId = newCat[0]?.id ?? null;
          categoryImageUrl = newCat[0]?.imageUrl ?? null;
        }
        const existingProduct = await db.select().from(products).where(and2(eq2(products.providerKey, PROVIDER_KEY2), eq2(products.supplierProductId, prod.product_id))).limit(1);
        if (existingProduct[0]) {
          const updateData = {
            stockQuantity: stockQty,
            stockUnlimited: false,
            supplierPrice: supplierPriceUSD.toFixed(4),
            customerPriceUSD: customerPriceUSD.toFixed(4)
          };
          if (categoryId) updateData.categoryId = categoryId;
          if (!existingProduct[0].imageUrl && categoryImageUrl) {
            updateData.imageUrl = categoryImageUrl;
          }
          if (deliveryFormat && !existingProduct[0].deliveryFormat) {
            updateData.deliveryFormat = deliveryFormat;
          }
          if (!existingProduct[0].description) {
            const supplierDesc = prod.description ?? null;
            if (supplierDesc) {
              updateData.description = supplierDesc;
            } else {
              const generated = await generateProductDescription(prodName);
              if (generated) {
                updateData.description = generated.description;
                if (!existingProduct[0].deliveryNote) {
                  updateData.deliveryNote = generated.howToUse;
                }
              }
            }
          }
          await db.update(products).set(updateData).where(eq2(products.id, existingProduct[0].id));
        } else {
          let finalDescription = prod.description ?? null;
          let deliveryNote = null;
          if (!finalDescription) {
            const generated = await generateProductDescription(prodName);
            if (generated) {
              finalDescription = generated.description;
              deliveryNote = generated.howToUse;
            }
          }
          await db.insert(products).values({
            providerKey: PROVIDER_KEY2,
            supplierProductId: prod.product_id,
            title: prodName,
            slug: `${slug}-fadded-${prod.product_id}`,
            description: finalDescription,
            imageUrl: categoryImageUrl,
            categoryId,
            supplierPrice: supplierPriceUSD.toFixed(4),
            markupPercent: markupPercent.toFixed(2),
            customerPriceUSD: customerPriceUSD.toFixed(4),
            stockQuantity: stockQty,
            stockUnlimited: false,
            isVisible: stockQty > 0,
            // Only show in-stock products by default
            isFeatured: false,
            deliveryFormat: deliveryFormat ?? null,
            deliveryNote
          });
        }
        synced++;
      } catch (err) {
        errors++;
        await logSystem("error", "sync", `Failed to sync Fadded product ${prod.name}`, { error: String(err) });
      }
    }
  } catch (err) {
    await logSystem("error", "sync", "Fadded product sync failed", { error: String(err) });
    throw err;
  }
  return { synced, errors };
}
async function syncStock2(apiKey) {
  const client = createClient2(apiKey);
  let updated = 0;
  let errors = 0;
  try {
    const response = await client.get("/products");
    const rawProducts = response.data?.data ?? [];
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    for (const prod of rawProducts) {
      try {
        const stockQty = Number(prod.in_stock) || 0;
        await db.update(products).set({
          stockQuantity: stockQty,
          stockUnlimited: false,
          // Auto-hide out-of-stock products, auto-show when back in stock
          isVisible: stockQty > 0
        }).where(and2(eq2(products.providerKey, PROVIDER_KEY2), eq2(products.supplierProductId, prod.product_id)));
        updated++;
      } catch (err) {
        errors++;
      }
    }
  } catch (err) {
    await logSystem("warn", "sync", "Fadded stock sync failed, will retry", { error: String(err) });
  }
  return { updated, errors };
}
async function syncPrices2(apiKey, ngnToUsd = DEFAULT_NGN_TO_USD) {
  const client = createClient2(apiKey);
  let updated = 0;
  let errors = 0;
  try {
    const response = await client.get("/products");
    const rawProducts = response.data?.data ?? [];
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const db = await getDb2();
    if (!db) throw new Error("Database not available");
    for (const prod of rawProducts) {
      try {
        const existing = await db.select().from(products).where(and2(eq2(products.providerKey, PROVIDER_KEY2), eq2(products.supplierProductId, prod.product_id))).limit(1);
        if (existing[0]) {
          const supplierPriceUSD = Number(prod.unit_price) / ngnToUsd;
          const markup = Number(existing[0].markupPercent) || 20;
          const customerPrice = supplierPriceUSD * (1 + markup / 100);
          await db.update(products).set({
            supplierPrice: supplierPriceUSD.toFixed(4),
            customerPriceUSD: customerPrice.toFixed(4)
          }).where(eq2(products.id, existing[0].id));
          updated++;
        }
      } catch (err) {
        errors++;
      }
    }
  } catch (err) {
    await logSystem("warn", "sync", "Fadded price sync failed", { error: String(err) });
  }
  return { updated, errors };
}
async function placeSupplierOrder2(apiKey, supplierProductId, quantity, orderId) {
  const client = createClient2(apiKey);
  try {
    const response = await client.post("/order", {
      product_key: `prod_${supplierProductId}`,
      quantity,
      external_order_id: `BULNIX-${orderId}`,
      customer_info: { order_id: orderId }
    });
    const responseData = response.data;
    if (!responseData.success) {
      const errMsg = responseData.message ?? responseData.code ?? "Unknown error from Fadded";
      await logSystem("error", "fulfillment", `Fadded order failed for order ${orderId}`, { error: errMsg, code: responseData.code });
      return { success: false, error: errMsg };
    }
    const orderData = responseData.data;
    await logSystem("info", "fulfillment", `Fadded order placed for order ${orderId}`, {
      supplierOrderId: `fadded-${orderId}`,
      itemCount: orderData.items?.length ?? 0
    });
    const deliveryData = (orderData.items ?? []).map((item) => ({
      product_detail_id: item.product_detail_id,
      details: item.details,
      // Parse the pipe-separated details into structured fields
      ...parseItemDetails(item.details)
    }));
    return {
      success: true,
      supplierOrderId: `fadded-${orderId}`,
      deliveryData
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logSystem("error", "fulfillment", `Fadded order exception for order ${orderId}`, { error: message });
    return { success: false, error: message };
  }
}
function parseItemDetails(details) {
  const result = {};
  if (!details) return result;
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
  result["details"] = details;
  return result;
}
async function checkSupplierOrderStatus2(_apiKey, supplierOrderId) {
  if (supplierOrderId && supplierOrderId.startsWith("fadded-")) {
    return { status: "completed" };
  }
  return { status: "unknown" };
}
async function syncProvider2(providerKey, syncType) {
  const apiKey = await getApiKey2();
  if (!apiKey) {
    await logSystem("warn", "sync", `No API key configured for ${providerKey}`);
    return;
  }
  const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
  const db = await getDb2();
  if (!db) return;
  const syncLog = await db.select().from(providerSyncLogs).where(and2(eq2(providerSyncLogs.providerKey, providerKey), eq2(providerSyncLogs.status, "running"))).orderBy(providerSyncLogs.startedAt).limit(1);
  const logId = syncLog[0]?.id;
  try {
    let result = { errors: 0 };
    if (syncType === "categories" || syncType === "full") {
      const catResult = await syncCategories2(apiKey);
      result = catResult;
      await logSystem("info", "sync", `Fadded categories synced: ${catResult.synced} ok, ${catResult.errors} errors`);
    }
    if (syncType === "products" || syncType === "full") {
      const config = await db.select().from(providerConfigs).where(eq2(providerConfigs.providerKey, providerKey)).limit(1);
      const markup = Number(config[0]?.defaultMarkupPercent ?? 20);
      const prodResult = await syncProducts2(apiKey, markup);
      result = prodResult;
      await logSystem("info", "sync", `Fadded products synced: ${prodResult.synced} ok, ${prodResult.errors} errors`);
    }
    if (syncType === "stock") {
      const stockResult = await syncStock2(apiKey);
      result = stockResult;
      await logSystem("info", "sync", `Fadded stock updated: ${stockResult.updated} ok, ${stockResult.errors} errors`);
    }
    if (syncType === "prices") {
      const priceResult = await syncPrices2(apiKey);
      result = priceResult;
      await logSystem("info", "sync", `Fadded prices updated: ${priceResult.updated} ok, ${priceResult.errors} errors`);
    }
    if (logId) {
      await db.update(providerSyncLogs).set({
        status: "success",
        completedAt: /* @__PURE__ */ new Date(),
        itemsSynced: result.synced ?? result.updated ?? 0,
        itemsFailed: result.errors
      }).where(eq2(providerSyncLogs.id, logId));
    }
    await db.update(providerConfigs).set({ lastSyncAt: /* @__PURE__ */ new Date() }).where(eq2(providerConfigs.providerKey, providerKey));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (logId) {
      await db.update(providerSyncLogs).set({
        status: "failed",
        completedAt: /* @__PURE__ */ new Date(),
        errorMessage: message
      }).where(eq2(providerSyncLogs.id, logId));
    }
    await logSystem("error", "sync", `Fadded sync failed for ${providerKey}`, { error: message });
  }
}
var PROVIDER_KEY2, BASE_URL6, DEFAULT_NGN_TO_USD;
var init_fadded = __esm({
  "server/connectors/fadded.ts"() {
    "use strict";
    init_schema();
    init_db();
    PROVIDER_KEY2 = "fadded";
    BASE_URL6 = "https://www.fadded.net/api/v1/reseller";
    DEFAULT_NGN_TO_USD = 1600;
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addProductCredentials: () => addProductCredentials,
  adminApproveApiKey: () => adminApproveApiKey,
  adminCreateManualProduct: () => adminCreateManualProduct,
  adminCreateProduct: () => adminCreateProduct,
  adminDeleteManualProduct: () => adminDeleteManualProduct,
  adminDeliverSubscription: () => adminDeliverSubscription,
  adminGetAffiliateWithdrawals: () => adminGetAffiliateWithdrawals,
  adminGetApiKeys: () => adminGetApiKeys,
  adminGetOrderDetail: () => adminGetOrderDetail,
  adminGetOrders: () => adminGetOrders,
  adminGetProducts: () => adminGetProducts,
  adminGetTickets: () => adminGetTickets,
  adminGetUserDetail: () => adminGetUserDetail,
  adminGetUsers: () => adminGetUsers,
  adminOrderManualRefund: () => adminOrderManualRefund,
  adminProcessRefund: () => adminProcessRefund,
  adminProcessWithdrawal: () => adminProcessWithdrawal,
  adminReactivateUser: () => adminReactivateUser,
  adminRejectApiKey: () => adminRejectApiKey,
  adminReplyToTicket: () => adminReplyToTicket,
  adminRetryFulfillment: () => adminRetryFulfillment,
  adminSuspendUser: () => adminSuspendUser,
  adminToggleApiKey: () => adminToggleApiKey,
  adminTopUpUserWallet: () => adminTopUpUserWallet,
  adminUpdateManualProduct: () => adminUpdateManualProduct,
  adminUpdateOrder: () => adminUpdateOrder,
  adminUpdateProduct: () => adminUpdateProduct,
  applyMarkupToAllProducts: () => applyMarkupToAllProducts,
  autoFulfillOrder: () => autoFulfillOrder,
  claimManualCredential: () => claimManualCredential,
  claimTelegramBonus: () => claimTelegramBonus,
  clearRawKeyOnce: () => clearRawKeyOnce,
  confirmWalletTopup: () => confirmWalletTopup,
  convertAffiliateToWallet: () => convertAffiliateToWallet,
  createCategory: () => createCategory,
  createNotification: () => createNotification,
  createOrder: () => createOrder,
  createSupplierRefundClaim: () => createSupplierRefundClaim,
  createTicket: () => createTicket,
  creditAffiliateSignupBonus: () => creditAffiliateSignupBonus,
  creditWallet: () => creditWallet,
  deleteApiKey: () => deleteApiKey,
  deleteCategory: () => deleteCategory,
  deleteProductCredential: () => deleteProductCredential,
  earnRewardPoints: () => earnRewardPoints,
  fetchAndCacheExchangeRates: () => fetchAndCacheExchangeRates,
  fulfillOrderByReference: () => fulfillOrderByReference,
  generateApiKey: () => generateApiKey,
  generateFaddedDescriptions: () => generateFaddedDescriptions,
  getAccsZoneBalance: () => getAccsZoneBalance,
  getAdminStats: () => getAdminStats,
  getAffiliateTransactions: () => getAffiliateTransactions,
  getAllCategories: () => getAllCategories,
  getCategories: () => getCategories,
  getCategoriesWithCounts: () => getCategoriesWithCounts,
  getCategoryBySlug: () => getCategoryBySlug,
  getDb: () => getDb,
  getExchangeRates: () => getExchangeRates,
  getFaddedBalance: () => getFaddedBalance,
  getFeaturedProducts: () => getFeaturedProducts,
  getOrCreateAffiliateBalance: () => getOrCreateAffiliateBalance,
  getOrCreateWallet: () => getOrCreateWallet,
  getOrderDelivery: () => getOrderDelivery,
  getPaymentStatus: () => getPaymentStatus,
  getProductById: () => getProductById,
  getProductBySlug: () => getProductBySlug,
  getProductCredentials: () => getProductCredentials,
  getProducts: () => getProducts,
  getProviderConfigs: () => getProviderConfigs,
  getProviderSyncLogs: () => getProviderSyncLogs,
  getRewardSettings: () => getRewardSettings,
  getRewardTransactions: () => getRewardTransactions,
  getSavedProducts: () => getSavedProducts,
  getSubcategoriesByParentId: () => getSubcategoriesByParentId,
  getSupplierRefundClaim: () => getSupplierRefundClaim,
  getSystemLogs: () => getSystemLogs,
  getTicketById: () => getTicketById,
  getUserApiKeys: () => getUserApiKeys,
  getUserByOpenId: () => getUserByOpenId,
  getUserNotifications: () => getUserNotifications,
  getUserOrderById: () => getUserOrderById,
  getUserOrders: () => getUserOrders,
  getUserRewardPoints: () => getUserRewardPoints,
  getUserTickets: () => getUserTickets,
  getWalletTransactions: () => getWalletTransactions,
  initiatePayment: () => initiatePayment,
  initiateWalletTopup: () => initiateWalletTopup,
  invalidateCache: () => invalidateCache,
  listSupplierRefundClaims: () => listSupplierRefundClaims,
  logSystem: () => logSystem,
  markNotificationRead: () => markNotificationRead,
  payOrderWithWallet: () => payOrderWithWallet,
  redeemPointsToWallet: () => redeemPointsToWallet,
  replyToTicket: () => replyToTicket,
  requestAffiliateWithdrawal: () => requestAffiliateWithdrawal,
  requestApiKey: () => requestApiKey,
  resetDbPool: () => resetDbPool,
  retryAllProcessingOrders: () => retryAllProcessingOrders,
  submitSupplierRefundClaim: () => submitSupplierRefundClaim,
  toggleApiKey: () => toggleApiKey,
  toggleSavedProduct: () => toggleSavedProduct,
  triggerProviderSync: () => triggerProviderSync,
  updateCategory: () => updateCategory,
  updateExchangeRate: () => updateExchangeRate,
  updateProviderConfig: () => updateProviderConfig,
  updateRewardSetting: () => updateRewardSetting,
  updateSupplierRefundClaim: () => updateSupplierRefundClaim,
  updateUserProfile: () => updateUserProfile,
  upsertUser: () => upsertUser,
  validateApiKey: () => validateApiKey,
  validateCoupon: () => validateCoupon
});
import { and as and3, asc, desc, eq as eq3, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";
import { nanoid } from "nanoid";
import { createHash, randomBytes } from "crypto";
function getPool() {
  const hasDbConfig = !!(process.env.DATABASE_URL || process.env.DB_HOST);
  if (!_pool && hasDbConfig) {
    let host, port, user, password, database;
    if (process.env.DB_HOST) {
      host = process.env.DB_HOST;
      port = parseInt(process.env.DB_PORT || "3306");
      user = process.env.DB_USER || "";
      password = process.env.DB_PASS || "";
      database = process.env.DB_NAME || "";
    } else {
      const dbUrl = new URL(process.env.DATABASE_URL);
      host = dbUrl.hostname;
      port = parseInt(dbUrl.port || "3306");
      user = decodeURIComponent(dbUrl.username);
      password = decodeURIComponent(dbUrl.password);
      database = dbUrl.pathname.replace(/^\//, "");
    }
    const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
    const useSSL = !isLocalhost && process.env.DB_SSL !== "false";
    _pool = createPool({
      host,
      port,
      user,
      password,
      database,
      ...useSSL ? { ssl: { rejectUnauthorized: false } } : {},
      connectionLimit: 15,
      waitForConnections: true,
      queueLimit: 100,
      enableKeepAlive: true,
      keepAliveInitialDelay: 3e4,
      connectTimeout: 3e4,
      idleTimeout: 6e4
    });
  }
  return _pool;
}
async function getDb() {
  const hasDbConfig = !!(process.env.DATABASE_URL || process.env.DB_HOST);
  if (!_db && hasDbConfig) {
    try {
      const pool = getPool();
      if (!pool) {
        console.error("[Database] Pool is null - check DB_HOST/DATABASE_URL env vars");
        return null;
      }
      _db = drizzle(pool);
      console.log("[Database] Connected to", process.env.DB_HOST || "(via DATABASE_URL)");
    } catch (error) {
      console.error("[Database] Failed to initialize:", error);
      _db = null;
    }
  } else if (!hasDbConfig) {
    console.error("[Database] No DB config found. Set DATABASE_URL or DB_HOST env var.");
  }
  return _db;
}
function resetDbPool() {
  if (_pool) {
    try {
      _pool.end?.();
    } catch {
    }
    _pool = null;
  }
  _db = null;
}
function cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}
function cacheSet(key, data, ttlMs) {
  _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
function invalidateCache(prefix) {
  if (!prefix) {
    _cache.clear();
    return;
  }
  for (const key of Array.from(_cache.keys())) {
    if (key.startsWith(prefix)) _cache.delete(key);
  }
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const buildPayload = () => {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (user.signupIp !== void 0) {
      values.signupIp = user.signupIp;
    }
    if (user.signupCountry !== void 0) {
      values.signupCountry = user.signupCountry;
    }
    if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    return { values, updateSet };
  };
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { values, updateSet } = buildPayload();
      await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
      return;
    } catch (error) {
      if (attempt < MAX_RETRIES && isRetryableDbError(error)) {
        const delay = attempt * 1500;
        console.warn(`[Database] upsertUser transient error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
      }
    }
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await withDbRetry(
    () => db.select().from(users).where(eq3(users.openId, openId)).limit(1),
    "getUserByOpenId"
  );
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserProfile(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (data.name !== void 0) updateData.name = data.name;
  if (data.country !== void 0) updateData.country = data.country;
  if (data.preferredCurrency !== void 0) updateData.preferredCurrency = data.preferredCurrency;
  if (data.notifyEmail !== void 0) updateData.notifyEmail = data.notifyEmail;
  if (data.notifyOrders !== void 0) updateData.notifyOrders = data.notifyOrders;
  if (Object.keys(updateData).length === 0) return { success: true };
  await db.update(users).set(updateData).where(eq3(users.id, userId));
  return { success: true };
}
async function getCategories() {
  const cached = cacheGet("categories:visible");
  if (cached) return cached;
  const db = await getDb();
  if (!db) return [];
  const result = await withDbRetry(
    () => db.select().from(categories).where(eq3(categories.isVisible, true)).orderBy(categories.sortOrder, categories.name),
    "getCategories"
  );
  cacheSet("categories:visible", result, CACHE_TTL_CATEGORIES);
  return result;
}
async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db.select().from(categories).orderBy(categories.sortOrder, categories.name),
    "getAllCategories"
  );
}
async function getCategoriesWithCounts() {
  const cached = cacheGet("categories:withCounts");
  if (cached) return cached;
  const db = await getDb();
  if (!db) return [];
  const cats = await withDbRetry(
    () => db.select().from(categories).where(eq3(categories.isVisible, true)).orderBy(categories.sortOrder, categories.name),
    "getCategoriesWithCounts:cats"
  );
  const counts = await withDbRetry(
    () => db.select({ categoryId: products.categoryId, count: sql`count(*)` }).from(products).where(eq3(products.isVisible, true)).groupBy(products.categoryId),
    "getCategoriesWithCounts:counts"
  );
  const countMap = /* @__PURE__ */ new Map();
  for (const row of counts) {
    if (row.categoryId != null) countMap.set(row.categoryId, Number(row.count));
  }
  const result = cats.map((cat) => {
    const directCount = countMap.get(cat.id) ?? 0;
    const childCount = cats.filter((c) => c.parentId === cat.id).reduce((sum, c) => sum + (countMap.get(c.id) ?? 0), 0);
    return { ...cat, productCount: directCount + childCount };
  });
  cacheSet("categories:withCounts", result, CACHE_TTL_CATEGORIES);
  return result;
}
async function getSubcategoriesByParentId(parentId) {
  const db = await getDb();
  if (!db) return [];
  const subs = await withDbRetry(
    () => db.select().from(categories).where(and3(eq3(categories.parentId, parentId), eq3(categories.isVisible, true))).orderBy(categories.sortOrder, categories.name),
    "getSubcategoriesByParentId:subs"
  );
  if (subs.length === 0) return [];
  const subIds = subs.map((s) => s.id);
  const counts = await withDbRetry(
    () => db.select({ categoryId: products.categoryId, count: sql`count(*)` }).from(products).where(and3(eq3(products.isVisible, true), inArray(products.categoryId, subIds))).groupBy(products.categoryId),
    "getSubcategoriesByParentId:counts"
  );
  const countMap = /* @__PURE__ */ new Map();
  for (const row of counts) {
    if (row.categoryId != null) countMap.set(row.categoryId, Number(row.count));
  }
  return subs.map((s) => ({ ...s, productCount: countMap.get(s.id) ?? 0 }));
}
async function getCategoryBySlug(slug) {
  const db = await getDb();
  if (!db) return null;
  const result = await withDbRetry(
    () => db.select().from(categories).where(eq3(categories.slug, slug)).limit(1),
    "getCategoryBySlug"
  );
  return result[0] ?? null;
}
async function createCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(categories).values({ name: data.name, slug: data.slug, description: data.description ?? null, parentId: data.parentId ?? null });
  return { success: true };
}
async function updateCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (data.name !== void 0) updateData.name = data.name;
  if (data.slug !== void 0) updateData.slug = data.slug;
  if (data.description !== void 0) updateData.description = data.description;
  if (data.imageUrl !== void 0) updateData.imageUrl = data.imageUrl;
  if (data.parentId !== void 0) updateData.parentId = data.parentId;
  if (data.isVisible !== void 0) updateData.isVisible = data.isVisible;
  if (data.sortOrder !== void 0) updateData.sortOrder = data.sortOrder;
  if (Object.keys(updateData).length > 0) {
    await db.update(categories).set(updateData).where(eq3(categories.id, data.id));
  }
  return { success: true };
}
async function deleteCategory(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ categoryId: null }).where(eq3(products.categoryId, id));
  await db.delete(categories).where(eq3(categories.id, id));
  return { success: true };
}
async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db.select().from(products).where(and3(eq3(products.isVisible, true), eq3(products.isFeatured, true))).orderBy(desc(products.updatedAt)).limit(8),
    "getFeaturedProducts"
  );
}
async function getProducts(input) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq3(products.isVisible, true)];
  if (input.categoryId) conditions.push(eq3(products.categoryId, input.categoryId));
  if (input.featured) conditions.push(eq3(products.isFeatured, true));
  if (input.search) {
    const searchTerm = `%${input.search}%`;
    const matchingCats = await withDbRetry(
      () => db.select({ id: categories.id }).from(categories).where(like(categories.name, searchTerm)),
      "getProducts:searchCats"
    );
    const matchingCatIds = matchingCats.map((c) => c.id);
    if (matchingCatIds.length > 0) {
      conditions.push(or(like(products.title, searchTerm), inArray(products.categoryId, matchingCatIds)));
    } else {
      conditions.push(like(products.title, searchTerm));
    }
  }
  const offset = (input.page - 1) * input.limit;
  let orderByClause;
  if (input.sort === "price_asc") orderByClause = asc(products.customerPriceUSD);
  else if (input.sort === "price_desc") orderByClause = desc(products.customerPriceUSD);
  else if (input.sort === "popular") orderByClause = desc(products.stockQuantity);
  else orderByClause = desc(products.updatedAt);
  if (input.categorySlug && !input.categoryId) {
    const cat = await getCategoryBySlug(input.categorySlug);
    if (cat) {
      const subcats = await db.select({ id: categories.id }).from(categories).where(eq3(categories.parentId, cat.id));
      const allCategoryIds = [cat.id, ...subcats.map((s) => s.id)];
      if (allCategoryIds.length === 1) {
        conditions.push(eq3(products.categoryId, allCategoryIds[0]));
      } else {
        conditions.push(inArray(products.categoryId, allCategoryIds));
      }
    }
  }
  const items = await withDbRetry(
    () => db.select().from(products).where(and3(...conditions)).orderBy(orderByClause).limit(input.limit).offset(offset),
    "getProducts:items"
  );
  const countResult = await withDbRetry(
    () => db.select({ count: sql`count(*)` }).from(products).where(and3(...conditions)),
    "getProducts:count"
  );
  const total = Number(countResult[0]?.count ?? 0);
  return { items, total, page: input.page, limit: input.limit };
}
async function getProductBySlug(slug) {
  const db = await getDb();
  if (!db) return null;
  const result = await withDbRetry(
    () => db.select().from(products).where(and3(eq3(products.slug, slug), eq3(products.isVisible, true))).limit(1),
    "getProductBySlug"
  );
  return result[0] ?? null;
}
async function getProductById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await withDbRetry(
    () => db.select().from(products).where(eq3(products.id, id)).limit(1),
    "getProductById"
  );
  return result[0] ?? null;
}
async function validateCoupon(code, subtotalUSD) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(coupons).where(and3(eq3(coupons.code, code.toUpperCase()), eq3(coupons.isActive, true))).limit(1);
  const coupon = result[0];
  if (!coupon) return { valid: false, message: "Invalid coupon code" };
  if (coupon.expiresAt && coupon.expiresAt < /* @__PURE__ */ new Date()) return { valid: false, message: "Coupon has expired" };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, message: "Coupon usage limit reached" };
  if (coupon.minOrderUSD && subtotalUSD < Number(coupon.minOrderUSD)) return { valid: false, message: `Minimum order of $${coupon.minOrderUSD} required` };
  const discount = coupon.discountType === "percent" ? subtotalUSD * Number(coupon.discountValue) / 100 : Number(coupon.discountValue);
  return { valid: true, discount: Math.min(discount, subtotalUSD), coupon };
}
async function createOrder(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
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
  let discountUSD = 0;
  let couponDiscountUSD = 0;
  if (input.couponCode) {
    const couponResult = await validateCoupon(input.couponCode, subtotalUSD);
    if (couponResult.valid) {
      couponDiscountUSD = couponResult.discount ?? 0;
      discountUSD = couponDiscountUSD;
    }
  }
  const rates = await getExchangeRates();
  const rate = rates.find((r) => r.fromCurrency === "USD" && r.toCurrency === input.currency);
  const exchangeRate = rate ? Number(rate.rate) : 1;
  const totalUSD = subtotalUSD - discountUSD;
  const totalInCurrency = totalUSD * exchangeRate;
  const orderNumber = `BLX-${Date.now()}-${nanoid(6).toUpperCase()}`;
  await withDbRetry(() => db.insert(orders).values({
    orderNumber,
    userId,
    status: "pending_payment",
    subtotalUSD: subtotalUSD.toFixed(2),
    discountUSD: discountUSD.toFixed(2),
    totalUSD: totalUSD.toFixed(2),
    currency: input.currency,
    totalInCurrency: totalInCurrency.toFixed(2),
    exchangeRateSnapshot: exchangeRate.toFixed(6),
    couponCode: input.couponCode ?? null,
    couponDiscountUSD: couponDiscountUSD.toFixed(2),
    billingEmail: input.billingEmail ?? null,
    billingCountry: input.billingCountry ?? null
  }), "createOrder:insertOrder");
  const newOrder = await db.select().from(orders).where(eq3(orders.orderNumber, orderNumber)).limit(1);
  const orderId = newOrder[0].id;
  for (const item of itemsWithProducts) {
    await withDbRetry(() => db.insert(orderItems).values({
      orderId,
      productId: item.productId,
      productTitle: item.product.title,
      quantity: item.quantity,
      unitPriceUSD: item.unitPrice.toFixed(2),
      totalPriceUSD: (item.unitPrice * item.quantity).toFixed(2),
      supplierProductId: item.product.supplierProductId?.toString() ?? null,
      providerKey: item.product.providerKey
    }), "createOrder:insertItem");
  }
  await logSystem("info", "order", `Order ${orderNumber} created for user ${userId}`, { orderId, totalUSD });
  const orderUser = await db.select({ email: users.email, name: users.name, notifyOrders: users.notifyOrders }).from(users).where(eq3(users.id, userId)).limit(1);
  const recipientEmail = orderUser[0]?.email ?? input.billingEmail ?? null;
  if (recipientEmail && orderUser[0]?.notifyOrders !== false) {
    safeSendEmail(() => sendOrderConfirmationEmail({
      to: recipientEmail,
      name: orderUser[0]?.name ?? "there",
      orderNumber,
      orderId,
      items: itemsWithProducts.map((i) => ({ title: i.product.title, quantity: i.quantity, priceUSD: i.unitPrice })),
      totalUSD,
      currency: input.currency,
      status: "pending_payment"
    }));
  }
  return { orderId, orderNumber, totalUSD, totalInCurrency, currency: input.currency };
}
async function getUserOrders(userId, input) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq3(orders.userId, userId)];
  if (input.status) conditions.push(eq3(orders.status, input.status));
  const offset = (input.page - 1) * input.limit;
  const items = await db.select().from(orders).where(and3(...conditions)).orderBy(desc(orders.createdAt)).limit(input.limit).offset(offset);
  const countResult = await db.select({ count: sql`count(*)` }).from(orders).where(and3(...conditions));
  return { items, total: Number(countResult[0]?.count ?? 0) };
}
async function getUserOrderById(userId, orderId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(and3(eq3(orders.id, orderId), eq3(orders.userId, userId))).limit(1);
  if (!result[0]) return null;
  const items = await db.select().from(orderItems).where(eq3(orderItems.orderId, orderId));
  const isSubscriptionOrder = items.length > 0 && items.every((item) => item.providerKey === "manual" && !item.supplierProductId);
  return { ...result[0], items, isSubscriptionOrder };
}
async function getOrderDelivery(userId, orderId) {
  const db = await getDb();
  if (!db) return null;
  const order = await db.select().from(orders).where(and3(eq3(orders.id, orderId), eq3(orders.userId, userId))).limit(1);
  if (!order[0]) return null;
  const records = await db.select().from(fulfillmentRecords).where(eq3(fulfillmentRecords.orderId, orderId));
  await db.update(fulfillmentRecords).set({ userViewed: true }).where(eq3(fulfillmentRecords.orderId, orderId));
  return records;
}
async function initiatePayment(userId, input, origin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const order = await db.select().from(orders).where(and3(eq3(orders.id, input.orderId), eq3(orders.userId, userId))).limit(1);
  if (!order[0]) throw new Error("Order not found");
  if (order[0].status !== "pending_payment") throw new Error("Order is not in pending payment state");
  const gatewayRef = `BLX-PAY-${nanoid(16).toUpperCase()}`;
  const rates = await getExchangeRates();
  const rate = rates.find((r) => r.fromCurrency === "USD" && r.toCurrency === input.currency);
  const exchangeRate = rate ? Number(rate.rate) : 1;
  const amount = Number(order[0].totalUSD) * exchangeRate;
  const [orderUser] = await db.select({ email: users.email, name: users.name }).from(users).where(eq3(users.id, userId)).limit(1);
  const userEmail = orderUser?.email ?? `user${userId}@bulnix.com`;
  const userName = orderUser?.name ?? "Bulnix Customer";
  const siteOrigin = origin ?? (process.env.NODE_ENV === "production" ? "https://bulnix.com" : "http://localhost:3000");
  const callbackUrl = `${siteOrigin}/api/payments/verify?type=order`;
  let paymentUrl = `#payment-${gatewayRef}`;
  let gatewayTransactionId;
  const allRates = await getExchangeRates();
  const ngnRateRow = allRates.find((r) => r.fromCurrency === "USD" && r.toCurrency === "NGN");
  const usdToNgn = ngnRateRow ? Number(ngnRateRow.rate) : 1600;
  try {
    if (input.gateway === "paystack") {
      const amountNGN = Math.round(Number(order[0].totalUSD) * usdToNgn);
      const amountKobo = amountNGN * 100;
      const result = await paystackInitiate({
        email: userEmail,
        amountKobo,
        reference: gatewayRef,
        currency: "NGN",
        callbackUrl,
        metadata: { orderId: input.orderId, userId, topupRef: gatewayRef, amountUSD: Number(order[0].totalUSD) }
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
        meta: { orderId: input.orderId, userId }
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
        ipnCallbackUrl: `${siteOrigin}/api/webhooks/nowpayments`
      });
      paymentUrl = result.invoiceUrl;
      gatewayTransactionId = result.invoiceId;
    }
  } catch (err) {
    await logSystem("error", "payment", `Gateway initiation failed for order ${input.orderId}`, { gateway: input.gateway, error: err.message });
    throw new Error(`Payment gateway error: ${err.message}`);
  }
  await withDbRetry(() => db.insert(payments).values({
    orderId: input.orderId,
    userId,
    gateway: input.gateway,
    gatewayReference: gatewayRef,
    gatewayTransactionId: gatewayTransactionId ?? null,
    status: "pending",
    amount: amount.toFixed(2),
    currency: input.currency,
    amountUSD: order[0].totalUSD,
    exchangeRate: exchangeRate.toFixed(6)
  }), "initiatePayment:insertPayment");
  await withDbRetry(() => db.update(orders).set({ isLocked: true }).where(eq3(orders.id, input.orderId)), "initiatePayment:lockOrder");
  await logSystem("info", "payment", `Payment initiated for order ${input.orderId}`, { gateway: input.gateway, amount, currency: input.currency, paymentUrl });
  return {
    gatewayRef,
    amount,
    currency: input.currency,
    gateway: input.gateway,
    paymentUrl,
    message: `Payment initiated. Reference: ${gatewayRef}`
  };
}
async function fulfillOrderByReference(reference, gateway) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [payment] = await db.select().from(payments).where(eq3(payments.gatewayReference, reference)).limit(1);
  if (!payment) throw new Error(`Payment not found for reference ${reference}`);
  if (payment.status === "success") return { success: true, alreadyProcessed: true };
  await withDbRetry(() => db.update(payments).set({ status: "success", webhookVerified: true }).where(eq3(payments.id, payment.id)), "fulfillOrderByReference:updatePayment");
  await withDbRetry(() => db.update(orders).set({ status: "processing" }).where(eq3(orders.id, payment.orderId)), "fulfillOrderByReference:updateOrder");
  await logSystem("info", "payment", `Order ${payment.orderId} payment confirmed via ${gateway} webhook`, { reference, gateway });
  autoFulfillOrder(payment.orderId).catch((err) => console.error("[AutoFulfill] Error:", err));
  if (payment.userId) {
    const amountUSD = Number(payment.amount);
    earnRewardPoints(payment.userId, amountUSD, payment.orderId).catch((err) => console.error("[RewardPoints] Error:", err));
  }
  return { success: true, orderId: payment.orderId };
}
async function payOrderWithWallet(userId, orderId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [order] = await db.select().from(orders).where(and3(eq3(orders.id, orderId), eq3(orders.userId, userId))).limit(1);
  if (!order) throw new Error("Order not found");
  if (order.status !== "pending_payment") throw new Error("Order is not pending payment");
  const totalUSD = Number(order.totalUSD);
  const wallet = await getOrCreateWallet(userId);
  const currentBalance = Number(wallet.balanceUSD);
  if (currentBalance < totalUSD) {
    throw new Error(`Insufficient wallet balance. You have $${currentBalance.toFixed(2)} but need $${totalUSD.toFixed(2)}`);
  }
  const oldSpent = Number(wallet.totalSpent);
  const newBalance = (currentBalance - totalUSD).toFixed(6);
  const newSpent = (oldSpent + totalUSD).toFixed(6);
  await withDbRetry(() => db.update(wallets).set({ balanceUSD: newBalance, totalSpent: newSpent }).where(eq3(wallets.userId, userId)), "payOrderWithWallet:deductWallet");
  const getTierName = (spent) => {
    if (spent >= 500) return "Platinum";
    if (spent >= 200) return "Gold";
    if (spent >= 50) return "Silver";
    return "Bronze";
  };
  const oldTier = getTierName(oldSpent);
  const newTier = getTierName(Number(newSpent));
  if (oldTier !== newTier) {
    const [userRow] = await db.select({ name: users.name, email: users.email }).from(users).where(eq3(users.id, userId)).limit(1);
    const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
    notifyOwner2({
      title: `User Tier Upgrade: ${oldTier} \u2192 ${newTier}`,
      content: `User ${userRow?.name ?? "(no name)"} (${userRow?.email ?? `ID ${userId}`}) has upgraded from ${oldTier} to ${newTier}.
Total spent: $${Number(newSpent).toFixed(2)}
Order: ${order.orderNumber}`
    }).catch((err) => console.error("[TierNotify] Error:", err));
    createNotification(
      userId,
      "tier_upgrade",
      `You reached ${newTier} tier!`,
      `Congratulations! You have been upgraded from ${oldTier} to ${newTier} tier. Your total spending is now $${Number(newSpent).toFixed(2)}. Enjoy your new status!`,
      orderId
    ).catch((err) => console.error("[TierNotify] User notification error:", err));
  }
  const txRef = `WALLET-ORDER-${orderId}-${Date.now()}`;
  await withDbRetry(() => db.insert(walletTransactions).values({
    userId,
    type: "spend",
    amountUSD: totalUSD.toFixed(6),
    balanceAfterUSD: newBalance,
    reference: txRef,
    gateway: "wallet",
    status: "completed",
    description: `Payment for order #${order.orderNumber}`,
    orderId
  }), "payOrderWithWallet:insertTx");
  await withDbRetry(() => db.update(orders).set({ status: "processing" }).where(eq3(orders.id, orderId)), "payOrderWithWallet:updateOrder");
  await withDbRetry(() => db.insert(payments).values({
    orderId,
    userId,
    gateway: "manual",
    gatewayReference: txRef,
    amount: totalUSD.toFixed(2),
    currency: "USD",
    status: "success",
    webhookVerified: true
  }), "payOrderWithWallet:insertPayment");
  await logSystem("info", "payment", `Order ${order.orderNumber} paid with wallet by user ${userId}`, { orderId, totalUSD });
  earnRewardPoints(userId, totalUSD, orderId).catch((err) => console.error("[RewardPoints] Error:", err));
  autoFulfillOrder(orderId).catch((err) => console.error("[AutoFulfill] Error:", err));
  earnRewardPoints(userId, totalUSD, orderId).catch((err) => console.error("[RewardPoints] Error:", err));
  return { success: true, orderId, orderNumber: order.orderNumber, amountDeducted: totalUSD, newBalance: Number(newBalance) };
}
async function autoFulfillOrder(orderId) {
  const db = await getDb();
  if (!db) return;
  try {
    const items = await db.select().from(orderItems).where(eq3(orderItems.orderId, orderId));
    if (!items.length) {
      await logSystem("warn", "fulfillment", `No order items found for order ${orderId}`);
      return;
    }
    const allSubscription = items.every((item) => item.providerKey === "manual" && !item.supplierProductId);
    if (allSubscription) {
      await withDbRetry(() => db.update(orders).set({ status: "processing" }).where(eq3(orders.id, orderId)), "autoFulfillOrder:subscriptionPending");
      const [orderRow] = await db.select().from(orders).where(eq3(orders.id, orderId)).limit(1);
      const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
      notifyOwner2({
        title: `New Subscription Order: #${orderRow?.orderNumber ?? orderId}`,
        content: `A subscription order requires manual delivery.
Order: #${orderRow?.orderNumber ?? orderId}
Items: ${items.map((i) => i.productTitle).join(", ")}
Total: $${orderRow?.totalUSD ?? "?"}
Go to Admin > Orders to deliver.`
      }).catch((err) => console.error("[SubscriptionNotify]", err));
      await logSystem("info", "fulfillment", `Order ${orderId} is subscription-only \u2014 set to pending, admin notified`, { orderId });
      return;
    }
    const [accsConfig] = await db.select().from(providerConfigs).where(eq3(providerConfigs.providerKey, "accszone")).limit(1);
    const [faddedConfig] = await db.select().from(providerConfigs).where(eq3(providerConfigs.providerKey, "fadded")).limit(1);
    const accsApiKey = accsConfig?.apiKey ?? null;
    const faddedApiKey = faddedConfig?.apiKey ?? null;
    const { placeSupplierOrder: accsPlaceOrder } = await Promise.resolve().then(() => (init_accszone(), accszone_exports));
    const { placeSupplierOrder: faddedPlaceOrder } = await Promise.resolve().then(() => (init_fadded(), fadded_exports));
    let successCount = 0;
    let failCount = 0;
    for (const item of items) {
      const itemProvider = item.providerKey ?? "accszone";
      const supplierProductId = item.supplierProductId;
      if (!supplierProductId) {
        await logSystem("warn", "fulfillment", `No supplier product ID for order item ${item.id} (order ${orderId})`);
        await withDbRetry(() => db.insert(fulfillmentRecords).values({
          orderId,
          orderItemId: item.id,
          providerKey: itemProvider,
          status: "failed",
          errorMessage: "Supplier product ID not found \u2014 product may not be linked to a supplier"
        }), "autoFulfillOrder:insertFailedRecord");
        failCount++;
        continue;
      }
      let result;
      if (itemProvider === "fadded") {
        if (!faddedApiKey) {
          await logSystem("error", "fulfillment", `Fadded API key not configured \u2014 cannot fulfill order item ${item.id}`);
          result = { success: false, error: "Fadded API key not configured" };
        } else {
          result = await faddedPlaceOrder(faddedApiKey, supplierProductId, item.quantity, orderId);
        }
      } else {
        if (!accsApiKey) {
          await logSystem("error", "fulfillment", `AccsZone API key not configured \u2014 cannot fulfill order item ${item.id}`);
          result = { success: false, error: "AccsZone API key not configured" };
        } else {
          result = await accsPlaceOrder(accsApiKey, supplierProductId, item.quantity, orderId);
        }
      }
      if (result.success) {
        const deliveryDataStr = JSON.stringify(result.deliveryData);
        await withDbRetry(() => db.insert(fulfillmentRecords).values({
          orderId,
          orderItemId: item.id,
          providerKey: itemProvider,
          supplierOrderId: result.supplierOrderId ?? null,
          status: "success",
          deliveryData: deliveryDataStr,
          rawResponse: result.deliveryData
        }), "autoFulfillOrder:insertSuccessRecord");
        successCount++;
      } else {
        await withDbRetry(() => db.insert(fulfillmentRecords).values({
          orderId,
          orderItemId: item.id,
          providerKey: itemProvider,
          status: "failed",
          errorMessage: result.error ?? "Unknown supplier error"
        }), "autoFulfillOrder:insertFailedRecord");
        failCount++;
      }
    }
    const finalStatus = failCount === 0 ? "fulfilled" : successCount === 0 ? "failed" : "partial";
    await withDbRetry(() => db.update(orders).set({ status: finalStatus }).where(eq3(orders.id, orderId)), "autoFulfillOrder:updateOrderStatus");
    await logSystem("info", "fulfillment", `Order ${orderId} fulfillment complete: ${successCount} success, ${failCount} failed (status: ${finalStatus})`, { orderId, successCount, failCount });
    if (finalStatus === "fulfilled" || finalStatus === "partial") {
      const [orderRow] = await db.select().from(orders).where(eq3(orders.id, orderId)).limit(1);
      const [orderUser] = await db.select({ email: users.email, name: users.name }).from(users).where(eq3(users.id, orderRow?.userId ?? 0)).limit(1);
      if (orderUser?.email && orderRow) {
        const { sendOrderStatusEmail: sendOrderStatusEmail2, safeSendEmail: safeSendEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
        safeSendEmail2(() => sendOrderStatusEmail2({
          to: orderUser.email,
          name: orderUser.name ?? "there",
          orderNumber: orderRow.orderNumber,
          orderId,
          status: finalStatus
        }));
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logSystem("error", "fulfillment", `autoFulfillOrder exception for order ${orderId}`, { error: message });
  }
}
async function getPaymentStatus(userId, orderId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments).where(and3(eq3(payments.orderId, orderId), eq3(payments.userId, userId))).orderBy(desc(payments.createdAt)).limit(1);
  return result[0] ?? null;
}
async function createTicket(userId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ticketNumber = `TKT-${Date.now()}-${nanoid(4).toUpperCase()}`;
  await withDbRetry(() => db.insert(supportTickets).values({
    ticketNumber,
    userId,
    orderId: input.orderId ?? null,
    subject: input.subject,
    priority: input.priority,
    status: "open"
  }), "createTicket:insertTicket");
  const ticket = await db.select().from(supportTickets).where(eq3(supportTickets.ticketNumber, ticketNumber)).limit(1);
  const ticketId = ticket[0].id;
  await withDbRetry(() => db.insert(ticketMessages).values({ ticketId, senderId: userId, senderRole: "user", message: input.message }), "createTicket:insertMessage");
  return { ticketId, ticketNumber };
}
async function getUserTickets(userId) {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db.select().from(supportTickets).where(eq3(supportTickets.userId, userId)).orderBy(desc(supportTickets.updatedAt)),
    "getUserTickets"
  );
}
async function getTicketById(userId, ticketId) {
  const db = await getDb();
  if (!db) return null;
  const ticket = await db.select().from(supportTickets).where(and3(eq3(supportTickets.id, ticketId), eq3(supportTickets.userId, userId))).limit(1);
  if (!ticket[0]) return null;
  const messages = await db.select().from(ticketMessages).where(eq3(ticketMessages.ticketId, ticketId)).orderBy(ticketMessages.createdAt);
  return { ...ticket[0], messages };
}
async function replyToTicket(userId, role, input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await withDbRetry(() => db.insert(ticketMessages).values({ ticketId: input.ticketId, senderId: userId, senderRole: role, message: input.message }), "replyToTicket:insertMessage");
  await withDbRetry(() => db.update(supportTickets).set({ status: role === "admin" ? "pending" : "open", updatedAt: /* @__PURE__ */ new Date() }).where(eq3(supportTickets.id, input.ticketId)), "replyToTicket:updateStatus");
  if (role === "admin") {
    const ticket = await db.select({ subject: supportTickets.subject, userId: supportTickets.userId }).from(supportTickets).where(eq3(supportTickets.id, input.ticketId)).limit(1);
    if (ticket[0]) {
      const ticketUser = await db.select({ email: users.email, name: users.name, notifyEmail: users.notifyEmail }).from(users).where(eq3(users.id, ticket[0].userId)).limit(1);
      if (ticketUser[0]?.email && ticketUser[0]?.notifyEmail !== false) {
        safeSendEmail(() => sendTicketReplyEmail({
          to: ticketUser[0].email,
          name: ticketUser[0].name ?? "there",
          ticketId: input.ticketId,
          ticketSubject: ticket[0].subject,
          replyPreview: input.message
        }));
      }
    }
  }
  return { success: true };
}
async function getSavedProducts(userId) {
  const db = await getDb();
  if (!db) return [];
  const saved = await db.select().from(savedProducts).where(eq3(savedProducts.userId, userId));
  if (saved.length === 0) return [];
  const productIds = saved.map((s) => s.productId);
  const prods = await db.select().from(products).where(sql`${products.id} IN (${productIds.join(",")})`);
  return prods;
}
async function toggleSavedProduct(userId, productId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(savedProducts).where(and3(eq3(savedProducts.userId, userId), eq3(savedProducts.productId, productId))).limit(1);
  if (existing[0]) {
    await db.delete(savedProducts).where(and3(eq3(savedProducts.userId, userId), eq3(savedProducts.productId, productId)));
    return { saved: false };
  } else {
    await db.insert(savedProducts).values({ userId, productId });
    return { saved: true };
  }
}
async function getUserNotifications(userId) {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db.select().from(notifications).where(eq3(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50),
    "getUserNotifications"
  );
}
async function markNotificationRead(userId, notifId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(and3(eq3(notifications.id, notifId), eq3(notifications.userId, userId)));
  return { success: true };
}
async function createNotification(userId, type, title, message, relatedOrderId) {
  const db = await getDb();
  if (!db) return;
  await withDbRetry(() => db.insert(notifications).values({ userId, type, title, message, relatedOrderId: relatedOrderId ?? null }), "createNotification");
}
async function getExchangeRates() {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db.select().from(exchangeRates),
    "getExchangeRates"
  );
}
async function fetchAndCacheExchangeRates() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);
  const json2 = await res.json();
  if (json2.result !== "success") throw new Error("Exchange rate API returned non-success result");
  const targets = ["NGN", "EUR", "GBP", "GHS"];
  let updated = 0;
  for (const toCurrency of targets) {
    const rate = json2.rates[toCurrency];
    if (!rate) continue;
    await upsertExchangeRateApi("USD", toCurrency, rate);
    updated++;
  }
  return { updated, rateNGN: json2.rates["NGN"] ?? 0 };
}
async function upsertExchangeRateApi(fromCurrency, toCurrency, rate) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(exchangeRates).where(and3(eq3(exchangeRates.fromCurrency, fromCurrency), eq3(exchangeRates.toCurrency, toCurrency)));
  if (existing.length > 0) {
    if (existing[0].source === "manual") return;
    await db.update(exchangeRates).set({ rate: rate.toFixed(6), source: "api" }).where(and3(eq3(exchangeRates.fromCurrency, fromCurrency), eq3(exchangeRates.toCurrency, toCurrency)));
  } else {
    await db.insert(exchangeRates).values({
      fromCurrency,
      toCurrency,
      rate: rate.toFixed(6),
      source: "api"
    });
  }
}
async function updateExchangeRate(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updated = await db.update(exchangeRates).set({ rate: input.rate.toFixed(6), source: "manual" }).where(and3(eq3(exchangeRates.fromCurrency, input.fromCurrency), eq3(exchangeRates.toCurrency, input.toCurrency)));
  if (updated.affectedRows === 0 || updated[0]?.affectedRows === 0) {
    await db.insert(exchangeRates).values({
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      rate: input.rate.toFixed(6),
      source: "manual"
    });
  }
  return { success: true };
}
async function getProviderConfigs() {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db.select().from(providerConfigs),
    "getProviderConfigs"
  );
}
async function updateProviderConfig(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (input.apiKey !== void 0) updateData.apiKey = input.apiKey;
  if (input.isEnabled !== void 0) updateData.isEnabled = input.isEnabled;
  if (input.syncIntervalMinutes !== void 0) updateData.syncIntervalMinutes = input.syncIntervalMinutes;
  if (input.defaultMarkupPercent !== void 0) updateData.defaultMarkupPercent = input.defaultMarkupPercent.toFixed(2);
  if (Object.keys(updateData).length > 0) {
    await db.update(providerConfigs).set(updateData).where(eq3(providerConfigs.providerKey, input.providerKey));
  }
  return { success: true };
}
async function triggerProviderSync(providerKey, syncType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(providerSyncLogs).values({ providerKey, syncType, status: "running" });
  if (providerKey === "fadded") {
    const { syncProvider: syncProvider3 } = await Promise.resolve().then(() => (init_fadded(), fadded_exports));
    syncProvider3(providerKey, syncType).catch((err) => console.error("[Sync] Fadded error:", err));
  } else {
    const { syncProvider: syncProvider3 } = await Promise.resolve().then(() => (init_accszone(), accszone_exports));
    syncProvider3(providerKey, syncType).catch((err) => console.error("[Sync] AccsZone error:", err));
  }
  return { success: true, message: `Sync triggered for ${providerKey}` };
}
async function getProviderSyncLogs() {
  const db = await getDb();
  if (!db) return [];
  return withDbRetry(
    () => db.select().from(providerSyncLogs).orderBy(desc(providerSyncLogs.startedAt)).limit(50),
    "getProviderSyncLogs"
  );
}
async function logSystem(level, category, message, details, userId, orderId) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(systemLogs).values({ level, category, message, details: details ?? null, userId: userId ?? null, orderId: orderId ?? null });
  } catch {
  }
}
async function getSystemLogs(input) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (input.level) conditions.push(eq3(systemLogs.level, input.level));
  if (input.category) conditions.push(eq3(systemLogs.category, input.category));
  const offset = (input.page - 1) * input.limit;
  const items = conditions.length > 0 ? await db.select().from(systemLogs).where(and3(...conditions)).orderBy(desc(systemLogs.createdAt)).limit(input.limit).offset(offset) : await db.select().from(systemLogs).orderBy(desc(systemLogs.createdAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0 ? await db.select({ count: sql`count(*)` }).from(systemLogs).where(and3(...conditions)) : await db.select({ count: sql`count(*)` }).from(systemLogs);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}
async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0, failedOrders: 0, openTickets: 0 };
  const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
  const [orderCount] = await db.select({ count: sql`count(*)` }).from(orders);
  const [revenue] = await db.select({ sum: sql`COALESCE(sum(totalUSD), 0)` }).from(orders).where(eq3(orders.status, "fulfilled"));
  const [pendingCount] = await db.select({ count: sql`count(*)` }).from(orders).where(eq3(orders.status, "pending_payment"));
  const [failedCount] = await db.select({ count: sql`count(*)` }).from(orders).where(eq3(orders.status, "failed"));
  const [ticketCount] = await db.select({ count: sql`count(*)` }).from(supportTickets).where(eq3(supportTickets.status, "open"));
  const [totalProductCount] = await db.select({ count: sql`count(*)` }).from(products);
  const [visibleProductCount] = await db.select({ count: sql`count(*)` }).from(products).where(eq3(products.isVisible, true));
  return {
    totalUsers: Number(userCount?.count ?? 0),
    totalOrders: Number(orderCount?.count ?? 0),
    totalRevenue: Number(revenue?.sum ?? 0),
    pendingOrders: Number(pendingCount?.count ?? 0),
    failedOrders: Number(failedCount?.count ?? 0),
    openTickets: Number(ticketCount?.count ?? 0),
    totalProducts: Number(totalProductCount?.count ?? 0),
    visibleProducts: Number(visibleProductCount?.count ?? 0)
  };
}
async function adminGetProducts(input) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (input.page - 1) * input.limit;
  const conditions = input.search ? [like(products.title, `%${input.search}%`)] : [];
  const items = conditions.length > 0 ? await db.select().from(products).where(and3(...conditions)).orderBy(desc(products.updatedAt)).limit(input.limit).offset(offset) : await db.select().from(products).orderBy(desc(products.updatedAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0 ? await db.select({ count: sql`count(*)` }).from(products).where(and3(...conditions)) : await db.select({ count: sql`count(*)` }).from(products);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}
async function adminCreateProduct(input) {
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
    supplierPrice: input.supplierPrice.toFixed(8),
    customerPriceUSD: customerPrice.toFixed(2),
    markupPercent: input.markupPercent.toFixed(2),
    stockQuantity: input.stockQuantity,
    stockUnlimited: input.stockUnlimited,
    deliveryNote: input.deliveryNote ?? null,
    deliveryFormat: input.deliveryFormat ?? null,
    isVisible: input.isVisible,
    isFeatured: input.isFeatured
  });
  return { success: true };
}
async function adminUpdateProduct(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (input.title !== void 0) updateData.title = input.title;
  if (input.description !== void 0) updateData.description = input.description;
  if (input.imageUrl !== void 0) updateData.imageUrl = input.imageUrl;
  if (input.isVisible !== void 0) updateData.isVisible = input.isVisible;
  if (input.isFeatured !== void 0) updateData.isFeatured = input.isFeatured;
  if (input.categoryId !== void 0) updateData.categoryId = input.categoryId;
  if (input.regionRestrictions !== void 0) updateData.regionRestrictions = input.regionRestrictions;
  if (input.allowedPaymentMethods !== void 0) updateData.allowedPaymentMethods = input.allowedPaymentMethods;
  if (input.deliveryNote !== void 0) updateData.deliveryNote = input.deliveryNote;
  if (input.deliveryFormat !== void 0) updateData.deliveryFormat = input.deliveryFormat;
  if (input.refundPolicy !== void 0) updateData.refundPolicy = input.refundPolicy;
  if (input.markupPercent !== void 0) {
    updateData.markupPercent = input.markupPercent.toFixed(2);
    const product = await getProductById(input.id);
    if (product) {
      const newPrice = Number(product.supplierPrice) * (1 + input.markupPercent / 100);
      updateData.customerPriceUSD = newPrice.toFixed(2);
    }
  }
  if (Object.keys(updateData).length > 0) {
    await db.update(products).set(updateData).where(eq3(products.id, input.id));
  }
  return { success: true };
}
async function adminGetOrders(input) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (input.page - 1) * input.limit;
  const conditions = [];
  if (input.status) conditions.push(eq3(orders.status, input.status));
  if (input.search) {
    const s = `%${input.search}%`;
    conditions.push(or(like(orders.orderNumber, s), like(orders.billingEmail, s)));
  }
  const items = conditions.length > 0 ? await db.select().from(orders).where(and3(...conditions)).orderBy(desc(orders.createdAt)).limit(input.limit).offset(offset) : await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0 ? await db.select({ count: sql`count(*)` }).from(orders).where(and3(...conditions)) : await db.select({ count: sql`count(*)` }).from(orders);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}
async function adminGetOrderDetail(orderId) {
  const db = await getDb();
  if (!db) return null;
  const [order] = await db.select().from(orders).where(eq3(orders.id, orderId)).limit(1);
  if (!order) return null;
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq3(users.id, order.userId)).limit(1);
  const [wallet] = await db.select({ balanceUSD: wallets.balanceUSD }).from(wallets).where(eq3(wallets.userId, order.userId)).limit(1);
  const items = await db.select().from(orderItems).where(eq3(orderItems.orderId, orderId));
  const fulfillments = await db.select().from(fulfillmentRecords).where(eq3(fulfillmentRecords.orderId, orderId));
  const paymentRows = await db.select().from(payments).where(eq3(payments.orderId, orderId));
  const isSubscriptionOrder = items.length > 0 && items.every((item) => item.providerKey === "manual" && !item.supplierProductId);
  return { order, user: user ? { ...user, walletBalanceUSD: wallet?.balanceUSD ?? "0" } : null, items, fulfillments, payments: paymentRows, isSubscriptionOrder };
}
async function adminUpdateOrder(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (input.status !== void 0) updateData.status = input.status;
  if (input.adminNotes !== void 0) updateData.adminNotes = input.adminNotes;
  if (input.fraudFlag !== void 0) updateData.fraudFlag = input.fraudFlag;
  if (Object.keys(updateData).length > 0) {
    await withDbRetry(() => db.update(orders).set(updateData).where(eq3(orders.id, input.id)), "adminUpdateOrder");
    if (input.status) {
      const updatedOrder = await withDbRetry(() => db.select().from(orders).where(eq3(orders.id, input.id)).limit(1), "adminUpdateOrder-fetch");
      if (updatedOrder[0]) {
        const user = await withDbRetry(() => db.select().from(users).where(eq3(users.id, updatedOrder[0].userId)).limit(1), "adminUpdateOrder-user");
        if (user[0]?.email) {
          safeSendEmail(() => sendOrderStatusEmail({
            to: user[0].email,
            name: user[0].name ?? "there",
            orderNumber: updatedOrder[0].orderNumber,
            orderId: updatedOrder[0].id,
            status: input.status
          }));
          if (input.status === "fulfilled") {
            try {
              const items = await withDbRetry(() => db.select({
                title: orderItems.productTitle,
                quantity: orderItems.quantity,
                productId: orderItems.productId,
                itemId: orderItems.id
              }).from(orderItems).where(eq3(orderItems.orderId, input.id)), "adminUpdateOrder-items");
              const fulfillments = await withDbRetry(() => db.select().from(fulfillmentRecords).where(eq3(fulfillmentRecords.orderId, input.id)), "adminUpdateOrder-fulfillments");
              const productIds = items.map((i) => i.productId).filter(Boolean);
              const productDetails = productIds.length > 0 ? await withDbRetry(() => db.select({ id: products.id, deliveryNote: products.deliveryNote, categoryId: products.categoryId }).from(products).where(inArray(products.id, productIds)), "adminUpdateOrder-products") : [];
              const categoryIds = productDetails.map((p) => p.categoryId).filter(Boolean);
              const categoryDetails = categoryIds.length > 0 ? await withDbRetry(() => db.select({ id: categories.id, name: categories.name }).from(categories).where(inArray(categories.id, categoryIds)), "adminUpdateOrder-categories") : [];
              const catMap = new Map(categoryDetails.map((c) => [c.id, c.name]));
              const prodMap = new Map(productDetails.map((p) => [p.id, p]));
              const deliveryItems = items.map((item) => {
                const prod = item.productId ? prodMap.get(item.productId) : void 0;
                const catName = prod?.categoryId ? catMap.get(prod.categoryId) : void 0;
                const creds = fulfillments.filter((f) => f.orderItemId === item.itemId).map((f) => {
                  try {
                    return typeof f.deliveryData === "string" ? JSON.parse(f.deliveryData) : f.deliveryData;
                  } catch {
                    return f.deliveryData;
                  }
                }).flat().filter(Boolean);
                return { title: item.title, quantity: item.quantity, categoryName: catName, deliveryNote: prod?.deliveryNote ?? void 0, credentials: creds };
              });
              safeSendEmail(() => sendDeliveryEmail({
                to: user[0].email,
                name: user[0].name ?? "there",
                orderNumber: updatedOrder[0].orderNumber,
                orderId: updatedOrder[0].id,
                items: deliveryItems
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
async function adminRetryFulfillment(orderId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const order = await db.select().from(orders).where(eq3(orders.id, orderId)).limit(1);
  if (!order[0]) throw new Error("Order not found");
  await db.update(orders).set({ status: "processing", fulfillmentRetries: (order[0].fulfillmentRetries ?? 0) + 1 }).where(eq3(orders.id, orderId));
  await logSystem("info", "order", `Admin retrying fulfillment for order ${orderId}`, { orderId });
  return { success: true };
}
async function adminOrderManualRefund(adminId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const orderRows = await db.select().from(orders).where(eq3(orders.id, input.orderId)).limit(1);
  if (!orderRows[0]) throw new Error("Order not found");
  const order = orderRows[0];
  const wallet = await getOrCreateWallet(order.userId);
  const newBalance = Number(wallet.balanceUSD) + input.amountUSD;
  const reference = `REFUND-${input.orderId}-${Date.now()}`;
  await withDbRetry(() => db.update(wallets).set({ balanceUSD: newBalance.toFixed(6) }).where(eq3(wallets.userId, order.userId)), "adminOrderManualRefund:wallet");
  await withDbRetry(() => db.insert(walletTransactions).values({
    userId: order.userId,
    type: "refund",
    amountUSD: input.amountUSD.toFixed(6),
    balanceAfterUSD: newBalance.toFixed(6),
    description: `Refund for order #${order.orderNumber}: ${input.reason}`,
    reference,
    orderId: input.orderId,
    status: "completed"
  }), "adminOrderManualRefund:txn");
  await withDbRetry(() => db.update(orders).set({ status: "refunded" }).where(eq3(orders.id, input.orderId)), "adminOrderManualRefund:orderStatus");
  await withDbRetry(() => db.insert(adminActions).values({
    adminId,
    action: `Manual refund of $${input.amountUSD.toFixed(2)} for order #${order.orderNumber}`,
    targetType: "order",
    targetId: input.orderId,
    details: { reason: input.reason, amountUSD: input.amountUSD, userId: order.userId, orderNumber: order.orderNumber }
  }), "adminOrderManualRefund:log");
  await logSystem("info", "order", `Admin issued manual refund of $${input.amountUSD.toFixed(2)} for order ${input.orderId}`, { adminId, orderId: input.orderId, userId: order.userId, reason: input.reason });
  const refundUser = await withDbRetry(() => db.select({ email: users.email, name: users.name }).from(users).where(eq3(users.id, order.userId)).limit(1), "adminOrderManualRefund:user");
  if (refundUser[0]?.email) {
    const { sendRefundConfirmationEmail: sendRefundConfirmationEmail2, safeSendEmail: safeSendEmail2 } = await Promise.resolve().then(() => (init_email(), email_exports));
    safeSendEmail2(() => sendRefundConfirmationEmail2({
      to: refundUser[0].email,
      name: refundUser[0].name ?? "there",
      orderNumber: order.orderNumber ?? `#${order.id}`,
      orderId: order.id,
      amountUSD: input.amountUSD,
      reason: input.reason,
      newBalanceUSD: newBalance
    }));
  }
  return { success: true, newBalance, orderNumber: order.orderNumber };
}
async function adminTopUpUserWallet(adminId, userId, amountUSD, note) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const wallet = await getOrCreateWallet(userId);
  const newBalance = Number(wallet.balanceUSD) + amountUSD;
  const reference = `TOPUP-ADMIN-${userId}-${Date.now()}`;
  await withDbRetry(() => db.update(wallets).set({ balanceUSD: newBalance.toFixed(6), totalDeposited: sql`totalDeposited + ${amountUSD.toFixed(6)}` }).where(eq3(wallets.userId, userId)), "adminTopUp:wallet");
  await withDbRetry(() => db.insert(walletTransactions).values({
    userId,
    type: "deposit",
    amountUSD: amountUSD.toFixed(6),
    balanceAfterUSD: newBalance.toFixed(6),
    description: note,
    reference,
    status: "completed",
    gateway: "manual"
  }), "adminTopUp:txn");
  await withDbRetry(() => db.insert(adminActions).values({
    adminId,
    action: `Manual top-up of $${amountUSD.toFixed(2)} for user ${userId}`,
    targetType: "user",
    targetId: userId,
    details: { amountUSD, note, newBalance }
  }), "adminTopUp:log");
  await db.insert(notifications).values({
    userId,
    type: "wallet",
    title: `Wallet Top-Up: +$${amountUSD.toFixed(2)}`,
    message: `$${amountUSD.toFixed(2)} has been added to your wallet. ${note}`
  }).catch(() => {
  });
  return { success: true, newBalance };
}
async function claimTelegramBonus(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [user] = await db.select({ telegramBonusClaimed: users.telegramBonusClaimed }).from(users).where(eq3(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  if (user.telegramBonusClaimed) return { success: true, alreadyClaimed: true, amountUSD: 0 };
  const bonusUSD = 0.5;
  const wallet = await getOrCreateWallet(userId);
  const newBalance = Number(wallet.balanceUSD) + bonusUSD;
  const reference = `TELEGRAM-BONUS-${userId}-${Date.now()}`;
  await withDbRetry(() => db.update(users).set({ telegramBonusClaimed: true }).where(eq3(users.id, userId)), "claimTelegramBonus:user");
  await withDbRetry(() => db.update(wallets).set({ balanceUSD: newBalance.toFixed(6) }).where(eq3(wallets.userId, userId)), "claimTelegramBonus:wallet");
  await withDbRetry(() => db.insert(walletTransactions).values({
    userId,
    type: "deposit",
    amountUSD: bonusUSD.toFixed(6),
    balanceAfterUSD: newBalance.toFixed(6),
    description: "Telegram channel join bonus",
    reference,
    status: "completed",
    gateway: "bonus"
  }), "claimTelegramBonus:txn");
  await db.insert(notifications).values({
    userId,
    type: "wallet",
    title: "Telegram Bonus Credited!",
    message: `$${bonusUSD.toFixed(2)} has been added to your wallet for joining the Bulnix Telegram channel!`
  }).catch(() => {
  });
  return { success: true, alreadyClaimed: false, amountUSD: bonusUSD };
}
async function adminGetUsers(input) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (input.page - 1) * input.limit;
  const conditions = input.search ? [or(like(users.email, `%${input.search}%`), like(users.name, `%${input.search}%`))] : [];
  const baseItems = conditions.length > 0 ? await db.select().from(users).where(and3(...conditions)).orderBy(desc(users.createdAt)).limit(input.limit).offset(offset) : await db.select().from(users).orderBy(desc(users.createdAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0 ? await db.select({ count: sql`count(*)` }).from(users).where(and3(...conditions)) : await db.select({ count: sql`count(*)` }).from(users);
  const userIds = baseItems.map((u) => u.id);
  const walletRows = userIds.length > 0 ? await db.select({ userId: wallets.userId, totalSpent: wallets.totalSpent }).from(wallets).where(inArray(wallets.userId, userIds)) : [];
  const walletMap = new Map(walletRows.map((w) => [w.userId, w.totalSpent]));
  const items = baseItems.map((u) => ({ ...u, totalSpent: walletMap.get(u.id) ?? "0" }));
  return { items, total: Number(countResult[0]?.count ?? 0) };
}
async function adminSuspendUser(userId, reason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isSuspended: true, suspendedReason: reason ?? null }).where(eq3(users.id, userId));
  return { success: true };
}
async function adminReactivateUser(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ isSuspended: false, suspendedReason: null }).where(eq3(users.id, userId));
  return { success: true };
}
async function adminGetTickets(input) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (input.page - 1) * input.limit;
  const conditions = input.status ? [eq3(supportTickets.status, input.status)] : [];
  const items = conditions.length > 0 ? await db.select().from(supportTickets).where(and3(...conditions)).orderBy(desc(supportTickets.updatedAt)).limit(input.limit).offset(offset) : await db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt)).limit(input.limit).offset(offset);
  const countResult = conditions.length > 0 ? await db.select({ count: sql`count(*)` }).from(supportTickets).where(and3(...conditions)) : await db.select({ count: sql`count(*)` }).from(supportTickets);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}
async function adminReplyToTicket(adminId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await withDbRetry(() => db.insert(ticketMessages).values({ ticketId: input.ticketId, senderId: adminId, senderRole: "admin", message: input.message }), "adminReplyToTicket:insertMessage");
  const newStatus = input.closeTicket ? "resolved" : "pending";
  await withDbRetry(() => db.update(supportTickets).set({ status: newStatus, resolvedAt: input.closeTicket ? /* @__PURE__ */ new Date() : null }).where(eq3(supportTickets.id, input.ticketId)), "adminReplyToTicket:updateStatus");
  return { success: true };
}
async function getOrCreateWallet(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(wallets).where(eq3(wallets.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(wallets).values({ userId, balanceUSD: "0.000000", totalDeposited: "0.000000", totalSpent: "0.000000" });
  const created = await db.select().from(wallets).where(eq3(wallets.userId, userId)).limit(1);
  return created[0];
}
async function getWalletTransactions(userId, page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const offset = (page - 1) * limit;
  const items = await db.select().from(walletTransactions).where(eq3(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(limit).offset(offset);
  const [countRow] = await db.select({ count: sql`count(*)` }).from(walletTransactions).where(eq3(walletTransactions.userId, userId));
  return { items, total: Number(countRow?.count ?? 0) };
}
async function initiateWalletTopup(userId, amountUSD, gateway, origin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (amountUSD < 3) throw new Error("Minimum deposit is $3.00");
  const reference = `TOPUP-${userId}-${Date.now()}`;
  const [topupUser] = await db.select({ email: users.email, name: users.name }).from(users).where(eq3(users.id, userId)).limit(1);
  const userEmail = topupUser?.email ?? `user${userId}@bulnix.com`;
  const userName = topupUser?.name ?? "Bulnix Customer";
  const siteOrigin = origin ?? (process.env.NODE_ENV === "production" ? "https://bulnix.com" : "http://localhost:3000");
  const callbackUrl = `${siteOrigin}/api/payments/verify?type=topup`;
  let paymentUrl = `#topup-${reference}`;
  const allRates = await getExchangeRates();
  const ngnRateRow = allRates.find((r) => r.fromCurrency === "USD" && r.toCurrency === "NGN");
  const usdToNgn = ngnRateRow ? Number(ngnRateRow.rate) : 1600;
  try {
    if (gateway === "paystack") {
      throw new Error("Paystack is currently unavailable. Please use Flutterwave, Kora Pay, or Crypto.");
    } else if (gateway === "flutterwave") {
      const amountNGN = Math.round(amountUSD * usdToNgn);
      const result = await flwInitiate({
        txRef: reference,
        amount: amountNGN,
        currency: "NGN",
        email: userEmail,
        name: userName,
        redirectUrl: `${siteOrigin}/wallet?topup_ref=${reference}&status=success`,
        description: `Bulnix wallet top-up $${amountUSD.toFixed(2)}`,
        meta: { topupRef: reference, userId, type: "wallet_topup", amountUSD }
      });
      paymentUrl = result.paymentLink;
    } else if (gateway === "nowpayments") {
      if (amountUSD < 20) throw new Error("Minimum crypto deposit is $20.00");
      const cryptoFeePercent = 0.05;
      const chargeAmount = parseFloat((amountUSD * (1 + cryptoFeePercent)).toFixed(2));
      const result = await npInitiate({
        priceAmount: chargeAmount,
        priceCurrency: "usd",
        orderId: reference,
        orderDescription: `Bulnix wallet top-up $${amountUSD.toFixed(2)} (+5% crypto fee)`,
        successUrl: `${siteOrigin}/wallet?topup_ref=${reference}&status=success`,
        cancelUrl: `${siteOrigin}/wallet?topup_ref=${reference}&status=cancelled`,
        ipnCallbackUrl: `${siteOrigin}/api/webhooks/nowpayments`
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
        metadata: { topupRef: reference, userId, type: "wallet_topup" }
      });
      paymentUrl = result.checkoutUrl;
    }
  } catch (err) {
    await logSystem("error", "payment", `Wallet topup gateway initiation failed`, { gateway, userId, amountUSD, error: err.message });
    throw new Error(`Payment gateway error: ${err.message}`);
  }
  await withDbRetry(() => db.insert(walletTransactions).values({
    userId,
    type: "deposit",
    amountUSD: amountUSD.toFixed(6),
    balanceAfterUSD: "0.000000",
    // will be updated on confirmation
    description: `Wallet top-up via ${gateway}`,
    reference,
    status: "pending",
    gateway
  }), "initiateWalletTopup");
  return { reference, amountUSD, paymentUrl };
}
async function confirmWalletTopup(reference, skipVerify = false, overrideAmountUSD) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [txn] = await db.select().from(walletTransactions).where(eq3(walletTransactions.reference, reference)).limit(1);
  if (!txn) throw new Error("Transaction not found");
  if (txn.status === "completed") return { success: true, alreadyProcessed: true };
  if (!skipVerify && txn.gateway === "korapay") {
    const { koraVerify: koraVerify3 } = await Promise.resolve().then(() => (init_korapay(), korapay_exports));
    let verified = false;
    try {
      const result = await koraVerify3(reference);
      verified = result.status === "success";
    } catch (verifyErr) {
      await logSystem("warn", "payment", `Kora Pay verify failed for ${reference}: ${verifyErr.message}`);
    }
    if (!verified) {
      await logSystem("warn", "payment", `Kora Pay confirmation rejected \u2014 payment not confirmed by API`, { reference });
      throw new Error("Payment has not been confirmed by Kora Pay. Your wallet will be credited automatically once payment is received.");
    }
  }
  if (!skipVerify && txn.gateway === "flutterwave") {
    const { flwVerify: flwVerify3 } = await Promise.resolve().then(() => (init_flutterwave(), flutterwave_exports));
    let verified = false;
    try {
      const [pmtRow] = await db.select({ gatewayTransactionId: payments.gatewayTransactionId }).from(payments).where(eq3(payments.gatewayReference, reference)).limit(1);
      if (pmtRow?.gatewayTransactionId) {
        const result = await flwVerify3(pmtRow.gatewayTransactionId);
        verified = result.status === "successful";
      } else {
        verified = false;
      }
    } catch (verifyErr) {
      await logSystem("warn", "payment", `Flutterwave verify failed for ${reference}: ${verifyErr.message}`);
    }
    if (!verified) {
      await logSystem("warn", "payment", `Flutterwave confirmation rejected \u2014 payment not confirmed by API`, { reference });
      throw new Error("Payment has not been confirmed by Flutterwave. Your wallet will be credited automatically once payment is received.");
    }
  }
  const wallet = await getOrCreateWallet(txn.userId);
  const creditAmount = overrideAmountUSD !== void 0 ? overrideAmountUSD : Number(txn.amountUSD);
  const isPartial = overrideAmountUSD !== void 0 && overrideAmountUSD < Number(txn.amountUSD);
  const newBalance = Number(wallet.balanceUSD) + creditAmount;
  const newDeposited = Number(wallet.totalDeposited) + creditAmount;
  await withDbRetry(() => db.update(wallets).set({
    balanceUSD: newBalance.toFixed(6),
    totalDeposited: newDeposited.toFixed(6)
  }).where(eq3(wallets.userId, txn.userId)), "confirmWalletTopup:updateWallet");
  await withDbRetry(() => db.update(walletTransactions).set({
    status: isPartial ? "partial" : "completed",
    amountUSD: creditAmount.toFixed(6),
    balanceAfterUSD: newBalance.toFixed(6)
  }).where(eq3(walletTransactions.id, txn.id)), "confirmWalletTopup:updateTxn");
  try {
    const [topupUser] = await db.select({ email: users.email, name: users.name }).from(users).where(eq3(users.id, txn.userId)).limit(1);
    if (topupUser?.email) {
      await sendWalletTopupReceiptEmail({
        to: topupUser.email,
        name: topupUser.name ?? "",
        amountUSD: creditAmount,
        reference: txn.reference ?? "",
        gateway: String(txn.gateway ?? "unknown"),
        newBalanceUSD: newBalance
      });
    }
  } catch (emailErr) {
    await logSystem("warn", "email", `Failed to send wallet top-up receipt: ${emailErr.message}`);
  }
  return { success: true, newBalance, isPartial, creditAmount };
}
async function adminProcessRefund(adminId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const wallet = await getOrCreateWallet(input.userId);
  const newBalance = Number(wallet.balanceUSD) + input.amountUSD;
  const reference = `REFUND-${input.orderId ?? "MANUAL"}-${Date.now()}`;
  await withDbRetry(() => db.update(wallets).set({ balanceUSD: newBalance.toFixed(6) }).where(eq3(wallets.userId, input.userId)), "adminProcessRefund:updateWallet");
  await withDbRetry(() => db.insert(walletTransactions).values({
    userId: input.userId,
    type: "refund",
    amountUSD: input.amountUSD.toFixed(6),
    balanceAfterUSD: newBalance.toFixed(6),
    description: `Refund: ${input.reason}`,
    reference,
    orderId: input.orderId ?? null,
    status: "completed"
  }), "adminProcessRefund:insertTxn");
  await withDbRetry(() => db.insert(adminActions).values({
    adminId,
    action: `Processed refund of $${input.amountUSD} to user ${input.userId}`,
    targetType: "user",
    targetId: input.userId,
    details: { reason: input.reason, amountUSD: input.amountUSD, orderId: input.orderId, ticketId: input.ticketId }
  }), "adminProcessRefund:logAction");
  if (input.ticketId) {
    await withDbRetry(() => db.update(supportTickets).set({ status: "resolved", resolvedAt: /* @__PURE__ */ new Date() }).where(eq3(supportTickets.id, input.ticketId)), "adminProcessRefund:closeTicket");
  }
  return { success: true, newBalance };
}
async function creditWallet(userId, amountUSD, description) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const wallet = await getOrCreateWallet(userId);
  const newBalance = Number(wallet.balanceUSD) + amountUSD;
  const reference = `BONUS-${userId}-${Date.now()}`;
  await withDbRetry(() => db.update(wallets).set({ balanceUSD: newBalance.toFixed(6) }).where(eq3(wallets.userId, userId)), "creditWallet:updateWallet");
  await withDbRetry(() => db.insert(walletTransactions).values({
    userId,
    type: "bonus",
    amountUSD: amountUSD.toFixed(6),
    balanceAfterUSD: newBalance.toFixed(6),
    description,
    reference,
    status: "completed"
  }), "creditWallet:insertTxn");
  return { success: true, newBalance };
}
async function createSupplierRefundClaim(adminId, input) {
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
    creditedToCustomer: false
  });
  await logSystem("info", "supplier_refund", `Supplier refund claim created for provider ${input.providerKey}`, { adminId, claimAmountUSD: input.claimAmountUSD, orderId: input.orderId, ticketId: input.ticketId });
  return { success: true, claimId: result.insertId };
}
async function submitSupplierRefundClaim(adminId, claimId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [claim] = await db.select().from(supplierRefundClaims).where(eq3(supplierRefundClaims.id, claimId)).limit(1);
  if (!claim) throw new Error("Claim not found");
  if (claim.status !== "draft") throw new Error("Only draft claims can be submitted");
  const requestMessage = buildSupplierRefundMessage(claim);
  const log = JSON.parse(claim.communicationLog || "[]");
  log.push({
    direction: "outbound",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    message: requestMessage,
    actor: `Admin #${adminId}`,
    type: "submission"
  });
  await db.update(supplierRefundClaims).set({
    status: "submitted",
    submittedAt: /* @__PURE__ */ new Date(),
    communicationLog: JSON.stringify(log)
  }).where(eq3(supplierRefundClaims.id, claimId));
  await logSystem("info", "supplier_refund", `Supplier refund claim #${claimId} submitted`, { adminId, claimId, providerKey: claim.providerKey });
  return { success: true, requestMessage };
}
async function updateSupplierRefundClaim(adminId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [claim] = await db.select().from(supplierRefundClaims).where(eq3(supplierRefundClaims.id, input.claimId)).limit(1);
  if (!claim) throw new Error("Claim not found");
  const log = JSON.parse(claim.communicationLog || "[]");
  if (input.addLogEntry) {
    log.push({
      direction: input.addLogEntry.direction,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: input.addLogEntry.message,
      actor: input.addLogEntry.direction === "inbound" ? claim.providerKey : `Admin #${adminId}`,
      type: input.addLogEntry.type
    });
  }
  const updateData = {
    communicationLog: JSON.stringify(log)
  };
  if (input.status) updateData.status = input.status;
  if (input.approvedAmountUSD !== void 0) updateData.approvedAmountUSD = String(input.approvedAmountUSD);
  if (input.supplierResponse !== void 0) updateData.supplierResponse = input.supplierResponse;
  if (input.supplierRefundRef !== void 0) updateData.supplierRefundRef = input.supplierRefundRef;
  if (input.adminNotes !== void 0) updateData.adminNotes = input.adminNotes;
  if (input.status === "resolved" || input.status === "approved") updateData.resolvedAt = /* @__PURE__ */ new Date();
  await db.update(supplierRefundClaims).set(updateData).where(eq3(supplierRefundClaims.id, input.claimId));
  if (input.creditToCustomer && input.customerUserId && input.approvedAmountUSD) {
    const creditAmount = input.approvedAmountUSD;
    const wallet = await getOrCreateWallet(input.customerUserId);
    const newBalance = parseFloat(wallet.balanceUSD) + creditAmount;
    await db.update(wallets).set({ balanceUSD: String(newBalance), totalDeposited: String(parseFloat(wallet.totalDeposited) + creditAmount) }).where(eq3(wallets.userId, input.customerUserId));
    await db.insert(walletTransactions).values({
      userId: input.customerUserId,
      type: "refund",
      amountUSD: String(creditAmount),
      balanceAfterUSD: String(newBalance),
      description: `Supplier refund credited (Claim #${input.claimId})`,
      reference: `supplier-refund-${input.claimId}`,
      status: "completed"
    });
    await db.update(supplierRefundClaims).set({ creditedToCustomer: true }).where(eq3(supplierRefundClaims.id, input.claimId));
  }
  await logSystem("info", "supplier_refund", `Supplier refund claim #${input.claimId} updated to status: ${input.status ?? "unchanged"}`, { adminId, claimId: input.claimId });
  return { success: true };
}
async function listSupplierRefundClaims(input) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (input.status) conditions.push(eq3(supplierRefundClaims.status, input.status));
  if (input.providerKey) conditions.push(eq3(supplierRefundClaims.providerKey, input.providerKey));
  const offset = (input.page - 1) * input.limit;
  const query = db.select().from(supplierRefundClaims);
  const items = conditions.length > 0 ? await query.where(and3(...conditions)).limit(input.limit).offset(offset) : await query.limit(input.limit).offset(offset);
  return { items, total: items.length };
}
async function getSupplierRefundClaim(claimId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [claim] = await db.select().from(supplierRefundClaims).where(eq3(supplierRefundClaims.id, claimId)).limit(1);
  if (!claim) throw new Error("Claim not found");
  return { ...claim, communicationLog: JSON.parse(claim.communicationLog || "[]") };
}
function buildSupplierRefundMessage(claim) {
  return `REFUND REQUEST \u2014 Bulnix Marketplace

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
async function adminGetUserDetail(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [user] = await db.select().from(users).where(eq3(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  const userOrders = await db.select().from(orders).where(eq3(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(20);
  const userTickets = await db.select().from(supportTickets).where(eq3(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt)).limit(10);
  const [wallet] = await db.select().from(wallets).where(eq3(wallets.userId, userId)).limit(1);
  const walletTxns = await db.select().from(walletTransactions).where(eq3(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(10);
  const orderIds = userOrders.map((o) => o.id);
  const allItems = orderIds.length > 0 ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)) : [];
  const allFulfillments = orderIds.length > 0 ? await db.select().from(fulfillmentRecords).where(inArray(fulfillmentRecords.orderId, orderIds)) : [];
  const enrichedOrders = userOrders.map((order) => ({
    ...order,
    items: allItems.filter((item) => item.orderId === order.id),
    fulfillments: allFulfillments.filter((f) => f.orderId === order.id)
  }));
  return { user, orders: enrichedOrders, tickets: userTickets, wallet: wallet ?? null, walletTransactions: walletTxns };
}
async function getAccsZoneBalance() {
  try {
    const db = await getDb();
    if (!db) return { balance: 0, referralBalance: 0, lowBalance: true, error: "Database unavailable" };
    const [config] = await db.select().from(providerConfigs).where(eq3(providerConfigs.providerKey, "accszone")).limit(1);
    if (!config?.apiKey) return { balance: 0, referralBalance: 0, lowBalance: true, error: "AccsZone API key not configured" };
    const response = await fetch("https://accszone.com/api/v1/user/balance", {
      headers: { "X-API-Key": config.apiKey, "Accept": "application/json" }
    });
    if (!response.ok) return { balance: 0, referralBalance: 0, lowBalance: true, error: `AccsZone API error: ${response.status}` };
    const json2 = await response.json();
    const balance = parseFloat(json2?.data?.balance ?? "0");
    const referralBalance = parseFloat(json2?.data?.referral_balance ?? "0");
    const lowBalance = balance < 5;
    if (lowBalance) {
      const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
      await notifyOwner2({
        title: "\u26A0\uFE0F AccsZone Low Balance Alert",
        content: `Your AccsZone reseller account balance is critically low: $${balance.toFixed(2)}. Please top up your AccsZone account to avoid order fulfillment failures. Current balance: $${balance.toFixed(2)} USD.`
      }).catch(() => {
      });
    }
    return { balance, referralBalance, lowBalance };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { balance: 0, referralBalance: 0, lowBalance: true, error: msg };
  }
}
async function getFaddedBalance() {
  try {
    const db = await getDb();
    if (!db) return { balance: 0, currency: "NGN", lowBalance: true, error: "Database unavailable" };
    const [config] = await db.select().from(providerConfigs).where(eq3(providerConfigs.providerKey, "fadded")).limit(1);
    if (!config?.apiKey) return { balance: 0, currency: "NGN", lowBalance: true, error: "Fadded API key not configured" };
    const response = await fetch(`${config.baseUrl ?? "https://fadded.net/api/v1"}/reseller/balance`, {
      headers: { "X-Api-Key": config.apiKey, "Accept": "application/json" }
    });
    if (!response.ok) return { balance: 0, currency: "NGN", lowBalance: true, error: `Fadded API error: ${response.status}` };
    const json2 = await response.json();
    const balance = parseFloat(json2?.data?.balance ?? "0");
    const currency = json2?.data?.currency ?? "NGN";
    const lowBalance = balance < 1e4;
    if (lowBalance) {
      const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
      await notifyOwner2({
        title: "\u26A0\uFE0F Fadded Low Balance Alert",
        content: `Your Fadded reseller account balance is critically low: \u20A6${balance.toLocaleString()} NGN. Please top up your Fadded account to avoid order fulfillment failures. Current balance: \u20A6${balance.toLocaleString()} NGN.`
      }).catch(() => {
      });
    }
    return { balance, currency, lowBalance };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { balance: 0, currency: "NGN", lowBalance: true, error: msg };
  }
}
async function applyMarkupToAllProducts(providerKey, markupPercent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const providerProducts = await db.select({ id: products.id, supplierPrice: products.supplierPrice }).from(products).where(eq3(products.providerKey, providerKey));
  let updated = 0;
  for (const p of providerProducts) {
    const newPrice = Number(p.supplierPrice) * (1 + markupPercent / 100);
    await db.update(products).set({
      markupPercent: markupPercent.toFixed(2),
      customerPriceUSD: newPrice.toFixed(2)
    }).where(eq3(products.id, p.id));
    updated++;
  }
  return { updated };
}
async function retryAllProcessingOrders() {
  const db = await getDb();
  if (!db) return { retried: 0, skipped: 0 };
  try {
    const processingOrders = await db.select({ id: orders.id }).from(orders).where(eq3(orders.status, "processing")).limit(50);
    if (processingOrders.length === 0) return { retried: 0, skipped: 0 };
    let retried = 0;
    for (const order of processingOrders) {
      await db.update(orders).set({ fulfillmentRetries: sql`COALESCE(fulfillmentRetries, 0) + 1` }).where(eq3(orders.id, order.id));
      retried++;
    }
    await logSystem("info", "fulfillment", `Auto-retry triggered for ${retried} processing orders`, { orderIds: processingOrders.map((o) => o.id) });
    return { retried, skipped: 0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSystem("error", "fulfillment", `Auto-retry failed: ${msg}`, {});
    return { retried: 0, skipped: 0 };
  }
}
async function generateFaddedDescriptions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
  const faddedProducts = await db.select({
    id: products.id,
    title: products.title
  }).from(products).where(and3(
    eq3(products.providerKey, "fadded"),
    sql`(description IS NULL OR description = '')`
  )).limit(50);
  if (faddedProducts.length === 0) return { generated: 0, skipped: 0, errors: 0 };
  let generated = 0;
  let skipped = 0;
  let errors = 0;
  for (const product of faddedProducts) {
    try {
      const response = await invokeLLM2({
        messages: [
          {
            role: "system",
            content: "You are a product description writer for a digital accounts reseller marketplace called Bulnix. Write concise, natural, and professional product descriptions in 2-3 sentences. Do not use em-dashes, hyphens for pauses, or AI-sounding language. Be direct and informative. Do not use markdown formatting."
          },
          {
            role: "user",
            content: `Write a product description for: "${product.title}". This is a digital product sold on Bulnix marketplace. Keep it to 2-3 sentences, natural and professional.`
          }
        ]
      });
      const description = response.choices?.[0]?.message?.content?.trim();
      if (!description) {
        skipped++;
        continue;
      }
      await db.update(products).set({ description }).where(eq3(products.id, product.id));
      generated++;
    } catch (err) {
      errors++;
      console.error(`[generateFaddedDescriptions] Failed for product ${product.id}:`, err);
    }
  }
  return { generated, skipped, errors };
}
async function addProductCredentials(productId, lines) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (lines.length === 0) return { added: 0 };
  await db.insert(productCredentials).values(lines.map((data) => ({ productId, data: data.trim() })));
  const [{ count }] = await db.select({ count: sql`count(*)` }).from(productCredentials).where(and3(eq3(productCredentials.productId, productId), eq3(productCredentials.isUsed, false)));
  await db.update(products).set({ stockQuantity: Number(count) }).where(eq3(products.id, productId));
  return { added: lines.length };
}
async function getProductCredentials(productId, includeUsed = false) {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq3(productCredentials.productId, productId)];
  if (!includeUsed) conds.push(eq3(productCredentials.isUsed, false));
  return db.select().from(productCredentials).where(and3(...conds)).orderBy(productCredentials.createdAt);
}
async function deleteProductCredential(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [cred] = await db.select().from(productCredentials).where(eq3(productCredentials.id, id)).limit(1);
  if (!cred) throw new Error("Credential not found");
  if (cred.isUsed) throw new Error("Cannot delete a used credential");
  await db.delete(productCredentials).where(eq3(productCredentials.id, id));
  const [{ count }] = await db.select({ count: sql`count(*)` }).from(productCredentials).where(and3(eq3(productCredentials.productId, cred.productId), eq3(productCredentials.isUsed, false)));
  await db.update(products).set({ stockQuantity: Number(count) }).where(eq3(products.id, cred.productId));
  return { success: true };
}
async function claimManualCredential(productId, orderId, userId) {
  const db = await getDb();
  if (!db) return null;
  const [cred] = await db.select().from(productCredentials).where(and3(eq3(productCredentials.productId, productId), eq3(productCredentials.isUsed, false))).orderBy(productCredentials.createdAt).limit(1);
  if (!cred) return null;
  await db.update(productCredentials).set({ isUsed: true, usedByOrderId: orderId, usedByUserId: userId, usedAt: /* @__PURE__ */ new Date() }).where(eq3(productCredentials.id, cred.id));
  const [{ count }] = await db.select({ count: sql`count(*)` }).from(productCredentials).where(and3(eq3(productCredentials.productId, productId), eq3(productCredentials.isUsed, false)));
  await db.update(products).set({ stockQuantity: Number(count) }).where(eq3(products.id, productId));
  return cred.data;
}
async function adminCreateManualProduct(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + nanoid(6);
  await db.insert(products).values({
    slug,
    providerKey: "manual",
    isManual: true,
    isSubscription: data.isSubscription ?? false,
    title: data.title,
    description: data.description ?? null,
    shortDescription: data.shortDescription ?? null,
    categoryId: data.categoryId ?? null,
    imageUrl: data.imageUrl ?? null,
    supplierPrice: "0",
    supplierCurrency: "USD",
    markupPercent: "0",
    customerPriceUSD: String(data.customerPriceUSD),
    stockQuantity: 0,
    stockUnlimited: data.isSubscription ? true : false,
    isVisible: data.isVisible ?? false,
    deliveryNote: data.deliveryNote ?? null
  });
  const [created] = await db.select().from(products).where(eq3(products.slug, slug)).limit(1);
  invalidateCache("categories:");
  return created;
}
async function adminUpdateManualProduct(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (data.title !== void 0) updateData.title = data.title;
  if (data.description !== void 0) updateData.description = data.description;
  if (data.shortDescription !== void 0) updateData.shortDescription = data.shortDescription;
  if (data.categoryId !== void 0) updateData.categoryId = data.categoryId;
  if (data.customerPriceUSD !== void 0) updateData.customerPriceUSD = String(data.customerPriceUSD);
  if (data.imageUrl !== void 0) updateData.imageUrl = data.imageUrl;
  if (data.isSubscription !== void 0) updateData.isSubscription = data.isSubscription;
  if (data.deliveryNote !== void 0) updateData.deliveryNote = data.deliveryNote;
  if (data.isVisible !== void 0) updateData.isVisible = data.isVisible;
  if (data.isFeatured !== void 0) updateData.isFeatured = data.isFeatured;
  if (Object.keys(updateData).length > 0) {
    await db.update(products).set(updateData).where(and3(eq3(products.id, id), eq3(products.isManual, true)));
  }
  invalidateCache("categories:");
  return { success: true };
}
async function adminDeleteManualProduct(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productCredentials).where(eq3(productCredentials.productId, id));
  await db.delete(products).where(and3(eq3(products.id, id), eq3(products.isManual, true)));
  invalidateCache("categories:");
  return { success: true };
}
async function adminDeliverSubscription(orderId, deliveryData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [order] = await db.select().from(orders).where(eq3(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Order not found");
  const existing = await db.select().from(fulfillmentRecords).where(eq3(fulfillmentRecords.orderId, orderId)).limit(1);
  if (existing.length > 0) {
    await db.update(fulfillmentRecords).set({ deliveryData, status: "success", updatedAt: /* @__PURE__ */ new Date() }).where(eq3(fulfillmentRecords.orderId, orderId));
  } else {
    await db.insert(fulfillmentRecords).values({ orderId, providerKey: "manual", status: "success", deliveryData });
  }
  await db.update(orders).set({ status: "fulfilled" }).where(eq3(orders.id, orderId));
  const [user] = await db.select().from(users).where(eq3(users.id, order.userId)).limit(1);
  if (user) {
    await db.insert(notifications).values({
      userId: user.id,
      type: "order_delivered",
      title: "Your subscription is ready!",
      message: `Your order #${order.orderNumber} has been delivered. Check your order page for details.`,
      relatedOrderId: orderId
    });
  }
  return { success: true };
}
function getTierFromSpend(totalSpent) {
  if (totalSpent >= 1e3) return "diamond";
  if (totalSpent >= 500) return "platinum";
  if (totalSpent >= 200) return "gold";
  if (totalSpent >= 50) return "silver";
  return "bronze";
}
async function earnRewardPoints(userId, orderAmountUSD, orderId) {
  const db = await getDb();
  if (!db) return;
  const [wallet] = await db.select().from(wallets).where(eq3(wallets.userId, userId)).limit(1);
  if (!wallet) return;
  const tier = getTierFromSpend(Number(wallet.totalSpent));
  if (!["gold", "platinum", "diamond"].includes(tier)) return;
  const [setting] = await db.select().from(rewardSettings).where(eq3(rewardSettings.tier, tier)).limit(1);
  if (!setting) return;
  const rate = Number(setting.cashbackPercent) / 100;
  const pointsEarned = Math.floor(orderAmountUSD * rate * 100);
  if (pointsEarned <= 0) return;
  await db.insert(rewardPoints).values({ userId, points: pointsEarned, lifetimeEarned: pointsEarned }).onDuplicateKeyUpdate({ set: { points: sql`points + ${pointsEarned}`, lifetimeEarned: sql`lifetimeEarned + ${pointsEarned}` } });
  await db.insert(rewardTransactions).values({ userId, type: "earn", points: pointsEarned, description: `Cashback from order #${orderId}`, orderId });
  await db.insert(notifications).values({
    userId,
    type: "reward_points",
    title: `You earned ${pointsEarned} reward points!`,
    message: `${pointsEarned} points added to your account from your recent order. 1 point = $0.01.`,
    relatedOrderId: orderId
  });
}
async function getUserRewardPoints(userId) {
  const db = await getDb();
  if (!db) return { points: 0, lifetimeEarned: 0 };
  const [row] = await db.select().from(rewardPoints).where(eq3(rewardPoints.userId, userId)).limit(1);
  return row ?? { points: 0, lifetimeEarned: 0 };
}
async function redeemPointsToWallet(userId, pointsToRedeem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [rp] = await db.select().from(rewardPoints).where(eq3(rewardPoints.userId, userId)).limit(1);
  if (!rp || rp.points < pointsToRedeem) throw new Error("Insufficient points");
  const amountUSD = pointsToRedeem * 0.01;
  await db.update(rewardPoints).set({ points: sql`points - ${pointsToRedeem}` }).where(eq3(rewardPoints.userId, userId));
  await db.insert(rewardTransactions).values({ userId, type: "redeem", points: -pointsToRedeem, description: `Redeemed ${pointsToRedeem} points for $${amountUSD.toFixed(2)} wallet credit` });
  const [wallet] = await db.select().from(wallets).where(eq3(wallets.userId, userId)).limit(1);
  if (!wallet) throw new Error("Wallet not found");
  const newBalance = Number(wallet.balanceUSD) + amountUSD;
  await db.update(wallets).set({ balanceUSD: String(newBalance) }).where(eq3(wallets.userId, userId));
  await db.insert(walletTransactions).values({
    userId,
    type: "deposit",
    amountUSD: String(amountUSD),
    balanceAfterUSD: String(newBalance),
    description: `Redeemed ${pointsToRedeem} reward points`,
    status: "completed"
  });
  return { amountUSD, newBalance };
}
async function getRewardSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rewardSettings).orderBy(rewardSettings.tier);
}
async function updateRewardSetting(tier, cashbackPercent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rewardSettings).set({ cashbackPercent: String(cashbackPercent) }).where(eq3(rewardSettings.tier, tier));
  return { success: true };
}
async function getRewardTransactions(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rewardTransactions).where(eq3(rewardTransactions.userId, userId)).orderBy(desc(rewardTransactions.createdAt)).limit(50);
}
async function getOrCreateAffiliateBalance(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(affiliateBalances).values({ userId }).onDuplicateKeyUpdate({ set: { userId } });
  const [row] = await db.select().from(affiliateBalances).where(eq3(affiliateBalances.userId, userId)).limit(1);
  return row;
}
async function creditAffiliateSignupBonus(referrerId, newUserId) {
  const db = await getDb();
  if (!db) return;
  const bonus = 0.5;
  await db.insert(affiliateBalances).values({ userId: referrerId, balanceUSD: String(bonus), totalEarned: String(bonus) }).onDuplicateKeyUpdate({ set: { balanceUSD: sql`balanceUSD + ${bonus}`, totalEarned: sql`totalEarned + ${bonus}` } });
  await db.insert(affiliateTransactions).values({ userId: referrerId, type: "signup_bonus", amountUSD: String(bonus), description: "Referral signup bonus", referredUserId: newUserId });
  await db.insert(notifications).values({
    userId: referrerId,
    type: "affiliate_bonus",
    title: "You earned a $0.50 referral bonus!",
    message: "Someone signed up using your referral link. $0.50 has been added to your affiliate balance."
  });
}
async function getAffiliateTransactions(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(affiliateTransactions).where(eq3(affiliateTransactions.userId, userId)).orderBy(desc(affiliateTransactions.createdAt)).limit(50);
}
async function requestAffiliateWithdrawal(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [bal] = await db.select().from(affiliateBalances).where(eq3(affiliateBalances.userId, userId)).limit(1);
  if (!bal || Number(bal.balanceUSD) < data.amountUSD) throw new Error("Insufficient affiliate balance");
  if (data.amountUSD < 10) throw new Error("Minimum withdrawal is $10");
  await db.update(affiliateBalances).set({ balanceUSD: sql`balanceUSD - ${data.amountUSD}` }).where(eq3(affiliateBalances.userId, userId));
  await db.insert(affiliateWithdrawals).values({ userId, amountUSD: String(data.amountUSD), bankName: data.bankName, accountNumber: data.accountNumber, accountName: data.accountName });
  return { success: true };
}
async function convertAffiliateToWallet(userId, amountUSD) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [bal] = await db.select().from(affiliateBalances).where(eq3(affiliateBalances.userId, userId)).limit(1);
  if (!bal || Number(bal.balanceUSD) < amountUSD) throw new Error("Insufficient affiliate balance");
  await db.update(affiliateBalances).set({ balanceUSD: sql`balanceUSD - ${amountUSD}` }).where(eq3(affiliateBalances.userId, userId));
  const [wallet] = await db.select().from(wallets).where(eq3(wallets.userId, userId)).limit(1);
  if (!wallet) throw new Error("Wallet not found");
  const newBalance = Number(wallet.balanceUSD) + amountUSD;
  await db.update(wallets).set({ balanceUSD: String(newBalance) }).where(eq3(wallets.userId, userId));
  await db.insert(walletTransactions).values({ userId, type: "deposit", amountUSD: String(amountUSD), balanceAfterUSD: String(newBalance), description: "Converted from affiliate balance", status: "completed" });
  await db.insert(affiliateTransactions).values({ userId, type: "withdrawal", amountUSD: String(amountUSD), description: "Converted to wallet balance" });
  return { newBalance };
}
async function adminGetAffiliateWithdrawals(status) {
  const db = await getDb();
  if (!db) return [];
  const conds = status ? [eq3(affiliateWithdrawals.status, status)] : [];
  const rows = await db.select({
    w: affiliateWithdrawals,
    userName: users.name,
    userEmail: users.email
  }).from(affiliateWithdrawals).leftJoin(users, eq3(users.id, affiliateWithdrawals.userId)).where(conds.length > 0 ? and3(...conds) : void 0).orderBy(desc(affiliateWithdrawals.createdAt));
  return rows;
}
async function adminProcessWithdrawal(id, action, adminNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [wd] = await db.select().from(affiliateWithdrawals).where(eq3(affiliateWithdrawals.id, id)).limit(1);
  if (!wd) throw new Error("Withdrawal not found");
  if (wd.status !== "pending") throw new Error("Already processed");
  await db.update(affiliateWithdrawals).set({ status: action, adminNote: adminNote ?? null, processedAt: /* @__PURE__ */ new Date() }).where(eq3(affiliateWithdrawals.id, id));
  if (action === "rejected") {
    await db.update(affiliateBalances).set({ balanceUSD: sql`balanceUSD + ${Number(wd.amountUSD)}` }).where(eq3(affiliateBalances.userId, wd.userId));
  }
  await db.insert(notifications).values({
    userId: wd.userId,
    type: "affiliate_withdrawal",
    title: action === "approved" ? "Withdrawal Approved" : "Withdrawal Rejected",
    message: action === "approved" ? `Your withdrawal of $${Number(wd.amountUSD).toFixed(2)} has been approved. Payment will be sent to your bank.` : `Your withdrawal of $${Number(wd.amountUSD).toFixed(2)} was rejected. ${adminNote ?? ""}. The amount has been returned to your affiliate balance.`
  });
  return { success: true };
}
async function requestApiKey(userId, label) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(apiKeys).where(eq3(apiKeys.userId, userId));
  if (existing.length >= 3) throw new Error("Maximum 3 API keys allowed");
  const pending = existing.find((k) => k.status === "pending");
  if (pending) throw new Error("You already have a pending API key request");
  const [result] = await db.insert(apiKeys).values({
    userId,
    keyHash: "",
    keyPrefix: "",
    label,
    status: "pending"
  }).$returningId();
  return { id: result.id, label, status: "pending" };
}
async function adminApproveApiKey(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rawKey = "blx_" + randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 12);
  await db.update(apiKeys).set({ keyHash, keyPrefix, status: "active", adminNote: null, rawKeyOnce: rawKey }).where(eq3(apiKeys.id, id));
  const [key] = await db.select().from(apiKeys).where(eq3(apiKeys.id, id)).limit(1);
  if (key) {
    await db.insert(notifications).values({
      userId: key.userId,
      type: "order",
      title: "API Key Approved",
      message: `Your API key request has been approved. Log in to your API Keys page to view your full key (shown once).`
    }).catch(() => {
    });
  }
  return { rawKey, keyPrefix };
}
async function adminRejectApiKey(id, reason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys).set({ status: "rejected", adminNote: reason }).where(eq3(apiKeys.id, id));
  const [key] = await db.select().from(apiKeys).where(eq3(apiKeys.id, id)).limit(1);
  if (key) {
    await db.insert(notifications).values({
      userId: key.userId,
      type: "order",
      title: "API Key Request Rejected",
      message: `Your API key request was rejected. Reason: ${reason}`
    }).catch(() => {
    });
  }
  return { success: true };
}
async function generateApiKey(userId, label) {
  return requestApiKey(userId, label);
}
async function getUserApiKeys(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: apiKeys.id,
    keyPrefix: apiKeys.keyPrefix,
    label: apiKeys.label,
    status: apiKeys.status,
    adminNote: apiKeys.adminNote,
    isEnabled: apiKeys.isEnabled,
    adminEnabled: apiKeys.adminEnabled,
    rawKeyOnce: apiKeys.rawKeyOnce,
    lastUsedAt: apiKeys.lastUsedAt,
    requestCount: apiKeys.requestCount,
    createdAt: apiKeys.createdAt
  }).from(apiKeys).where(eq3(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
}
async function clearRawKeyOnce(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys).set({ rawKeyOnce: null }).where(and3(eq3(apiKeys.id, id), eq3(apiKeys.userId, userId)));
  return { success: true };
}
async function deleteApiKey(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(apiKeys).where(and3(eq3(apiKeys.id, id), eq3(apiKeys.userId, userId)));
  return { success: true };
}
async function toggleApiKey(id, userId, isEnabled) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys).set({ isEnabled }).where(and3(eq3(apiKeys.id, id), eq3(apiKeys.userId, userId)));
  return { success: true };
}
async function validateApiKey(rawKey) {
  const db = await getDb();
  if (!db) return null;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const [key] = await db.select().from(apiKeys).where(eq3(apiKeys.keyHash, keyHash)).limit(1);
  if (!key || !key.isEnabled || !key.adminEnabled) return null;
  await db.update(apiKeys).set({ lastUsedAt: /* @__PURE__ */ new Date(), requestCount: sql`requestCount + 1` }).where(eq3(apiKeys.id, key.id));
  const [user] = await db.select().from(users).where(eq3(users.id, key.userId)).limit(1);
  return user ?? null;
}
async function adminGetApiKeys() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: apiKeys.id,
    keyPrefix: apiKeys.keyPrefix,
    label: apiKeys.label,
    status: apiKeys.status,
    adminNote: apiKeys.adminNote,
    isEnabled: apiKeys.isEnabled,
    adminEnabled: apiKeys.adminEnabled,
    lastUsedAt: apiKeys.lastUsedAt,
    requestCount: apiKeys.requestCount,
    createdAt: apiKeys.createdAt,
    userId: apiKeys.userId,
    userName: users.name,
    userEmail: users.email
  }).from(apiKeys).leftJoin(users, eq3(users.id, apiKeys.userId)).orderBy(desc(apiKeys.createdAt));
}
async function adminToggleApiKey(id, adminEnabled) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(apiKeys).set({ adminEnabled }).where(eq3(apiKeys.id, id));
  return { success: true };
}
var _db, _pool, _cache, CACHE_TTL_CATEGORIES, CACHE_TTL_PRODUCTS;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_paystack();
    init_flutterwave();
    init_nowpayments();
    init_korapay();
    init_db_retry();
    init_schema();
    init_email();
    _db = null;
    _pool = null;
    _cache = /* @__PURE__ */ new Map();
    CACHE_TTL_CATEGORIES = 5 * 60 * 1e3;
    CACHE_TTL_PRODUCTS = 2 * 60 * 1e3;
  }
});

// server/storage.ts
import crypto from "crypto";
function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return { cloudName, apiKey, apiSecret };
}
function isCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  return !!(cloudName && apiKey && apiSecret);
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  if (!isCloudinaryConfigured()) {
    console.warn("[Storage] Cloudinary not configured \u2014 skipping upload for:", relKey);
    return { key: relKey, url: "" };
  }
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const key = relKey.replace(/^\/+/, "");
  const publicId = key.replace(/\.[^.]+$/, "");
  const timestamp2 = Math.floor(Date.now() / 1e3).toString();
  const resourceType = contentType.startsWith("image/") ? "image" : "raw";
  const signatureStr = `public_id=${publicId}&timestamp=${timestamp2}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");
  const formData = new FormData();
  const blobData = typeof data === "string" ? data : Buffer.from(data);
  const blob = new Blob([blobData], { type: contentType });
  formData.append("file", blob, key.split("/").pop() ?? key);
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp2);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const response = await fetch(uploadUrl, { method: "POST", body: formData });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Cloudinary upload failed (${response.status}): ${message}`);
  }
  const result = await response.json();
  return { key: result.public_id, url: result.secure_url };
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
  }
});

// server/backup.ts
var backup_exports = {};
__export(backup_exports, {
  runDatabaseBackup: () => runDatabaseBackup,
  runDatabaseBackupSafe: () => runDatabaseBackupSafe
});
import { sql as sql2 } from "drizzle-orm";
function escapeValue(val) {
  if (val === null || val === void 0) return "NULL";
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  return `'${str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}'`;
}
async function dumpTable(tableName) {
  let output = `
-- Table: ${tableName}
`;
  try {
    const db = await getDb();
    if (!db) {
      output += `-- SKIPPED (no DB connection)
`;
      return output;
    }
    const columns = await db.execute(sql2.raw(`SHOW COLUMNS FROM \`${tableName}\``));
    const colNames = columns.map((c) => c.Field ?? c.field ?? Object.values(c)[0]);
    const rows = await db.execute(sql2.raw(`SELECT * FROM \`${tableName}\``));
    const rowArr = rows;
    if (rowArr.length === 0) {
      output += `-- (empty)
`;
      return output;
    }
    output += `INSERT INTO \`${tableName}\` (\`${colNames.join("`, `")}\`) VALUES
`;
    const valueLines = rowArr.map((row) => {
      const vals = colNames.map((col) => escapeValue(row[col]));
      return `  (${vals.join(", ")})`;
    });
    output += valueLines.join(",\n") + ";\n";
  } catch (err) {
    output += `-- SKIPPED (${err.message})
`;
  }
  return output;
}
async function runDatabaseBackup() {
  const now = /* @__PURE__ */ new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "-");
  let sql_dump = `-- Bulnix Database Backup
-- Date: ${now.toISOString()}
-- Generated automatically by Bulnix backup system

SET FOREIGN_KEY_CHECKS=0;
`;
  let tableCount = 0;
  for (const table of TABLES) {
    sql_dump += await dumpTable(table);
    tableCount++;
  }
  sql_dump += `
SET FOREIGN_KEY_CHECKS=1;
-- End of backup
`;
  const fileKey = `backups/bulnix-backup-${dateStr}-${timeStr}.sql`;
  const buffer = Buffer.from(sql_dump, "utf8");
  const sizeKb = Math.round(buffer.byteLength / 1024);
  const { url } = await storagePut(fileKey, buffer, "text/plain");
  const ownerEmail = process.env.EMAIL_FROM ?? process.env.OWNER_EMAIL ?? "";
  if (ownerEmail) {
    const backupUrl = url;
    const backupDate = now.toUTCString();
    const backupSize = sizeKb;
    const backupTables = tableCount;
    safeSendEmail(() => Promise.resolve().then(() => (init_email(), email_exports)).then((m) => m.sendBackupEmail({
      to: ownerEmail,
      date: backupDate,
      sizeKb: backupSize,
      tableCount: backupTables,
      downloadUrl: backupUrl
    })));
  }
  await logSystem("info", "backup", `Daily backup complete: ${sizeKb} KB, ${tableCount} tables \u2192 ${url}`);
  return { url, sizeKb, tableCount };
}
async function runDatabaseBackupSafe() {
  try {
    const result = await runDatabaseBackup();
    console.log(`[Backup] \u2705 Daily backup complete: ${result.sizeKb} KB, ${result.tableCount} tables`);
  } catch (err) {
    console.error(`[Backup] \u274C Daily backup failed:`, err.message);
    try {
      const ownerEmail = process.env.EMAIL_FROM ?? "";
      if (ownerEmail) {
        const errMsg = err.message;
        safeSendEmail(() => Promise.resolve().then(() => (init_email(), email_exports)).then((m) => m.sendBackupFailedEmail({
          to: ownerEmail,
          errorMessage: errMsg,
          date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
        })));
      }
    } catch (_) {
    }
    await logSystem("error", "backup", `Daily backup failed: ${err.message}`).catch(() => {
    });
  }
}
var TABLES;
var init_backup = __esm({
  "server/backup.ts"() {
    "use strict";
    init_db();
    init_storage();
    init_email();
    init_db();
    TABLES = [
      "users",
      "wallets",
      "wallet_transactions",
      "exchange_rates",
      "categories",
      "products",
      "provider_configs",
      "provider_sync_logs",
      "supplier_products",
      "coupons",
      "orders",
      "order_items",
      "payments",
      "payment_events",
      "fulfillment_records",
      "support_tickets",
      "ticket_messages",
      "notifications",
      "user_sessions",
      "system_logs",
      "admin_actions",
      "saved_products",
      "supplier_refund_claims"
    ];
  }
});

// server/_core/vite.ts
var vite_exports = {};
__export(vite_exports, {
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
import express from "express";
import fs from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path from "path";
async function setupVite(app, server) {
  const { createServer: createViteServer } = await import("vite");
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    configFile: path.resolve(import.meta.dirname, "../../vite.config.ts"),
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path.resolve(import.meta.dirname, "../..", "dist", "public") : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
var init_vite = __esm({
  "server/_core/vite.ts"() {
    "use strict";
  }
});

// server/_core/static.ts
var static_exports = {};
__export(static_exports, {
  serveStatic: () => serveStatic2
});
import express2 from "express";
import fs2 from "fs";
import path2 from "path";
function serveStatic2(app) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express2.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}
var init_static = __esm({
  "server/_core/static.ts"() {
    "use strict";
  }
});

// server/runMigrations.ts
var runMigrations_exports = {};
__export(runMigrations_exports, {
  runPendingMigrations: () => runPendingMigrations
});
async function runPendingMigrations() {
  const db = await getDb();
  if (!db) {
    console.error("[Migrations] DB not available, skipping migrations");
    return;
  }
  let ok = 0;
  let skipped = 0;
  let errors = 0;
  for (const m of MIGRATIONS) {
    try {
      await db.execute(m.sql);
      ok++;
    } catch (err) {
      const msg = err?.message ?? String(err);
      if (msg.includes("already exists") || msg.includes("Duplicate column") || msg.includes("Multiple primary key") || msg.includes("Duplicate key name") || msg.includes("Can't DROP") || msg.includes("doesn't exist")) {
        skipped++;
      } else {
        errors++;
        console.error(`[Migrations] Error on ${m.name}: ${msg}`);
      }
    }
  }
  console.log(`[Migrations] Done: ${ok} applied, ${skipped} skipped, ${errors} errors`);
}
var MIGRATIONS;
var init_runMigrations = __esm({
  "server/runMigrations.ts"() {
    "use strict";
    init_db();
    MIGRATIONS = [
      // 0001 — main tables
      { name: "admin_actions", sql: "CREATE TABLE IF NOT EXISTS `admin_actions` (`id` int AUTO_INCREMENT NOT NULL, `adminId` int NOT NULL, `action` varchar(256) NOT NULL, `targetType` varchar(64), `targetId` int, `details` json, `ipAddress` varchar(64), `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `admin_actions_id` PRIMARY KEY(`id`))" },
      { name: "categories", sql: "CREATE TABLE IF NOT EXISTS `categories` (`id` int AUTO_INCREMENT NOT NULL, `slug` varchar(128) NOT NULL, `name` varchar(256) NOT NULL, `description` text, `imageUrl` text, `parentId` int, `isVisible` boolean NOT NULL DEFAULT true, `sortOrder` int NOT NULL DEFAULT 0, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `categories_id` PRIMARY KEY(`id`), CONSTRAINT `categories_slug_unique` UNIQUE(`slug`))" },
      { name: "coupons", sql: "CREATE TABLE IF NOT EXISTS `coupons` (`id` int AUTO_INCREMENT NOT NULL, `code` varchar(64) NOT NULL, `discountType` enum('percent','fixed_usd') NOT NULL, `discountValue` decimal(10,2) NOT NULL, `maxUses` int, `usedCount` int NOT NULL DEFAULT 0, `minOrderUSD` decimal(10,2) DEFAULT '0.00', `expiresAt` timestamp, `isActive` boolean NOT NULL DEFAULT true, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `coupons_id` PRIMARY KEY(`id`), CONSTRAINT `coupons_code_unique` UNIQUE(`code`))" },
      { name: "exchange_rates", sql: "CREATE TABLE IF NOT EXISTS `exchange_rates` (`id` int AUTO_INCREMENT NOT NULL, `fromCurrency` varchar(8) NOT NULL, `toCurrency` varchar(8) NOT NULL, `rate` decimal(18,6) NOT NULL, `source` varchar(64) NOT NULL DEFAULT 'manual', `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `exchange_rates_id` PRIMARY KEY(`id`))" },
      { name: "fulfillment_records", sql: "CREATE TABLE IF NOT EXISTS `fulfillment_records` (`id` int AUTO_INCREMENT NOT NULL, `orderId` int NOT NULL, `orderItemId` int, `providerKey` varchar(64) NOT NULL, `supplierOrderId` varchar(256), `status` enum('pending','success','failed','partial') NOT NULL, `deliveryData` text, `rawResponse` json, `errorMessage` text, `userViewed` boolean NOT NULL DEFAULT false, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `fulfillment_records_id` PRIMARY KEY(`id`))" },
      { name: "notifications", sql: "CREATE TABLE IF NOT EXISTS `notifications` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `type` varchar(64) NOT NULL, `title` varchar(256) NOT NULL, `message` text NOT NULL, `isRead` boolean NOT NULL DEFAULT false, `relatedOrderId` int, `relatedTicketId` int, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `notifications_id` PRIMARY KEY(`id`))" },
      { name: "order_items", sql: "CREATE TABLE IF NOT EXISTS `order_items` (`id` int AUTO_INCREMENT NOT NULL, `orderId` int NOT NULL, `productId` int NOT NULL, `productTitle` varchar(512) NOT NULL, `quantity` int NOT NULL, `unitPriceUSD` decimal(18,2) NOT NULL, `totalPriceUSD` decimal(18,2) NOT NULL, `supplierProductId` varchar(256), `providerKey` varchar(64), `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `order_items_id` PRIMARY KEY(`id`))" },
      { name: "orders", sql: "CREATE TABLE IF NOT EXISTS `orders` (`id` int AUTO_INCREMENT NOT NULL, `orderNumber` varchar(64) NOT NULL, `userId` int NOT NULL, `status` enum('pending_payment','paid','processing','fulfilled','partial','failed','cancelled','refunded','disputed') NOT NULL DEFAULT 'pending_payment', `subtotalUSD` decimal(18,2) NOT NULL, `discountUSD` decimal(18,2) NOT NULL DEFAULT '0.00', `totalUSD` decimal(18,2) NOT NULL, `currency` enum('NGN','USD','EUR','GBP') NOT NULL DEFAULT 'USD', `totalInCurrency` decimal(18,2) NOT NULL, `exchangeRateSnapshot` decimal(18,6), `couponCode` varchar(64), `couponDiscountUSD` decimal(18,2) DEFAULT '0.00', `billingEmail` varchar(320), `billingCountry` varchar(64), `fraudFlag` boolean NOT NULL DEFAULT false, `fraudReason` text, `isLocked` boolean NOT NULL DEFAULT false, `adminNotes` text, `supplierOrderId` varchar(256), `supplierStatus` varchar(64), `fulfillmentRetries` int NOT NULL DEFAULT 0, `lastFulfillmentAttempt` timestamp, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `orders_id` PRIMARY KEY(`id`), CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`))" },
      { name: "payment_events", sql: "CREATE TABLE IF NOT EXISTS `payment_events` (`id` int AUTO_INCREMENT NOT NULL, `paymentId` int, `orderId` int, `gateway` varchar(64) NOT NULL, `eventType` varchar(128) NOT NULL, `payload` json, `isProcessed` boolean NOT NULL DEFAULT false, `isDuplicate` boolean NOT NULL DEFAULT false, `processedAt` timestamp, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `payment_events_id` PRIMARY KEY(`id`))" },
      { name: "payments", sql: "CREATE TABLE IF NOT EXISTS `payments` (`id` int AUTO_INCREMENT NOT NULL, `orderId` int NOT NULL, `userId` int NOT NULL, `gateway` varchar(64) NOT NULL, `gatewayReference` varchar(256), `gatewayTransactionId` varchar(256), `status` enum('pending','success','failed','refunded','disputed') NOT NULL DEFAULT 'pending', `amount` decimal(18,2) NOT NULL, `currency` enum('NGN','USD','EUR','GBP') NOT NULL, `amountUSD` decimal(18,2), `exchangeRate` decimal(18,6), `paymentMethod` varchar(64), `metadata` json, `webhookVerified` boolean NOT NULL DEFAULT false, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `payments_id` PRIMARY KEY(`id`), CONSTRAINT `payments_gatewayReference_unique` UNIQUE(`gatewayReference`))" },
      { name: "products", sql: "CREATE TABLE IF NOT EXISTS `products` (`id` int AUTO_INCREMENT NOT NULL, `slug` varchar(256) NOT NULL, `supplierProductId` varchar(256), `providerKey` varchar(64) NOT NULL, `categoryId` int, `title` varchar(512) NOT NULL, `description` text, `shortDescription` text, `imageUrl` text, `tags` json, `supplierPrice` decimal(18,8) NOT NULL, `supplierCurrency` varchar(16) NOT NULL DEFAULT 'USD', `markupPercent` decimal(10,2) NOT NULL DEFAULT '20.00', `customerPriceUSD` decimal(18,2) NOT NULL, `customerPriceNGN` decimal(18,2), `stockQuantity` int NOT NULL DEFAULT 0, `stockUnlimited` boolean NOT NULL DEFAULT false, `isVisible` boolean NOT NULL DEFAULT true, `isFeatured` boolean NOT NULL DEFAULT false, `isDigital` boolean NOT NULL DEFAULT true, `regionRestrictions` json, `allowedPaymentMethods` json, `riskFlag` boolean NOT NULL DEFAULT false, `requiresAgeVerification` boolean NOT NULL DEFAULT false, `deliveryNote` text, `refundPolicy` text, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `products_id` PRIMARY KEY(`id`), CONSTRAINT `products_slug_unique` UNIQUE(`slug`))" },
      { name: "provider_configs", sql: "CREATE TABLE IF NOT EXISTS `provider_configs` (`id` int AUTO_INCREMENT NOT NULL, `providerKey` varchar(64) NOT NULL, `displayName` varchar(128) NOT NULL, `baseUrl` text NOT NULL, `apiKey` text, `webhookSecret` text, `isEnabled` boolean NOT NULL DEFAULT true, `syncIntervalMinutes` int NOT NULL DEFAULT 30, `lastSyncAt` timestamp, `defaultMarkupPercent` decimal(10,2) NOT NULL DEFAULT '20.00', `settings` json, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `provider_configs_id` PRIMARY KEY(`id`), CONSTRAINT `provider_configs_providerKey_unique` UNIQUE(`providerKey`))" },
      { name: "provider_sync_logs", sql: "CREATE TABLE IF NOT EXISTS `provider_sync_logs` (`id` int AUTO_INCREMENT NOT NULL, `providerKey` varchar(64) NOT NULL, `syncType` enum('categories','products','stock','prices','full') NOT NULL, `status` enum('running','success','failed','partial') NOT NULL, `itemsSynced` int DEFAULT 0, `itemsFailed` int DEFAULT 0, `errorMessage` text, `startedAt` timestamp NOT NULL DEFAULT (now()), `completedAt` timestamp, CONSTRAINT `provider_sync_logs_id` PRIMARY KEY(`id`))" },
      { name: "saved_products", sql: "CREATE TABLE IF NOT EXISTS `saved_products` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `productId` int NOT NULL, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `saved_products_id` PRIMARY KEY(`id`))" },
      { name: "supplier_products", sql: "CREATE TABLE IF NOT EXISTS `supplier_products` (`id` int AUTO_INCREMENT NOT NULL, `providerKey` varchar(64) NOT NULL, `supplierProductId` varchar(256) NOT NULL, `supplierCategoryId` varchar(128), `supplierSlug` varchar(256), `rawTitle` text, `rawDescription` text, `rawPrice` decimal(18,8), `rawCurrency` varchar(16), `rawStock` int DEFAULT 0, `rawData` json, `lastSyncedAt` timestamp NOT NULL DEFAULT (now()), `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `supplier_products_id` PRIMARY KEY(`id`))" },
      { name: "support_tickets", sql: "CREATE TABLE IF NOT EXISTS `support_tickets` (`id` int AUTO_INCREMENT NOT NULL, `ticketNumber` varchar(32) NOT NULL, `userId` int NOT NULL, `orderId` int, `subject` varchar(512) NOT NULL, `status` enum('open','pending','resolved','closed') NOT NULL DEFAULT 'open', `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium', `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, `resolvedAt` timestamp, CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`), CONSTRAINT `support_tickets_ticketNumber_unique` UNIQUE(`ticketNumber`))" },
      { name: "system_logs", sql: "CREATE TABLE IF NOT EXISTS `system_logs` (`id` int AUTO_INCREMENT NOT NULL, `level` enum('info','warn','error','critical') NOT NULL, `category` varchar(64) NOT NULL, `message` text NOT NULL, `details` json, `userId` int, `orderId` int, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `system_logs_id` PRIMARY KEY(`id`))" },
      { name: "ticket_messages", sql: "CREATE TABLE IF NOT EXISTS `ticket_messages` (`id` int AUTO_INCREMENT NOT NULL, `ticketId` int NOT NULL, `senderId` int NOT NULL, `senderRole` enum('user','admin') NOT NULL, `message` text NOT NULL, `attachmentUrl` text, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `ticket_messages_id` PRIMARY KEY(`id`))" },
      { name: "user_sessions", sql: "CREATE TABLE IF NOT EXISTS `user_sessions` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `sessionToken` varchar(256) NOT NULL, `ipAddress` varchar(64), `userAgent` text, `expiresAt` timestamp NOT NULL, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`), CONSTRAINT `user_sessions_sessionToken_unique` UNIQUE(`sessionToken`))" },
      // 0002 — wallets
      { name: "wallet_transactions", sql: "CREATE TABLE IF NOT EXISTS `wallet_transactions` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `type` enum('deposit','spend','refund','adjustment') NOT NULL, `amountUSD` decimal(18,6) NOT NULL, `balanceAfterUSD` decimal(18,6) NOT NULL, `description` varchar(512) NOT NULL, `reference` varchar(256), `orderId` int, `paymentId` int, `status` enum('pending','completed','failed','reversed') NOT NULL DEFAULT 'completed', `gateway` varchar(64), `gatewayRef` varchar(256), `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`))" },
      { name: "wallets", sql: "CREATE TABLE IF NOT EXISTS `wallets` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `balanceUSD` decimal(18,6) NOT NULL DEFAULT '0.000000', `totalDeposited` decimal(18,6) NOT NULL DEFAULT '0.000000', `totalSpent` decimal(18,6) NOT NULL DEFAULT '0.000000', `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `wallets_id` PRIMARY KEY(`id`), CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`))" },
      // 0003 — supplier refund claims
      { name: "supplier_refund_claims", sql: "CREATE TABLE IF NOT EXISTS `supplier_refund_claims` (`id` int AUTO_INCREMENT NOT NULL, `raisedByAdminId` int NOT NULL, `ticketId` int, `orderId` int, `providerKey` varchar(64) NOT NULL, `supplierOrderId` varchar(256), `claimAmountUSD` decimal(18,6) NOT NULL, `reason` text NOT NULL, `status` enum('draft','submitted','acknowledged','approved','partially_approved','rejected','resolved','cancelled') NOT NULL DEFAULT 'draft', `approvedAmountUSD` decimal(18,6), `supplierResponse` text, `supplierRefundRef` varchar(256), `adminNotes` text, `communicationLog` json, `creditedToCustomer` boolean NOT NULL DEFAULT false, `submittedAt` timestamp, `resolvedAt` timestamp, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `supplier_refund_claims_id` PRIMARY KEY(`id`))" },
      // users columns (0001 + 0004 + 0005)
      { name: "users.username", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `username` varchar(64)" },
      { name: "users.passwordHash", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `passwordHash` text" },
      { name: "users.country", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `country` varchar(64)" },
      { name: "users.referralCode", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `referralCode` varchar(32)" },
      { name: "users.referredBy", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `referredBy` varchar(32)" },
      { name: "users.emailVerified", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `emailVerified` boolean DEFAULT false NOT NULL" },
      { name: "users.emailVerifyToken", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `emailVerifyToken` varchar(128)" },
      { name: "users.passwordResetToken", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `passwordResetToken` varchar(128)" },
      { name: "users.passwordResetExpiry", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `passwordResetExpiry` timestamp" },
      { name: "users.isSuspended", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `isSuspended` boolean DEFAULT false NOT NULL" },
      { name: "users.suspendedReason", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `suspendedReason` text" },
      { name: "users.twoFactorEnabled", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `twoFactorEnabled` boolean DEFAULT false NOT NULL" },
      { name: "users.twoFactorSecret", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `twoFactorSecret` varchar(64)" },
      { name: "users.notifyEmail", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifyEmail` boolean DEFAULT true NOT NULL" },
      { name: "users.notifyOrders", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifyOrders` boolean DEFAULT true NOT NULL" },
      { name: "users.preferredCurrency", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `preferredCurrency` enum('NGN','USD','EUR','GBP') DEFAULT 'USD' NOT NULL" },
      { name: "users.otpCode", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `otpCode` varchar(6)" },
      { name: "users.otpExpiry", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `otpExpiry` timestamp" },
      { name: "users.otpPurpose", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `otpPurpose` varchar(16)" },
      { name: "users.lastLoginIp", sql: "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `lastLoginIp` varchar(64)" },
      { name: "products.deliveryFormat", sql: "ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `deliveryFormat` text" },
      { name: "seed.provider.accszone", sql: "INSERT IGNORE INTO `provider_configs` (`providerKey`, `displayName`, `baseUrl`, `isEnabled`, `defaultMarkupPercent`) VALUES ('accszone', 'AccsZone', 'https://accszone.com/api/v1', 1, 20.00)" },
      { name: "seed.provider.fadded", sql: "INSERT IGNORE INTO `provider_configs` (`providerKey`, `displayName`, `baseUrl`, `isEnabled`, `defaultMarkupPercent`) VALUES ('fadded', 'Fadded', 'https://fadded.net/api/v1', 1, 20.00)" },
      // Reward tables
      { name: "reward_points", sql: "CREATE TABLE IF NOT EXISTS `reward_points` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `points` int NOT NULL DEFAULT 0, `lifetimeEarned` int NOT NULL DEFAULT 0, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `reward_points_id` PRIMARY KEY(`id`), CONSTRAINT `reward_points_userId_unique` UNIQUE(`userId`))" },
      { name: "reward_transactions", sql: "CREATE TABLE IF NOT EXISTS `reward_transactions` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `type` enum('earn','redeem') NOT NULL, `points` int NOT NULL, `description` varchar(256) NOT NULL, `orderId` int, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `reward_transactions_id` PRIMARY KEY(`id`))" },
      { name: "reward_settings", sql: "CREATE TABLE IF NOT EXISTS `reward_settings` (`id` int AUTO_INCREMENT NOT NULL, `tier` varchar(32) NOT NULL, `cashbackPercent` decimal(5,2) NOT NULL, `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `reward_settings_id` PRIMARY KEY(`id`), CONSTRAINT `reward_settings_tier_unique` UNIQUE(`tier`))" },
      { name: "seed.reward_settings", sql: "INSERT IGNORE INTO `reward_settings` (`tier`, `cashbackPercent`) VALUES ('gold', 0.50), ('platinum', 0.75), ('diamond', 1.00)" },
      // Affiliate tables
      { name: "affiliate_balances", sql: "CREATE TABLE IF NOT EXISTS `affiliate_balances` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `balanceUSD` decimal(18,6) NOT NULL DEFAULT '0.000000', `totalEarned` decimal(18,6) NOT NULL DEFAULT '0.000000', `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `affiliate_balances_id` PRIMARY KEY(`id`), CONSTRAINT `affiliate_balances_userId_unique` UNIQUE(`userId`))" },
      { name: "affiliate_transactions", sql: "CREATE TABLE IF NOT EXISTS `affiliate_transactions` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `type` enum('signup_bonus','withdrawal') NOT NULL, `amountUSD` decimal(18,6) NOT NULL, `description` varchar(256) NOT NULL, `referredUserId` int, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `affiliate_transactions_id` PRIMARY KEY(`id`))" },
      { name: "affiliate_withdrawals", sql: "CREATE TABLE IF NOT EXISTS `affiliate_withdrawals` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `amountUSD` decimal(18,6) NOT NULL, `bankName` varchar(128) NOT NULL, `accountNumber` varchar(64) NOT NULL, `accountName` varchar(128) NOT NULL, `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending', `adminNote` text, `processedAt` timestamp, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `affiliate_withdrawals_id` PRIMARY KEY(`id`))" },
      // API Keys table
      { name: "api_keys", sql: "CREATE TABLE IF NOT EXISTS `api_keys` (`id` int AUTO_INCREMENT NOT NULL, `userId` int NOT NULL, `keyHash` varchar(256) NOT NULL, `keyPrefix` varchar(16) NOT NULL, `label` varchar(128) NOT NULL DEFAULT 'Default', `isEnabled` boolean NOT NULL DEFAULT true, `adminEnabled` boolean NOT NULL DEFAULT true, `lastUsedAt` timestamp, `requestCount` int NOT NULL DEFAULT 0, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `api_keys_id` PRIMARY KEY(`id`), CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`))" },
      { name: "api_keys.status", sql: "ALTER TABLE `api_keys` ADD COLUMN IF NOT EXISTS `status` enum('pending','active','rejected') NOT NULL DEFAULT 'pending'" },
      { name: "api_keys.adminNote", sql: "ALTER TABLE `api_keys` ADD COLUMN IF NOT EXISTS `adminNote` varchar(256)" }
    ];
  }
});

// server/_core/index.ts
import "dotenv/config";
import express3 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();
init_db_retry();
init_email();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios3 from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios3.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString2(openId) || !isNonEmptyString2(appId) || !isNonEmptyString2(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
var TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1e3;
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", (_req, res) => {
    res.redirect(302, "/");
  });
  return;
  app.get("/api/oauth/callback-unused", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      const existingUser = await withDbRetry(
        () => getUserByOpenId(userInfo.openId),
        "oauth:getUserByOpenId"
      );
      const isNewUser = !existingUser;
      let signupIp = null;
      let signupCountry = null;
      if (isNewUser) {
        signupIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? null;
        if (signupIp && signupIp !== "127.0.0.1" && signupIp !== "::1" && !signupIp.startsWith("192.168.") && !signupIp.startsWith("10.")) {
          try {
            const geoRes = await fetch(`https://ipapi.co/${signupIp}/country_name/`, { signal: AbortSignal.timeout(3e3) });
            if (geoRes.ok) {
              const t2 = (await geoRes.text()).trim();
              if (t2.length > 0 && t2.length < 100) signupCountry = t2;
            }
          } catch {
          }
        }
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date(),
        ...isNewUser && signupIp ? { signupIp } : {},
        ...isNewUser && signupCountry ? { signupCountry } : {}
      });
      if (isNewUser && userInfo.email) {
        safeSendEmail(() => sendWelcomeEmail({
          to: userInfo.email,
          name: userInfo.name || "there"
        }));
      }
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: TWENTY_FOUR_HOURS_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: TWENTY_FOUR_HOURS_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/googleAuth.ts
init_env();
import { OAuth2Client } from "google-auth-library";
init_db();
init_db_retry();
init_email();
var TWENTY_FOUR_HOURS_MS2 = 24 * 60 * 60 * 1e3;
var SCOPES = ["openid", "email", "profile"];
function getCallbackUrl(req) {
  return "https://bulnix.com/api/auth/google/callback";
}
function registerGoogleAuthRoutes(app) {
  app.get("/api/auth/google", (req, res) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(503).json({ error: "Google OAuth is not configured." });
      return;
    }
    const returnPath = typeof req.query.return === "string" ? req.query.return : "/";
    const state = Buffer.from(JSON.stringify({ returnPath })).toString("base64url");
    const client = new OAuth2Client(ENV.googleClientId, ENV.googleClientSecret, getCallbackUrl(req));
    const url = client.generateAuthUrl({
      access_type: "online",
      scope: SCOPES,
      state,
      prompt: "select_account"
    });
    res.redirect(302, url);
  });
  app.get("/api/auth/google/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const stateRaw = typeof req.query.state === "string" ? req.query.state : null;
    const error = typeof req.query.error === "string" ? req.query.error : null;
    if (error) {
      console.error("[Google OAuth] User denied or error:", error);
      res.redirect(302, "/login?error=google_denied");
      return;
    }
    if (!code) {
      res.redirect(302, "/login?error=google_no_code");
      return;
    }
    let returnPath = "/";
    if (stateRaw) {
      try {
        const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
        if (typeof parsed.returnPath === "string") returnPath = parsed.returnPath;
      } catch {
      }
    }
    try {
      const client = new OAuth2Client(ENV.googleClientId, ENV.googleClientSecret, getCallbackUrl(req));
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: ENV.googleClientId
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        res.redirect(302, "/login?error=google_invalid_token");
        return;
      }
      const openId = `google:${payload.sub}`;
      const email = payload.email ?? null;
      const name = payload.name ?? null;
      const existingUser = await withDbRetry(
        () => getUserByOpenId(openId),
        "google-oauth:getUserByOpenId"
      );
      const isNewUser = !existingUser;
      await upsertUser({
        openId,
        name,
        email,
        loginMethod: "google",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      if (isNewUser && email) {
        safeSendEmail(() => sendWelcomeEmail({ to: email, name: name || "there" }));
      }
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: TWENTY_FOUR_HOURS_MS2
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: TWENTY_FOUR_HOURS_MS2 });
      res.redirect(302, returnPath || "/");
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect(302, "/login?error=google_failed");
    }
  });
}

// server/_core/storageProxy.ts
init_env();
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers/customAuth.ts
init_schema();
init_db();
import { TRPCError as TRPCError3 } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq as eq4 } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { z } from "zod/v4";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/routers/customAuth.ts
init_email();
var TWENTY_FOUR_HOURS_MS3 = 24 * 60 * 60 * 1e3;
function generateOtp() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
function otpExpiresAt() {
  return new Date(Date.now() + 10 * 60 * 1e3);
}
function generateOpenId() {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
async function findUserByEmail(email) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq4(users.email, email)).limit(1);
  return rows[0] ?? null;
}
async function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? null;
}
async function getCountryFromIp(ip) {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) return null;
  try {
    const res = await fetch(`https://ipapi.co/${ip}/country_name/`, { signal: AbortSignal.timeout(3e3) });
    if (!res.ok) return null;
    const text2 = (await res.text()).trim();
    return text2.length > 0 && text2.length < 100 ? text2 : null;
  } catch {
    return null;
  }
}
var customAuthRouter = router({
  /**
   * Step 1 of registration: validate email/password, send OTP
   */
  register: publicProcedure.input(
    z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      referralCode: z.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = input.email.toLowerCase().trim();
    const existing = await findUserByEmail(email);
    if (existing?.emailVerified) {
      throw new TRPCError3({
        code: "CONFLICT",
        message: "An account with this email already exists. Please sign in."
      });
    }
    const otp = generateOtp();
    const otpExpiry = otpExpiresAt();
    const passwordHash = await bcrypt.hash(input.password, 12);
    const newReferralCode = `BX${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    if (existing) {
      await db.update(users).set({
        name: input.name,
        passwordHash,
        otpCode: otp,
        otpExpiry,
        otpPurpose: "register",
        referralCode: existing.referralCode ?? newReferralCode,
        referredBy: input.referralCode ?? existing.referredBy
      }).where(eq4(users.email, email));
    } else {
      const signupIp = await getClientIp(ctx.req);
      const signupCountry = await getCountryFromIp(signupIp);
      await db.insert(users).values({
        openId: generateOpenId(),
        name: input.name,
        email,
        passwordHash,
        loginMethod: "email",
        emailVerified: false,
        otpCode: otp,
        otpExpiry,
        otpPurpose: "register",
        signupIp,
        signupCountry,
        referralCode: newReferralCode,
        referredBy: input.referralCode ?? null
      });
    }
    await safeSendEmail(
      () => sendOtpEmail({ to: email, name: input.name, otp, purpose: "register" })
    );
    return { success: true, email };
  }),
  /**
   * Verify OTP code for registration or login
   */
  verifyOtp: publicProcedure.input(
    z.object({
      email: z.email(),
      otp: z.string().length(6),
      purpose: z.enum(["register", "login", "reset"])
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = input.email.toLowerCase().trim();
    const user = await findUserByEmail(email);
    if (!user) throw new TRPCError3({ code: "NOT_FOUND", message: "Account not found" });
    if (!user.otpCode || !user.otpExpiry) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "No verification code pending. Please request a new one." });
    }
    if (user.otpPurpose !== input.purpose) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "Invalid verification code" });
    }
    if (/* @__PURE__ */ new Date() > user.otpExpiry) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "Verification code has expired. Please request a new one." });
    }
    if (user.otpCode !== input.otp) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "Incorrect verification code" });
    }
    await db.update(users).set({
      emailVerified: true,
      otpCode: null,
      otpExpiry: null,
      otpPurpose: null,
      lastSignedIn: /* @__PURE__ */ new Date()
    }).where(eq4(users.id, user.id));
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name ?? "",
      expiresInMs: TWENTY_FOUR_HOURS_MS3
    });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, {
      ...cookieOptions,
      maxAge: TWENTY_FOUR_HOURS_MS3
    });
    if (input.purpose === "register") {
      await safeSendEmail(
        () => sendWelcomeEmail({ to: email, name: user.name ?? "" })
      );
      if (user.referredBy) {
        try {
          const db2 = await getDb();
          if (db2) {
            const [referrer] = await db2.select({ id: users.id }).from(users).where(eq4(users.referralCode, user.referredBy)).limit(1);
            if (referrer) {
              const { creditAffiliateSignupBonus: creditAffiliateSignupBonus2 } = await Promise.resolve().then(() => (init_db(), db_exports));
              await creditAffiliateSignupBonus2(referrer.id, user.id);
            }
          }
        } catch (e) {
          console.error("[Referral] Failed to credit bonus:", e);
        }
      }
    }
    return {
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  }),
  /**
   * Step 1 of login: validate credentials.
   * - Regular users: log in directly (no OTP), 24h session.
   * - Admin users: send OTP for extra security.
   */
  loginRequest: publicProcedure.input(
    z.object({
      email: z.email("Invalid email address"),
      password: z.string().min(1, "Password is required")
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = input.email.toLowerCase().trim();
    const user = await findUserByEmail(email);
    if (!user) {
      throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    }
    if (!user.passwordHash) {
      throw new TRPCError3({ code: "FORBIDDEN", message: 'No password set for this account. Please use "Forgot Password" to set one.' });
    }
    if (!user.emailVerified) {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Please verify your email first. Check your inbox for a verification code." });
    }
    if (user.isSuspended) {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Your account has been suspended. Please contact support." });
    }
    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    }
    if (user.role === "admin") {
      const otp = generateOtp();
      await db.update(users).set({
        otpCode: otp,
        otpExpiry: otpExpiresAt(),
        otpPurpose: "login"
      }).where(eq4(users.id, user.id));
      await safeSendEmail(
        () => sendOtpEmail({ to: email, name: user.name ?? "", otp, purpose: "login" })
      );
      return { success: true, email, requiresOtp: true };
    }
    await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq4(users.id, user.id));
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name ?? "",
      expiresInMs: TWENTY_FOUR_HOURS_MS3
    });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, {
      ...cookieOptions,
      maxAge: TWENTY_FOUR_HOURS_MS3
    });
    return { success: true, email, requiresOtp: false };
  }),
  /**
   * Resend OTP code
   */
  resendOtp: publicProcedure.input(z.object({
    email: z.email(),
    purpose: z.enum(["register", "login", "reset"])
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = input.email.toLowerCase().trim();
    const user = await findUserByEmail(email);
    if (!user) throw new TRPCError3({ code: "NOT_FOUND", message: "Account not found" });
    if (user.otpExpiry) {
      const secondsLeft = (user.otpExpiry.getTime() - Date.now()) / 1e3;
      if (secondsLeft > 9 * 60) {
        throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: "Please wait before requesting a new code" });
      }
    }
    const otp = generateOtp();
    await db.update(users).set({
      otpCode: otp,
      otpExpiry: otpExpiresAt(),
      otpPurpose: input.purpose
    }).where(eq4(users.id, user.id));
    await safeSendEmail(
      () => sendOtpEmail({ to: email, name: user.name ?? "", otp, purpose: input.purpose })
    );
    return { success: true };
  }),
  /**
   * Forgot password: send reset OTP
   */
  forgotPassword: publicProcedure.input(z.object({ email: z.email() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = input.email.toLowerCase().trim();
    const user = await findUserByEmail(email);
    if (!user) return { success: true };
    const otp = generateOtp();
    await db.update(users).set({
      otpCode: otp,
      otpExpiry: otpExpiresAt(),
      otpPurpose: "reset"
    }).where(eq4(users.id, user.id));
    await safeSendEmail(
      () => sendOtpEmail({ to: email, name: user.name ?? "", otp, purpose: "reset" })
    );
    return { success: true };
  }),
  /**
   * Reset password after OTP verification
   */
  resetPassword: publicProcedure.input(z.object({
    email: z.email(),
    otp: z.string().length(6),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const email = input.email.toLowerCase().trim();
    const user = await findUserByEmail(email);
    if (!user || user.otpCode !== input.otp || !user.otpExpiry || /* @__PURE__ */ new Date() > user.otpExpiry || user.otpPurpose !== "reset") {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "Invalid or expired reset code" });
    }
    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await db.update(users).set({
      passwordHash,
      emailVerified: true,
      loginMethod: "email",
      otpCode: null,
      otpExpiry: null,
      otpPurpose: null,
      lastSignedIn: /* @__PURE__ */ new Date()
    }).where(eq4(users.id, user.id));
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name ?? "",
      expiresInMs: TWENTY_FOUR_HOURS_MS3
    });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: TWENTY_FOUR_HOURS_MS3 });
    return { success: true };
  }),
  /**
   * Change password (authenticated user)
   */
  changePassword: protectedProcedure.input(z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq4(users.id, ctx.user.id)).limit(1);
    const userRow = rows[0];
    if (!userRow?.passwordHash) throw new TRPCError3({ code: "BAD_REQUEST", message: "No password set on this account" });
    const valid = await bcrypt.compare(input.currentPassword, userRow.passwordHash);
    if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
    const newHash = await bcrypt.hash(input.newPassword, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq4(users.id, ctx.user.id));
    return { success: true };
  }),
  /**
   * Admin-only direct login (email + password, no OTP, admin role required)
   */
  adminLogin: publicProcedure.input(z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({
      id: users.id,
      openId: users.openId,
      email: users.email,
      name: users.name,
      role: users.role,
      passwordHash: users.passwordHash,
      emailVerified: users.emailVerified,
      isSuspended: users.isSuspended
    }).from(users).where(eq4(users.email, input.email.toLowerCase().trim())).limit(1);
    const user = rows[0];
    const invalidErr = new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    if (!user) throw invalidErr;
    if (user.role !== "admin") throw invalidErr;
    if (!user.passwordHash) throw invalidErr;
    if (user.isSuspended) throw new TRPCError3({ code: "FORBIDDEN", message: "Account suspended" });
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw invalidErr;
    const loginIp = ctx.req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? ctx.req.socket?.remoteAddress ?? null;
    await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date(), lastLoginIp: loginIp }).where(eq4(users.id, user.id));
    const sessionToken = await sdk.createSessionToken(user.openId, {
      expiresInMs: TWENTY_FOUR_HOURS_MS3,
      name: user.name || ""
    });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: TWENTY_FOUR_HOURS_MS3 });
    return { success: true, name: user.name };
  }),
  /**
   * Generate a referral code for the current user if they don't have one.
   * Called from the Affiliate page when referralCode is null.
   */
  generateReferralCode: protectedProcedure.mutation(async ({ ctx }) => {
    const dbConn = await getDb();
    if (!dbConn) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const [user] = await dbConn.select({ referralCode: users.referralCode }).from(users).where(eq4(users.id, ctx.user.id)).limit(1);
    if (user?.referralCode) return { referralCode: user.referralCode };
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "BX";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    await dbConn.update(users).set({ referralCode: code }).where(eq4(users.id, ctx.user.id));
    return { referralCode: code };
  }),
  /**
   * Claim the one-time $0.50 Telegram join bonus.
   */
  claimTelegramBonus: protectedProcedure.mutation(async ({ ctx }) => {
    const dbConn = await getDb();
    if (!dbConn) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await dbConn.select().from(users).where(eq4(users.id, ctx.user.id)).limit(1);
    const row = rows[0];
    if (!row) throw new TRPCError3({ code: "NOT_FOUND" });
    if (row.telegramBonusClaimed) return { alreadyClaimed: true, amountUSD: 0 };
    const bonusUSD = 0.5;
    await dbConn.update(users).set({ telegramBonusClaimed: true }).where(eq4(users.id, ctx.user.id));
    const { creditWallet: creditWallet2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    await creditWallet2(ctx.user.id, bonusUSD, "Telegram channel join bonus");
    return { alreadyClaimed: false, amountUSD: bonusUSD };
  })
});
var adminAccountRouter = router({
  /**
   * Change admin password (admin-only, requires current password)
   */
  changeAdminPassword: protectedProcedure.input(z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "New password must be at least 8 characters")
  })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq4(users.id, ctx.user.id)).limit(1);
    const userRow = rows[0];
    if (!userRow?.passwordHash) throw new TRPCError3({ code: "BAD_REQUEST", message: "No password set" });
    const valid = await bcrypt.compare(input.currentPassword, userRow.passwordHash);
    if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
    const newHash = await bcrypt.hash(input.newPassword, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq4(users.id, ctx.user.id));
    return { success: true };
  }),
  /**
   * Generate a new TOTP secret + QR code data URL for setup
   */
  setupTotp: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const totp = new OTPAuth.TOTP({
      issuer: "Bulnix Admin",
      label: ctx.user.email ?? "admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30
    });
    const secret = totp.secret.base32;
    const otpauthUrl = totp.toString();
    await db.update(users).set({ twoFactorSecret: secret }).where(eq4(users.id, ctx.user.id));
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret, qrDataUrl };
  }),
  /**
   * Verify TOTP token and enable 2FA
   */
  verifyTotp: protectedProcedure.input(z.object({ token: z.string().length(6) })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({ twoFactorSecret: users.twoFactorSecret }).from(users).where(eq4(users.id, ctx.user.id)).limit(1);
    const secret = rows[0]?.twoFactorSecret;
    if (!secret) throw new TRPCError3({ code: "BAD_REQUEST", message: "No TOTP secret found. Please start setup again." });
    const totp = new OTPAuth.TOTP({
      issuer: "Bulnix Admin",
      label: ctx.user.email ?? "admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });
    const delta = totp.validate({ token: input.token, window: 1 });
    if (delta === null) throw new TRPCError3({ code: "BAD_REQUEST", message: "Invalid verification code. Please try again." });
    await db.update(users).set({ twoFactorEnabled: true }).where(eq4(users.id, ctx.user.id));
    return { success: true };
  }),
  /**
   * Disable 2FA (requires current password for safety)
   */
  disableTotp: protectedProcedure.input(z.object({ password: z.string().min(1) })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq4(users.id, ctx.user.id)).limit(1);
    const userRow = rows[0];
    if (!userRow?.passwordHash) throw new TRPCError3({ code: "BAD_REQUEST", message: "No password set" });
    const valid = await bcrypt.compare(input.password, userRow.passwordHash);
    if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Incorrect password" });
    await db.update(users).set({ twoFactorEnabled: false, twoFactorSecret: null }).where(eq4(users.id, ctx.user.id));
    return { success: true };
  }),
  /**
   * Get current 2FA status for the admin
   */
  getTotpStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({ twoFactorEnabled: users.twoFactorEnabled }).from(users).where(eq4(users.id, ctx.user.id)).limit(1);
    return { enabled: rows[0]?.twoFactorEnabled ?? false };
  }),
  /**
   * Get last login date and IP for the admin account settings page
   */
  getSessionInfo: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const rows = await db.select({ lastSignedIn: users.lastSignedIn, lastLoginIp: users.lastLoginIp }).from(users).where(eq4(users.id, ctx.user.id)).limit(1);
    return {
      lastSignedIn: rows[0]?.lastSignedIn ?? null,
      lastLoginIp: rows[0]?.lastLoginIp ?? null
    };
  })
});

// server/_core/systemRouter.ts
init_notification();
import { z as z2 } from "zod";
init_backup();
var systemRouter = router({
  health: publicProcedure.input(
    z2.object({
      timestamp: z2.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z2.object({
      title: z2.string().min(1, "title is required"),
      content: z2.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  }),
  runBackup: adminProcedure.mutation(async () => {
    const result = await runDatabaseBackup();
    return {
      success: true,
      url: result.url,
      sizeKb: result.sizeKb,
      tableCount: result.tableCount
    };
  })
});

// server/routers.ts
init_db();
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z3 } from "zod/v4";

// server/routers/migrations.ts
init_db();
var migrationsRouter = router({
  runPending: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const migrations = [
      {
        name: "0001_main_tables",
        sql: [
          `CREATE TABLE IF NOT EXISTS \`admin_actions\` (\`id\` int AUTO_INCREMENT NOT NULL, \`adminId\` int NOT NULL, \`action\` varchar(256) NOT NULL, \`targetType\` varchar(64), \`targetId\` int, \`details\` json, \`ipAddress\` varchar(64), \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`admin_actions_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`categories\` (\`id\` int AUTO_INCREMENT NOT NULL, \`slug\` varchar(128) NOT NULL, \`name\` varchar(256) NOT NULL, \`description\` text, \`imageUrl\` text, \`parentId\` int, \`isVisible\` boolean NOT NULL DEFAULT true, \`sortOrder\` int NOT NULL DEFAULT 0, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`categories_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`categories_slug_unique\` UNIQUE(\`slug\`))`,
          `CREATE TABLE IF NOT EXISTS \`coupons\` (\`id\` int AUTO_INCREMENT NOT NULL, \`code\` varchar(64) NOT NULL, \`discountType\` enum('percent','fixed_usd') NOT NULL, \`discountValue\` decimal(10,2) NOT NULL, \`maxUses\` int, \`usedCount\` int NOT NULL DEFAULT 0, \`minOrderUSD\` decimal(10,2) DEFAULT '0.00', \`expiresAt\` timestamp, \`isActive\` boolean NOT NULL DEFAULT true, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`coupons_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`coupons_code_unique\` UNIQUE(\`code\`))`,
          `CREATE TABLE IF NOT EXISTS \`exchange_rates\` (\`id\` int AUTO_INCREMENT NOT NULL, \`fromCurrency\` varchar(8) NOT NULL, \`toCurrency\` varchar(8) NOT NULL, \`rate\` decimal(18,6) NOT NULL, \`source\` varchar(64) NOT NULL DEFAULT 'manual', \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`exchange_rates_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`fulfillment_records\` (\`id\` int AUTO_INCREMENT NOT NULL, \`orderId\` int NOT NULL, \`orderItemId\` int, \`providerKey\` varchar(64) NOT NULL, \`supplierOrderId\` varchar(256), \`status\` enum('pending','success','failed','partial') NOT NULL, \`deliveryData\` text, \`rawResponse\` json, \`errorMessage\` text, \`userViewed\` boolean NOT NULL DEFAULT false, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`fulfillment_records_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`notifications\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`type\` varchar(64) NOT NULL, \`title\` varchar(256) NOT NULL, \`message\` text NOT NULL, \`isRead\` boolean NOT NULL DEFAULT false, \`relatedOrderId\` int, \`relatedTicketId\` int, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`notifications_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`order_items\` (\`id\` int AUTO_INCREMENT NOT NULL, \`orderId\` int NOT NULL, \`productId\` int NOT NULL, \`productTitle\` varchar(512) NOT NULL, \`quantity\` int NOT NULL, \`unitPriceUSD\` decimal(18,2) NOT NULL, \`totalPriceUSD\` decimal(18,2) NOT NULL, \`supplierProductId\` varchar(256), \`providerKey\` varchar(64), \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`order_items_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`orders\` (\`id\` int AUTO_INCREMENT NOT NULL, \`orderNumber\` varchar(64) NOT NULL, \`userId\` int NOT NULL, \`status\` enum('pending_payment','paid','processing','fulfilled','partial','failed','cancelled','refunded','disputed') NOT NULL DEFAULT 'pending_payment', \`subtotalUSD\` decimal(18,2) NOT NULL, \`discountUSD\` decimal(18,2) NOT NULL DEFAULT '0.00', \`totalUSD\` decimal(18,2) NOT NULL, \`currency\` enum('NGN','USD','EUR','GBP') NOT NULL DEFAULT 'USD', \`totalInCurrency\` decimal(18,2) NOT NULL, \`exchangeRateSnapshot\` decimal(18,6), \`couponCode\` varchar(64), \`couponDiscountUSD\` decimal(18,2) DEFAULT '0.00', \`billingEmail\` varchar(320), \`billingCountry\` varchar(64), \`fraudFlag\` boolean NOT NULL DEFAULT false, \`fraudReason\` text, \`isLocked\` boolean NOT NULL DEFAULT false, \`adminNotes\` text, \`supplierOrderId\` varchar(256), \`supplierStatus\` varchar(64), \`fulfillmentRetries\` int NOT NULL DEFAULT 0, \`lastFulfillmentAttempt\` timestamp, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`orders_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`orders_orderNumber_unique\` UNIQUE(\`orderNumber\`))`,
          `CREATE TABLE IF NOT EXISTS \`payment_events\` (\`id\` int AUTO_INCREMENT NOT NULL, \`paymentId\` int, \`orderId\` int, \`gateway\` varchar(64) NOT NULL, \`eventType\` varchar(128) NOT NULL, \`payload\` json, \`isProcessed\` boolean NOT NULL DEFAULT false, \`isDuplicate\` boolean NOT NULL DEFAULT false, \`processedAt\` timestamp, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`payment_events_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`payments\` (\`id\` int AUTO_INCREMENT NOT NULL, \`orderId\` int NOT NULL, \`userId\` int NOT NULL, \`gateway\` varchar(64) NOT NULL, \`gatewayReference\` varchar(256), \`gatewayTransactionId\` varchar(256), \`status\` enum('pending','success','failed','refunded','disputed') NOT NULL DEFAULT 'pending', \`amount\` decimal(18,2) NOT NULL, \`currency\` enum('NGN','USD','EUR','GBP') NOT NULL, \`amountUSD\` decimal(18,2), \`exchangeRate\` decimal(18,6), \`paymentMethod\` varchar(64), \`metadata\` json, \`webhookVerified\` boolean NOT NULL DEFAULT false, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`payments_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`payments_gatewayReference_unique\` UNIQUE(\`gatewayReference\`))`,
          `CREATE TABLE IF NOT EXISTS \`products\` (\`id\` int AUTO_INCREMENT NOT NULL, \`slug\` varchar(256) NOT NULL, \`supplierProductId\` varchar(256), \`providerKey\` varchar(64) NOT NULL, \`categoryId\` int, \`title\` varchar(512) NOT NULL, \`description\` text, \`shortDescription\` text, \`imageUrl\` text, \`tags\` json, \`supplierPrice\` decimal(18,8) NOT NULL, \`supplierCurrency\` varchar(16) NOT NULL DEFAULT 'USD', \`markupPercent\` decimal(10,2) NOT NULL DEFAULT '20.00', \`customerPriceUSD\` decimal(18,2) NOT NULL, \`customerPriceNGN\` decimal(18,2), \`stockQuantity\` int NOT NULL DEFAULT 0, \`stockUnlimited\` boolean NOT NULL DEFAULT false, \`isVisible\` boolean NOT NULL DEFAULT true, \`isFeatured\` boolean NOT NULL DEFAULT false, \`isDigital\` boolean NOT NULL DEFAULT true, \`regionRestrictions\` json, \`allowedPaymentMethods\` json, \`riskFlag\` boolean NOT NULL DEFAULT false, \`requiresAgeVerification\` boolean NOT NULL DEFAULT false, \`deliveryNote\` text, \`refundPolicy\` text, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`products_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`products_slug_unique\` UNIQUE(\`slug\`))`,
          `CREATE TABLE IF NOT EXISTS \`provider_configs\` (\`id\` int AUTO_INCREMENT NOT NULL, \`providerKey\` varchar(64) NOT NULL, \`displayName\` varchar(128) NOT NULL, \`baseUrl\` text NOT NULL, \`apiKey\` text, \`webhookSecret\` text, \`isEnabled\` boolean NOT NULL DEFAULT true, \`syncIntervalMinutes\` int NOT NULL DEFAULT 30, \`lastSyncAt\` timestamp, \`defaultMarkupPercent\` decimal(10,2) NOT NULL DEFAULT '20.00', \`settings\` json, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`provider_configs_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`provider_configs_providerKey_unique\` UNIQUE(\`providerKey\`))`,
          `CREATE TABLE IF NOT EXISTS \`provider_sync_logs\` (\`id\` int AUTO_INCREMENT NOT NULL, \`providerKey\` varchar(64) NOT NULL, \`syncType\` enum('categories','products','stock','prices','full') NOT NULL, \`status\` enum('running','success','failed','partial') NOT NULL, \`itemsSynced\` int DEFAULT 0, \`itemsFailed\` int DEFAULT 0, \`errorMessage\` text, \`startedAt\` timestamp NOT NULL DEFAULT (now()), \`completedAt\` timestamp, CONSTRAINT \`provider_sync_logs_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`saved_products\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`productId\` int NOT NULL, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`saved_products_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`supplier_products\` (\`id\` int AUTO_INCREMENT NOT NULL, \`providerKey\` varchar(64) NOT NULL, \`supplierProductId\` varchar(256) NOT NULL, \`supplierCategoryId\` varchar(128), \`supplierSlug\` varchar(256), \`rawTitle\` text, \`rawDescription\` text, \`rawPrice\` decimal(18,8), \`rawCurrency\` varchar(16), \`rawStock\` int DEFAULT 0, \`rawData\` json, \`lastSyncedAt\` timestamp NOT NULL DEFAULT (now()), \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`supplier_products_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`support_tickets\` (\`id\` int AUTO_INCREMENT NOT NULL, \`ticketNumber\` varchar(32) NOT NULL, \`userId\` int NOT NULL, \`orderId\` int, \`subject\` varchar(512) NOT NULL, \`status\` enum('open','pending','resolved','closed') NOT NULL DEFAULT 'open', \`priority\` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium', \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, \`resolvedAt\` timestamp, CONSTRAINT \`support_tickets_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`support_tickets_ticketNumber_unique\` UNIQUE(\`ticketNumber\`))`,
          `CREATE TABLE IF NOT EXISTS \`system_logs\` (\`id\` int AUTO_INCREMENT NOT NULL, \`level\` enum('info','warn','error','critical') NOT NULL, \`category\` varchar(64) NOT NULL, \`message\` text NOT NULL, \`details\` json, \`userId\` int, \`orderId\` int, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`system_logs_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`ticket_messages\` (\`id\` int AUTO_INCREMENT NOT NULL, \`ticketId\` int NOT NULL, \`senderId\` int NOT NULL, \`senderRole\` enum('user','admin') NOT NULL, \`message\` text NOT NULL, \`attachmentUrl\` text, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`ticket_messages_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`user_sessions\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`sessionToken\` varchar(256) NOT NULL, \`ipAddress\` varchar(64), \`userAgent\` text, \`expiresAt\` timestamp NOT NULL, \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`user_sessions_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`user_sessions_sessionToken_unique\` UNIQUE(\`sessionToken\`))`,
          // users columns
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`username\` varchar(64)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`passwordHash\` text`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`country\` varchar(64)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`referralCode\` varchar(32)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`referredBy\` varchar(32)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`emailVerified\` boolean DEFAULT false NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`emailVerifyToken\` varchar(128)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`passwordResetToken\` varchar(128)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`passwordResetExpiry\` timestamp`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`isSuspended\` boolean DEFAULT false NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`suspendedReason\` text`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`twoFactorEnabled\` boolean DEFAULT false NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`twoFactorSecret\` varchar(64)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`notifyEmail\` boolean DEFAULT true NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`notifyOrders\` boolean DEFAULT true NOT NULL`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`preferredCurrency\` enum('NGN','USD','EUR','GBP') DEFAULT 'USD' NOT NULL`
        ]
      },
      {
        name: "0002_wallets",
        sql: [
          `CREATE TABLE IF NOT EXISTS \`wallet_transactions\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`type\` enum('deposit','spend','refund','adjustment') NOT NULL, \`amountUSD\` decimal(18,6) NOT NULL, \`balanceAfterUSD\` decimal(18,6) NOT NULL, \`description\` varchar(512) NOT NULL, \`reference\` varchar(256), \`orderId\` int, \`paymentId\` int, \`status\` enum('pending','completed','failed','reversed') NOT NULL DEFAULT 'completed', \`gateway\` varchar(64), \`gatewayRef\` varchar(256), \`createdAt\` timestamp NOT NULL DEFAULT (now()), CONSTRAINT \`wallet_transactions_id\` PRIMARY KEY(\`id\`))`,
          `CREATE TABLE IF NOT EXISTS \`wallets\` (\`id\` int AUTO_INCREMENT NOT NULL, \`userId\` int NOT NULL, \`balanceUSD\` decimal(18,6) NOT NULL DEFAULT '0.000000', \`totalDeposited\` decimal(18,6) NOT NULL DEFAULT '0.000000', \`totalSpent\` decimal(18,6) NOT NULL DEFAULT '0.000000', \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`wallets_id\` PRIMARY KEY(\`id\`), CONSTRAINT \`wallets_userId_unique\` UNIQUE(\`userId\`))`
        ]
      },
      {
        name: "0003_supplier_refund_claims",
        sql: [
          `CREATE TABLE IF NOT EXISTS \`supplier_refund_claims\` (\`id\` int AUTO_INCREMENT NOT NULL, \`raisedByAdminId\` int NOT NULL, \`ticketId\` int, \`orderId\` int, \`providerKey\` varchar(64) NOT NULL, \`supplierOrderId\` varchar(256), \`claimAmountUSD\` decimal(18,6) NOT NULL, \`reason\` text NOT NULL, \`status\` enum('draft','submitted','acknowledged','approved','partially_approved','rejected','resolved','cancelled') NOT NULL DEFAULT 'draft', \`approvedAmountUSD\` decimal(18,6), \`supplierResponse\` text, \`supplierRefundRef\` varchar(256), \`adminNotes\` text, \`communicationLog\` json, \`creditedToCustomer\` boolean NOT NULL DEFAULT false, \`submittedAt\` timestamp, \`resolvedAt\` timestamp, \`createdAt\` timestamp NOT NULL DEFAULT (now()), \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT \`supplier_refund_claims_id\` PRIMARY KEY(\`id\`))`
        ]
      },
      {
        name: "0004_otp_columns",
        sql: [
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`otpCode\` varchar(6)`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`otpExpiry\` timestamp`,
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`otpPurpose\` varchar(16)`
        ]
      },
      {
        name: "0005_lastLoginIp",
        sql: [
          `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`lastLoginIp\` varchar(64)`
        ]
      },
      {
        name: "0007_deliveryFormat",
        sql: [
          `ALTER TABLE \`products\` ADD COLUMN IF NOT EXISTS \`deliveryFormat\` text`
        ]
      }
    ];
    const results = [];
    for (const migration of migrations) {
      for (const sql3 of migration.sql) {
        try {
          await db.execute(sql3);
          results.push({ migration: migration.name, statement: sql3.slice(0, 60) + "...", status: "ok" });
        } catch (err) {
          const msg = err?.message ?? String(err);
          if (msg.includes("already exists") || msg.includes("Duplicate column") || msg.includes("Multiple primary key") || msg.includes("Duplicate key name")) {
            results.push({ migration: migration.name, statement: sql3.slice(0, 60) + "...", status: "skipped (already exists)" });
          } else {
            results.push({ migration: migration.name, statement: sql3.slice(0, 60) + "...", status: "error", error: msg });
          }
        }
      }
    }
    const errors = results.filter((r) => r.status === "error");
    return {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      skipped: results.filter((r) => r.status.startsWith("skipped")).length,
      errors: errors.length,
      errorDetails: errors,
      results
    };
  })
});

// server/routers.ts
import { Resend as Resend2 } from "resend";
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError4({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var appRouter = router({
  system: systemRouter,
  // ── Auth ────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    register: customAuthRouter.register,
    verifyOtp: customAuthRouter.verifyOtp,
    loginRequest: customAuthRouter.loginRequest,
    resendOtp: customAuthRouter.resendOtp,
    forgotPassword: customAuthRouter.forgotPassword,
    resetPassword: customAuthRouter.resetPassword,
    changePassword: customAuthRouter.changePassword,
    adminLogin: customAuthRouter.adminLogin,
    generateReferralCode: customAuthRouter.generateReferralCode,
    claimTelegramBonus: protectedProcedure.mutation(({ ctx }) => claimTelegramBonus(ctx.user.id)),
    // Admin account settings (2FA + password)
    changeAdminPassword: adminAccountRouter.changeAdminPassword,
    setupTotp: adminAccountRouter.setupTotp,
    verifyTotp: adminAccountRouter.verifyTotp,
    disableTotp: adminAccountRouter.disableTotp,
    getTotpStatus: adminAccountRouter.getTotpStatus,
    getSessionInfo: adminAccountRouter.getSessionInfo
  }),
  // ── Categories ──────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => getCategories()),
    listWithCounts: publicProcedure.query(() => getCategoriesWithCounts()),
    getBySlug: publicProcedure.input(z3.object({ slug: z3.string() })).query(({ input }) => getCategoryBySlug(input.slug)),
    getSubcategories: publicProcedure.input(z3.object({ parentId: z3.number() })).query(({ input }) => getSubcategoriesByParentId(input.parentId))
  }),
  // ── Products ────────────────────────────────────────────────────────────
  products: router({
    getFeatured: publicProcedure.query(() => getFeaturedProducts()),
    list: publicProcedure.input(z3.object({
      categoryId: z3.number().optional(),
      categorySlug: z3.string().optional(),
      search: z3.string().optional(),
      sort: z3.enum(["newest", "price_asc", "price_desc", "popular"]).optional(),
      featured: z3.boolean().optional(),
      page: z3.number().default(1),
      limit: z3.number().default(24)
    })).query(({ input }) => getProducts(input)),
    getBySlug: publicProcedure.input(z3.object({ slug: z3.string() })).query(({ input }) => getProductBySlug(input.slug))
  }),
  // ── Cart / Checkout ─────────────────────────────────────────────────────
  cart: router({
    validateCoupon: publicProcedure.input(z3.object({ code: z3.string(), subtotalUSD: z3.number() })).mutation(({ input }) => validateCoupon(input.code, input.subtotalUSD))
  }),
  // ── Orders ──────────────────────────────────────────────────────────────
  orders: router({
    create: protectedProcedure.input(z3.object({
      items: z3.array(z3.object({
        productId: z3.number(),
        quantity: z3.number().min(1)
      })),
      currency: z3.enum(["NGN", "USD", "EUR", "GBP"]).default("USD"),
      couponCode: z3.string().optional(),
      billingEmail: z3.string().optional(),
      billingCountry: z3.string().optional()
    })).mutation(({ input, ctx }) => createOrder(ctx.user.id, input)),
    list: protectedProcedure.input(z3.object({
      status: z3.string().optional(),
      page: z3.number().default(1),
      limit: z3.number().default(20)
    })).query(({ input, ctx }) => getUserOrders(ctx.user.id, input)),
    getById: protectedProcedure.input(z3.object({ id: z3.number() })).query(({ input, ctx }) => getUserOrderById(ctx.user.id, input.id)),
    getDelivery: protectedProcedure.input(z3.object({ orderId: z3.number() })).query(({ input, ctx }) => getOrderDelivery(ctx.user.id, input.orderId))
  }),
  // ── Payments ────────────────────────────────────────────────────────────
  payments: router({
    initiate: protectedProcedure.input(z3.object({
      orderId: z3.number(),
      gateway: z3.enum(["paystack", "flutterwave", "nowpayments"]),
      currency: z3.enum(["NGN", "USD", "EUR", "GBP"])
    })).mutation(({ input, ctx }) => {
      const origin = process.env.NODE_ENV === "production" ? "https://bulnix.com" : `http://${ctx.req.headers.host ?? "localhost:3000"}`;
      return initiatePayment(ctx.user.id, input, origin);
    }),
    getStatus: protectedProcedure.input(z3.object({ orderId: z3.number() })).query(({ input, ctx }) => getPaymentStatus(ctx.user.id, input.orderId)),
    payWithWallet: protectedProcedure.input(z3.object({ orderId: z3.number() })).mutation(({ input, ctx }) => payOrderWithWallet(ctx.user.id, input.orderId))
  }),
  // ── Support Tickets ─────────────────────────────────────────────────────
  tickets: router({
    create: protectedProcedure.input(z3.object({
      subject: z3.string().min(5).max(512),
      message: z3.string().min(10),
      orderId: z3.number().optional(),
      priority: z3.enum(["low", "medium", "high", "urgent"]).default("medium")
    })).mutation(({ input, ctx }) => createTicket(ctx.user.id, input)),
    list: protectedProcedure.query(({ ctx }) => getUserTickets(ctx.user.id)),
    getById: protectedProcedure.input(z3.object({ id: z3.number() })).query(({ input, ctx }) => getTicketById(ctx.user.id, input.id)),
    reply: protectedProcedure.input(z3.object({ ticketId: z3.number(), message: z3.string().min(1) })).mutation(({ input, ctx }) => replyToTicket(ctx.user.id, "user", input))
  }),
  // ── User Profile ────────────────────────────────────────────────────────
  user: router({
    updateProfile: protectedProcedure.input(z3.object({
      name: z3.string().optional(),
      country: z3.string().optional(),
      preferredCurrency: z3.enum(["NGN", "USD", "EUR", "GBP"]).optional(),
      notifyEmail: z3.boolean().optional(),
      notifyOrders: z3.boolean().optional()
    })).mutation(({ input, ctx }) => updateUserProfile(ctx.user.id, input)),
    getSavedProducts: protectedProcedure.query(({ ctx }) => getSavedProducts(ctx.user.id)),
    toggleSavedProduct: protectedProcedure.input(z3.object({ productId: z3.number() })).mutation(({ input, ctx }) => toggleSavedProduct(ctx.user.id, input.productId)),
    getNotifications: protectedProcedure.query(({ ctx }) => getUserNotifications(ctx.user.id)),
    markNotificationRead: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(({ input, ctx }) => markNotificationRead(ctx.user.id, input.id))
  }),
  // ── Exchange Rates ──────────────────────────────────────────────────────
  rates: router({
    list: publicProcedure.query(() => getExchangeRates()),
    refresh: adminProcedure2.mutation(() => fetchAndCacheExchangeRates())
  }),
  // ── Admin ───────────────────────────────────────────────────────────────
  admin: router({
    // Dashboard stats
    getStats: adminProcedure2.query(() => getAdminStats()),
    // Products
    products: router({
      list: adminProcedure2.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(50), search: z3.string().optional() })).query(({ input }) => adminGetProducts(input)),
      create: adminProcedure2.input(z3.object({
        title: z3.string(),
        slug: z3.string(),
        description: z3.string().optional(),
        imageUrl: z3.string().optional(),
        categoryId: z3.number().optional(),
        supplierPrice: z3.number(),
        markupPercent: z3.number().default(20),
        stockQuantity: z3.number().default(0),
        stockUnlimited: z3.boolean().default(false),
        deliveryNote: z3.string().optional(),
        deliveryFormat: z3.string().optional(),
        isVisible: z3.boolean().default(true),
        isFeatured: z3.boolean().default(false)
      })).mutation(({ input }) => adminCreateProduct(input)),
      update: adminProcedure2.input(z3.object({
        id: z3.number(),
        title: z3.string().optional(),
        description: z3.string().optional(),
        imageUrl: z3.string().optional(),
        markupPercent: z3.number().optional(),
        isVisible: z3.boolean().optional(),
        isFeatured: z3.boolean().optional(),
        categoryId: z3.number().optional(),
        regionRestrictions: z3.array(z3.string()).optional(),
        allowedPaymentMethods: z3.array(z3.string()).optional(),
        deliveryNote: z3.string().optional(),
        deliveryFormat: z3.string().optional(),
        refundPolicy: z3.string().optional()
      })).mutation(({ input }) => adminUpdateProduct(input))
    }),
    // Orders
    orders: router({
      list: adminProcedure2.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(50), status: z3.string().optional(), search: z3.string().optional() })).query(({ input }) => adminGetOrders(input)),
      getDetail: adminProcedure2.input(z3.object({ orderId: z3.number() })).query(({ input }) => adminGetOrderDetail(input.orderId)),
      update: adminProcedure2.input(z3.object({ id: z3.number(), status: z3.string().optional(), adminNotes: z3.string().optional(), fraudFlag: z3.boolean().optional() })).mutation(({ input }) => adminUpdateOrder(input)),
      retryFulfillment: adminProcedure2.input(z3.object({ orderId: z3.number() })).mutation(({ input }) => adminRetryFulfillment(input.orderId)),
      manualRefund: adminProcedure2.input(z3.object({
        orderId: z3.number(),
        amountUSD: z3.number().min(0.01),
        reason: z3.string().min(3)
      })).mutation(({ input, ctx }) => adminOrderManualRefund(ctx.user.id, input))
    }),
    // Users
    users: router({
      list: adminProcedure2.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(50), search: z3.string().optional() })).query(({ input }) => adminGetUsers(input)),
      getDetail: adminProcedure2.input(z3.object({ userId: z3.number() })).query(({ input }) => adminGetUserDetail(input.userId)),
      suspend: adminProcedure2.input(z3.object({ userId: z3.number(), reason: z3.string().optional() })).mutation(({ input }) => adminSuspendUser(input.userId, input.reason)),
      reactivate: adminProcedure2.input(z3.object({ userId: z3.number() })).mutation(({ input }) => adminReactivateUser(input.userId)),
      topUp: adminProcedure2.input(z3.object({ userId: z3.number(), amountUSD: z3.number().positive(), note: z3.string().optional() })).mutation(({ input, ctx }) => adminTopUpUserWallet(ctx.user.id, input.userId, input.amountUSD, input.note ?? "Manual top-up by admin"))
    }),
    // Refunds
    refunds: router({
      process: adminProcedure2.input(z3.object({
        userId: z3.number(),
        amountUSD: z3.number().min(0.01),
        reason: z3.string().min(5),
        orderId: z3.number().optional(),
        ticketId: z3.number().optional()
      })).mutation(({ input, ctx }) => adminProcessRefund(ctx.user.id, input))
    }),
    // Tickets
    tickets: router({
      list: adminProcedure2.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(50), status: z3.string().optional() })).query(({ input }) => adminGetTickets(input)),
      reply: adminProcedure2.input(z3.object({ ticketId: z3.number(), message: z3.string().min(1), closeTicket: z3.boolean().optional() })).mutation(({ input, ctx }) => adminReplyToTicket(ctx.user.id, input))
    }),
    // Generate descriptions for products missing them
    generateFaddedDescriptions: adminProcedure2.mutation(() => generateFaddedDescriptions()),
    // Provider configs
    providers: router({
      list: adminProcedure2.query(() => getProviderConfigs()),
      update: adminProcedure2.input(z3.object({
        providerKey: z3.string(),
        apiKey: z3.string().optional(),
        isEnabled: z3.boolean().optional(),
        syncIntervalMinutes: z3.number().optional(),
        defaultMarkupPercent: z3.number().optional()
      })).mutation(({ input }) => updateProviderConfig(input)),
      triggerSync: adminProcedure2.input(z3.object({ providerKey: z3.string(), syncType: z3.enum(["categories", "products", "stock", "prices", "full"]) })).mutation(({ input }) => triggerProviderSync(input.providerKey, input.syncType)),
      syncLogs: adminProcedure2.query(() => getProviderSyncLogs()),
      getAccsZoneBalance: adminProcedure2.query(() => getAccsZoneBalance()),
      getFaddedBalance: adminProcedure2.query(() => getFaddedBalance()),
      applyMarkupToAll: adminProcedure2.input(z3.object({ providerKey: z3.string(), markupPercent: z3.number().min(0).max(500) })).mutation(({ input }) => applyMarkupToAllProducts(input.providerKey, input.markupPercent))
    }),
    // Categories
    categories: router({
      list: adminProcedure2.query(() => getAllCategories()),
      create: adminProcedure2.input(z3.object({ name: z3.string(), slug: z3.string(), description: z3.string().optional(), parentId: z3.number().optional() })).mutation(async ({ input }) => {
        const r = await createCategory(input);
        invalidateCache("categories");
        return r;
      }),
      update: adminProcedure2.input(z3.object({
        id: z3.number(),
        name: z3.string().optional(),
        slug: z3.string().optional(),
        description: z3.string().optional(),
        imageUrl: z3.string().optional(),
        parentId: z3.number().nullable().optional(),
        isVisible: z3.boolean().optional(),
        sortOrder: z3.number().optional()
      })).mutation(async ({ input }) => {
        const r = await updateCategory(input);
        invalidateCache("categories");
        return r;
      }),
      delete: adminProcedure2.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
        const r = await deleteCategory(input.id);
        invalidateCache("categories");
        return r;
      })
    }),
    // Supplier Refund Claims
    supplierRefunds: router({
      list: adminProcedure2.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(50), status: z3.string().optional(), providerKey: z3.string().optional() })).query(({ input }) => listSupplierRefundClaims(input)),
      get: adminProcedure2.input(z3.object({ claimId: z3.number() })).query(({ input }) => getSupplierRefundClaim(input.claimId)),
      create: adminProcedure2.input(z3.object({
        ticketId: z3.number().optional(),
        orderId: z3.number().optional(),
        providerKey: z3.string().default("accszone"),
        supplierOrderId: z3.string().optional(),
        claimAmountUSD: z3.number().min(0.01),
        reason: z3.string().min(10),
        adminNotes: z3.string().optional()
      })).mutation(({ input, ctx }) => createSupplierRefundClaim(ctx.user.id, input)),
      submit: adminProcedure2.input(z3.object({ claimId: z3.number() })).mutation(({ input, ctx }) => submitSupplierRefundClaim(ctx.user.id, input.claimId)),
      update: adminProcedure2.input(z3.object({
        claimId: z3.number(),
        status: z3.enum(["acknowledged", "approved", "partially_approved", "rejected", "resolved", "cancelled"]).optional(),
        approvedAmountUSD: z3.number().optional(),
        supplierResponse: z3.string().optional(),
        supplierRefundRef: z3.string().optional(),
        adminNotes: z3.string().optional(),
        addLogEntry: z3.object({ message: z3.string(), direction: z3.enum(["inbound", "outbound"]), type: z3.string() }).optional(),
        creditToCustomer: z3.boolean().optional(),
        customerUserId: z3.number().optional()
      })).mutation(({ input, ctx }) => updateSupplierRefundClaim(ctx.user.id, input))
    }),
    // System logs
    logs: router({
      list: adminProcedure2.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(100), level: z3.string().optional(), category: z3.string().optional() })).query(({ input }) => getSystemLogs(input))
    }),
    // Exchange rates
    rates: router({
      update: adminProcedure2.input(z3.object({ fromCurrency: z3.string(), toCurrency: z3.string(), rate: z3.number() })).mutation(({ input }) => updateExchangeRate(input))
    })
  }),
  // ── Wallet ──────────────────────────────────────────────────────────────
  wallet: router({
    get: protectedProcedure.query(({ ctx }) => getOrCreateWallet(ctx.user.id)),
    transactions: protectedProcedure.input(z3.object({ page: z3.number().default(1), limit: z3.number().default(20) })).query(({ input, ctx }) => getWalletTransactions(ctx.user.id, input.page, input.limit)),
    initiateTopup: protectedProcedure.input(z3.object({
      amountUSD: z3.number().min(1),
      gateway: z3.enum(["flutterwave", "nowpayments", "korapay"])
    })).mutation(({ input, ctx }) => {
      const gatewayMins = { korapay: 1, flutterwave: 1, nowpayments: 20 };
      const minAmount = gatewayMins[input.gateway] ?? 1;
      if (input.amountUSD < minAmount) {
        throw new TRPCError4({ code: "BAD_REQUEST", message: `Minimum deposit for this payment method is $${minAmount.toFixed(2)}` });
      }
      const origin = process.env.NODE_ENV === "production" ? "https://bulnix.com" : `http://${ctx.req.headers.host ?? "localhost:3000"}`;
      return initiateWalletTopup(ctx.user.id, input.amountUSD, input.gateway, origin);
    }),
    confirmTopup: protectedProcedure.input(z3.object({ reference: z3.string() })).mutation(({ input }) => confirmWalletTopup(input.reference))
  }),
  // ── Supplier Sync (internal) ────────────────────────────────────────────
  supplier: router({
    syncStatus: adminProcedure2.query(() => getProviderSyncLogs())
  }),
  // ── Support Triage ────────────────────────────────────────────────────────
  support: router({
    /**
     * Called when the user completes the triage bot and is redirected to WhatsApp.
     * Sends a confirmation email to the user with their issue summary.
     */
    submitTriage: publicProcedure.input(z3.object({
      email: z3.string().email().optional(),
      name: z3.string().optional(),
      issueSummary: z3.string().min(1),
      steps: z3.array(z3.string())
    })).mutation(async ({ input }) => {
      if (!input.email) return { sent: false };
      const client = process.env.RESEND_API_KEY ? new Resend2(process.env.RESEND_API_KEY) : null;
      if (!client) return { sent: false };
      const stepsHtml = input.steps.map((s) => `<li style="margin-bottom:6px;color:#94a3b8;font-size:14px;">${s}</li>`).join("");
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{margin:0;padding:0;background:#0B0F19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0}.wrapper{max-width:600px;margin:0 auto;padding:40px 20px}.card{background:#0F172A;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px}h1{font-size:22px;font-weight:700;color:#fff;margin:0 0 12px}p{font-size:15px;line-height:1.6;color:#94a3b8;margin:0 0 16px}.highlight{background:rgba(0,185,233,0.08);border:1px solid rgba(0,185,233,0.2);border-radius:10px;padding:20px 24px;margin:20px 0}.label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#475569;margin-bottom:4px}.footer{text-align:center;margin-top:32px;font-size:12px;color:#334155}</style></head><body><div class="wrapper"><div class="card"><img src="https://static-assets.manus.space/manus-storage/bulnix-logo-new_03e40d5d.jpg" alt="Bulnix" style="height:36px;margin-bottom:28px;"/><h1>Your Support Request Has Been Received</h1><p>Hi ${input.name || "there"}, thank you for reaching out to Bulnix Support. Here's a summary of your issue that has been shared with our team on WhatsApp.</p><div class="highlight"><div class="label">Issue Summary</div><div style="color:#e2e8f0;font-size:15px;margin-bottom:16px;">${input.issueSummary}</div><div class="label">Steps Completed</div><ul style="margin:8px 0 0;padding-left:20px;">${stepsHtml}</ul></div><p>Our support team will follow up with you on WhatsApp shortly. If you haven't connected yet, you can reach us at <a href="https://wa.me/447988531474" style="color:#00B9E9;">wa.me/447988531474</a>.</p><div class="footer">Bulnix &bull; <a href="https://bulnix.com" style="color:#475569;">bulnix.com</a></div></div></div></body></html>`;
      try {
        await client.emails.send({
          from: `Bulnix Support <${process.env.EMAIL_FROM ?? "noreply@bulnix.com"}>`,
          replyTo: process.env.EMAIL_REPLY_TO ?? "bulnixsupport@gmail.com",
          to: input.email,
          subject: `Your Bulnix Support Request \u2014 ${input.issueSummary.slice(0, 60)}`,
          html
        });
        const adminAlertHtml = `<html><body style="font-family:sans-serif;background:#0B0F19;color:#e2e8f0;padding:24px"><h2 style="color:#00B9E9;margin-bottom:16px">New Support Request</h2><table style="border-collapse:collapse;width:100%"><tr><td style="padding:8px 0;color:#94a3b8;width:100px">From</td><td style="padding:8px 0;color:#e2e8f0">${input.name || "Anonymous"} &lt;${input.email}&gt;</td></tr><tr><td style="padding:8px 0;color:#94a3b8">Issue</td><td style="padding:8px 0;color:#e2e8f0">${input.issueSummary}</td></tr></table><div style="margin-top:16px"><p style="color:#94a3b8;margin-bottom:8px">Steps completed:</p><ol style="margin:0;padding-left:20px">${input.steps.map((s) => `<li style="margin-bottom:4px;color:#e2e8f0">${s}</li>`).join("")}</ol></div><p style="margin-top:24px;color:#475569;font-size:12px">Sent from Bulnix Support Bot &bull; bulnix.com</p></body></html>`;
        try {
          await client.emails.send({
            from: `Bulnix Support <${process.env.EMAIL_FROM ?? "noreply@bulnix.com"}>`,
            replyTo: input.email ?? "noreply@bulnix.com",
            to: "bulnixsupport@gmail.com",
            subject: `[Support Request] ${input.issueSummary.slice(0, 80)} \u2014 ${input.name || input.email}`,
            html: adminAlertHtml
          });
        } catch (adminEmailErr) {
          console.error("[support.submitTriage] admin alert email error:", adminEmailErr);
        }
        return { sent: true };
      } catch (err) {
        console.error("[support.submitTriage] email error:", err);
        return { sent: false };
      }
    })
  }),
  // ── Manual Products (admin) ──────────────────────────────────────────────
  manualProducts: router({
    create: adminProcedure2.input(z3.object({
      title: z3.string().min(2),
      description: z3.string().optional(),
      shortDescription: z3.string().optional(),
      categoryId: z3.number().optional(),
      customerPriceUSD: z3.number().positive(),
      imageUrl: z3.string().optional(),
      isSubscription: z3.boolean().optional(),
      deliveryNote: z3.string().optional(),
      isVisible: z3.boolean().optional()
    })).mutation(({ input }) => adminCreateManualProduct(input)),
    update: adminProcedure2.input(z3.object({
      id: z3.number(),
      title: z3.string().optional(),
      description: z3.string().optional(),
      shortDescription: z3.string().optional(),
      categoryId: z3.number().nullable().optional(),
      customerPriceUSD: z3.number().positive().optional(),
      imageUrl: z3.string().optional(),
      isSubscription: z3.boolean().optional(),
      deliveryNote: z3.string().optional(),
      isVisible: z3.boolean().optional(),
      isFeatured: z3.boolean().optional()
    })).mutation(({ input }) => {
      const { id, ...rest } = input;
      return adminUpdateManualProduct(id, rest);
    }),
    delete: adminProcedure2.input(z3.object({ id: z3.number() })).mutation(({ input }) => adminDeleteManualProduct(input.id)),
    addCredentials: adminProcedure2.input(z3.object({ productId: z3.number(), lines: z3.array(z3.string()) })).mutation(({ input }) => addProductCredentials(input.productId, input.lines)),
    getCredentials: adminProcedure2.input(z3.object({ productId: z3.number(), includeUsed: z3.boolean().optional() })).query(({ input }) => getProductCredentials(input.productId, input.includeUsed)),
    deleteCredential: adminProcedure2.input(z3.object({ id: z3.number() })).mutation(({ input }) => deleteProductCredential(input.id)),
    deliverSubscription: adminProcedure2.input(z3.object({ orderId: z3.number(), deliveryData: z3.string().min(1) })).mutation(({ input }) => adminDeliverSubscription(input.orderId, input.deliveryData))
  }),
  // ── Reward Points ─────────────────────────────────────────────────────────
  rewards: router({
    getPoints: protectedProcedure.query(({ ctx }) => getUserRewardPoints(ctx.user.id)),
    getTransactions: protectedProcedure.query(({ ctx }) => getRewardTransactions(ctx.user.id)),
    redeem: protectedProcedure.input(z3.object({ points: z3.number().int().positive() })).mutation(({ ctx, input }) => redeemPointsToWallet(ctx.user.id, input.points)),
    getSettings: adminProcedure2.query(() => getRewardSettings()),
    updateSetting: adminProcedure2.input(z3.object({ tier: z3.string(), cashbackPercent: z3.number().min(0).max(100) })).mutation(({ input }) => updateRewardSetting(input.tier, input.cashbackPercent))
  }),
  // ── Affiliate Program ─────────────────────────────────────────────────────
  affiliate: router({
    getBalance: protectedProcedure.query(({ ctx }) => getOrCreateAffiliateBalance(ctx.user.id)),
    getTransactions: protectedProcedure.query(({ ctx }) => getAffiliateTransactions(ctx.user.id)),
    requestWithdrawal: protectedProcedure.input(z3.object({
      amountUSD: z3.number().positive(),
      bankName: z3.string().min(2),
      accountNumber: z3.string().min(5),
      accountName: z3.string().min(2)
    })).mutation(({ ctx, input }) => requestAffiliateWithdrawal(ctx.user.id, input)),
    convertToWallet: protectedProcedure.input(z3.object({ amountUSD: z3.number().positive() })).mutation(({ ctx, input }) => convertAffiliateToWallet(ctx.user.id, input.amountUSD)),
    adminGetWithdrawals: adminProcedure2.input(z3.object({ status: z3.enum(["pending", "approved", "rejected"]).optional() })).query(({ input }) => adminGetAffiliateWithdrawals(input.status)),
    adminProcess: adminProcedure2.input(z3.object({ id: z3.number(), action: z3.enum(["approved", "rejected"]), adminNote: z3.string().optional() })).mutation(({ input }) => adminProcessWithdrawal(input.id, input.action, input.adminNote))
  }),
  // ── Customer API Keys ─────────────────────────────────────────────────────
  apiKeys: router({
    list: protectedProcedure.query(({ ctx }) => getUserApiKeys(ctx.user.id)),
    request: protectedProcedure.input(z3.object({ label: z3.string().min(1).max(64) })).mutation(({ ctx, input }) => requestApiKey(ctx.user.id, input.label)),
    generate: protectedProcedure.input(z3.object({ label: z3.string().min(1).max(64) })).mutation(({ ctx, input }) => requestApiKey(ctx.user.id, input.label)),
    delete: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(({ ctx, input }) => deleteApiKey(input.id, ctx.user.id)),
    toggle: protectedProcedure.input(z3.object({ id: z3.number(), isEnabled: z3.boolean() })).mutation(({ ctx, input }) => toggleApiKey(input.id, ctx.user.id, input.isEnabled)),
    adminList: adminProcedure2.query(() => adminGetApiKeys()),
    adminToggle: adminProcedure2.input(z3.object({ id: z3.number(), adminEnabled: z3.boolean() })).mutation(({ input }) => adminToggleApiKey(input.id, input.adminEnabled)),
    adminApprove: adminProcedure2.input(z3.object({ id: z3.number() })).mutation(({ input }) => adminApproveApiKey(input.id)),
    adminReject: adminProcedure2.input(z3.object({ id: z3.number(), reason: z3.string().min(1).max(256) })).mutation(({ input }) => adminRejectApiKey(input.id, input.reason)),
    clearRawKeyOnce: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(({ ctx, input }) => clearRawKeyOnce(input.id, ctx.user.id))
  }),
  // ── One-time Migrations (admin only) ─────────────────────────────────────
  migrations: migrationsRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/index.ts
init_storage();
init_paystack();
init_flutterwave();
init_nowpayments();
init_korapay();
init_db();
import multer from "multer";
import { nanoid as nanoid3 } from "nanoid";

// server/sitemap.ts
init_db();
init_schema();
import { eq as eq5, and as and4 } from "drizzle-orm";
var BASE_URL7 = "https://bulnix.com";
var STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/categories", priority: "0.9", changefreq: "daily" },
  { path: "/products", priority: "0.9", changefreq: "daily" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/faq", priority: "0.6", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/refund", priority: "0.4", changefreq: "monthly" }
];
function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function toIsoDate(date) {
  if (!date) return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}
function registerSitemapRoute(app) {
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const db = await getDb();
      const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      let categoryRows = [];
      let productRows = [];
      if (db) {
        categoryRows = await db.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories).where(eq5(categories.isVisible, true));
        productRows = await db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(and4(eq5(products.isVisible, true)));
      }
      const lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
        '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
        '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">'
      ];
      for (const page of STATIC_PAGES) {
        lines.push("  <url>");
        lines.push(`    <loc>${BASE_URL7}${escapeXml(page.path)}</loc>`);
        lines.push(`    <lastmod>${now}</lastmod>`);
        lines.push(`    <changefreq>${page.changefreq}</changefreq>`);
        lines.push(`    <priority>${page.priority}</priority>`);
        lines.push("  </url>");
      }
      for (const cat of categoryRows) {
        if (!cat.slug) continue;
        lines.push("  <url>");
        lines.push(`    <loc>${BASE_URL7}/categories/${escapeXml(cat.slug)}</loc>`);
        lines.push(`    <lastmod>${toIsoDate(cat.updatedAt)}</lastmod>`);
        lines.push("    <changefreq>weekly</changefreq>");
        lines.push("    <priority>0.8</priority>");
        lines.push("  </url>");
      }
      for (const prod of productRows) {
        if (!prod.slug) continue;
        lines.push("  <url>");
        lines.push(`    <loc>${BASE_URL7}/products/${escapeXml(prod.slug)}</loc>`);
        lines.push(`    <lastmod>${toIsoDate(prod.updatedAt)}</lastmod>`);
        lines.push("    <changefreq>weekly</changefreq>");
        lines.push("    <priority>0.7</priority>");
        lines.push("  </url>");
      }
      lines.push("</urlset>");
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(lines.join("\n"));
    } catch (err) {
      console.error("[Sitemap] Error generating sitemap:", err);
      res.status(500).send("Error generating sitemap");
    }
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express3();
  const server = createServer(app);
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] && req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
  app.post("/api/webhooks/korapay", express3.raw({ type: "application/json" }), async (req, res) => {
    try {
      const signature = req.headers["x-korapay-signature"];
      const rawBody = req.body.toString("utf8");
      if (!verifyKoraSignature(rawBody, signature)) {
        await logSystem("warn", "payment", "Kora Pay webhook: invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      const event = JSON.parse(rawBody);
      const eventType = event.event ?? "";
      if (eventType === "charge.success") {
        const data = event.data;
        const reference = data.reference;
        const status = data.status ?? "";
        if (isKoraSuccess(status)) {
          try {
            await confirmWalletTopup(reference, true);
            await logSystem("info", "payment", `Kora Pay webhook: wallet topup confirmed for ref ${reference}`);
          } catch (e) {
            await logSystem("warn", "payment", `Kora Pay webhook: could not confirm topup for ref ${reference}: ${e.message}`);
          }
        }
      }
      res.status(200).json({ received: true });
    } catch (e) {
      await logSystem("error", "payment", `Kora Pay webhook error: ${e.message}`);
      res.status(500).json({ error: "Internal error" });
    }
  });
  app.post("/api/webhooks/paystack", express3.raw({ type: "application/json" }), async (req, res) => {
    try {
      const signature = req.headers["x-paystack-signature"];
      const rawBody = req.body.toString("utf8");
      if (!verifyPaystackSignature(rawBody, signature)) {
        await logSystem("warn", "payment", "Paystack webhook: invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      const event = JSON.parse(rawBody);
      const eventType = event.event;
      if (eventType === "charge.success") {
        const data = event.data;
        const reference = data.reference;
        const metadata = data.metadata ?? {};
        const topupRef = metadata.topupRef ?? reference;
        try {
          await confirmWalletTopup(topupRef, true);
          await logSystem("info", "payment", `Paystack webhook: wallet topup confirmed for ref ${topupRef}`);
        } catch (e) {
          try {
            await fulfillOrderByReference(reference, "paystack");
            await logSystem("info", "payment", `Paystack webhook: order fulfilled for ref ${reference}`);
          } catch (e2) {
            await logSystem("error", "payment", `Paystack webhook: failed to process ref ${reference}: ${e2.message}`);
          }
        }
      }
      res.status(200).json({ received: true });
    } catch (e) {
      await logSystem("error", "payment", `Paystack webhook error: ${e.message}`);
      res.status(500).json({ error: "Internal error" });
    }
  });
  app.post("/api/webhooks/flutterwave", express3.raw({ type: "application/json" }), async (req, res) => {
    try {
      const hash = req.headers["verif-hash"];
      if (!verifyFlwSignature(hash)) {
        await logSystem("warn", "payment", "Flutterwave webhook: invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      const rawBody = req.body.toString("utf8");
      const event = JSON.parse(rawBody);
      const eventType = event.event ?? "";
      if (eventType === "charge.completed") {
        const data = event.data;
        const txRef = data.tx_ref;
        const status = data.status;
        if (status === "successful") {
          try {
            await confirmWalletTopup(txRef, true);
            await logSystem("info", "payment", `Flutterwave webhook: wallet topup confirmed for txRef ${txRef}`);
          } catch (e) {
            try {
              await fulfillOrderByReference(txRef, "flutterwave");
              await logSystem("info", "payment", `Flutterwave webhook: order fulfilled for txRef ${txRef}`);
            } catch (e2) {
              await logSystem("error", "payment", `Flutterwave webhook: failed to process txRef ${txRef}: ${e2.message}`);
            }
          }
        }
      }
      res.status(200).json({ received: true });
    } catch (e) {
      await logSystem("error", "payment", `Flutterwave webhook error: ${e.message}`);
      res.status(500).json({ error: "Internal error" });
    }
  });
  app.post("/api/webhooks/nowpayments", express3.raw({ type: "application/json" }), async (req, res) => {
    try {
      const signature = req.headers["x-nowpayments-sig"];
      const rawBody = req.body.toString("utf8");
      if (!verifyNowPaymentsIpn(rawBody, signature)) {
        await logSystem("warn", "payment", "NowPayments IPN: invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      const payload = JSON.parse(rawBody);
      const paymentStatus = payload.payment_status;
      const orderId = payload.order_id;
      if (isNowPaymentsSuccess(paymentStatus)) {
        let overrideAmountUSD;
        if (isNowPaymentsPartial(paymentStatus)) {
          const fiatReceived = payload.actually_paid_at_fiat;
          const cryptoReceived = payload.actually_paid;
          const priceAmount = payload.price_amount;
          const payAmount = payload.pay_amount;
          if (fiatReceived && fiatReceived > 0) {
            overrideAmountUSD = Math.floor(fiatReceived * 100) / 100;
          } else if (cryptoReceived && payAmount && priceAmount && payAmount > 0) {
            overrideAmountUSD = Math.floor(cryptoReceived / payAmount * priceAmount * 100) / 100;
          }
          await logSystem("warn", "payment", `NowPayments IPN: partially_paid for orderId ${orderId} \u2014 crediting $${overrideAmountUSD ?? "unknown"} of $${priceAmount}`);
        }
        try {
          await confirmWalletTopup(orderId, true, overrideAmountUSD);
          const suffix = isNowPaymentsPartial(paymentStatus) ? " (partial \u2014 credited actual amount received)" : "";
          await logSystem("info", "payment", `NowPayments IPN: wallet topup confirmed for orderId ${orderId}${suffix}`);
        } catch (e) {
          try {
            await fulfillOrderByReference(orderId, "nowpayments");
            await logSystem("info", "payment", `NowPayments IPN: order fulfilled for orderId ${orderId}`);
          } catch (e2) {
            await logSystem("error", "payment", `NowPayments IPN: failed to process orderId ${orderId}: ${e2.message}`);
          }
        }
      }
      res.status(200).json({ received: true });
    } catch (e) {
      await logSystem("error", "payment", `NowPayments IPN error: ${e.message}`);
      res.status(500).json({ error: "Internal error" });
    }
  });
  app.get("/api/payments/verify", async (req, res) => {
    const { reference, tx_ref, status, type } = req.query;
    const ref = reference ?? tx_ref ?? "";
    const proto = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:3000";
    const frontendUrl = `${proto}://${host}`;
    if (type === "order") {
      res.redirect(`${frontendUrl}/orders?payment_ref=${encodeURIComponent(ref)}&status=${encodeURIComponent(status ?? "")}`);
    } else {
      res.redirect(`${frontendUrl}/wallet?topup_ref=${encodeURIComponent(ref)}&status=${encodeURIComponent(status ?? "")}`);
    }
  });
  app.get("/api/debug", async (req, res) => {
    const dbHost = process.env.DB_HOST || "(not set)";
    const dbName = process.env.DB_NAME || "(not set)";
    const dbUser = process.env.DB_USER || "(not set)";
    const dbUrl = process.env.DATABASE_URL ? "(set, length=" + process.env.DATABASE_URL.length + ")" : "(not set)";
    const jwtSecret = process.env.JWT_SECRET ? "(set, length=" + process.env.JWT_SECRET.length + ")" : "(not set)";
    let dbStatus = "not tested";
    let dbError = "";
    try {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const db = await getDb2();
      if (db) {
        dbStatus = "connected";
      } else {
        dbStatus = "null (pool failed)";
      }
    } catch (e) {
      dbStatus = "error";
      dbError = e.message;
    }
    res.json({
      node_env: process.env.NODE_ENV,
      db_host: dbHost,
      db_name: dbName,
      db_user: dbUser,
      database_url: dbUrl,
      jwt_secret: jwtSecret,
      db_status: dbStatus,
      db_error: dbError || void 0
    });
  });
  app.use(express3.json({ limit: "50mb" }));
  app.use(express3.urlencoded({ limit: "50mb", extended: true }));
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  app.post("/api/upload/image", upload.single("file"), async (req, res) => {
    try {
      const ctx = await createContext({ req, res });
      if (!ctx.user || ctx.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const ext = req.file.originalname.split(".").pop()?.toLowerCase() ?? "jpg";
      const key = `product-images/${nanoid3(12)}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ url });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerGoogleAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path: path3 }) {
        const isDbError = error.message?.includes("Failed query") || error.message?.includes("ER_") || error.message?.includes("TiDB") || error.message?.includes("mysql") || error.message?.includes("ECONNREFUSED");
        if (isDbError) {
          console.error(`[tRPC] DB error on ${path3}:`, error.message);
          error.message = "A database error occurred. Please try again shortly.";
        }
      }
    })
  );
  registerSitemapRoute(app);
  if (process.env.NODE_ENV === "development") {
    const { setupVite: setupVite2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
    await setupVite2(app, server);
  } else {
    const { serveStatic: serveStatic3 } = await Promise.resolve().then(() => (init_static(), static_exports));
    serveStatic3(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
Promise.resolve().then(() => (init_runMigrations(), runMigrations_exports)).then((m) => m.runPendingMigrations()).then(async () => {
  try {
    const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const { providerConfigs: providerConfigs2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq6 } = await import("drizzle-orm");
    const db = await getDb2();
    if (db) {
      const faddedKey = process.env.FADDED_API_KEY;
      if (faddedKey) {
        await db.update(providerConfigs2).set({ apiKey: faddedKey }).where(eq6(providerConfigs2.providerKey, "fadded"));
        console.log("[Startup] Fadded API key seeded from env.");
      }
      const accsKey = process.env.ACCSZONE_API_KEY;
      if (accsKey) {
        await db.update(providerConfigs2).set({ apiKey: accsKey }).where(eq6(providerConfigs2.providerKey, "accszone"));
        console.log("[Startup] AccsZone API key seeded from env.");
      }
      const { products: productsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const [faddedCount] = await db.select({ count: db.$count(productsTable, eq6(productsTable.providerKey, "fadded")) }).from(productsTable);
      if (!faddedCount || faddedCount.count === 0) {
        console.log("[Startup] No Fadded products found \u2014 triggering initial full sync...");
        Promise.resolve().then(() => (init_fadded(), fadded_exports)).then(
          ({ syncProvider: syncProvider3 }) => syncProvider3("fadded", "full").then((r) => console.log("[Startup] Fadded initial sync complete:", JSON.stringify(r))).catch((e) => console.error("[Startup] Fadded initial sync failed:", e))
        ).catch((e) => console.error("[Startup] Fadded import failed:", e));
      }
    }
  } catch (e) {
    console.error("[Startup] Provider API key seeding failed:", e);
  }
}).catch(
  (e) => console.error("[Migrations] Startup migration failed:", e)
);
var syncCycleCount = 0;
async function runAutoSync() {
  syncCycleCount++;
  const syncType = syncCycleCount % 4 === 0 ? "full" : "stock";
  try {
    const { syncProvider: syncProvider3 } = await Promise.resolve().then(() => (init_accszone(), accszone_exports));
    console.log(`[AutoSync] AccsZone ${syncType} sync (cycle ${syncCycleCount})...`);
    await syncProvider3("accszone", syncType);
    console.log(`[AutoSync] AccsZone ${syncType} sync complete.`);
  } catch (err) {
    console.error("[AutoSync] AccsZone error:", err);
  }
  try {
    const { syncProvider: syncFadded } = await Promise.resolve().then(() => (init_fadded(), fadded_exports));
    console.log(`[AutoSync] Fadded ${syncType} sync (cycle ${syncCycleCount})...`);
    await syncFadded("fadded", syncType);
    console.log(`[AutoSync] Fadded ${syncType} sync complete.`);
  } catch (err) {
    console.error("[AutoSync] Fadded error:", err);
  }
}
setTimeout(() => {
  runAutoSync();
  setInterval(runAutoSync, 15 * 60 * 1e3);
}, 2 * 60 * 1e3);
var lastRetryBalance = 0;
async function runAutoRetry() {
  try {
    const { getAccsZoneBalance: getAccsZoneBalance2, getFaddedBalance: getFaddedBalance2, retryAllProcessingOrders: retryAllProcessingOrders2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const balResult = await getAccsZoneBalance2();
    const balance = balResult.balance ?? 0;
    if (balance > 0) {
      const result = await retryAllProcessingOrders2();
      if (result.retried > 0) {
        console.log(`[AutoRetry] Balance $${balance.toFixed(2)} \u2014 retried ${result.retried} processing orders.`);
      }
    }
    lastRetryBalance = balance;
    await getFaddedBalance2().catch(() => {
    });
  } catch (err) {
    console.error("[AutoRetry] Error:", err);
  }
}
setTimeout(() => {
  runAutoRetry();
  setInterval(runAutoRetry, 5 * 60 * 1e3);
}, 3 * 60 * 1e3);
function msUntil2amUTC() {
  const now = /* @__PURE__ */ new Date();
  const next2am = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 2, 0, 0, 0));
  if (next2am.getTime() <= now.getTime()) {
    next2am.setUTCDate(next2am.getUTCDate() + 1);
  }
  return next2am.getTime() - now.getTime();
}
async function runDailyBackup() {
  try {
    const { runDatabaseBackupSafe: runDatabaseBackupSafe2 } = await Promise.resolve().then(() => (init_backup(), backup_exports));
    await runDatabaseBackupSafe2();
  } catch (err) {
    console.error("[Backup] Scheduler error:", err);
  }
}
var delayToFirstBackup = msUntil2amUTC();
var hoursUntilFirst = Math.round(delayToFirstBackup / 36e5 * 10) / 10;
console.log(`[Backup] Next daily backup scheduled in ${hoursUntilFirst}h (2:00 AM UTC)`);
setTimeout(() => {
  runDailyBackup();
  setInterval(runDailyBackup, 24 * 60 * 60 * 1e3);
}, delayToFirstBackup);
async function runExchangeRateRefresh() {
  try {
    const { fetchAndCacheExchangeRates: fetchAndCacheExchangeRates2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const result = await fetchAndCacheExchangeRates2();
    console.log(`[ExchangeRates] Updated ${result.updated} rates. USD/NGN = ${result.rateNGN.toFixed(2)}`);
  } catch (err) {
    console.error("[ExchangeRates] Refresh failed:", err);
  }
}
runExchangeRateRefresh();
setInterval(runExchangeRateRefresh, 6 * 60 * 60 * 1e3);
