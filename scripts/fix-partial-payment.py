with open('server/db.ts', 'r') as f:
    content = f.read()

# Update the balance crediting section to use overrideAmountUSD when provided
old_credit = '''  const wallet = await getOrCreateWallet(txn.userId);
  const newBalance = Number(wallet.balanceUSD) + Number(txn.amountUSD);
  const newDeposited = Number(wallet.totalDeposited) + Number(txn.amountUSD);

    await withDbRetry(() => db!.update(wallets).set({
    balanceUSD: newBalance.toFixed(6),
    totalDeposited: newDeposited.toFixed(6),
  }).where(eq(wallets.userId, txn.userId)), "confirmWalletTopup:updateWallet");
  await withDbRetry(() => db!.update(walletTransactions).set({
    status: "completed",
    balanceAfterUSD: newBalance.toFixed(6),
  }).where(eq(walletTransactions.id, txn.id)), "confirmWalletTopup:updateTxn");

  // Send receipt email to customer (fire-and-forget, don't block confirmation)
  try {
    const [topupUser] = await db!.select({ email: users.email, name: users.name })
      .from(users).where(eq(users.id, txn.userId)).limit(1);
    if (topupUser?.email) {
      await sendWalletTopupReceiptEmail({
        to: topupUser.email,
        name: topupUser.name ?? "",
        amountUSD: Number(txn.amountUSD),
        reference: txn.reference ?? "",
        gateway: String(txn.gateway ?? "unknown"),
        newBalanceUSD: newBalance,
      });
    }
  } catch (emailErr: any) {
    await logSystem("warn", "email", `Failed to send wallet top-up receipt: ${emailErr.message}`);
  }

  return { success: true, newBalance };
}'''

new_credit = '''  const wallet = await getOrCreateWallet(txn.userId);
  // Use overrideAmountUSD for partial payments (e.g. NOWPayments partially_paid)
  // where the customer sent less than requested. Credit only what was actually received.
  const creditAmount = overrideAmountUSD !== undefined ? overrideAmountUSD : Number(txn.amountUSD);
  const isPartial = overrideAmountUSD !== undefined && overrideAmountUSD < Number(txn.amountUSD);
  const newBalance = Number(wallet.balanceUSD) + creditAmount;
  const newDeposited = Number(wallet.totalDeposited) + creditAmount;
  await withDbRetry(() => db!.update(wallets).set({
    balanceUSD: newBalance.toFixed(6),
    totalDeposited: newDeposited.toFixed(6),
  }).where(eq(wallets.userId, txn.userId)), "confirmWalletTopup:updateWallet");
  await withDbRetry(() => db!.update(walletTransactions).set({
    status: isPartial ? "partial" : "completed",
    amountUSD: creditAmount.toFixed(6),
    balanceAfterUSD: newBalance.toFixed(6),
  }).where(eq(walletTransactions.id, txn.id)), "confirmWalletTopup:updateTxn");

  // Send receipt email to customer (fire-and-forget, don't block confirmation)
  try {
    const [topupUser] = await db!.select({ email: users.email, name: users.name })
      .from(users).where(eq(users.id, txn.userId)).limit(1);
    if (topupUser?.email) {
      await sendWalletTopupReceiptEmail({
        to: topupUser.email,
        name: topupUser.name ?? "",
        amountUSD: creditAmount,
        reference: txn.reference ?? "",
        gateway: String(txn.gateway ?? "unknown"),
        newBalanceUSD: newBalance,
      });
    }
  } catch (emailErr: any) {
    await logSystem("warn", "email", `Failed to send wallet top-up receipt: ${emailErr.message}`);
  }

  return { success: true, newBalance, isPartial, creditAmount };
}'''

if old_credit not in content:
    print('ERROR: old credit section not found')
    # Find the closest match
    idx = content.find('const wallet = await getOrCreateWallet(txn.userId)')
    print('Found getOrCreateWallet at:', idx)
    print('Snippet (repr):', repr(content[idx:idx+200]))
    exit(1)
    
content = content.replace(old_credit, new_credit, 1)
print('Step 1: Updated balance crediting to use overrideAmountUSD')

with open('server/db.ts', 'w') as f:
    f.write(content)
print('SUCCESS: db.ts updated')
