import { createHmac } from "crypto";
import { ENV } from "../_core/env";

const BASE_URL = "https://api.korapay.com/merchant/api/v1";

async function koraRequest(method: string, path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ENV.korapaySecretKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as Record<string, unknown>;
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
// Exchange rate: 1 USD ≈ 1600 NGN (update periodically or fetch dynamically)
const USD_TO_NGN = 1600;
// Kora Pay account transaction limit: NGN 8,000,000 max (~$5,000 USD) — approved merchant account.
const KORA_MAX_NGN = 8_000_000;

export async function koraInitiate(params: {
  reference: string;
  amountUSD: number;
  email: string;
  name: string;
  redirectUrl: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<KoraInitResult> {
  // Kora Pay uses NGN in kobo (1 NGN = 100 kobo).
  // Convert USD → NGN → kobo. Do NOT pass channels — let Kora use account defaults.
  const amountNGN = Math.round(params.amountUSD * USD_TO_NGN);
  if (amountNGN > KORA_MAX_NGN) {
    throw new Error(
      `Kora Pay maximum per transaction is NGN ${KORA_MAX_NGN.toLocaleString()} (~$${(KORA_MAX_NGN / USD_TO_NGN).toFixed(2)} USD). ` +
      `Please use Flutterwave or Crypto for amounts above this limit.`
    );
  }
  const amountKobo = amountNGN * 100;
  const data = await koraRequest("POST", "/charges/initialize", {
    reference: params.reference,
    amount: amountKobo,
    currency: "NGN",
    redirect_url: params.redirectUrl,
    customer: {
      email: params.email,
      name: params.name,
    },
    narration: params.description ?? "Bulnix wallet top-up",
    metadata: params.metadata ?? {},
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
    // Kora returns amount in minor units — convert back to major
    amount: (data.amount as number) / 100,
    currency: data.currency as string,
    fee: ((data.fee as number) ?? 0) / 100,
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
