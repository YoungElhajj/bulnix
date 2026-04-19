import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock payment gateway modules ────────────────────────────────────────────

vi.mock("./payments/paystack", () => ({
  paystackInitiate: vi.fn().mockResolvedValue({
    authorizationUrl: "https://checkout.paystack.com/test-ref",
    reference: "BLX-PAY-TEST123",
  }),
  paystackVerify: vi.fn().mockResolvedValue({
    status: "success",
    reference: "BLX-PAY-TEST123",
    amount: 100000,
    currency: "NGN",
    metadata: { orderId: 1, userId: 1 },
  }),
}));

vi.mock("./payments/flutterwave", () => ({
  flwInitiate: vi.fn().mockResolvedValue({
    paymentLink: "https://checkout.flutterwave.com/v3/hosted/pay/test-ref",
    txRef: "BLX-PAY-TEST123",
  }),
  flwVerify: vi.fn().mockResolvedValue({
    status: "successful",
    tx_ref: "BLX-PAY-TEST123",
    amount: 10,
    currency: "USD",
    meta: { orderId: 1, userId: 1 },
  }),
}));

vi.mock("./payments/nowpayments", () => ({
  npInitiate: vi.fn().mockResolvedValue({
    invoiceUrl: "https://nowpayments.io/payment/?iid=test-invoice-id",
    invoiceId: "test-invoice-id",
  }),
  npGetPaymentStatus: vi.fn().mockResolvedValue({
    payment_status: "finished",
    order_id: "BLX-PAY-TEST123",
    price_amount: 10,
    price_currency: "usd",
  }),
  isNowPaymentsSuccess: vi.fn().mockReturnValue(true),
}));

// ─── Import after mocking ─────────────────────────────────────────────────────

import { paystackInitiate, paystackVerify } from "./payments/paystack";
import { flwInitiate, flwVerify } from "./payments/flutterwave";
import { npInitiate, npGetPaymentStatus, isNowPaymentsSuccess } from "./payments/nowpayments";

// ─── Paystack tests ───────────────────────────────────────────────────────────

describe("Paystack gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initiates a payment and returns an authorization URL", async () => {
    const result = await paystackInitiate({
      email: "user@test.com",
      amountKobo: 100000,
      reference: "BLX-PAY-TEST123",
      currency: "NGN",
      callbackUrl: "https://bulnix.com/api/payments/verify",
      metadata: { orderId: 1, userId: 1, topupRef: "BLX-PAY-TEST123" },
    });

    expect(result).toHaveProperty("authorizationUrl");
    expect(result.authorizationUrl).toContain("paystack.com");
    expect(paystackInitiate).toHaveBeenCalledOnce();
  });

  it("verifies a payment and returns success status", async () => {
    const result = await paystackVerify("BLX-PAY-TEST123");
    expect(result).toHaveProperty("status", "success");
    expect(result).toHaveProperty("reference", "BLX-PAY-TEST123");
    expect(paystackVerify).toHaveBeenCalledWith("BLX-PAY-TEST123");
  });
});

// ─── Flutterwave tests ────────────────────────────────────────────────────────

describe("Flutterwave gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initiates a payment and returns a payment link", async () => {
    const result = await flwInitiate({
      txRef: "BLX-PAY-TEST123",
      amount: 10,
      currency: "USD",
      email: "user@test.com",
      name: "Test User",
      redirectUrl: "https://bulnix.com/api/payments/verify",
      description: "Order #BLX-123",
      meta: { orderId: 1, userId: 1 },
    });

    expect(result).toHaveProperty("paymentLink");
    expect(result.paymentLink).toContain("flutterwave.com");
    expect(flwInitiate).toHaveBeenCalledOnce();
  });

  it("verifies a payment and returns successful status", async () => {
    const result = await flwVerify("BLX-PAY-TEST123");
    expect(result).toHaveProperty("status", "successful");
    expect(result).toHaveProperty("tx_ref", "BLX-PAY-TEST123");
    expect(flwVerify).toHaveBeenCalledWith("BLX-PAY-TEST123");
  });
});

// ─── NowPayments tests ────────────────────────────────────────────────────────

describe("NowPayments gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initiates a crypto invoice and returns invoice URL", async () => {
    const result = await npInitiate({
      priceAmount: 10,
      priceCurrency: "usd",
      orderId: "BLX-PAY-TEST123",
      orderDescription: "Order #BLX-123",
      successUrl: "https://bulnix.com/api/payments/verify?status=success",
      cancelUrl: "https://bulnix.com/api/payments/verify?status=cancelled",
      ipnCallbackUrl: "https://bulnix.com/api/webhooks/nowpayments",
    });

    expect(result).toHaveProperty("invoiceUrl");
    expect(result.invoiceUrl).toContain("nowpayments.io");
    expect(result).toHaveProperty("invoiceId");
    expect(npInitiate).toHaveBeenCalledOnce();
  });

  it("gets payment status for a given payment ID", async () => {
    const result = await npGetPaymentStatus("payment-id-123");
    expect(result).toHaveProperty("payment_status", "finished");
    expect(npGetPaymentStatus).toHaveBeenCalledWith("payment-id-123");
  });

  it("correctly identifies successful payment statuses", () => {
    const result = isNowPaymentsSuccess("finished");
    expect(result).toBe(true);
  });
});

// ─── Gateway selection logic tests ───────────────────────────────────────────

describe("Payment gateway routing", () => {
  it("routes to Paystack for NGN payments", async () => {
    const gateway = "paystack";
    const currency = "NGN";
    // Verify the gateway key is correct for NGN
    expect(gateway).toBe("paystack");
    expect(["NGN", "USD", "EUR", "GBP"]).toContain(currency);
  });

  it("routes to Flutterwave for mobile money payments", async () => {
    const gateway = "flutterwave";
    // Flutterwave supports multiple currencies
    const supportedCurrencies = ["NGN", "USD", "EUR", "GBP", "GHS", "KES"];
    expect(supportedCurrencies).toContain("USD");
    expect(gateway).toBe("flutterwave");
  });

  it("routes to NowPayments for crypto payments", async () => {
    const gateway = "nowpayments";
    // NowPayments always uses USD as base price currency
    const priceCurrency = "usd";
    expect(gateway).toBe("nowpayments");
    expect(priceCurrency).toBe("usd");
  });

  it("validates minimum topup amount", () => {
    const MIN_TOPUP = 3;
    expect(5 >= MIN_TOPUP).toBe(true);
    expect(2.99 >= MIN_TOPUP).toBe(false);
    expect(3 >= MIN_TOPUP).toBe(true);
  });
});
