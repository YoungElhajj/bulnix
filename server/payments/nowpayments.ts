import { createHmac } from "crypto";
import { ENV } from "../_core/env";

const BASE_URL = "https://api.nowpayments.io/v1";

async function npRequest(method: string, path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "x-api-key": ENV.nowpaymentsApiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((data.message as string) ?? "NowPayments API error");
  }
  return data;
}

export interface NowPaymentsInitResult {
  invoiceId: string;
  invoiceUrl: string;
  paymentId?: string;
}

/**
 * Create a NowPayments invoice and return the hosted payment URL.
 */
export async function npInitiate(params: {
  priceAmount: number;
  priceCurrency: string; // e.g. "usd"
  payCurrency?: string;  // e.g. "usdttrc20" — defaults to ENV.nowpaymentsCurrency
  orderId: string;
  orderDescription?: string;
  successUrl?: string;
  cancelUrl?: string;
  ipnCallbackUrl?: string;
}): Promise<NowPaymentsInitResult> {
  const data = await npRequest("POST", "/invoice", {
    price_amount: params.priceAmount,
    price_currency: params.priceCurrency.toLowerCase(),
    pay_currency: (params.payCurrency ?? ENV.nowpaymentsCurrency).toLowerCase(),
    order_id: params.orderId,
    order_description: params.orderDescription ?? "Bulnix digital account purchase",
    success_url: params.successUrl ?? "",
    cancel_url: params.cancelUrl ?? "",
    ipn_callback_url: params.ipnCallbackUrl ?? "",
  }) as Record<string, unknown>;
  return {
    invoiceId: data.id as string,
    invoiceUrl: data.invoice_url as string,
  };
}

export interface NowPaymentsStatus {
  paymentId: string;
  paymentStatus: string; // "waiting" | "confirming" | "confirmed" | "sending" | "partially_paid" | "finished" | "failed" | "refunded" | "expired"
  orderId: string;
  priceAmount: number;
  priceCurrency: string;
  payAmount: number;
  payCurrency: string;
  actuallyPaid: number;
}

/**
 * Get the status of a NowPayments payment by payment ID.
 */
export async function npGetPaymentStatus(paymentId: string): Promise<NowPaymentsStatus> {
  const data = await npRequest("GET", `/payment/${encodeURIComponent(paymentId)}`) as Record<string, unknown>;
  return {
    paymentId: data.payment_id as string,
    paymentStatus: data.payment_status as string,
    orderId: data.order_id as string,
    priceAmount: data.price_amount as number,
    priceCurrency: data.price_currency as string,
    payAmount: data.pay_amount as number,
    payCurrency: data.pay_currency as string,
    actuallyPaid: (data.actually_paid as number) ?? 0,
  };
}

/**
 * Verify NowPayments IPN (Instant Payment Notification) signature.
 * The signature is an HMAC-SHA512 of the sorted JSON body using the IPN secret.
 */
export function verifyNowPaymentsIpn(rawBody: string, signature: string): boolean {
  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    // Sort keys alphabetically
    const sorted = Object.keys(parsed)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => { acc[key] = parsed[key]; return acc; }, {});
    const hash = createHmac("sha512", ENV.nowpaymentsIpnSecret)
      .update(JSON.stringify(sorted))
      .digest("hex");
    return hash === signature;
  } catch {
    return false;
  }
}

/** Returns true if the payment status indicates a successful payment. */
export function isNowPaymentsSuccess(status: string): boolean {
  return status === "finished" || status === "confirmed";
}
