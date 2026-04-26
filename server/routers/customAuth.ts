/**
 * Custom Email+Password+OTP Authentication Router
 * Replaces Manus OAuth for branded sign-up / sign-in experience.
 * All emails are sent from noreply@support.bulnix.com via Resend.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { z } from "zod/v4";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { safeSendEmail, sendOtpEmail, sendWelcomeEmail } from "../email";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpExpiresAt(): Date {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

function generateOpenId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function findUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}


async function getClientIp(req: any): Promise<string | null> {
  return (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket?.remoteAddress ?? null;
}

async function getCountryFromIp(ip: string | null): Promise<string | null> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) return null;
  try {
    const res = await fetch(`https://ipapi.co/${ip}/country_name/`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text.length > 0 && text.length < 100 ? text : null;
  } catch {
    return null;
  }
}

// ─── Public/User Auth Router ──────────────────────────────────────────────────

export const customAuthRouter = router({
  /**
   * Step 1 of registration: validate email/password, send OTP
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const existing = await findUserByEmail(email);

      if (existing?.emailVerified) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists. Please sign in.",
        });
      }

      const otp = generateOtp();
      const otpExpiry = otpExpiresAt();
      const passwordHash = await bcrypt.hash(input.password, 12);

      if (existing) {
        await db.update(users).set({
          name: input.name,
          passwordHash,
          otpCode: otp,
          otpExpiry,
          otpPurpose: "register",
        }).where(eq(users.email, email));
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
        });
      }

      await safeSendEmail(() =>
        sendOtpEmail({ to: email, name: input.name, otp, purpose: "register" })
      );

      return { success: true, email };
    }),

  /**
   * Verify OTP code for registration or login
   */
  verifyOtp: publicProcedure
    .input(
      z.object({
        email: z.email(),
        otp: z.string().length(6),
        purpose: z.enum(["register", "login", "reset"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const user = await findUserByEmail(email);

      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });

      if (!user.otpCode || !user.otpExpiry) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No verification code pending. Please request a new one." });
      }

      if (user.otpPurpose !== input.purpose) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification code" });
      }

      if (new Date() > user.otpExpiry) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Verification code has expired. Please request a new one." });
      }

      if (user.otpCode !== input.otp) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Incorrect verification code" });
      }

      await db.update(users).set({
        emailVerified: true,
        otpCode: null,
        otpExpiry: null,
        otpPurpose: null,
        lastSignedIn: new Date(),
      }).where(eq(users.id, user.id));

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "",
        expiresInMs: TWENTY_FOUR_HOURS_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: TWENTY_FOUR_HOURS_MS,
      });

      if (input.purpose === "register") {
        await safeSendEmail(() =>
          sendWelcomeEmail({ to: email, name: user.name ?? "" })
        );
      }

      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      };
    }),

  /**
   * Step 1 of login: validate credentials.
   * - Regular users: log in directly (no OTP), 24h session.
   * - Admin users: send OTP for extra security.
   */
  loginRequest: publicProcedure
    .input(
      z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const user = await findUserByEmail(email);

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
      if (!user.passwordHash) {
        throw new TRPCError({ code: "FORBIDDEN", message: 'No password set for this account. Please use "Forgot Password" to set one.' });
      }

      if (!user.emailVerified) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Please verify your email first. Check your inbox for a verification code." });
      }

      if (user.isSuspended) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Your account has been suspended. Please contact support." });
      }

      const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      // Admin users: require OTP for extra security
      if (user.role === "admin") {
        const otp = generateOtp();
        await db.update(users).set({
          otpCode: otp,
          otpExpiry: otpExpiresAt(),
          otpPurpose: "login",
        }).where(eq(users.id, user.id));

        await safeSendEmail(() =>
          sendOtpEmail({ to: email, name: user.name ?? "", otp, purpose: "login" })
        );

        return { success: true, email, requiresOtp: true };
      }

      // Regular users: log in directly with a 24h session
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "",
        expiresInMs: TWENTY_FOUR_HOURS_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: TWENTY_FOUR_HOURS_MS,
      });

      return { success: true, email, requiresOtp: false };
    }),

  /**
   * Resend OTP code
   */
  resendOtp: publicProcedure
    .input(z.object({
      email: z.email(),
      purpose: z.enum(["register", "login", "reset"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const user = await findUserByEmail(email);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });

      if (user.otpExpiry) {
        const secondsLeft = (user.otpExpiry.getTime() - Date.now()) / 1000;
        if (secondsLeft > 9 * 60) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before requesting a new code" });
        }
      }

      const otp = generateOtp();
      await db.update(users).set({
        otpCode: otp,
        otpExpiry: otpExpiresAt(),
        otpPurpose: input.purpose,
      }).where(eq(users.id, user.id));

      await safeSendEmail(() =>
        sendOtpEmail({ to: email, name: user.name ?? "", otp, purpose: input.purpose })
      );

      return { success: true };
    }),

  /**
   * Forgot password: send reset OTP
   */
  forgotPassword: publicProcedure
    .input(z.object({ email: z.email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const user = await findUserByEmail(email);

      if (!user) return { success: true };

      const otp = generateOtp();
      await db.update(users).set({
        otpCode: otp,
        otpExpiry: otpExpiresAt(),
        otpPurpose: "reset",
      }).where(eq(users.id, user.id));

      await safeSendEmail(() =>
        sendOtpEmail({ to: email, name: user.name ?? "", otp, purpose: "reset" })
      );

      return { success: true };
    }),

  /**
   * Reset password after OTP verification
   */
  resetPassword: publicProcedure
    .input(z.object({
      email: z.email(),
      otp: z.string().length(6),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const user = await findUserByEmail(email);

      if (
        !user ||
        user.otpCode !== input.otp ||
        !user.otpExpiry ||
        new Date() > user.otpExpiry ||
        user.otpPurpose !== "reset"
      ) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset code" });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({
        passwordHash,
        emailVerified: true,
        loginMethod: "email",
        otpCode: null,
        otpExpiry: null,
        otpPurpose: null,
        lastSignedIn: new Date(),
      }).where(eq(users.id, user.id));
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "",
        expiresInMs: TWENTY_FOUR_HOURS_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: TWENTY_FOUR_HOURS_MS });

      return { success: true };
    }),

  /**
   * Change password (authenticated user)
   */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db.select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const userRow = rows[0];
      if (!userRow?.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "No password set on this account" });

      const valid = await bcrypt.compare(input.currentPassword, userRow.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });

      const newHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  /**
   * Admin-only direct login (email + password, no OTP, admin role required)
   */
  adminLogin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db.select({
        id: users.id,
        openId: users.openId,
        email: users.email,
        name: users.name,
        role: users.role,
        passwordHash: users.passwordHash,
        emailVerified: users.emailVerified,
        isSuspended: users.isSuspended,
      })
        .from(users)
        .where(eq(users.email, input.email.toLowerCase().trim()))
        .limit(1);

      const user = rows[0];
      const invalidErr = new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });

      if (!user) throw invalidErr;
      if (user.role !== "admin") throw invalidErr;
      if (!user.passwordHash) throw invalidErr;
      if (user.isSuspended) throw new TRPCError({ code: "FORBIDDEN", message: "Account suspended" });

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw invalidErr;

      // Record login timestamp and IP address
      const loginIp =
        (ctx.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
        ctx.req.socket?.remoteAddress ??
        null;
      await db.update(users)
        .set({ lastSignedIn: new Date(), lastLoginIp: loginIp })
        .where(eq(users.id, user.id));

      const sessionToken = await sdk.createSessionToken(user.openId, {
        expiresInMs: TWENTY_FOUR_HOURS_MS,
        name: user.name || "",
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: TWENTY_FOUR_HOURS_MS });

      return { success: true, name: user.name };
    }),
});

// ─── Admin Account Settings Router (TOTP 2FA + Password) ─────────────────────

export const adminAccountRouter = router({
  /**
   * Change admin password (admin-only, requires current password)
   */
  changeAdminPassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, "New password must be at least 8 characters"),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db.select({ passwordHash: users.passwordHash })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const userRow = rows[0];
      if (!userRow?.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "No password set" });

      const valid = await bcrypt.compare(input.currentPassword, userRow.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });

      const newHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  /**
   * Generate a new TOTP secret + QR code data URL for setup
   */
  setupTotp: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const totp = new OTPAuth.TOTP({
        issuer: "Bulnix Admin",
        label: ctx.user.email ?? "admin",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      });

      const secret = totp.secret.base32;
      const otpauthUrl = totp.toString();

      await db.update(users)
        .set({ twoFactorSecret: secret })
        .where(eq(users.id, ctx.user.id));

      const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
      return { secret, qrDataUrl };
    }),

  /**
   * Verify TOTP token and enable 2FA
   */
  verifyTotp: protectedProcedure
    .input(z.object({ token: z.string().length(6) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db.select({ twoFactorSecret: users.twoFactorSecret })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const secret = rows[0]?.twoFactorSecret;
      if (!secret) throw new TRPCError({ code: "BAD_REQUEST", message: "No TOTP secret found. Please start setup again." });

      const totp = new OTPAuth.TOTP({
        issuer: "Bulnix Admin",
        label: ctx.user.email ?? "admin",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      const delta = totp.validate({ token: input.token, window: 1 });
      if (delta === null) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification code. Please try again." });

      await db.update(users)
        .set({ twoFactorEnabled: true })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  /**
   * Disable 2FA (requires current password for safety)
   */
  disableTotp: protectedProcedure
    .input(z.object({ password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db.select({ passwordHash: users.passwordHash })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const userRow = rows[0];
      if (!userRow?.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "No password set" });

      const valid = await bcrypt.compare(input.password, userRow.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password" });

      await db.update(users)
        .set({ twoFactorEnabled: false, twoFactorSecret: null })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  /**
   * Get current 2FA status for the admin
   */
  getTotpStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db.select({ twoFactorEnabled: users.twoFactorEnabled })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return { enabled: rows[0]?.twoFactorEnabled ?? false };
    }),

  /**
   * Get last login date and IP for the admin account settings page
   */
  getSessionInfo: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select({ lastSignedIn: users.lastSignedIn, lastLoginIp: users.lastLoginIp })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      return {
        lastSignedIn: rows[0]?.lastSignedIn ?? null,
        lastLoginIp: rows[0]?.lastLoginIp ?? null,
      };
    }),
});
