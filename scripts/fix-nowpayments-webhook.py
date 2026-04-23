with open('server/_core/index.ts', 'r') as f:
    content = f.read()

# 1. Update import to include isNowPaymentsPartial
old_import = 'import { verifyNowPaymentsIpn, isNowPaymentsSuccess } from "../payments/nowpayments";'
new_import = 'import { verifyNowPaymentsIpn, isNowPaymentsSuccess, isNowPaymentsPartial } from "../payments/nowpayments";'
if old_import not in content:
    print('ERROR: import not found')
    exit(1)
content = content.replace(old_import, new_import, 1)
print('Step 1: Updated import')

# 2. Update the webhook handler to pass overrideAmountUSD for partial payments
old_handler = '''      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const paymentStatus = payload.payment_status as string;
      const orderId = payload.order_id as string;
      if (isNowPaymentsSuccess(paymentStatus)) {
        try {
          await confirmWalletTopup(orderId, true); // skipVerify: IPN is already verified
          await logSystem("info", "payment", `NowPayments IPN: wallet topup confirmed for orderId ${orderId}`);
        } catch (e: any) {
          try {
            await fulfillOrderByReference(orderId, "nowpayments");
            await logSystem("info", "payment", `NowPayments IPN: order fulfilled for orderId ${orderId}`);
          } catch (e2: any) {
            await logSystem("error", "payment", `NowPayments IPN: failed to process orderId ${orderId}: ${e2.message}`);
          }
        }
      }'''

new_handler = '''      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const paymentStatus = payload.payment_status as string;
      const orderId = payload.order_id as string;
      if (isNowPaymentsSuccess(paymentStatus)) {
        // For partially_paid: credit only the amount actually received in fiat.
        // NOWPayments sends `actually_paid_at_fiat` (USD value actually received).
        // Fall back to ratio estimate if fiat field is missing.
        let overrideAmountUSD: number | undefined;
        if (isNowPaymentsPartial(paymentStatus)) {
          const fiatReceived = payload.actually_paid_at_fiat as number | undefined;
          const cryptoReceived = payload.actually_paid as number | undefined;
          const priceAmount = payload.price_amount as number | undefined;
          const payAmount = payload.pay_amount as number | undefined;
          if (fiatReceived && fiatReceived > 0) {
            overrideAmountUSD = Math.floor(fiatReceived * 100) / 100;
          } else if (cryptoReceived && payAmount && priceAmount && payAmount > 0) {
            // Estimate fiat from ratio: (cryptoReceived / payAmount) * priceAmount
            overrideAmountUSD = Math.floor((cryptoReceived / payAmount) * priceAmount * 100) / 100;
          }
          await logSystem("warn", "payment", `NowPayments IPN: partially_paid for orderId ${orderId} — crediting $${overrideAmountUSD ?? "unknown"} of $${priceAmount}`);
        }
        try {
          await confirmWalletTopup(orderId, true, overrideAmountUSD); // skipVerify: IPN is already verified
          const suffix = isNowPaymentsPartial(paymentStatus) ? " (partial — credited actual amount received)" : "";
          await logSystem("info", "payment", `NowPayments IPN: wallet topup confirmed for orderId ${orderId}${suffix}`);
        } catch (e: any) {
          try {
            await fulfillOrderByReference(orderId, "nowpayments");
            await logSystem("info", "payment", `NowPayments IPN: order fulfilled for orderId ${orderId}`);
          } catch (e2: any) {
            await logSystem("error", "payment", `NowPayments IPN: failed to process orderId ${orderId}: ${e2.message}`);
          }
        }
      }'''

if old_handler not in content:
    print('ERROR: old handler not found')
    exit(1)
content = content.replace(old_handler, new_handler, 1)
print('Step 2: Updated webhook handler for partial payments')

with open('server/_core/index.ts', 'w') as f:
    f.write(content)
print('SUCCESS: index.ts updated')
