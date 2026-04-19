import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
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
          await confirmWalletTopup(topupRef);
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
            await confirmWalletTopup(txRef);
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
          await confirmWalletTopup(orderId);
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
    const { reference, tx_ref, status } = req.query as Record<string, string>;
    const ref = reference ?? tx_ref ?? "";
    // Redirect to frontend with the reference so the client can confirm
    const frontendUrl = process.env.NODE_ENV === "production"
      ? `https://${req.headers.host}`
      : `http://localhost:${req.socket.localPort}`;
    res.redirect(`${frontendUrl}/wallet?topup_ref=${encodeURIComponent(ref)}&status=${encodeURIComponent(status ?? "")}`);
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
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
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
