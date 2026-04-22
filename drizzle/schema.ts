import {
  bigint,
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users & Auth ────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  username: varchar("username", { length: 64 }).unique(),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  country: varchar("country", { length: 64 }),
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
  notifyEmail: boolean("notifyEmail").default(true).notNull(),
  notifyOrders: boolean("notifyOrders").default(true).notNull(),
  preferredCurrency: mysqlEnum("preferredCurrency", ["NGN", "USD", "EUR", "GBP"]).default("USD").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  lastLoginIp: varchar("lastLoginIp", { length: 64 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionToken: varchar("sessionToken", { length: 256 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  parentId: int("parentId"),
  isVisible: boolean("isVisible").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

// ─── Supplier / Provider ──────────────────────────────────────────────────────

export const providerConfigs = mysqlTable("provider_configs", {
  id: int("id").autoincrement().primaryKey(),
  providerKey: varchar("providerKey", { length: 64 }).notNull().unique(), // "accszone" | "accsbulk"
  displayName: varchar("displayName", { length: 128 }).notNull(),
  baseUrl: text("baseUrl").notNull(),
  apiKey: text("apiKey"), // encrypted at rest
  webhookSecret: text("webhookSecret"),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  syncIntervalMinutes: int("syncIntervalMinutes").default(30).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  defaultMarkupPercent: decimal("defaultMarkupPercent", { precision: 10, scale: 2 }).default("20.00").notNull(),
  settings: json("settings"), // extra provider-specific config
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderConfig = typeof providerConfigs.$inferSelect;

export const providerSyncLogs = mysqlTable("provider_sync_logs", {
  id: int("id").autoincrement().primaryKey(),
  providerKey: varchar("providerKey", { length: 64 }).notNull(),
  syncType: mysqlEnum("syncType", ["categories", "products", "stock", "prices", "full"]).notNull(),
  status: mysqlEnum("status", ["running", "success", "failed", "partial"]).notNull(),
  itemsSynced: int("itemsSynced").default(0),
  itemsFailed: int("itemsFailed").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// ─── Supplier Products (raw from API) ────────────────────────────────────────

export const supplierProducts = mysqlTable("supplier_products", {
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
  rawData: json("rawData"), // full supplier API response
  lastSyncedAt: timestamp("lastSyncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierProduct = typeof supplierProducts.$inferSelect;

// ─── Products (our mapped/cached catalog) ────────────────────────────────────

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  supplierProductId: int("supplierProductId"), // FK to supplierProducts.id
  providerKey: varchar("providerKey", { length: 64 }).notNull(),
  categoryId: int("categoryId"),

  // Overrideable fields
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  imageUrl: text("imageUrl"),
  tags: json("tags"), // string[]

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
  regionRestrictions: json("regionRestrictions"), // string[] of blocked country codes
  allowedPaymentMethods: json("allowedPaymentMethods"), // string[] e.g. ["card","crypto","bank"]
  riskFlag: boolean("riskFlag").default(false).notNull(),
  requiresAgeVerification: boolean("requiresAgeVerification").default(false).notNull(),
  deliveryNote: text("deliveryNote"),
  deliveryFormat: text("deliveryFormat"), // Override auto-detected credential format, e.g. "Email : Password : 2FA : Facebook ID"
  refundPolicy: text("refundPolicy"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = mysqlTable("orders", {
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
    "disputed",
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productTitle: varchar("productTitle", { length: 512 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPriceUSD: decimal("unitPriceUSD", { precision: 18, scale: 2 }).notNull(),
  totalPriceUSD: decimal("totalPriceUSD", { precision: 18, scale: 2 }).notNull(),
  supplierProductId: varchar("supplierProductId", { length: 256 }),
  providerKey: varchar("providerKey", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ─── Fulfillment Records ──────────────────────────────────────────────────────

export const fulfillmentRecords = mysqlTable("fulfillment_records", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  orderItemId: int("orderItemId"),
  providerKey: varchar("providerKey", { length: 64 }).notNull(),
  supplierOrderId: varchar("supplierOrderId", { length: 256 }),
  status: mysqlEnum("status", ["pending", "success", "failed", "partial"]).notNull(),
  deliveryData: text("deliveryData"), // encrypted JSON - account credentials etc.
  rawResponse: json("rawResponse"),
  errorMessage: text("errorMessage"),
  userViewed: boolean("userViewed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FulfillmentRecord = typeof fulfillmentRecords.$inferSelect;

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = mysqlTable("payments", {
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
  paymentMethod: varchar("paymentMethod", { length: 64 }), // card, bank_transfer, crypto
  metadata: json("metadata"),
  webhookVerified: boolean("webhookVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;

export const paymentEvents = mysqlTable("payment_events", {
  id: int("id").autoincrement().primaryKey(),
  paymentId: int("paymentId"),
  orderId: int("orderId"),
  gateway: varchar("gateway", { length: 64 }).notNull(),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  payload: json("payload"),
  isProcessed: boolean("isProcessed").default(false).notNull(),
  isDuplicate: boolean("isDuplicate").default(false).notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["percent", "fixed_usd"]).notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  maxUses: int("maxUses"),
  usedCount: int("usedCount").default(0).notNull(),
  minOrderUSD: decimal("minOrderUSD", { precision: 10, scale: 2 }).default("0.00"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;

// ─── Support Tickets ──────────────────────────────────────────────────────────

export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNumber: varchar("ticketNumber", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  orderId: int("orderId"),
  subject: varchar("subject", { length: 512 }).notNull(),
  status: mysqlEnum("status", ["open", "pending", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type SupportTicket = typeof supportTickets.$inferSelect;

export const ticketMessages = mysqlTable("ticket_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  senderId: int("senderId").notNull(),
  senderRole: mysqlEnum("senderRole", ["user", "admin"]).notNull(),
  message: text("message").notNull(),
  attachmentUrl: text("attachmentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(), // "order_update" | "ticket_reply" | "payment" etc.
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedOrderId: int("relatedOrderId"),
  relatedTicketId: int("relatedTicketId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Admin Actions Log ────────────────────────────────────────────────────────

export const adminActions = mysqlTable("admin_actions", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 256 }).notNull(),
  targetType: varchar("targetType", { length: 64 }), // "user" | "order" | "product" | "ticket"
  targetId: int("targetId"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── System Logs ──────────────────────────────────────────────────────────────

export const systemLogs = mysqlTable("system_logs", {
  id: int("id").autoincrement().primaryKey(),
  level: mysqlEnum("level", ["info", "warn", "error", "critical"]).notNull(),
  category: varchar("category", { length: 64 }).notNull(), // "payment" | "supplier" | "auth" | "order"
  message: text("message").notNull(),
  details: json("details"),
  userId: int("userId"),
  orderId: int("orderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Saved Products (Wishlist) ────────────────────────────────────────────────

export const savedProducts = mysqlTable("saved_products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export const exchangeRates = mysqlTable("exchange_rates", {
  id: int("id").autoincrement().primaryKey(),
  fromCurrency: varchar("fromCurrency", { length: 8 }).notNull(),
  toCurrency: varchar("toCurrency", { length: 8 }).notNull(),
  rate: decimal("rate", { precision: 18, scale: 6 }).notNull(),
  source: varchar("source", { length: 64 }).default("manual").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balanceUSD: decimal("balanceUSD", { precision: 18, scale: 6 }).default("0.000000").notNull(),
  totalDeposited: decimal("totalDeposited", { precision: 18, scale: 6 }).default("0.000000").notNull(),
  totalSpent: decimal("totalSpent", { precision: 18, scale: 6 }).default("0.000000").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;

export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deposit", "spend", "refund", "adjustment"]).notNull(),
  amountUSD: decimal("amountUSD", { precision: 18, scale: 6 }).notNull(),
  balanceAfterUSD: decimal("balanceAfterUSD", { precision: 18, scale: 6 }).notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  reference: varchar("reference", { length: 256 }),
  orderId: int("orderId"),
  paymentId: int("paymentId"),
  status: mysqlEnum("status", ["pending", "completed", "failed", "reversed"]).default("completed").notNull(),
  gateway: varchar("gateway", { length: 64 }),
  gatewayRef: varchar("gatewayRef", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;


// ─── Supplier Refund Claims ──────────────────────────────────────────────────

export const supplierRefundClaims = mysqlTable("supplier_refund_claims", {
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
    "cancelled",
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SupplierRefundClaim = typeof supplierRefundClaims.$inferSelect;
export type InsertSupplierRefundClaim = typeof supplierRefundClaims.$inferInsert;
