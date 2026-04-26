/**
 * Bulnix Email Service
 * Uses Resend for transactional email delivery.
 * Set RESEND_API_KEY, EMAIL_FROM, and EMAIL_FROM_NAME in environment secrets.
 */
import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@support.bulnix.com";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "support@bulnix.com";
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "Bulnix";
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;

// ─── Base HTML wrapper ────────────────────────────────────────────────────────
function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #0F172A; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo img { height: 40px; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
    .btn { display: inline-block; background: #00B9E9; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 28px 0; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin-bottom: 4px; }
    .value { font-size: 15px; color: #e2e8f0; margin-bottom: 16px; }
    .highlight { background: rgba(0,185,233,0.08); border: 1px solid rgba(0,185,233,0.2); border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
    .highlight .code { font-size: 32px; font-weight: 800; color: #00B9E9; letter-spacing: 0.15em; text-align: center; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-paid { background: rgba(34,197,94,0.15); color: #22C55E; }
    .status-processing { background: rgba(251,191,36,0.15); color: #FBBF24; }
    .status-completed { background: rgba(0,185,233,0.15); color: #00B9E9; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #334155; }
    .footer a { color: #475569; text-decoration: none; }
    .social-row { text-align: center; margin: 20px 0 0; }
    .social-row a { display: inline-block; margin: 0 8px; color: #475569; font-size: 13px; text-decoration: none; }
    table.order-items { width: 100%; border-collapse: collapse; margin: 16px 0; }
    table.order-items th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; padding: 0 0 10px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    table.order-items td { padding: 10px 0; font-size: 14px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: top; }
    table.order-items td.name { color: #e2e8f0; }
    table.order-items td.price { text-align: right; color: #22C55E; font-weight: 600; white-space: nowrap; }
    .total-row { display: flex; justify-content: space-between; padding: 14px 0 0; font-size: 16px; font-weight: 700; color: #ffffff; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo">
      <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg" alt="Bulnix" />
    </div>
    <div class="card">
      ${body}
    </div>
    <div class="footer">
      <p style="margin-bottom:8px;">© ${new Date().getFullYear()} Bulnix. All rights reserved.</p>
      <div class="social-row">
        <a href="https://t.me/bulnix">Telegram</a>
        <a href="https://wa.me/447916699429">WhatsApp</a>
        <a href="https://bulnix.com/privacy">Privacy</a>
        <a href="https://bulnix.com/terms">Terms</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email senders ────────────────────────────────────────────────────────────

/** Send welcome email when a new user signs up */
export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
}): Promise<void> {
  const body = `
    <h1>Welcome to Bulnix, ${opts.name || "there"}! 🎉</h1>
    <p>Your account is ready. You now have access to thousands of premium digital products — social media accounts, streaming services, gaming credits, VPNs, and more.</p>
    <a href="https://bulnix.com/categories" class="btn">Browse Products →</a>
    <hr class="divider" />
    <p style="font-size:13px;">Need help getting started? Our support team is available 24/7 via <a href="https://wa.me/447916699429" style="color:#00B9E9;">WhatsApp</a> or by opening a <a href="https://bulnix.com/support" style="color:#00B9E9;">support ticket</a>.</p>
    <p style="font-size:13px;">Join our Telegram channel for exclusive deals and updates: <a href="https://t.me/bulnix" style="color:#00B9E9;">t.me/bulnix</a></p>`;

  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set — skipping welcome email"); return; }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: "Welcome to Bulnix — Your account is ready",
    html: baseTemplate("Welcome to Bulnix", body),
  });
}

/** Send OTP verification code email for register/login/reset */
export async function sendOtpEmail(opts: {
  to: string;
  name: string;
  otp: string;
  purpose: "register" | "login" | "reset";
}): Promise<void> {
  const purposeLabels = {
    register: {
      subject: "Verify your email \u2014 Bulnix",
      heading: "Verify your email address",
      desc: "You're almost there! Enter the code below to verify your email and activate your Bulnix account.",
    },
    login: {
      subject: "Your Bulnix sign-in code",
      heading: "Sign-in verification code",
      desc: "Use the code below to complete your sign-in. This code expires in 10 minutes.",
    },
    reset: {
      subject: "Reset your Bulnix password",
      heading: "Password reset code",
      desc: "Use the code below to reset your password. This code expires in 10 minutes.",
    },
  };
  const { subject, heading, desc } = purposeLabels[opts.purpose];
  const body = `
    <h1>${heading}</h1>
    <p>Hi ${opts.name || "there"},</p>
    <p>${desc}</p>
    <div class="highlight" style="text-align:center;">
      <div class="code" style="font-size:40px;font-weight:800;letter-spacing:14px;color:#00B9E9;font-family:monospace;">${opts.otp}</div>
    </div>
    <p style="font-size:13px;color:#94a3b8;">This code expires in <strong style="color:#e2e8f0;">10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
    <hr class="divider" />
    <p style="font-size:13px;">Need help? Contact us on <a href="https://wa.me/447916699429" style="color:#00B9E9;">WhatsApp</a> or open a <a href="https://bulnix.com/support" style="color:#00B9E9;">support ticket</a>.</p>`;
  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set \u2014 skipping OTP email"); return; }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject,
    html: baseTemplate(subject, body),
  });
}

/** Send order confirmation email */
export async function sendOrderConfirmationEmail(opts: {
  to: string;
  name: string;
  orderNumber: string;
  orderId: number;
  items: Array<{ title: string; quantity: number; priceUSD: number }>;
  totalUSD: number;
  currency: string;
  status: string;
}): Promise<void> {
  const itemRows = opts.items.map(item => `
    <tr>
      <td class="name">${item.title}</td>
      <td style="text-align:center;color:#94a3b8;">×${item.quantity}</td>
      <td class="price">$${(item.priceUSD * item.quantity).toFixed(2)}</td>
    </tr>`).join("");

  const body = `
    <h1>Order Confirmed ✅</h1>
    <p>Hi ${opts.name || "there"}, your order has been received and is being processed.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Order Number</div>
      <div class="code">${opts.orderNumber}</div>
    </div>
    <table class="order-items">
      <thead><tr><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="total-row"><span>Total</span><span style="color:#22C55E;">$${opts.totalUSD.toFixed(2)}</span></div>
    <hr class="divider" />
    <a href="https://bulnix.com/orders/${opts.orderId}" class="btn">View Order Details →</a>
    <p style="font-size:13px;">Digital products are delivered automatically once payment is confirmed. Check your order page for delivery details.</p>
    <p style="font-size:13px;">Questions? Contact us on <a href="https://wa.me/447916699429" style="color:#00B9E9;">WhatsApp</a> or open a <a href="https://bulnix.com/support" style="color:#00B9E9;">support ticket</a>.</p>`;

  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set — skipping order confirmation email"); return; }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Order ${opts.orderNumber} confirmed — Bulnix`,
    html: baseTemplate("Order Confirmed", body),
  });
}

/** Send order status update email */
export async function sendOrderStatusEmail(opts: {
  to: string;
  name: string;
  orderNumber: string;
  orderId: number;
  status: string;
  message?: string;
}): Promise<void> {
  const statusLabel: Record<string, string> = {
    processing: "Processing",
    paid: "Payment Received",
    fulfilled: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  const statusClass: Record<string, string> = {
    paid: "status-paid",
    fulfilled: "status-completed",
    completed: "status-completed",
    processing: "status-processing",
  };
  const label = statusLabel[opts.status] ?? opts.status;
  const cls = statusClass[opts.status] ?? "status-processing";

  const body = `
    <h1>Order Update</h1>
    <p>Hi ${opts.name || "there"}, your order status has been updated.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Order ${opts.orderNumber}</div>
      <div style="text-align:center;margin-top:8px;"><span class="status-badge ${cls}">${label}</span></div>
    </div>
    ${opts.message ? `<p>${opts.message}</p>` : ""}
    <a href="https://bulnix.com/orders/${opts.orderId}" class="btn">View Order →</a>
    <p style="font-size:13px;">Need help? Contact us on <a href="https://wa.me/447916699429" style="color:#00B9E9;">WhatsApp</a> or open a <a href="https://bulnix.com/support" style="color:#00B9E9;">support ticket</a>.</p>`;

  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set — skipping order status email"); return; }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Order ${opts.orderNumber} — ${label} | Bulnix`,
    html: baseTemplate("Order Update", body),
  });
}

/** Send support ticket reply notification */
export async function sendTicketReplyEmail(opts: {
  to: string;
  name: string;
  ticketId: number;
  ticketSubject: string;
  replyPreview: string;
}): Promise<void> {
  const body = `
    <h1>New reply on your ticket</h1>
    <p>Hi ${opts.name || "there"}, our support team has replied to your ticket.</p>
    <div class="highlight">
      <div class="label">Ticket Subject</div>
      <div style="color:#e2e8f0;font-size:15px;margin-bottom:12px;">${opts.ticketSubject}</div>
      <div class="label">Reply Preview</div>
      <div style="color:#94a3b8;font-size:14px;line-height:1.6;">${opts.replyPreview.slice(0, 200)}${opts.replyPreview.length > 200 ? "…" : ""}</div>
    </div>
    <a href="https://bulnix.com/support/${opts.ticketId}" class="btn">View Full Reply →</a>`;

  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set — skipping ticket reply email"); return; }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Re: ${opts.ticketSubject} — Bulnix Support`,
    html: baseTemplate("Support Reply", body),
  });
}

/** Send password reset email (for future custom auth) */
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const body = `
    <h1>Reset your password</h1>
    <p>Hi ${opts.name || "there"}, we received a request to reset your Bulnix password. Click the button below to set a new password.</p>
    <a href="${opts.resetUrl}" class="btn">Reset Password →</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#475569;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>`;

  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set — skipping password reset email"); return; }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: "Reset your Bulnix password",
    html: baseTemplate("Password Reset", body),
  });
}

/** Send delivery email with account credentials and login instructions */
export async function sendDeliveryEmail(opts: {
  to: string;
  name: string;
  orderNumber: string;
  orderId: number;
  items: Array<{
    title: string;
    quantity: number;
    categoryName?: string;
    description?: string;
    deliveryNote?: string;
    credentials?: Array<{ login?: string; password?: string; email?: string; data?: string; [key: string]: unknown }>;
  }>;
}): Promise<void> {
  const itemSections = opts.items.map(item => {
    // Build credentials block
    const credRows = (item.credentials ?? []).map((cred, idx) => {
      const fields = Object.entries(cred)
        .filter(([k, v]) => v && typeof v === "string" && v.trim() !== "")
        .map(([k, v]) => `<tr><td class="label" style="padding:4px 0;width:120px;">${k.charAt(0).toUpperCase() + k.slice(1)}</td><td style="padding:4px 0;color:#e2e8f0;font-family:monospace;font-size:13px;word-break:break-all;">${v}</td></tr>`)
        .join("");
      return `<div style="background:rgba(0,185,233,0.06);border:1px solid rgba(0,185,233,0.15);border-radius:8px;padding:14px 18px;margin:8px 0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#00B9E9;margin-bottom:8px;">Account ${idx + 1}</div>
        <table style="width:100%;border-collapse:collapse;">${fields}</table>
      </div>`;
    }).join("");

    // Build login instructions block
    const loginGuide = getLoginInstructions(item.categoryName ?? "", item.title);
    const deliveryNote = item.deliveryNote ? `<p style="font-size:13px;color:#94a3b8;margin:8px 0;">${item.deliveryNote}</p>` : "";

    return `
      <div style="margin:20px 0;padding:20px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.07);">
        <h3 style="font-size:16px;font-weight:700;color:#ffffff;margin:0 0 8px;">${item.title} ×${item.quantity}</h3>
        ${deliveryNote}
        ${credRows ? `<div style="margin:12px 0;"><div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#475569;margin-bottom:8px;">Your Account Credentials</div>${credRows}</div>` : ""}
        ${loginGuide}
      </div>`;
  }).join("");

  const body = `
    <h1>🎉 Your Order Has Been Delivered!</h1>
    <p>Hi ${opts.name || "there"}, great news — your Bulnix order is ready. Your account credentials are below.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Order Number</div>
      <div class="code">${opts.orderNumber}</div>
    </div>
    ${itemSections}
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">⚠️ <strong style="color:#e2e8f0;">Keep these credentials safe.</strong> Do not share them with anyone. If you have any issues accessing your account, please open a support ticket.</p>
    <a href="https://bulnix.com/orders/${opts.orderId}" class="btn">View Full Order →</a>
    <p style="font-size:13px;">Need help? Contact us on <a href="https://wa.me/447916699429" style="color:#00B9E9;">WhatsApp</a> or open a <a href="https://bulnix.com/tickets" style="color:#00B9E9;">support ticket</a>.</p>`;

  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set — skipping delivery email"); return; }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `✅ Your Bulnix order ${opts.orderNumber} has been delivered`,
    html: baseTemplate("Order Delivered", body),
  });
}

/** Per-category / per-product login instructions */
function getLoginInstructions(categoryName: string, productTitle: string): string {
  const cat = (categoryName + " " + productTitle).toLowerCase();
  let steps: string[] = [];

  if (cat.includes("netflix")) {
    steps = [
      "Go to <a href='https://netflix.com' style='color:#00B9E9;'>netflix.com</a> and click <strong>Sign In</strong>.",
      "Enter the email and password provided above.",
      "If prompted, choose <strong>Use a sign-in link</strong> or enter the password directly.",
      "Go to <strong>Account → Profile & Parental Controls</strong> to set up your profile.",
      "⚠️ Do NOT change the email or password — this will lock out other users on the account.",
    ];
  } else if (cat.includes("spotify")) {
    steps = [
      "Go to <a href='https://spotify.com' style='color:#00B9E9;'>spotify.com</a> and click <strong>Log In</strong>.",
      "Enter the email and password provided above.",
      "Download the Spotify app on your device for the best experience.",
      "⚠️ Do NOT change the account password or email.",
    ];
  } else if (cat.includes("youtube") || cat.includes("google")) {
    steps = [
      "Open a browser and go to <a href='https://accounts.google.com' style='color:#00B9E9;'>accounts.google.com</a>.",
      "Sign in with the email and password provided above.",
      "If asked for 2FA, check the <strong>data</strong> field above for the recovery code.",
      "Go to YouTube and click your profile icon to confirm Premium is active.",
      "⚠️ Do NOT change the password or recovery email.",
    ];
  } else if (cat.includes("disney") || cat.includes("hulu") || cat.includes("hbo") || cat.includes("max")) {
    steps = [
      "Go to the streaming service website or app.",
      "Click <strong>Log In</strong> and enter the email and password above.",
      "Create your own profile within the account.",
      "⚠️ Do NOT change the main account password or email.",
    ];
  } else if (cat.includes("instagram") || cat.includes("facebook") || cat.includes("tiktok") || cat.includes("twitter") || cat.includes("x.com")) {
    steps = [
      "Open the app or website and click <strong>Log In</strong>.",
      "Enter the username/email and password provided above.",
      "If asked for 2FA, use the code in the <strong>data</strong> field above.",
      "Update your profile name and bio as desired.",
      "⚠️ Do NOT change the account email or phone number.",
    ];
  } else if (cat.includes("amazon") || cat.includes("prime")) {
    steps = [
      "Go to <a href='https://amazon.com' style='color:#00B9E9;'>amazon.com</a> and click <strong>Sign In</strong>.",
      "Enter the email and password provided above.",
      "Go to <strong>Prime Video</strong> to access your subscription.",
      "⚠️ Do NOT change the account password.",
    ];
  } else if (cat.includes("vpn") || cat.includes("nordvpn") || cat.includes("expressvpn")) {
    steps = [
      "Download the VPN app from the official website.",
      "Open the app and click <strong>Sign In</strong>.",
      "Enter the email and password provided above.",
      "Choose a server location and click <strong>Connect</strong>.",
    ];
  } else if (cat.includes("gaming") || cat.includes("steam") || cat.includes("xbox") || cat.includes("playstation") || cat.includes("psn")) {
    steps = [
      "Open the gaming platform app or website.",
      "Click <strong>Sign In</strong> and enter the credentials above.",
      "If prompted for 2FA, use the code in the <strong>data</strong> field.",
      "⚠️ Do NOT change the password or linked email.",
    ];
  } else {
    steps = [
      "Use the credentials above to log in to the service.",
      "Visit the official website or app and click <strong>Sign In / Log In</strong>.",
      "Enter the email/username and password exactly as shown.",
      "If 2FA is required, check the <strong>data</strong> field for the recovery code.",
      "⚠️ Do NOT change the account password, email, or phone number.",
    ];
  }

  const stepsHtml = steps.map((s, i) => `<li style="padding:5px 0;font-size:13px;color:#94a3b8;">${s}</li>`).join("");
  return `<div style="margin-top:14px;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#475569;margin-bottom:8px;">How to Login</div>
    <ol style="margin:0;padding-left:20px;">${stepsHtml}</ol>
  </div>`;
}

/** Send refund confirmation email to customer */
export async function sendRefundConfirmationEmail(opts: {
  to: string;
  name: string;
  orderNumber: string;
  orderId: number;
  amountUSD: number;
  reason: string;
  newBalanceUSD: number;
}): Promise<void> {
  const body = `
    <h1>Refund Issued — $${opts.amountUSD.toFixed(2)} Credited</h1>
    <p>Hi ${opts.name || "there"}, we have processed a refund for your order. The amount has been credited to your Bulnix wallet and is ready to use immediately.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Refund Amount</div>
      <div class="code" style="color:#22C55E;">$${opts.amountUSD.toFixed(2)} USD</div>
      <div style="text-align:center;margin-top:4px;font-size:13px;color:#94a3b8;">Credited to your Bulnix wallet</div>
    </div>
    <div style="margin:16px 0;">
      <div class="label">Order Number</div>
      <div class="value">${opts.orderNumber}</div>
      <div class="label">Reason</div>
      <div class="value">${opts.reason}</div>
      <div class="label">New Wallet Balance</div>
      <div class="value" style="color:#22C55E;font-weight:700;">$${opts.newBalanceUSD.toFixed(2)} USD</div>
    </div>
    <a href="https://bulnix.com/wallet" class="btn">View Wallet →</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Your refund is available in your wallet and can be used on your next purchase. If you have any questions, please <a href="https://bulnix.com/tickets" style="color:#00B9E9;">open a support ticket</a>.</p>`;

  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set — skipping refund confirmation email"); return; }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Refund of $${opts.amountUSD.toFixed(2)} credited — Order ${opts.orderNumber} | Bulnix`,
    html: baseTemplate("Refund Confirmation", body),
  });
}

/** Wallet top-up receipt email to customer */
export async function sendWalletTopupReceiptEmail(opts: {
  to: string;
  name: string;
  amountUSD: number;
  reference: string;
  gateway: string;
  newBalanceUSD: number;
}): Promise<void> {
  const gatewayLabel = opts.gateway === "korapay" ? "Kora Pay"
    : opts.gateway === "flutterwave" ? "Flutterwave"
    : opts.gateway === "nowpayments" ? "Crypto"
    : opts.gateway === "paystack" ? "Paystack"
    : opts.gateway;
  const body = `
    <h1>Wallet Funded Successfully</h1>
    <p>Hi ${opts.name || "there"}, your Bulnix wallet has been topped up. Your funds are ready to use.</p>
    <div class="highlight">
      <div class="label" style="text-align:center;">Amount Added</div>
      <div class="code" style="color:#22C55E;">$${opts.amountUSD.toFixed(2)} USD</div>
    </div>
    <div style="margin:16px 0;">
      <div class="label">Reference</div>
      <div class="value">${opts.reference}</div>
      <div class="label">Payment Method</div>
      <div class="value">${gatewayLabel}</div>
      <div class="label">New Wallet Balance</div>
      <div class="value" style="color:#22C55E;font-weight:700;">$${opts.newBalanceUSD.toFixed(2)} USD</div>
    </div>
    <a href="https://bulnix.com/wallet" class="btn">View Wallet</a>
    <hr class="divider" />
    <p style="font-size:13px;color:#94a3b8;">Your wallet is ready to use. Browse our products and place your order. If you did not make this top-up, please <a href="https://bulnix.com/tickets" style="color:#00B9E9;">contact support</a> immediately.</p>`;

  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set — skipping wallet top-up receipt email"); return; }
  await client.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: opts.to,
    subject: `Wallet funded: $${opts.amountUSD.toFixed(2)} added to your Bulnix wallet`,
    html: baseTemplate("Wallet Funded", body),
  });
}

/** Backup success email to owner */
export async function sendBackupEmail(opts: {
  to: string;
  date: string;
  sizeKb: number;
  tableCount: number;
  downloadUrl: string;
}): Promise<void> {
  const body = `
    <h1>&#x2705; Daily Backup Complete</h1>
    <p>Your automatic database backup ran successfully and has been stored securely in S3.</p>
    <div style="margin:16px 0;background:#0f172a;border-radius:8px;padding:16px;">
      <div style="margin-bottom:8px;"><span style="color:#94a3b8;">Date:</span> <strong style="color:#f1f5f9;">${opts.date}</strong></div>
      <div style="margin-bottom:8px;"><span style="color:#94a3b8;">Tables backed up:</span> <strong style="color:#f1f5f9;">${opts.tableCount}</strong></div>
      <div style="margin-bottom:8px;"><span style="color:#94a3b8;">Backup size:</span> <strong style="color:#f1f5f9;">${opts.sizeKb} KB</strong></div>
    </div>
    <a href="${opts.downloadUrl}" class="btn">Download Backup File</a>
    <p style="font-size:12px;color:#475569;margin-top:16px;">Backups are stored in your Bulnix S3 storage. Keep copies in a safe place for disaster recovery.</p>`;
  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set \u2014 skipping backup email"); return; }
  await client.emails.send({ from: FROM, replyTo: REPLY_TO, to: opts.to, subject: `\u2705 Bulnix Daily Backup Complete \u2014 ${opts.date.slice(0, 10)}`, html: baseTemplate("Daily Backup Complete", body) });
}

/** Backup failure alert email to owner */
export async function sendBackupFailedEmail(opts: {
  to: string;
  date: string;
  errorMessage: string;
}): Promise<void> {
  const body = `
    <h1 style="color:#ef4444;">&#x274c; Daily Backup FAILED</h1>
    <p>Your automatic database backup encountered an error and did not complete. Please take action immediately.</p>
    <div style="background:#1f2937;color:#f87171;padding:12px;border-radius:6px;font-family:monospace;font-size:13px;margin:16px 0;">${opts.errorMessage}</div>
    <p>Please log in to your admin panel and trigger a manual backup, or contact Manus support.</p>
    <a href="https://help.manus.im" class="btn" style="background:#ef4444;">Contact Support</a>`;
  const client = getResend();
  if (!client) { console.warn("[email] RESEND_API_KEY not set \u2014 skipping backup failure email"); return; }
  await client.emails.send({ from: FROM, replyTo: REPLY_TO, to: opts.to, subject: `\u274c Bulnix Daily Backup FAILED \u2014 ${opts.date}`, html: baseTemplate("Backup Failed", body) });
}

/** Generic safe wrapper — logs errors but never throws */
export async function safeSendEmail(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error("[Email] Failed to send email:", err);
  }
}
