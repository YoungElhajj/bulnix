export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Payment gateways
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY ?? "",
  flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY ?? "",
  flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY ?? "",
  // Flutterwave webhook hash — set this in your Flutterwave dashboard under Webhooks > Secret Hash
  // It is a SEPARATE value from the API secret key
  flutterwaveWebhookHash: process.env.FLUTTERWAVE_WEBHOOK_HASH ?? "",
  nowpaymentsApiKey: process.env.NOWPAYMENTS_API_KEY ?? "",
  nowpaymentsIpnSecret: process.env.NOWPAYMENTS_IPN_SECRET ?? "",
  nowpaymentsCurrency: process.env.NOWPAYMENTS_CURRENCY ?? "usdttrc20",
};
