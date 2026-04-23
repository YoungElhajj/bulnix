with open('client/src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# 1. Add "partial" to TxStatusBadge map
old_badge = '''    reversed: { color: "text-[#4A6080] bg-slate-100 border-slate-300/40", icon: AlertCircle, label: "Reversed" },
  };'''
new_badge = '''    reversed: { color: "text-[#4A6080] bg-slate-100 border-slate-300/40", icon: AlertCircle, label: "Reversed" },
    partial: { color: "text-orange-600 bg-orange-50 border-orange-300/40", icon: AlertCircle, label: "Partial" },
  };'''
if old_badge not in content:
    print('ERROR: TxStatusBadge map not found')
    exit(1)
content = content.replace(old_badge, new_badge, 1)
print('Step 1: Added partial to TxStatusBadge')

# 2. Add settlement notice after the NGN equivalent notice block
old_ngn_notice = '''              {/* NGN equivalent notice for Kora Pay and Paystack */}
              {(gateway === "korapay" || gateway === "paystack") && amountNGN > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-[#EEF4FF] border border-[#0050D0]/20">
                  <p className="text-xs text-[#0050D0] font-semibold">
                    You will be charged ₦{amountNGN.toLocaleString()}
                  </p>
                </div>
              )}'''
new_ngn_notice = '''              {/* NGN equivalent notice for Kora Pay and Paystack */}
              {(gateway === "korapay" || gateway === "paystack") && amountNGN > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-[#EEF4FF] border border-[#0050D0]/20">
                  <p className="text-xs text-[#0050D0] font-semibold">
                    You will be charged ₦{amountNGN.toLocaleString()}
                  </p>
                </div>
              )}
              {/* Flutterwave USD settlement notice */}
              {gateway === "flutterwave" && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300/40">
                  <p className="text-xs text-amber-700 font-semibold flex items-start gap-1.5">
                    <span className="mt-0.5">⚠</span>
                    <span>USD payments via Flutterwave may take <strong>3–5 business days</strong> to settle. For instant credits, use Kora Pay (NGN) or Crypto.</span>
                  </p>
                </div>
              )}
              {/* NOWPayments partial payment notice */}
              {gateway === "nowpayments" && (
                <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200/60">
                  <p className="text-xs text-blue-700 font-semibold flex items-start gap-1.5">
                    <span className="mt-0.5">ℹ</span>
                    <span>Send the <strong>exact amount</strong> shown. Sending less will credit only the amount received (partial payment). Network fees are not covered by Bulnix.</span>
                  </p>
                </div>
              )}'''
if old_ngn_notice not in content:
    print('ERROR: NGN notice block not found')
    exit(1)
content = content.replace(old_ngn_notice, new_ngn_notice, 1)
print('Step 2: Added Flutterwave and NOWPayments notices')

with open('client/src/pages/Wallet.tsx', 'w') as f:
    f.write(content)
print('SUCCESS: Wallet.tsx updated')
