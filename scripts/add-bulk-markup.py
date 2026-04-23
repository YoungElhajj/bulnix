import re

# 1. Add applyMarkupToAll function to db.ts
with open('server/db.ts', 'r') as f:
    db_content = f.read()

bulk_markup_fn = '''
export async function applyMarkupToAllProducts(providerKey: string, markupPercent: number): Promise<{ updated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Get all products for this provider
  const providerProducts = await db.select({ id: products.id, supplierPrice: products.supplierPrice })
    .from(products)
    .where(eq(products.providerKey, providerKey));
  let updated = 0;
  for (const p of providerProducts) {
    const newPrice = Number(p.supplierPrice) * (1 + markupPercent / 100);
    await db.update(products).set({
      markupPercent: markupPercent.toFixed(2) as any,
      customerPriceUSD: newPrice.toFixed(2) as any,
    }).where(eq(products.id, p.id));
    updated++;
  }
  return { updated };
}
'''

# Insert before retryAllProcessingOrders
marker = '// ─── Auto-Retry Processing Orders ─────────────────────────────────────────────'
idx = db_content.find(marker)
if idx == -1:
    print('ERROR: marker not found in db.ts')
    exit(1)

db_content = db_content[:idx] + bulk_markup_fn + '\n' + db_content[idx:]
with open('server/db.ts', 'w') as f:
    f.write(db_content)
print('SUCCESS: applyMarkupToAllProducts added to db.ts')

# 2. Add applyMarkupToAll procedure to routers.ts
with open('server/routers.ts', 'r') as f:
    router_content = f.read()

old_router = '''      getFaddedBalance: adminProcedure.query(() => db.getFaddedBalance()),
    }),'''

new_router = '''      getFaddedBalance: adminProcedure.query(() => db.getFaddedBalance()),
      applyMarkupToAll: adminProcedure
        .input(z.object({ providerKey: z.string(), markupPercent: z.number().min(0).max(500) }))
        .mutation(({ input }) => db.applyMarkupToAllProducts(input.providerKey, input.markupPercent)),
    }),'''

if old_router in router_content:
    router_content = router_content.replace(old_router, new_router, 1)
    with open('server/routers.ts', 'w') as f:
        f.write(router_content)
    print('SUCCESS: applyMarkupToAll procedure added to routers.ts')
else:
    print('ERROR: old router text not found')
    exit(1)
