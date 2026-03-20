import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Social Media", slug: "social-media", isVisible: true, sortOrder: 0 },
  ]),
  getCategoryBySlug: vi.fn().mockResolvedValue({ id: 1, name: "Social Media", slug: "social-media" }),
  getFeaturedProducts: vi.fn().mockResolvedValue([
    { id: 1, title: "Instagram Accounts", slug: "instagram-accounts", customerPriceUSD: "4.99", isVisible: true, isFeatured: true },
  ]),
  getProducts: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 24 }),
  getProductBySlug: vi.fn().mockResolvedValue({ id: 1, title: "Instagram Accounts", slug: "instagram-accounts", customerPriceUSD: "4.99", isVisible: true }),
  validateCoupon: vi.fn().mockResolvedValue({ valid: false, message: "Invalid coupon code" }),
  createOrder: vi.fn().mockResolvedValue({ orderId: 1, orderNumber: "BLX-123456-ABCDEF", totalUSD: "9.99" }),
  getUserOrders: vi.fn().mockResolvedValue({ orders: [], total: 0 }),
  getUserOrderById: vi.fn().mockResolvedValue({ id: 1, status: "pending_payment", totalUSD: "9.99" }),
  getOrderDelivery: vi.fn().mockResolvedValue([]),
  initiatePayment: vi.fn().mockResolvedValue({ success: true, paymentUrl: null, reference: "ref_123" }),
  getPaymentStatus: vi.fn().mockResolvedValue({ status: "pending" }),
  createTicket: vi.fn().mockResolvedValue({ id: 1 }),
  getUserTickets: vi.fn().mockResolvedValue([]),
  getTicketById: vi.fn().mockResolvedValue({ id: 1, subject: "Test ticket", status: "open", messages: [] }),
  replyToTicket: vi.fn().mockResolvedValue({ success: true }),
  updateUserProfile: vi.fn().mockResolvedValue({ success: true }),
  getSavedProducts: vi.fn().mockResolvedValue([]),
  toggleSavedProduct: vi.fn().mockResolvedValue({ saved: true }),
  getUserNotifications: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue({ success: true }),
  getExchangeRates: vi.fn().mockResolvedValue([
    { fromCurrency: "USD", toCurrency: "NGN", rate: "1600.00" },
  ]),
  getAdminStats: vi.fn().mockResolvedValue({ totalUsers: 5, totalOrders: 12, totalRevenue: 99.99, pendingOrders: 2, failedOrders: 0, openTickets: 1, totalProducts: 20, visibleProducts: 18 }),
  adminGetProducts: vi.fn().mockResolvedValue({ products: [], total: 0 }),
  adminUpdateProduct: vi.fn().mockResolvedValue({ success: true }),
  adminGetOrders: vi.fn().mockResolvedValue({ orders: [], total: 0 }),
  adminUpdateOrder: vi.fn().mockResolvedValue({ success: true }),
  adminRetryFulfillment: vi.fn().mockResolvedValue({ success: true }),
  adminGetUsers: vi.fn().mockResolvedValue({ users: [], total: 0 }),
  adminSuspendUser: vi.fn().mockResolvedValue({ success: true }),
  adminReactivateUser: vi.fn().mockResolvedValue({ success: true }),
  adminGetTickets: vi.fn().mockResolvedValue({ tickets: [], total: 0 }),
  adminReplyToTicket: vi.fn().mockResolvedValue({ success: true }),
  getProviderConfigs: vi.fn().mockResolvedValue([]),
  updateProviderConfig: vi.fn().mockResolvedValue({ success: true }),
  triggerProviderSync: vi.fn().mockResolvedValue({ success: true, message: "Sync triggered for accszone" }),
  createCategory: vi.fn().mockResolvedValue({ success: true }),
  updateCategory: vi.fn().mockResolvedValue({ success: true }),
  getSystemLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
  updateExchangeRate: vi.fn().mockResolvedValue({ success: true }),
  getProviderSyncLogs: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: { id: 1, openId: "user-1", email: "user@test.com", name: "Test User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: { id: 2, openId: "admin-1", email: "admin@test.com", name: "Admin", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("returns null user for unauthenticated request", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated request", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.auth.me();
    expect(result?.email).toBe("user@test.com");
  });

  it("logout clears session cookie", async () => {
    const ctx = makeUserCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect((ctx.res.clearCookie as any).mock.calls.length).toBe(1);
  });
});

describe("categories", () => {
  it("lists visible categories", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.slug).toBe("social-media");
  });

  it("gets category by slug", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.categories.getBySlug({ slug: "social-media" });
    expect(result?.name).toBe("Social Media");
  });
});

describe("products", () => {
  it("lists featured products", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.products.getFeatured();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.slug).toBe("instagram-accounts");
  });

  it("lists products with pagination", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.products.list({ page: 1, limit: 24 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("gets product by slug", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.products.getBySlug({ slug: "instagram-accounts" });
    expect(result?.title).toBe("Instagram Accounts");
  });
});

describe("cart", () => {
  it("validates invalid coupon", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.cart.validateCoupon({ code: "INVALID", subtotalUSD: 10 });
    expect(result.valid).toBe(false);
  });
});

describe("orders", () => {
  it("requires authentication to create order", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.orders.create({ items: [{ productId: 1, quantity: 1 }], currency: "USD" })).rejects.toThrow();
  });

  it("creates order for authenticated user", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.orders.create({ items: [{ productId: 1, quantity: 1 }], currency: "USD" });
    expect(result).toHaveProperty("orderId");
  });

  it("lists user orders", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.orders.list({ page: 1, limit: 20 });
    expect(result).toHaveProperty("orders");
  });
});

describe("tickets", () => {
  it("requires authentication to create ticket", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.tickets.create({ subject: "Help", message: "I need help with my order" })).rejects.toThrow();
  });

  it("creates ticket for authenticated user", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.tickets.create({ subject: "Help needed", message: "I need help with my order please" });
    expect(result).toHaveProperty("id");
  });

  it("lists user tickets", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.tickets.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("user profile", () => {
  it("updates user profile", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.user.updateProfile({ name: "Updated Name", preferredCurrency: "NGN" });
    expect(result.success).toBe(true);
  });

  it("gets saved products", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.user.getSavedProducts();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("exchange rates", () => {
  it("returns exchange rates", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.rates.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.fromCurrency).toBe("USD");
  });
});

describe("admin - access control", () => {
  it("blocks non-admin from admin stats", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.admin.getStats()).rejects.toThrow("Admin access required");
  });

  it("allows admin to get stats", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.getStats();
    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalOrders");
  });
});

describe("admin - products", () => {
  it("admin can list all products", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.products.list({ page: 1, limit: 50 });
    expect(result).toHaveProperty("products");
    expect(result).toHaveProperty("total");
  });

  it("admin can update product visibility", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.products.update({ id: 1, isVisible: false });
    expect(result.success).toBe(true);
  });
});

describe("admin - orders", () => {
  it("admin can list orders", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.orders.list({ page: 1, limit: 50 });
    expect(result).toHaveProperty("orders");
  });

  it("admin can retry fulfillment", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.orders.retryFulfillment({ orderId: 1 });
    expect(result.success).toBe(true);
  });
});

describe("admin - users", () => {
  it("admin can list users", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.users.list({ page: 1, limit: 50 });
    expect(result).toHaveProperty("users");
  });

  it("admin can suspend user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.users.suspend({ userId: 1 });
    expect(result.success).toBe(true);
  });
});

describe("admin - providers", () => {
  it("admin can trigger sync", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.providers.triggerSync({ providerKey: "accszone", syncType: "full" });
    expect((result as any).success).toBe(true);
  });

  it("admin can update provider config", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.providers.update({ providerKey: "accszone", defaultMarkupPercent: 25 });
    expect(result.success).toBe(true);
  });
});

describe("admin - categories", () => {
  it("admin can create category", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.categories.create({ name: "Gaming", slug: "gaming" });
    expect(result.success).toBe(true);
  });
});
