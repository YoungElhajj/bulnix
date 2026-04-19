import { createHmac } from "crypto";
import { ENV } from "../_core/env";

const BASE_URL = "https://api.flutterwave.com/v3";

async function flwRequest(method: string, path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ENV.flutterwaveSecretKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok || data.status !== "success") {
    throw new Error((data.message as string) ?? "Flutterwave API error");
  }
  return data.data as Record<string, unknown>;
}

export interface FlwInitResult {
  paymentLink: string;
  txRef: string;
}

/**
 * Create a Flutterwave hosted payment link.
 */
export async function flwInitiate(params: {
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  phone?: string;
  redirectUrl: string;
  description?: string;
  meta?: Record<string, unknown>;
}): Promise<FlwInitResult> {
  const data = await flwRequest("POST", "/payments", {
    tx_ref: params.txRef,
    amount: params.amount,
    currency: params.currency,
    redirect_url: params.redirectUrl,
    customer: {
      email: params.email,
      name: params.name,
      phonenumber: params.phone ?? "",
    },
    customizations: {
      title: "Bulnix Store",
      description: params.description ?? "Digital account purchase",
      logo: "https://bulnix.com/favicon.ico",
    },
    meta: params.meta ?? {},
  });
  return {
    paymentLink: data.link as string,
    txRef: params.txRef,
  };
}

export interface FlwVerifyResult {
  status: "successful" | "failed" | "cancelled" | "pending";
  txRef: string;
  flwRef: string;
  amount: number;
  chargedAmount: number;
  currency: string;
  processorResponse: string;
}

/**
 * Verify a Flutterwave transaction by transaction ID.
 */
export async function flwVerify(transactionId: string): Promise<FlwVerifyResult> {
  const data = await flwRequest("GET", `/transactions/${encodeURIComponent(transactionId)}/verify`);
  return {
    status: data.status as FlwVerifyResult["status"],
    txRef: data.tx_ref as string,
    flwRef: data.flw_ref as string,
    amount: data.amount as number,
    chargedAmount: data.charged_amount as number,
    currency: data.currency as string,
    processorResponse: data.processor_response as string,
  };
}

/**
 * Verify Flutterwave webhook signature.
 * Flutterwave sends a `verif-hash` header which is compared against
 * the FLUTTERWAVE_SECRET_KEY (the webhook secret hash configured in the dashboard).
 */
export function verifyFlwSignature(receivedHash: string): boolean {
  // Flutterwave uses a plain string comparison against the secret hash
  // configured in the Flutterwave dashboard under "Webhooks"
  return receivedHash === ENV.flutterwaveSecretKey;
}
