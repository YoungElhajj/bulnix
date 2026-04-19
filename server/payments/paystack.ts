import { createHmac } from "crypto";
import { ENV } from "../_core/env";

const BASE_URL = "https://api.paystack.co";

async function paystackRequest(method: string, path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ENV.paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok || !data.status) {
    throw new Error((data.message as string) ?? "Paystack API error");
  }
  return data.data as Record<string, unknown>;
}

export interface PaystackInitResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Initialize a Paystack transaction and return the hosted payment URL.
 * @param email      Customer email
 * @param amountKobo Amount in the smallest currency unit (kobo for NGN, cents for USD)
 * @param reference  Unique reference for this transaction
 * @param currency   Currency code (NGN | USD | GHS | ZAR)
 * @param callbackUrl URL to redirect after payment
 * @param metadata   Optional extra metadata stored on the transaction
 */
export async function paystackInitiate(params: {
  email: string;
  amountKobo: number;
  reference: string;
  currency: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResult> {
  const data = await paystackRequest("POST", "/transaction/initialize", {
    email: params.email,
    amount: Math.round(params.amountKobo),
    reference: params.reference,
    currency: params.currency,
    callback_url: params.callbackUrl,
    metadata: params.metadata ?? {},
  });
  return {
    authorizationUrl: data.authorization_url as string,
    accessCode: data.access_code as string,
    reference: data.reference as string,
  };
}

export interface PaystackVerifyResult {
  status: "success" | "failed" | "abandoned" | "pending";
  reference: string;
  amount: number; // in kobo/cents
  currency: string;
  gatewayResponse: string;
  paidAt: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function paystackVerify(reference: string): Promise<PaystackVerifyResult> {
  const data = await paystackRequest("GET", `/transaction/verify/${encodeURIComponent(reference)}`);
  return {
    status: data.status as PaystackVerifyResult["status"],
    reference: data.reference as string,
    amount: data.amount as number,
    currency: data.currency as string,
    gatewayResponse: data.gateway_response as string,
    paidAt: (data.paid_at as string) ?? null,
    metadata: (data.metadata as Record<string, unknown>) ?? {},
  };
}

/**
 * Verify Paystack webhook signature.
 * Returns true if the signature matches.
 */
export function verifyPaystackSignature(rawBody: string, signature: string): boolean {
  const hash = createHmac("sha512", ENV.paystackSecretKey)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
