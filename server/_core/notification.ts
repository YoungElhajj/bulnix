import { TRPCError } from "@trpc/server";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Sends an owner notification via email (Resend).
 * Falls back gracefully if email is not configured.
 * Returns `true` on success, `false` on failure.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "bulnixsupport@gmail.com";
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || "noreply@support.bulnix.com";

  if (!resendApiKey) {
    console.warn("[Notification] RESEND_API_KEY not set — skipping owner notification.");
    return false;
  }

  try {
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#0F3D5E;padding:16px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#00C2FF;margin:0;font-size:18px;">🔔 ${title}</h2>
        </div>
        <div style="background:#f9f9f9;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">
          <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px;color:#333;margin:0;">${content}</pre>
          <hr style="margin:20px 0;border:none;border-top:1px solid #e0e0e0;">
          <p style="color:#888;font-size:12px;margin:0;">Bulnix Admin Notification — ${new Date().toUTCString()}</p>
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Bulnix Alerts <${emailFrom}>`,
        to: [adminEmail],
        subject: `[Bulnix Alert] ${title}`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[Notification] Failed to send owner email (${response.status})${detail ? `: ${detail}` : ""}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Error sending owner notification email:", error);
    return false;
  }
}
