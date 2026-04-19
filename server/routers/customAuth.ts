/**
 * Custom Email+Password+OTP Authentication Router
 * Replaces Manus OAuth for branded sign-up / sign-in experience.
 * All emails are sent from noreply@support.bulnix.com via Resend.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
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

// ─── Router ──────────────────────────────────────────────────────────────────

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
    .mutation(async ({ input }) => {
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
        // Update existing unverified account
        await db.update(users).set({
          name: input.name,
          passwordHash,
          otpCode: otp,
          otpExpiry,
          otpPurpose: "register",
        }).where(eq(users.email, email));
      } else {
        // Create new unverified account
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

      // Mark verified and clear OTP
      await db.update(users).set({
        emailVerified: true,
        otpCode: null,
        otpExpiry: null,
        otpPurpose: null,
        lastSignedIn: new Date(),
      }).where(eq(users.id, user.id));

      // Create session
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Send welcome email for new registrations
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
   * Step 1 of login: validate credentials, send OTP
   */
  loginRequest: publicProcedure
    .input(
      z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const user = await findUserByEmail(email);

      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
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

      const otp = generateOtp();
      await db.update(users).set({
        otpCode: otp,
        otpExpiry: otpExpiresAt(),
        otpPurpose: "login",
      }).where(eq(users.id, user.id));

      await safeSendEmail(() =>
        sendOtpEmail({ to: email, name: user.name ?? "", otp, purpose: "login" })
      );

      return { success: true, email };
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

      // Rate limit: only allow resend if previous OTP is older than 60s
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

      // Always return success to prevent email enumeration
      if (!user || !user.emailVerified) return { success: true };

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
        otpCode: null,
        otpExpiry: null,
        otpPurpose: null,
        lastSignedIn: new Date(),
      }).where(eq(users.id, user.id));

      // Auto sign in after reset
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true };
    }),

  /**
   * Change password (authenticated)
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
});
