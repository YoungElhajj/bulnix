import { COOKIE_NAME } from "../shared/const";
import { customAuthRouter } from "./routers/customAuth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import * as db from "./db";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ── Auth ────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    register: customAuthRouter.register,
    verifyOtp: customAuthRouter.verifyOtp,
    loginRequest: customAuthRouter.loginRequest,
    resendOtp: customAuthRouter.resendOtp,
    forgotPassword: customAuthRouter.forgotPassword,
    resetPassword: customAuthRouter.resetPassword,
    changePassword: customAuthRouter.changePassword,
    adminLogin: customAuthRouter.adminLogin,
  }),

  // ── Categories ──────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => db.getCategories()),
    listWithCounts: publicProcedure.query(() => db.getCategoriesWithCounts()),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getCategoryBySlug(input.slug)),
    getSubcategories: publicProcedure
      .input(z.object({ parentId: z.number() }))
      .query(({ input }) => db.getSubcategoriesByParentId(input.parentId)),
  }),

  // ── Products ────────────────────────────────────────────────────────────
  products: router({
    getFeatured: publicProcedure.query(() => db.getFeaturedProducts()),
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        categorySlug: z.string().optional(),
        search: z.string().optional(),
        sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).optional(),
        featured: z.boolean().optional(),
        page: z.number().default(1),
        limit: z.number().default(24),
      }))
      .query(({ input }) => db.getProducts(input)),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => db.getProductBySlug(input.slug)),
  }),

  // ── Cart / Checkout ─────────────────────────────────────────────────────
  cart: router({
    validateCoupon: publicProcedure
      .input(z.object({ code: z.string(), subtotalUSD: z.number() }))
      .mutation(({ input }) => db.validateCoupon(input.code, input.subtotalUSD)),
  }),

  // ── Orders ──────────────────────────────────────────────────────────────
  orders: router({
    create: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().min(1),
        })),
        currency: z.enum(["NGN", "USD", "EUR", "GBP"]).default("USD"),
        couponCode: z.string().optional(),
        billingEmail: z.string().optional(),
        billingCountry: z.string().optional(),
      }))
      .mutation(({ input, ctx }) => db.createOrder(ctx.user.id, input)),

    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }))
      .query(({ input, ctx }) => db.getUserOrders(ctx.user.id, input)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input, ctx }) => db.getUserOrderById(ctx.user.id, input.id)),

    getDelivery: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(({ input, ctx }) => db.getOrderDelivery(ctx.user.id, input.orderId)),
  }),

  // ── Payments ────────────────────────────────────────────────────────────
  payments: router({
    initiate: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        gateway: z.enum(["paystack", "monnify", "nowpayments"]),
        currency: z.enum(["NGN", "USD", "EUR", "GBP"]),
      }))
      .mutation(({ input, ctx }) => db.initiatePayment(ctx.user.id, input)),

    getStatus: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(({ input, ctx }) => db.getPaymentStatus(ctx.user.id, input.orderId)),
  }),

  // ── Support Tickets ─────────────────────────────────────────────────────
  tickets: router({
    create: protectedProcedure
      .input(z.object({
        subject: z.string().min(5).max(512),
        message: z.string().min(10),
        orderId: z.number().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      }))
      .mutation(({ input, ctx }) => db.createTicket(ctx.user.id, input)),

    list: protectedProcedure.query(({ ctx }) => db.getUserTickets(ctx.user.id)),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input, ctx }) => db.getTicketById(ctx.user.id, input.id)),

    reply: protectedProcedure
      .input(z.object({ ticketId: z.number(), message: z.string().min(1) }))
      .mutation(({ input, ctx }) => db.replyToTicket(ctx.user.id, "user", input)),
  }),

  // ── User Profile ────────────────────────────────────────────────────────
  user: router({
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        country: z.string().optional(),
        preferredCurrency: z.enum(["NGN", "USD", "EUR", "GBP"]).optional(),
        notifyEmail: z.boolean().optional(),
        notifyOrders: z.boolean().optional(),
      }))
      .mutation(({ input, ctx }) => db.updateUserProfile(ctx.user.id, input)),

    getSavedProducts: protectedProcedure.query(({ ctx }) => db.getSavedProducts(ctx.user.id)),

    toggleSavedProduct: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(({ input, ctx }) => db.toggleSavedProduct(ctx.user.id, input.productId)),

    getNotifications: protectedProcedure.query(({ ctx }) => db.getUserNotifications(ctx.user.id)),

    markNotificationRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input, ctx }) => db.markNotificationRead(ctx.user.id, input.id)),
  }),

  // ── Exchange Rates ──────────────────────────────────────────────────────
  rates: router({
    list: publicProcedure.query(() => db.getExchangeRates()),
  }),

  // ── Admin ───────────────────────────────────────────────────────────────
  admin: router({
    // Dashboard stats
    getStats: adminProcedure.query(() => db.getAdminStats()),

    // Products
    products: router({
      list: adminProcedure
        .input(z.object({ page: z.number().default(1), limit: z.number().default(50), search: z.string().optional() }))
        .query(({ input }) => db.adminGetProducts(input)),
      create: adminProcedure
        .input(z.object({
          title: z.string(),
          slug: z.string(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          categoryId: z.number().optional(),
          supplierPrice: z.number(),
          markupPercent: z.number().default(20),
          stockQuantity: z.number().default(0),
          stockUnlimited: z.boolean().default(false),
          deliveryNote: z.string().optional(),
          isVisible: z.boolean().default(true),
          isFeatured: z.boolean().default(false),
        }))
        .mutation(({ input }) => db.adminCreateProduct(input)),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          markupPercent: z.number().optional(),
          isVisible: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          categoryId: z.number().optional(),
          regionRestrictions: z.array(z.string()).optional(),
          allowedPaymentMethods: z.array(z.string()).optional(),
          deliveryNote: z.string().optional(),
          refundPolicy: z.string().optional(),
        }))
        .mutation(({ input }) => db.adminUpdateProduct(input)),
    }),

    // Orders
    orders: router({
      list: adminProcedure
        .input(z.object({ page: z.number().default(1), limit: z.number().default(50), status: z.string().optional() }))
        .query(({ input }) => db.adminGetOrders(input)),
      update: adminProcedure
        .input(z.object({ id: z.number(), status: z.string().optional(), adminNotes: z.string().optional(), fraudFlag: z.boolean().optional() }))
        .mutation(({ input }) => db.adminUpdateOrder(input)),
      retryFulfillment: adminProcedure
        .input(z.object({ orderId: z.number() }))
        .mutation(({ input }) => db.adminRetryFulfillment(input.orderId)),
    }),

    // Users
    users: router({
      list: adminProcedure
        .input(z.object({ page: z.number().default(1), limit: z.number().default(50), search: z.string().optional() }))
        .query(({ input }) => db.adminGetUsers(input)),
      getDetail: adminProcedure
        .input(z.object({ userId: z.number() }))
        .query(({ input }) => db.adminGetUserDetail(input.userId)),
      suspend: adminProcedure
        .input(z.object({ userId: z.number(), reason: z.string().optional() }))
        .mutation(({ input }) => db.adminSuspendUser(input.userId, input.reason)),
      reactivate: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(({ input }) => db.adminReactivateUser(input.userId)),
    }),

    // Refunds
    refunds: router({
      process: adminProcedure
        .input(z.object({
          userId: z.number(),
          amountUSD: z.number().min(0.01),
          reason: z.string().min(5),
          orderId: z.number().optional(),
          ticketId: z.number().optional(),
        }))
        .mutation(({ input, ctx }) => db.adminProcessRefund(ctx.user.id, input)),
    }),

    // Tickets
    tickets: router({
      list: adminProcedure
        .input(z.object({ page: z.number().default(1), limit: z.number().default(50), status: z.string().optional() }))
        .query(({ input }) => db.adminGetTickets(input)),
      reply: adminProcedure
        .input(z.object({ ticketId: z.number(), message: z.string().min(1), closeTicket: z.boolean().optional() }))
        .mutation(({ input, ctx }) => db.adminReplyToTicket(ctx.user.id, input)),
    }),

    // Provider configs
    providers: router({
      list: adminProcedure.query(() => db.getProviderConfigs()),
      update: adminProcedure
        .input(z.object({
          providerKey: z.string(),
          apiKey: z.string().optional(),
          isEnabled: z.boolean().optional(),
          syncIntervalMinutes: z.number().optional(),
          defaultMarkupPercent: z.number().optional(),
        }))
        .mutation(({ input }) => db.updateProviderConfig(input)),
      triggerSync: adminProcedure
        .input(z.object({ providerKey: z.string(), syncType: z.enum(["categories", "products", "stock", "prices", "full"]) }))
        .mutation(({ input }) => db.triggerProviderSync(input.providerKey, input.syncType)),
      syncLogs: adminProcedure.query(() => db.getProviderSyncLogs()),
    }),

    // Categories
    categories: router({
      list: adminProcedure.query(() => db.getCategories()),
      create: adminProcedure
        .input(z.object({ name: z.string(), slug: z.string(), description: z.string().optional(), parentId: z.number().optional() }))
        .mutation(({ input }) => db.createCategory(input)),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          parentId: z.number().nullable().optional(),
          isVisible: z.boolean().optional(),
          sortOrder: z.number().optional(),
        }))
        .mutation(({ input }) => db.updateCategory(input)),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => db.deleteCategory(input.id)),
    }),

    // Supplier Refund Claims
    supplierRefunds: router({
      list: adminProcedure
        .input(z.object({ page: z.number().default(1), limit: z.number().default(50), status: z.string().optional(), providerKey: z.string().optional() }))
        .query(({ input }) => db.listSupplierRefundClaims(input)),
      get: adminProcedure
        .input(z.object({ claimId: z.number() }))
        .query(({ input }) => db.getSupplierRefundClaim(input.claimId)),
      create: adminProcedure
        .input(z.object({
          ticketId: z.number().optional(),
          orderId: z.number().optional(),
          providerKey: z.string().default("accszone"),
          supplierOrderId: z.string().optional(),
          claimAmountUSD: z.number().min(0.01),
          reason: z.string().min(10),
          adminNotes: z.string().optional(),
        }))
        .mutation(({ input, ctx }) => db.createSupplierRefundClaim(ctx.user.id, input)),
      submit: adminProcedure
        .input(z.object({ claimId: z.number() }))
        .mutation(({ input, ctx }) => db.submitSupplierRefundClaim(ctx.user.id, input.claimId)),
      update: adminProcedure
        .input(z.object({
          claimId: z.number(),
          status: z.enum(["acknowledged", "approved", "partially_approved", "rejected", "resolved", "cancelled"]).optional(),
          approvedAmountUSD: z.number().optional(),
          supplierResponse: z.string().optional(),
          supplierRefundRef: z.string().optional(),
          adminNotes: z.string().optional(),
          addLogEntry: z.object({ message: z.string(), direction: z.enum(["inbound", "outbound"]), type: z.string() }).optional(),
          creditToCustomer: z.boolean().optional(),
          customerUserId: z.number().optional(),
        }))
        .mutation(({ input, ctx }) => db.updateSupplierRefundClaim(ctx.user.id, input)),
    }),

    // System logs
    logs: router({
      list: adminProcedure
        .input(z.object({ page: z.number().default(1), limit: z.number().default(100), level: z.string().optional(), category: z.string().optional() }))
        .query(({ input }) => db.getSystemLogs(input)),
    }),

    // Exchange rates
    rates: router({
      update: adminProcedure
        .input(z.object({ fromCurrency: z.string(), toCurrency: z.string(), rate: z.number() }))
        .mutation(({ input }) => db.updateExchangeRate(input)),
    }),
  }),

  // ── Wallet ──────────────────────────────────────────────────────────────
  wallet: router({
    get: protectedProcedure.query(({ ctx }) => db.getOrCreateWallet(ctx.user.id)),
    transactions: protectedProcedure
      .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
      .query(({ input, ctx }) => db.getWalletTransactions(ctx.user.id, input.page, input.limit)),
    initiateTopup: protectedProcedure
      .input(z.object({
        amountUSD: z.number().min(3),
        gateway: z.enum(["paystack", "monnify", "nowpayments"]),
      }))
      .mutation(({ input, ctx }) => db.initiateWalletTopup(ctx.user.id, input.amountUSD, input.gateway)),
    confirmTopup: protectedProcedure
      .input(z.object({ reference: z.string() }))
      .mutation(({ input }) => db.confirmWalletTopup(input.reference)),
  }),

  // ── Supplier Sync (internal) ────────────────────────────────────────────
  supplier: router({
    syncStatus: adminProcedure.query(() => db.getProviderSyncLogs()),
  }),
});

export type AppRouter = typeof appRouter;
