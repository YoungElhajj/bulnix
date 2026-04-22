/**
 * Google OAuth 2.0 routes
 * GET /api/auth/google          → redirects to Google consent screen
 * GET /api/auth/google/callback → exchanges code for tokens, upserts user, issues session
 */
import type { Express, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { ENV } from "./_core/env";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import * as db from "./db";
import { withDbRetry } from "./db-retry";
import { safeSendEmail, sendWelcomeEmail } from "./email";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const SCOPES = ["openid", "email", "profile"];

function getCallbackUrl(req: Request): string {
  // Always use the production domain for the redirect URI registered in Google Console
  return "https://bulnix.com/api/auth/google/callback";
}

export function registerGoogleAuthRoutes(app: Express) {
  // ── Step 1: Redirect to Google ──────────────────────────────────────────────
  app.get("/api/auth/google", (req: Request, res: Response) => {
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
      prompt: "select_account",
    });

    res.redirect(302, url);
  });

  // ── Step 2: Handle Google callback ─────────────────────────────────────────
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
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
        // ignore malformed state
      }
    }

    try {
      const client = new OAuth2Client(ENV.googleClientId, ENV.googleClientSecret, getCallbackUrl(req));
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // Verify and decode the ID token
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: ENV.googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        res.redirect(302, "/login?error=google_invalid_token");
        return;
      }

      const openId = `google:${payload.sub}`;
      const email = payload.email ?? null;
      const name = payload.name ?? null;

      // Check if new user
      const existingUser = await withDbRetry(
        () => db.getUserByOpenId(openId),
        "google-oauth:getUserByOpenId"
      );
      const isNewUser = !existingUser;

      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Send welcome email to new users
      if (isNewUser && email) {
        safeSendEmail(() => sendWelcomeEmail({ to: email, name: name || "there" }));
      }

      // Issue session token using the platform SDK
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: TWENTY_FOUR_HOURS_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: TWENTY_FOUR_HOURS_MS });
      res.redirect(302, returnPath || "/");
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect(302, "/login?error=google_failed");
    }
  });
}
