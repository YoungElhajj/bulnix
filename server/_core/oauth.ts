import { COOKIE_NAME } from "@shared/const";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { withDbRetry } from "../db-retry";
import { safeSendEmail, sendWelcomeEmail } from "../email";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Manus OAuth is not used — Google OAuth and email/password auth are used instead
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/");
  });
  return;
  // Dead code below kept for reference only
  app.get("/api/oauth/callback-unused", async (req: Request, res: Response) => {
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

      // Check if this is a brand-new user before upsert (with retry for PD/TiKV transient errors)
      const existingUser = await withDbRetry(
        () => db.getUserByOpenId(userInfo.openId),
        "oauth:getUserByOpenId"
      );
      const isNewUser = !existingUser;

      // Capture IP and country for new OAuth users
      let signupIp: string | null = null;
      let signupCountry: string | null = null;
      if (isNewUser) {
        signupIp = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? null;
        if (signupIp && signupIp !== "127.0.0.1" && signupIp !== "::1" && !signupIp.startsWith("192.168.") && !signupIp.startsWith("10.")) {
          try {
            const geoRes = await fetch(`https://ipapi.co/${signupIp}/country_name/`, { signal: AbortSignal.timeout(3000) });
            if (geoRes.ok) { const t = (await geoRes.text()).trim(); if (t.length > 0 && t.length < 100) signupCountry = t; }
          } catch { /* ignore */ }
        }
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
        ...(isNewUser && signupIp ? { signupIp } : {}),
        ...(isNewUser && signupCountry ? { signupCountry } : {}),
      });

      // Send welcome email to new users who have an email address
      if (isNewUser && userInfo.email) {
        safeSendEmail(() => sendWelcomeEmail({
          to: userInfo.email!,
          name: userInfo.name || "there",
        }));
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: TWENTY_FOUR_HOURS_MS,
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
