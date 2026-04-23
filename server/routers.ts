import { COOKIE_NAME } from "../shared/const";
import { customAuthRouter, adminAccountRouter } from "./routers/customAuth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import * as db from "./db";
import { migrationsRouter } from "./routers/migrations";
import { safeSendEmail } from "./email";
import { Resend } from "resend";

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
    // Admin account settings (2FA + password)
    changeAdminPassword: adminAccountRouter.changeAdminPassword,
    setupTotp: adminAccountRouter.setupTotp,
    verifyTotp: adminAccountRouter.verifyTotp,
    disableTotp: adminAccountRouter.disableTotp,
    getTotpStatus: adminAccountRouter.getTotpStatus,
    getSessionInfo: adminAccountRouter.getSessionInfo,
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
        gateway: z.enum(["paystack", "flutterwave", "nowpayments"]),
        currency: z.enum(["NGN", "USD", "EUR", "GBP"]),
      }))
      .mutation(({ input, ctx }) => {
        // Use the real public domain in production — never trust x-forwarded-host as it may be an internal proxy
        const origin = process.env.NODE_ENV === "production"
          ? "https://bulnix.com"
          : `http://${ctx.req.headers.host ?? "localhost:3000"}`;
        return db.initiatePayment(ctx.user.id, input, origin);
      }),

    getStatus: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(({ input, ctx }) => db.getPaymentStatus(ctx.user.id, input.orderId)),

    payWithWallet: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(({ input, ctx }) => db.payOrderWithWallet(ctx.user.id, input.orderId)),
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
    refresh: adminProcedure.mutation(() => db.fetchAndCacheExchangeRates()),
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
          deliveryFormat: z.string().optional(),
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
          deliveryFormat: z.string().optional(),
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
      manualRefund: adminProcedure
        .input(z.object({
          orderId: z.number(),
          amountUSD: z.number().min(0.01),
          reason: z.string().min(3),
        }))
        .mutation(({ input, ctx }) => db.adminOrderManualRefund(ctx.user.id, input)),
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
      getAccsZoneBalance: adminProcedure.query(() => db.getAccsZoneBalance()),
      getFaddedBalance: adminProcedure.query(() => db.getFaddedBalance()),
      applyMarkupToAll: adminProcedure
        .input(z.object({ providerKey: z.string(), markupPercent: z.number().min(0).max(500) }))
        .mutation(({ input }) => db.applyMarkupToAllProducts(input.providerKey, input.markupPercent)),
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
        amountUSD: z.number().min(1),
        gateway: z.enum(["flutterwave", "nowpayments", "korapay"]),
      }))
      .mutation(({ input, ctx }) => {
        // Gateway-specific minimum validation
        const gatewayMins: Record<string, number> = { korapay: 1, flutterwave: 1, nowpayments: 12 };
        const minAmount = gatewayMins[input.gateway] ?? 1;
        if (input.amountUSD < minAmount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum deposit for this payment method is $${minAmount.toFixed(2)}` });
        }
        // Use the real public domain in production — never trust x-forwarded-host as it may be an internal proxy
        const origin = process.env.NODE_ENV === "production"
          ? "https://bulnix.com"
          : `http://${ctx.req.headers.host ?? "localhost:3000"}`;
        return db.initiateWalletTopup(ctx.user.id, input.amountUSD, input.gateway, origin);
      }),
    confirmTopup: protectedProcedure
      .input(z.object({ reference: z.string() }))
      .mutation(({ input }) => db.confirmWalletTopup(input.reference)),
  }),

  // ── Supplier Sync (internal) ────────────────────────────────────────────
  supplier: router({
    syncStatus: adminProcedure.query(() => db.getProviderSyncLogs()),
  }),
  // ── Support Triage ────────────────────────────────────────────────────────
  support: router({
    /**
     * Called when the user completes the triage bot and is redirected to WhatsApp.
     * Sends a confirmation email to the user with their issue summary.
     */
    submitTriage: publicProcedure
      .input(z.object({
        email: z.string().email().optional(),
        name: z.string().optional(),
        issueSummary: z.string().min(1),
        steps: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        if (!input.email) return { sent: false };
        const client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
        if (!client) return { sent: false };
        const stepsHtml = input.steps.map(s => `<li style="margin-bottom:6px;color:#94a3b8;font-size:14px;">${s}</li>`).join("");
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{margin:0;padding:0;background:#0B0F19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0}.wrapper{max-width:600px;margin:0 auto;padding:40px 20px}.card{background:#0F172A;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px}h1{font-size:22px;font-weight:700;color:#fff;margin:0 0 12px}p{font-size:15px;line-height:1.6;color:#94a3b8;margin:0 0 16px}.highlight{background:rgba(0,185,233,0.08);border:1px solid rgba(0,185,233,0.2);border-radius:10px;padding:20px 24px;margin:20px 0}.label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#475569;margin-bottom:4px}.footer{text-align:center;margin-top:32px;font-size:12px;color:#334155}</style></head><body><div class="wrapper"><div class="card"><img src="https://static-assets.manus.space/manus-storage/bulnix-logo-new_03e40d5d.jpg" alt="Bulnix" style="height:36px;margin-bottom:28px;"/><h1>Your Support Request Has Been Received</h1><p>Hi ${input.name || "there"}, thank you for reaching out to Bulnix Support. Here's a summary of your issue that has been shared with our team on WhatsApp.</p><div class="highlight"><div class="label">Issue Summary</div><div style="color:#e2e8f0;font-size:15px;margin-bottom:16px;">${input.issueSummary}</div><div class="label">Steps Completed</div><ul style="margin:8px 0 0;padding-left:20px;">${stepsHtml}</ul></div><p>Our support team will follow up with you on WhatsApp shortly. If you haven't connected yet, you can reach us at <a href="https://wa.me/447367061279" style="color:#00B9E9;">wa.me/447367061279</a>.</p><div class="footer">Bulnix &bull; <a href="https://bulnix.com" style="color:#475569;">bulnix.com</a></div></div></div></body></html>`;
        try {
          await client.emails.send({
            from: `Bulnix Support <${process.env.EMAIL_FROM ?? "noreply@bulnix.com"}>`,
            replyTo: process.env.EMAIL_REPLY_TO ?? "bulnixsupport@gmail.com",
            to: input.email,
            subject: `Your Bulnix Support Request — ${input.issueSummary.slice(0, 60)}`,
            html,
          });
          return { sent: true };
        } catch (err) {
          console.error("[support.submitTriage] email error:", err);
          return { sent: false };
        }
      }),
  }),

  // ── One-time Migrations (admin only) ─────────────────────────────────────
  migrations: migrationsRouter,
});

export type AppRouter = typeof appRouter;
