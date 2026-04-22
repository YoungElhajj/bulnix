import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleAuthRoutes } from "../googleAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import multer from "multer";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { verifyPaystackSignature } from "../payments/paystack";
import { verifyFlwSignature } from "../payments/flutterwave";
import { verifyNowPaymentsIpn, isNowPaymentsSuccess } from "../payments/nowpayments";
import { verifyKoraSignature, isKoraSuccess } from "../payments/korapay";
import { confirmWalletTopup, fulfillOrderByReference, logSystem } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Force HTTPS in production (Manus/Cloudflare sets x-forwarded-proto)
  app.use((req: any, res: any, next: any) => {
    if (
      process.env.NODE_ENV === "production" &&
      req.headers["x-forwarded-proto"] &&
      req.headers["x-forwarded-proto"] !== "https"
    ) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });

  // ─── Webhook routes (raw body required for signature verification) ──────────
  // These MUST be registered before express.json() middleware

  // Kora Pay webhook
  app.post("/api/webhooks/korapay", express.raw({ type: "application/json" }), async (req: any, res: any) => {
    try {
      const signature = req.headers["x-korapay-signature"] as string;
      const rawBody = req.body.toString("utf8");
      if (!verifyKoraSignature(rawBody, signature)) {
        await logSystem("warn", "payment", "Kora Pay webhook: invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      const event = JSON.parse(rawBody) as Record<string, unknown>;
      // Kora Pay sends event type in event.event (e.g. "charge.success")
      const eventType = (event.event as string) ?? "";
      if (eventType === "charge.success") {
        const data = event.data as Record<string, unknown>;
        const reference = data.reference as string;
        const status = (data.status as string) ?? "";
        if (isKoraSuccess(status)) {
          try {
            await confirmWalletTopup(reference, true); // skipVerify: webhook is already verified by signature
            await logSystem("info", "payment", `Kora Pay webhook: wallet topup confirmed for ref ${reference}`);
          } catch (e: any) {
            // Not a wallet topup — ignore (Kora Pay is wallet-only for now)
            await logSystem("warn", "payment", `Kora Pay webhook: could not confirm topup for ref ${reference}: ${e.message}`);
          }
        }
      }
      // Always return 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (e: any) {
      await logSystem("error", "payment", `Kora Pay webhook error: ${e.message}`);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // Paystack webhook
  app.post("/api/webhooks/paystack", express.raw({ type: "application/json" }), async (req: any, res: any) => {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      const rawBody = req.body.toString("utf8");
      if (!verifyPaystackSignature(rawBody, signature)) {
        await logSystem("warn", "payment", "Paystack webhook: invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      const event = JSON.parse(rawBody) as Record<string, unknown>;
      const eventType = event.event as string;
      if (eventType === "charge.success") {
        const data = event.data as Record<string, unknown>;
        const reference = data.reference as string;
        const metadata = (data.metadata as Record<string, unknown>) ?? {};
        const topupRef = (metadata.topupRef as string) ?? reference;
        try {
          await confirmWalletTopup(topupRef, true); // skipVerify: webhook is already verified
          await logSystem("info", "payment", `Paystack webhook: wallet topup confirmed for ref ${topupRef}`);
        } catch (e: any) {
          // May be an order payment — try order fulfillment
          try {
            await fulfillOrderByReference(reference, "paystack");
            await logSystem("info", "payment", `Paystack webhook: order fulfilled for ref ${reference}`);
          } catch (e2: any) {
            await logSystem("error", "payment", `Paystack webhook: failed to process ref ${reference}: ${e2.message}`);
          }
        }
      }
      res.status(200).json({ received: true });
    } catch (e: any) {
      await logSystem("error", "payment", `Paystack webhook error: ${e.message}`);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // Flutterwave webhook
  app.post("/api/webhooks/flutterwave", express.raw({ type: "application/json" }), async (req: any, res: any) => {
    try {
      const hash = req.headers["verif-hash"] as string;
      if (!verifyFlwSignature(hash)) {
        await logSystem("warn", "payment", "Flutterwave webhook: invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      const rawBody = req.body.toString("utf8");
      const event = JSON.parse(rawBody) as Record<string, unknown>;
      const eventType = (event.event as string) ?? "";
      if (eventType === "charge.completed") {
        const data = event.data as Record<string, unknown>;
        const txRef = data.tx_ref as string;
        const status = data.status as string;
        if (status === "successful") {
          try {
            await confirmWalletTopup(txRef, true); // skipVerify: webhook is already verified
            await logSystem("info", "payment", `Flutterwave webhook: wallet topup confirmed for txRef ${txRef}`);
          } catch (e: any) {
            try {
              await fulfillOrderByReference(txRef, "flutterwave");
              await logSystem("info", "payment", `Flutterwave webhook: order fulfilled for txRef ${txRef}`);
            } catch (e2: any) {
              await logSystem("error", "payment", `Flutterwave webhook: failed to process txRef ${txRef}: ${e2.message}`);
            }
          }
        }
      }
      res.status(200).json({ received: true });
    } catch (e: any) {
      await logSystem("error", "payment", `Flutterwave webhook error: ${e.message}`);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // NowPayments IPN webhook
  app.post("/api/webhooks/nowpayments", express.raw({ type: "application/json" }), async (req: any, res: any) => {
    try {
      const signature = req.headers["x-nowpayments-sig"] as string;
      const rawBody = req.body.toString("utf8");
      if (!verifyNowPaymentsIpn(rawBody, signature)) {
        await logSystem("warn", "payment", "NowPayments IPN: invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const paymentStatus = payload.payment_status as string;
      const orderId = payload.order_id as string;
      if (isNowPaymentsSuccess(paymentStatus)) {
        try {
          await confirmWalletTopup(orderId, true); // skipVerify: IPN is already verified
          await logSystem("info", "payment", `NowPayments IPN: wallet topup confirmed for orderId ${orderId}`);
        } catch (e: any) {
          try {
            await fulfillOrderByReference(orderId, "nowpayments");
            await logSystem("info", "payment", `NowPayments IPN: order fulfilled for orderId ${orderId}`);
          } catch (e2: any) {
            await logSystem("error", "payment", `NowPayments IPN: failed to process orderId ${orderId}: ${e2.message}`);
          }
        }
      }
      res.status(200).json({ received: true });
    } catch (e: any) {
      await logSystem("error", "payment", `NowPayments IPN error: ${e.message}`);
      res.status(500).json({ error: "Internal error" });
    }
  });

  // Payment redirect callback (for redirect-based flows — Paystack/Flutterwave redirect back here)
  app.get("/api/payments/verify", async (req: any, res: any) => {
    const { reference, tx_ref, status, type } = req.query as Record<string, string>;
    const ref = reference ?? tx_ref ?? "";
    // Use the same host from the incoming request so it works in all environments (dev proxy, staging, production)
    const proto = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:3000";
    const frontendUrl = `${proto}://${host}`;
    // Route to the correct frontend page based on payment type
    if (type === "order") {
      res.redirect(`${frontendUrl}/orders?payment_ref=${encodeURIComponent(ref)}&status=${encodeURIComponent(status ?? "")}`);
    } else {
      // Default: wallet topup
      res.redirect(`${frontendUrl}/wallet?topup_ref=${encodeURIComponent(ref)}&status=${encodeURIComponent(status ?? "")}`);
    }
  });

  // ─── Regular middleware ──────────────────────────────────────────────────────

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // File upload endpoint for product/category images
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  app.post("/api/upload/image", upload.single("file"), async (req: any, res: any) => {
    try {
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user || ctx.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const ext = req.file.originalname.split(".").pop()?.toLowerCase() ?? "jpg";
      const key = `product-images/${nanoid(12)}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      res.json({ url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Storage proxy for /manus-storage/* paths
  registerStorageProxy(app);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Custom Google OAuth under /api/auth/google
  registerGoogleAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        // Log DB / unexpected errors server-side but never expose raw SQL to clients
        const isDbError = error.message?.includes('Failed query') ||
          error.message?.includes('ER_') ||
          error.message?.includes('TiDB') ||
          error.message?.includes('mysql') ||
          error.message?.includes('ECONNREFUSED');
        if (isDbError) {
          console.error(`[tRPC] DB error on ${path}:`, error.message);
          // Replace the raw message with a safe one
          (error as any).message = 'A database error occurred. Please try again shortly.';
        }
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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

// ─── Auto-Run Pending Migrations on Startup ─────────────────────────────────────────
// Runs all CREATE TABLE IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS
// statements on every server boot. Safe to run multiple times (idempotent).
import("../runMigrations").then(m => m.runPendingMigrations()).catch(e =>
  console.error("[Migrations] Startup migration failed:", e)
);

// ─── Auto-Sync Scheduler ────────────────────────────────────────────────────
// Runs a stock+price sync every 15 minutes to keep inventory up to date
// and prevent overselling. Full sync runs once per hour.
let syncCycleCount = 0;
async function runAutoSync() {
  try {
    const { syncProvider } = await import("../connectors/accszone");
    syncCycleCount++;
    // Every 4th cycle (1 hour) do a full sync; otherwise just stock+prices
    const syncType = syncCycleCount % 4 === 0 ? "full" : "stock";
    console.log(`[AutoSync] Running ${syncType} sync (cycle ${syncCycleCount})...`);
    await syncProvider("accszone", syncType);
    console.log(`[AutoSync] ${syncType} sync complete.`);
  } catch (err) {
    console.error("[AutoSync] Error:", err);
  }
}
// Start auto-sync after 2 minutes (allow server to fully boot), then every 15 min
setTimeout(() => {
  runAutoSync();
  setInterval(runAutoSync, 15 * 60 * 1000);
}, 2 * 60 * 1000);

// ─── Auto-Retry Scheduler ────────────────────────────────────────────────────
// Every 5 minutes: check AccsZone balance. If > $0, retry all processing orders.
let lastRetryBalance = 0;
async function runAutoRetry() {
  try {
    const { getAccsZoneBalance, retryAllProcessingOrders } = await import("../db");
    const balResult = await getAccsZoneBalance();
    const balance = balResult.balance ?? 0;
    // Only trigger retry if balance has gone from $0 to positive (account was just topped up)
    // OR if balance > $0 and there are processing orders (catch-all every 5 min)
    if (balance > 0) {
      const result = await retryAllProcessingOrders();
      if (result.retried > 0) {
        console.log(`[AutoRetry] Balance $${balance.toFixed(2)} — retried ${result.retried} processing orders.`);
      }
    }
    lastRetryBalance = balance;
  } catch (err) {
    console.error("[AutoRetry] Error:", err);
  }
}
// Start auto-retry after 3 minutes (after server boot), then every 5 minutes
setTimeout(() => {
  runAutoRetry();
  setInterval(runAutoRetry, 5 * 60 * 1000);
}, 3 * 60 * 1000);

// ─── Daily Backup Scheduler ──────────────────────────────────────────────────
// Runs a full database backup every 24 hours at 2:00 AM UTC.
function msUntil2amUTC(): number {
  const now = new Date();
  const next2am = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 2, 0, 0, 0));
  if (next2am.getTime() <= now.getTime()) {
    next2am.setUTCDate(next2am.getUTCDate() + 1);
  }
  return next2am.getTime() - now.getTime();
}
async function runDailyBackup() {
  try {
    const { runDatabaseBackupSafe } = await import("../backup");
    await runDatabaseBackupSafe();
  } catch (err) {
    console.error("[Backup] Scheduler error:", err);
  }
}
// Schedule first backup at 2:00 AM UTC, then every 24 hours
const delayToFirstBackup = msUntil2amUTC();
const hoursUntilFirst = Math.round(delayToFirstBackup / 3600000 * 10) / 10;
console.log(`[Backup] Next daily backup scheduled in ${hoursUntilFirst}h (2:00 AM UTC)`);
setTimeout(() => {
  runDailyBackup();
  setInterval(runDailyBackup, 24 * 60 * 60 * 1000);
}, delayToFirstBackup);

// ─── Exchange Rate Refresh Scheduler ────────────────────────────────────────
// Fetches live USD rates from open.er-api.com every 6 hours and caches in DB.
// Data only updates once per day on the free tier, so 6-hour polling is safe.
async function runExchangeRateRefresh() {
  try {
    const { fetchAndCacheExchangeRates } = await import("../db");
    const result = await fetchAndCacheExchangeRates();
    console.log(`[ExchangeRates] Updated ${result.updated} rates. USD/NGN = ${result.rateNGN.toFixed(2)}`);
  } catch (err) {
    console.error("[ExchangeRates] Refresh failed:", err);
  }
}
// Run immediately on startup, then every 6 hours
runExchangeRateRefresh();
setInterval(runExchangeRateRefresh, 6 * 60 * 60 * 1000);
