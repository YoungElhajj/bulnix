import { createHmac } from "crypto";
import { ENV } from "../_core/env";
import { getExchangeRates } from "../db";

const BASE_URL = "https://api.korapay.com/merchant/api/v1";

async function koraRequest(method: string, path: string, body?: Record<string, unknown>) {
  const bodyStr = body ? JSON.stringify(body) : undefined;
  console.log(`[KoraPay] ${method} ${path} payload:`, bodyStr);
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ENV.korapaySecretKey}`,
      "Content-Type": "application/json",
    },
    body: bodyStr,
  });
  const rawText = await res.text();
  console.log(`[KoraPay] ${method} ${path} status=${res.status} response:`, rawText);
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    throw new Error(`Kora Pay returned non-JSON response (${res.status}): ${rawText.slice(0, 200)}`);
  }
  if (!res.ok || data.status === false) {
    throw new Error((data.message as string) ?? "Kora Pay API error");
  }
  return (data.data ?? data) as Record<string, unknown>;
}

export interface KoraInitResult {
  checkoutUrl: string;
  reference: string;
}

/**
 * Create a Kora Pay checkout session and return the hosted payment URL.
 * Amount must be in the smallest currency unit (kobo for NGN, cents for USD).
 * We pass USD amounts in USD directly — Kora supports USD.
 */
// Kora Pay per-transaction limit: NGN 200,000 (~$125 USD) for Card, Bank Transfer, and Bank payments.
// Daily limit is NGN 1,000,000 (~$625 USD).
const KORA_MAX_NGN = 200_000;
// Fallback rate used only if DB has no cached rate yet
const FALLBACK_USD_TO_NGN = 1600;

async function getLiveNgnRate(): Promise<number> {
  try {
    const rates = await getExchangeRates();
    const row = rates.find((r: any) => r.fromCurrency === "USD" && r.toCurrency === "NGN");
    if (row && Number(row.rate) > 0) return Number(row.rate);
  } catch {
    // fall through to fallback
  }
  return FALLBACK_USD_TO_NGN;
}

export async function koraInitiate(params: {
  reference: string;
  amountUSD: number;
  email: string;
  name: string;
  redirectUrl: string;
  notificationUrl?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<KoraInitResult> {
  // Kora Pay uses NGN in kobo (1 NGN = 100 kobo).
  // Convert USD → NGN → kobo using live DB rate. Do NOT pass channels — let Kora use account defaults.
  const usdToNgn = await getLiveNgnRate();
  const amountNGN = Math.round(params.amountUSD * usdToNgn);
  if (amountNGN > KORA_MAX_NGN) {
    throw new Error(
      `Kora Pay maximum per transaction is NGN ${KORA_MAX_NGN.toLocaleString()} (~$${(KORA_MAX_NGN / usdToNgn).toFixed(0)} USD). ` +
      `Please use Flutterwave or Crypto for larger amounts.`
    );
  }
  // Kora Pay amount is in major currency unit (naira), NOT kobo.
  // See: https://developers.korapay.com/docs/checkout-redirect (example: amount: 22000 = ₦22,000)
  const data = await koraRequest("POST", "/charges/initialize", {
    reference: params.reference,
    amount: amountNGN,
    currency: "NGN",
    redirect_url: params.redirectUrl,
    // notification_url is required by Kora Pay API
    ...(params.notificationUrl ? { notification_url: params.notificationUrl } : {}),
    customer: {
      email: params.email,
      name: params.name,
    },
    // Strip characters Kora Pay rejects as unsafe (e.g. $, #, &, etc.)
    narration: (params.description ?? "Bulnix wallet top-up").replace(/[^a-zA-Z0-9 .,'\-_]/g, ""),
    // metadata must not be an empty object — omit if no keys
    ...(params.metadata && Object.keys(params.metadata).length > 0 ? { metadata: params.metadata } : {}),
  });
  return {
    checkoutUrl: (data.checkout_url ?? data.authorization_url) as string,
    reference: params.reference,
  };
}

export interface KoraVerifyResult {
  status: "success" | "failed" | "pending" | "processing";
  reference: string;
  amount: number;
  currency: string;
  fee: number;
  narration: string;
}

/**
 * Verify a Kora Pay transaction by reference.
 */
export async function koraVerify(reference: string): Promise<KoraVerifyResult> {
  const data = await koraRequest("GET", `/charges/${encodeURIComponent(reference)}`);
  const statusRaw = (data.status as string)?.toLowerCase();
  let status: KoraVerifyResult["status"] = "pending";
  if (statusRaw === "success") status = "success";
  else if (statusRaw === "failed") status = "failed";
  else if (statusRaw === "processing") status = "processing";
  return {
    status,
    reference: data.reference as string,
    // Kora returns amount in major units (naira), not kobo
    amount: data.amount as number,
    currency: data.currency as string,
    fee: (data.fee as number) ?? 0,
    narration: (data.narration as string) ?? "",
  };
}

/**
 * Verify Kora Pay webhook signature.
 * Kora sends an `x-korapay-signature` header which is HMAC-SHA256 of the raw body
 * using your secret key.
 */
export function verifyKoraSignature(rawBody: string, signature: string): boolean {
  try {
    const secret = ENV.korapaySecretKey;
    if (!secret) return true; // dev mode — accept all
    const hash = createHmac("sha256", secret).update(rawBody).digest("hex");
    return hash === signature;
  } catch {
    return false;
  }
}

/** Returns true if the Kora payment status is a confirmed success. */
export function isKoraSuccess(status: string): boolean {
  return status === "success";
}
