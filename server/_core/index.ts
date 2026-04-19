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
